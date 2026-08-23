function weightedAverage(entries) {
  if (!entries.length) return null

  const total = entries.reduce((sum, item) => sum + Math.max(0, Number(item.weight) || 0), 0)
  if (total === 0) return 0

  return Math.round(entries.reduce(
    (sum, item) => sum + item.progress * Math.max(0, Number(item.weight) || 0),
    0
  ) / total)
}

export function deriveStatus(progress, deadline, now = Date.now()) {
  if (progress === 100) return 'completed'
  if (deadline && new Date(deadline).getTime() < now) return 'overdue'
  return progress > 0 ? 'in_progress' : 'not_started'
}

export function deriveTaskView(taskId, tasks, now = Date.now(), stack = new Set()) {
  const id = String(taskId)
  if (stack.has(id)) throw new Error('检测到循环任务层级')

  const task = tasks.find(item => String(item.id) === id)
  if (!task) throw new Error('任务不存在')

  const next = new Set(stack).add(id)
  const children = tasks.filter(item => item.parentTaskId != null && String(item.parentTaskId) === id)
  const progress = children.length
    ? weightedAverage(children.map(child => ({ ...deriveTaskView(child.id, tasks, now, next), weight: child.weight })))
    : (task.completed ? 100 : 0)

  return { progress, completed: progress === 100, status: deriveStatus(progress, task.deadline, now) }
}

export function deriveGoalView(goalId, goals, tasks, now = Date.now(), stack = new Set()) {
  const id = String(goalId)
  if (stack.has(id)) throw new Error('检测到循环目标层级')

  const goal = goals.find(item => String(item.id) === id)
  if (!goal) throw new Error('目标不存在')

  const next = new Set(stack).add(id)
  const childGoals = goals.filter(item => item.parentGoalId != null && String(item.parentGoalId) === id)
  const rootTasks = tasks.filter(item => String(item.goalId) === id && item.parentTaskId == null)
  const entries = [
    ...childGoals.map(child => ({ ...deriveGoalView(child.id, goals, tasks, now, next), weight: child.weight })),
    ...rootTasks.map(task => ({ ...deriveTaskView(task.id, tasks, now), weight: task.weight }))
  ]
  const manual = Math.max(0, Math.min(100, Number(goal.manualProgress) || 0))
  const progress = weightedAverage(entries) ?? manual

  return { progress, status: deriveStatus(progress, goal.deadline, now) }
}
