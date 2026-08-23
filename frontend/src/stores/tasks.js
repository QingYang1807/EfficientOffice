import { defineStore } from 'pinia'
import { buildTree, getDescendantIds, validateMove } from '@/domain/hierarchy'
import { deriveTaskView } from '@/domain/progress'
import { exportWorkspace, loadWorkspace, patchWorkspace } from '@/repositories/workspaceRepository'

function makeId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function timestamp() {
  return new Date().toISOString()
}

function cloneRecords(records) {
  return records.map(record => ({ ...record }))
}

function normalizeGoalId(goalId) {
  return goalId == null ? null : String(goalId)
}

function hasChildTasks(tasks, id) {
  return tasks.some(task => String(task.parentTaskId) === String(id))
}

function assertLeafCompletion(tasks, task, patch) {
  if (Object.prototype.hasOwnProperty.call(patch, 'completed') && hasChildTasks(tasks, task.id)) {
    throw new Error('父任务完成状态由子任务进度派生')
  }
}

function buildTask(input, tasks) {
  const now = timestamp()
  const parentTaskId = input.parentTaskId == null ? null : String(input.parentTaskId)
  const parent = parentTaskId == null ? null : tasks.find(task => String(task.id) === parentTaskId)
  if (parentTaskId != null && !parent) throw new Error('父任务不存在')

  const suppliedGoalId = normalizeGoalId(input.goalId)
  const parentGoalId = parent ? normalizeGoalId(parent.goalId) : null
  if (parent && Object.prototype.hasOwnProperty.call(input, 'goalId') && suppliedGoalId !== parentGoalId) {
    throw new Error('子任务必须与父任务属于同一目标')
  }

  return {
    id: input.id == null ? makeId() : String(input.id),
    goalId: parent ? parentGoalId : suppliedGoalId,
    parentTaskId,
    title: String(input.title || input.text || '').trim(),
    description: String(input.description || ''),
    completed: Boolean(input.completed),
    weight: input.weight == null ? 1 : Number(input.weight),
    priority: ['高', '中', '低'].includes(input.priority) ? input.priority : '中',
    deadline: input.deadline ?? input.dueDate ?? null,
    pomodoros: Math.max(0, Math.floor(Number(input.pomodoros) || 0)),
    pomodoroStartedAt: input.pomodoroStartedAt ?? null,
    completedAt: input.completedAt ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now
  }
}

