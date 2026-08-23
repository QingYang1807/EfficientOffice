import { getDescendantIds } from '@/domain/hierarchy'
import { patchWorkspace } from '@/repositories/workspaceRepository'

function cloneRecords(records) {
  return records.map(record => ({ ...record }))
}

function assertMode(mode) {
  if (mode !== 'cascade' && mode !== 'promote') throw new Error('删除模式不受支持')
}

function persistenceMessage(error) {
  return ['本地存储空间不足，请先导出或清理数据', '数据已在其他页面更新，请刷新后重试'].includes(error.message)
    ? error.message : '工作区保存失败'
}

function persistBoth(goalStore, taskStore, previousGoals, previousTasks) {
  try {
    patchWorkspace(localStorage, { goals: goalStore.goals, tasks: taskStore.tasks })
    goalStore.lastError = null
    taskStore.lastError = null
  } catch (error) {
    goalStore.goals = previousGoals
    taskStore.tasks = previousTasks
    goalStore.lastError = persistenceMessage(error)
    taskStore.lastError = persistenceMessage(error)
    throw error
  }
}

export function deleteGoal({ goalId, mode, goalStore, taskStore }) {
  assertMode(mode)
  goalStore.initialize()
  taskStore.initialize()
  const id = String(goalId)
  const goal = goalStore.byId(id)
  if (!goal) throw new Error('目标不存在')
  const previousGoals = cloneRecords(goalStore.goals)
  const previousTasks = cloneRecords(taskStore.tasks)

  if (mode === 'cascade') {
    const removedGoalIds = new Set([id, ...getDescendantIds(goalStore.goals, id, 'parentGoalId')])
    goalStore.goals = goalStore.goals.filter(item => !removedGoalIds.has(String(item.id)))
    taskStore.tasks = taskStore.tasks.filter(task => task.goalId == null || !removedGoalIds.has(String(task.goalId)))
  } else {
    const parentGoalId = goal.parentGoalId == null ? null : String(goal.parentGoalId)
    goalStore.goals = goalStore.goals
      .filter(item => String(item.id) !== id)
      .map(item => String(item.parentGoalId) === id ? { ...item, parentGoalId } : item)
    taskStore.tasks = taskStore.tasks.map(task => String(task.goalId) === id ? { ...task, goalId: parentGoalId } : task)
  }

  persistBoth(goalStore, taskStore, previousGoals, previousTasks)
}

export function deleteTask({ taskId, mode, taskStore }) {
  assertMode(mode)
  taskStore.initialize()
  const id = String(taskId)
  const task = taskStore.byId(id)
  if (!task) throw new Error('任务不存在')
  const previousTasks = cloneRecords(taskStore.tasks)

  if (mode === 'cascade') {
    const removedTaskIds = new Set([id, ...getDescendantIds(taskStore.tasks, id, 'parentTaskId')])
    taskStore.tasks = taskStore.tasks.filter(item => !removedTaskIds.has(String(item.id)))
  } else {
    const parentTaskId = task.parentTaskId == null ? null : String(task.parentTaskId)
    taskStore.tasks = taskStore.tasks
      .filter(item => String(item.id) !== id)
      .map(item => String(item.parentTaskId) === id ? { ...item, parentTaskId } : item)
  }

  try {
    patchWorkspace(localStorage, { tasks: taskStore.tasks })
    taskStore.lastError = null
  } catch (error) {
    taskStore.tasks = previousTasks
    taskStore.lastError = persistenceMessage(error)
    throw error
  }
}
