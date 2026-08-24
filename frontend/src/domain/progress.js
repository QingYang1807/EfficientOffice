function validWeight(value) {
  const weight = Number(value)
  return Number.isFinite(weight) && weight > 0 ? weight : 0
}

function weightedAverage(entries) {
  if (!entries.length) return null

  const total = entries.reduce((sum, item) => sum + validWeight(item.weight), 0)
  if (total === 0) return 0

  return Math.round(entries.reduce(
    (sum, item) => sum + item.progress * validWeight(item.weight),
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

export function deriveWorkspaceViews(goals, tasks, now = Date.now()) {
  const goalsById = new Map(goals.map(goal => [String(goal.id), goal]))
  const tasksById = new Map(tasks.map(task => [String(task.id), task]))
  const childGoals = groupChildren(goals, 'parentGoalId')
  const childTasks = groupChildren(tasks, 'parentTaskId')
  const rootTasksByGoal = new Map()

  for (const task of tasks) {
    if (task.parentTaskId != null || task.goalId == null) continue
    const goalId = String(task.goalId)
    rootTasksByGoal.set(goalId, [...(rootTasksByGoal.get(goalId) || []), task])
  }

  const taskViews = new Map()
  const taskStack = new Set()
  const taskView = id => {
    id = String(id)
    if (taskViews.has(id)) return taskViews.get(id)
    if (taskStack.has(id)) throw new Error('检测到循环任务层级')
    const task = tasksById.get(id)
    if (!task) throw new Error('任务不存在')
    taskStack.add(id)
    const children = childTasks.get(id) || []
    const progress = children.length
      ? weightedAverage(children.map(child => ({ ...taskView(child.id), weight: child.weight })))
      : (task.completed ? 100 : 0)
    const view = { progress, completed: progress === 100, status: deriveStatus(progress, task.deadline, now) }
    taskStack.delete(id)
    taskViews.set(id, view)
    return view
  }

  const goalViews = new Map()
  const goalStack = new Set()
  const goalView = id => {
    id = String(id)
    if (goalViews.has(id)) return goalViews.get(id)
    if (goalStack.has(id)) throw new Error('检测到循环目标层级')
    const goal = goalsById.get(id)
    if (!goal) throw new Error('目标不存在')
    goalStack.add(id)
    const entries = [
      ...(childGoals.get(id) || []).map(child => ({ ...goalView(child.id), weight: child.weight })),
      ...(rootTasksByGoal.get(id) || []).map(task => ({ ...taskView(task.id), weight: task.weight }))
    ]
    const manual = Math.max(0, Math.min(100, Number(goal.manualProgress) || 0))
    const progress = weightedAverage(entries) ?? manual
    const view = { progress, status: deriveStatus(progress, goal.deadline, now) }
    goalStack.delete(id)
    goalViews.set(id, view)
    return view
  }

  tasks.forEach(task => taskView(task.id))
  goals.forEach(goal => goalView(goal.id))
  return { goals: goalViews, tasks: taskViews }
}

function groupChildren(items, parentKey) {
  const groups = new Map()
  for (const item of items) {
    if (item[parentKey] == null) continue
    const parentId = String(item[parentKey])
    groups.set(parentId, [...(groups.get(parentId) || []), item])
  }
  return groups
}