export const useTaskStore = defineStore('tasks-v2', {
  state: () => ({ tasks: [], initialized: false, lastError: null }),

  getters: {
    byId: state => id => state.tasks.find(task => String(task.id) === String(id)) || null,
    tasksForGoal: state => (goalId, includeDescendants = false, goals = []) => {
      const ids = new Set([String(goalId)])
      if (includeDescendants) {
        getDescendantIds(goals, goalId, 'parentGoalId').forEach(id => ids.add(id))
      }
      return state.tasks.filter(task => task.goalId != null && ids.has(String(task.goalId)))
    },
    treeForGoal: state => goalId => buildTree(
      state.tasks.filter(task => normalizeGoalId(task.goalId) === normalizeGoalId(goalId)),
      'parentTaskId'
    ),
    viewFor: state => (id, now = Date.now()) => deriveTaskView(id, state.tasks, now)
  },

  actions: {
    initialize() {
      if (this.initialized) return this.tasks
      const workspace = loadWorkspace(localStorage)
      this.tasks = cloneRecords(workspace.tasks)
      this.initialized = true
      this.lastError = null
      return this.tasks
    },

    reload() {
      const workspace = loadWorkspace(localStorage)
      this.tasks = cloneRecords(workspace.tasks)
      this.initialized = true
      this.lastError = null
      return this.tasks
    },

    exportData() {
      exportWorkspace(loadWorkspace(localStorage, { trackRevision: false }))
    },

    persist(snapshot) {
      try {
        patchWorkspace(localStorage, { tasks: this.tasks })
        this.lastError = null
      } catch (error) {
        this.tasks = snapshot
        this.lastError = ['本地存储空间不足，请先导出或清理数据', '数据已在其他页面更新，请刷新后重试'].includes(error.message)
          ? error.message : '工作区保存失败'
        throw error
      }
    },

    createTask(input = {}) {
      this.initialize()
      const snapshot = cloneRecords(this.tasks)
      const task = buildTask(input, this.tasks)
      if (this.tasks.some(item => String(item.id) === task.id)) throw new Error('任务ID已存在')

      const candidate = [...this.tasks, { ...task, parentTaskId: null }]
      const validation = validateMove({
        items: candidate,
        id: task.id,
        newParentId: task.parentTaskId,
        parentKey: 'parentTaskId'
      })
      if (!validation.ok) throw new Error(validation.reason)

      this.tasks.push(task)
      this.persist(snapshot)
      return task
    },

    createBatchTasks(inputs = []) {
      this.initialize()
      const snapshot = cloneRecords(this.tasks)
      const created = []
      try {
        for (const input of inputs) {
          const task = buildTask(input, this.tasks)
          if (this.tasks.some(item => String(item.id) === task.id)) throw new Error('任务ID已存在')
          const candidate = [...this.tasks, { ...task, parentTaskId: null }]
          const validation = validateMove({ items: candidate, id: task.id, newParentId: task.parentTaskId, parentKey: 'parentTaskId' })
          if (!validation.ok) throw new Error(validation.reason)
          this.tasks.push(task)
          created.push(task)
        }
        this.persist(snapshot)
        return created
      } catch (error) {
        this.tasks = snapshot
        throw error
      }
    },

    deleteBatchTasks(ids = []) {
      this.initialize()
      const requestedIds = [...new Set(ids.map(String))]
      const existingIds = new Set(this.tasks.map(task => String(task.id)))
      if (requestedIds.some(id => !existingIds.has(id))) throw new Error('任务不存在')

      const removedIds = new Set(requestedIds)
      for (const id of requestedIds) {
        getDescendantIds(this.tasks, id, 'parentTaskId').forEach(childId => removedIds.add(childId))
      }
      const snapshot = cloneRecords(this.tasks)
      this.tasks = this.tasks.filter(task => !removedIds.has(String(task.id)))
      this.persist(snapshot)
      return [...removedIds]
    },

    updateTask(id, patch = {}) {
      this.initialize()
      const task = this.byId(id)
      if (!task) throw new Error('任务不存在')
      assertLeafCompletion(this.tasks, task, patch)
      if (Object.prototype.hasOwnProperty.call(patch, 'parentTaskId') || Object.prototype.hasOwnProperty.call(patch, 'goalId')) {
        return this.moveTask(id, {
          parentTaskId: Object.prototype.hasOwnProperty.call(patch, 'parentTaskId') ? patch.parentTaskId : task.parentTaskId,
          goalId: Object.prototype.hasOwnProperty.call(patch, 'goalId') ? patch.goalId : task.goalId,
          patch
        })
      }
      const snapshot = cloneRecords(this.tasks)
      Object.assign(task, patch, { id: task.id, updatedAt: timestamp() })
      this.persist(snapshot)
      return task
    },

    toggleTask(id, completed) {
      const task = this.byId(id) || (this.initialize(), this.byId(id))
      if (!task) throw new Error('任务不存在')
      const next = completed == null ? !task.completed : Boolean(completed)
      return this.updateTask(id, { completed: next })
    },

    startPomodoro(id, now = timestamp()) {
      this.initialize()
      const task = this.byId(id)
      if (!task) throw new Error('任务不存在')
      const snapshot = cloneRecords(this.tasks)
      task.pomodoroStartedAt = now
      task.updatedAt = now
      this.persist(snapshot)
      return task
    },

    finishPomodoro(id, options = {}) {
      this.initialize()
      const task = this.byId(id)
      if (!task) throw new Error('任务不存在')
      if (options.completed) assertLeafCompletion(this.tasks, task, { completed: true })
      const snapshot = cloneRecords(this.tasks)
      const now = options.now ?? timestamp()
      task.pomodoros = Math.max(0, Math.floor(Number(task.pomodoros) || 0)) + 1
      task.pomodoroStartedAt = null
      if (options.completed) {
        task.completed = true
        task.completedAt = now
      }
      task.updatedAt = now
      this.persist(snapshot)
      return task
    },

    moveTask(id, options = {}) {
      this.initialize()
      const task = this.byId(id)
      if (!task) throw new Error('任务不存在')
      if (options.patch) assertLeafCompletion(this.tasks, task, options.patch)
      const parentTaskId = options.parentTaskId == null ? null : String(options.parentTaskId)
      const parent = parentTaskId == null ? null : this.byId(parentTaskId)
      if (parentTaskId != null && !parent) throw new Error('父任务不存在')

      const requestedGoalId = normalizeGoalId(options.goalId)
      const goalId = parent ? normalizeGoalId(parent.goalId) : requestedGoalId
      if (parent && Object.prototype.hasOwnProperty.call(options, 'goalId') && requestedGoalId !== goalId) {
        throw new Error('子任务必须与父任务属于同一目标')
      }
      const validation = validateMove({ items: this.tasks, id, newParentId: parentTaskId, parentKey: 'parentTaskId' })
      if (!validation.ok) throw new Error(validation.reason)

      const snapshot = cloneRecords(this.tasks)
      const affectedIds = new Set([String(id), ...getDescendantIds(this.tasks, id, 'parentTaskId')])
      const now = timestamp()
      for (const item of this.tasks) {
        if (affectedIds.has(String(item.id))) {
          item.goalId = goalId
          item.updatedAt = now
        }
      }
      task.parentTaskId = parentTaskId
      if (options.patch) {
        const safePatch = { ...options.patch }
        delete safePatch.id
        delete safePatch.parentTaskId
        delete safePatch.goalId
        Object.assign(task, safePatch)
      }
      this.persist(snapshot)
      return task
    }
  }
})
