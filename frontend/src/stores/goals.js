import { defineStore } from 'pinia'
import { buildTree, getAncestorIds, validateMove } from '@/domain/hierarchy'
import { deriveGoalView } from '@/domain/progress'
import { loadWorkspace, patchWorkspace } from '@/repositories/workspaceRepository'

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function timestamp() {
  return new Date().toISOString()
}

function cloneRecords(records) {
  return records.map(record => ({ ...record }))
}

export const useGoalStore = defineStore('goals-v2', {
  state: () => ({ goals: [], initialized: false, lastError: null }),

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
      if (this.initialized) return this.goals
      const workspace = loadWorkspace(localStorage)
      this.goals = cloneRecords(workspace.goals)
      this.initialized = true
      this.lastError = null
      return this.goals
    },

    persist(snapshot) {
      try {
        patchWorkspace(localStorage, { goals: this.goals })
        this.lastError = null
      } catch (error) {
        this.goals = snapshot
        this.lastError = '工作区保存失败'
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
