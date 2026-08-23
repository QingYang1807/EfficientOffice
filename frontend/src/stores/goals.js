import { defineStore } from 'pinia'
import { buildTree, getAncestorIds, validateMove } from '@/domain/hierarchy'
import { deriveGoalView } from '@/domain/progress'
import { exportWorkspace, loadWorkspace, patchWorkspace, workspaceForExport } from '@/repositories/workspaceRepository'

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function timestamp() {
  return new Date().toISOString()
}

function cloneRecords(records) {
  return records.map(record => ({ ...record }))
}

function persistenceMessage(error) {
  return ['本地存储空间不足，请先导出或清理数据', '数据已在其他页面更新，请刷新后重试'].includes(error.message)
    ? error.message : '工作区保存失败'
}

export const useGoalStore = defineStore('goals-v2', {
  state: () => ({ goals: [], initialized: false, loadFailed: false, lastError: null }),

  getters: {
    tree: state => buildTree(state.goals, 'parentGoalId'),
    byId: state => id => state.goals.find(goal => String(goal.id) === String(id)) || null,
    pathFor: state => id => [...getAncestorIds(state.goals, id, 'parentGoalId'), String(id)]
      .map(goalId => state.goals.find(goal => String(goal.id) === goalId))
      .filter(Boolean),
    viewFor: state => (id, tasks, now = Date.now()) => deriveGoalView(id, state.goals, tasks, now)
  },

  actions: {
    initialize() {
      if (this.initialized) {
        if (this.loadFailed) throw new Error(this.lastError)
        return this.goals
      }
      try {
        const workspace = loadWorkspace(localStorage)
        this.goals = cloneRecords(workspace.goals)
        this.loadFailed = false
        this.lastError = null
      } catch (error) {
        this.goals = []
        this.loadFailed = true
        this.lastError = persistenceMessage(error)
      }
      this.initialized = true
      return this.goals
    },

    reload() {
      try {
        const workspace = loadWorkspace(localStorage)
        this.goals = cloneRecords(workspace.goals)
        this.loadFailed = false
        this.lastError = null
      } catch (error) {
        this.loadFailed = true
        this.lastError = persistenceMessage(error)
      }
      this.initialized = true
      return this.goals
    },

    exportData() {
      exportWorkspace(workspaceForExport(localStorage))
    },

    persist(snapshot) {
      try {
        patchWorkspace(localStorage, { goals: this.goals })
        this.lastError = null
      } catch (error) {
        this.goals = snapshot
        this.lastError = persistenceMessage(error)
        throw error
      }
    },

    createGoal(input = {}) {
      this.initialize()
      const snapshot = cloneRecords(this.goals)
      const now = timestamp()
      const goal = {
        id: input.id == null ? makeId('goal') : String(input.id),
        parentGoalId: input.parentGoalId == null ? null : String(input.parentGoalId),
        title: String(input.title || '').trim(),
        description: String(input.description || ''),
        manualProgress: input.manualProgress == null ? null : Math.max(0, Math.min(100, Number(input.manualProgress) || 0)),
        weight: input.weight == null ? 1 : Number(input.weight),
        startDate: input.startDate ?? null,
        deadline: input.deadline ?? null,
        createdAt: input.createdAt ?? now,
        updatedAt: input.updatedAt ?? now
      }
      if (this.goals.some(item => String(item.id) === goal.id)) throw new Error('目标ID已存在')

      const candidate = [...this.goals, { ...goal, parentGoalId: null }]
      const validation = validateMove({
        items: candidate,
        id: goal.id,
        newParentId: goal.parentGoalId,
        parentKey: 'parentGoalId'
      })
      if (!validation.ok) throw new Error(validation.reason)

      this.goals.push(goal)
      this.persist(snapshot)
      return goal
    },

    updateGoal(id, patch = {}) {
      this.initialize()
      const goal = this.byId(id)
      if (!goal) throw new Error('目标不存在')
      if (Object.prototype.hasOwnProperty.call(patch, 'parentGoalId')) {
        const nextParentId = patch.parentGoalId == null ? null : String(patch.parentGoalId)
        const validation = validateMove({ items: this.goals, id, newParentId: nextParentId, parentKey: 'parentGoalId' })
        if (!validation.ok) throw new Error(validation.reason)
        patch = { ...patch, parentGoalId: nextParentId }
      }
      const snapshot = cloneRecords(this.goals)
      Object.assign(goal, patch, { id: goal.id, updatedAt: timestamp() })
      this.persist(snapshot)
      return goal
    },

    moveGoal(id, parent) {
      this.initialize()
      const parentGoalId = parent && typeof parent === 'object' ? parent.parentGoalId : parent
      const normalizedParentId = parentGoalId == null ? null : String(parentGoalId)
      const validation = validateMove({
        items: this.goals,
        id,
        newParentId: normalizedParentId,
        parentKey: 'parentGoalId'
      })
      if (!validation.ok) throw new Error(validation.reason)
      return this.updateGoal(id, { parentGoalId: normalizedParentId })
    }
  }
})
