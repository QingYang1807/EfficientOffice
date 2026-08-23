export const WORKSPACE_KEY = 'efficient-office.workspace.v2'
export const BACKUP_KEY = 'efficient-office.workspace.v1.backup'
export const DIAGNOSTICS_KEY = 'efficient-office.workspace.v2.diagnostics'

const priorities = new Set(['高', '中', '低'])

const normalizeGoal = (goal, now) => ({
  id: String(goal.id),
  parentGoalId: goal.parentGoalId == null ? null : String(goal.parentGoalId),
  title: String(goal.title || '').trim(),
  description: String(goal.description || ''),
  manualProgress: Math.max(0, Math.min(100, Number(goal.manualProgress ?? goal.progress) || 0)),
  weight: Math.max(0, Number(goal.weight) || 1),
  startDate: goal.startDate || null,
  deadline: goal.deadline || null,
  createdAt: goal.createdAt || now,
  updatedAt: goal.updatedAt || now
})

const normalizeTask = (task, validGoalIds, now) => ({
  id: String(task.id),
  goalId: task.goalId != null && validGoalIds.has(String(task.goalId)) ? String(task.goalId) : null,
  parentTaskId: task.parentTaskId == null ? null : String(task.parentTaskId),
  title: String(task.title || task.text || '').trim(),
  description: String(task.description || ''),
  completed: Boolean(task.completed),
  weight: Math.max(0, Number(task.weight) || 1),
  priority: priorities.has(task.priority) ? task.priority : '中',
  deadline: task.deadline || task.dueDate || null,
  createdAt: task.createdAt || now,
  updatedAt: task.updatedAt || now
})

function parseLegacyArray(storage, key) {
  const raw = storage.getItem(key)
  if (!raw) return []

  try {
    const value = JSON.parse(raw)
    if (!Array.isArray(value)) throw new TypeError('legacy value must be an array')
    return value
  } catch (error) {
    throw new Error('旧数据无法解析', { cause: error })
  }
}

function assertUniqueIds(items) {
  const ids = new Set()
  for (const item of items) {
    if (!item || typeof item !== 'object') throw new Error('旧数据无法解析')
    const id = String(item.id)
    if (ids.has(id)) throw new Error('检测到重复ID')
    ids.add(id)
  }
}

function withoutDerivedFields(workspace) {
  const { progress, status, ...rest } = workspace
  const strip = ({ progress: ignoredProgress, status: ignoredStatus, ...record }) => record

  return {
    ...rest,
    goals: Array.isArray(rest.goals) ? rest.goals.map(strip) : rest.goals,
    tasks: Array.isArray(rest.tasks) ? rest.tasks.map(strip) : rest.tasks,
    version: 2
  }
}

export function saveWorkspace(storage, workspace) {
  try {
    const json = JSON.stringify(withoutDerivedFields(workspace))
    JSON.parse(json)
    storage.setItem(WORKSPACE_KEY, json)
  } catch (error) {
    throw new Error('工作区保存失败', { cause: error })
  }
}

export function migrateLegacyWorkspace(storage, now) {
  const legacyGoals = parseLegacyArray(storage, 'goals')
  const legacyTasks = parseLegacyArray(storage, 'todos')
  assertUniqueIds(legacyGoals)
  assertUniqueIds(legacyTasks)

  const goals = legacyGoals.map((goal) => normalizeGoal(goal, now))
  const validGoalIds = new Set(goals.map((goal) => goal.id))
  const tasks = legacyTasks.map((task) => normalizeTask(task, validGoalIds, now))
  const orphanTaskIds = legacyTasks
    .filter((task) => task.goalId != null && !validGoalIds.has(String(task.goalId)))
    .map((task) => String(task.id))
  const workspace = { version: 2, goals, tasks }

  let backupJson
  let diagnosticsJson
  try {
    backupJson = JSON.stringify({ goals: legacyGoals, todos: legacyTasks })
    diagnosticsJson = JSON.stringify({ orphanTaskIds })
    JSON.parse(backupJson)
    JSON.parse(diagnosticsJson)
  } catch (error) {
    throw new Error('工作区保存失败', { cause: error })
  }

  storage.setItem(BACKUP_KEY, backupJson)
  storage.setItem(DIAGNOSTICS_KEY, diagnosticsJson)
  saveWorkspace(storage, workspace)
  return workspace
}

export function loadWorkspace(storage) {
  const raw = storage.getItem(WORKSPACE_KEY)
  if (!raw) return migrateLegacyWorkspace(storage, new Date().toISOString())
  const data = JSON.parse(raw)
  if (data.version !== 2) throw new Error('工作区数据版本不受支持')
  return data
}

export function patchWorkspace(storage, patch) {
  const next = { ...loadWorkspace(storage), ...patch, version: 2 }
  saveWorkspace(storage, next)
  return next
}
