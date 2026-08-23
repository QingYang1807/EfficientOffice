export const WORKSPACE_KEY = 'efficient-office.workspace.v2'
export const BACKUP_KEY = 'efficient-office.workspace.v1.backup'
export const DIAGNOSTICS_KEY = 'efficient-office.workspace.v2.diagnostics'

const priorities = new Set(['高', '中', '低'])

function normalizeLegacyId(record) {
  if (!record || typeof record !== 'object' || (typeof record.id !== 'string' && typeof record.id !== 'number')) {
    throw new Error('旧数据无法解析')
  }
  if ((typeof record.id === 'string' && record.id.trim() === '') || (typeof record.id === 'number' && !Number.isFinite(record.id))) {
    throw new Error('旧数据无法解析')
  }
  return String(record.id)
}

function normalizeWeight(value) {
  if (value == null) return 1
  if (typeof value !== 'number' && typeof value !== 'string') return 1
  if (typeof value === 'string' && value.trim() === '') return 1
  const weight = Number(value)
  return Number.isFinite(weight) ? Math.max(0, weight) : 1
}

const normalizeGoal = (goal, now) => ({
  id: normalizeLegacyId(goal),
  parentGoalId: goal.parentGoalId == null ? null : String(goal.parentGoalId),
  title: String(goal.title || '').trim(),
  description: String(goal.description || ''),
  manualProgress: Math.max(0, Math.min(100, Number(goal.manualProgress ?? goal.progress) || 0)),
  weight: normalizeWeight(goal.weight),
  startDate: goal.startDate || null,
  deadline: goal.deadline || null,
  createdAt: goal.createdAt ?? now,
  updatedAt: goal.updatedAt ?? now
})

const normalizeTask = (task, validGoalIds, now) => ({
  id: normalizeLegacyId(task),
  goalId: task.goalId != null && validGoalIds.has(String(task.goalId)) ? String(task.goalId) : null,
  parentTaskId: task.parentTaskId == null ? null : String(task.parentTaskId),
  title: String(task.title || task.text || '').trim(),
  description: String(task.description || ''),
  completed: Boolean(task.completed),
  weight: normalizeWeight(task.weight),
  priority: priorities.has(task.priority) ? task.priority : '中',
  deadline: task.deadline ?? task.dueDate ?? task.date ?? null,
  pomodoros: Math.max(0, Math.floor(Number(task.pomodoros) || 0)),
  pomodoroStartedAt: task.pomodoroStartedAt ?? null,
  completedAt: task.completedAt ?? null,
  createdAt: task.createdAt ?? now,
  updatedAt: task.updatedAt ?? now
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
    const id = normalizeLegacyId(item)
    if (ids.has(id)) throw new Error('检测到重复ID')
    ids.add(id)
  }
}

function withoutDerivedFields(workspace) {
  const rest = { ...workspace }
  delete rest.progress
  delete rest.status
  const strip = value => {
    const record = { ...value }
    delete record.progress
    delete record.status
    return record
  }

  return {
    ...rest,
    goals: Array.isArray(rest.goals) ? rest.goals.map(strip) : rest.goals,
    tasks: Array.isArray(rest.tasks) ? rest.tasks.map(strip) : rest.tasks,
    version: 2
  }
}

function indexRecords(records) {
  const byId = new Map()
  for (const record of records) {
    if (!record || typeof record !== 'object' || record.id == null) {
      throw new TypeError('record ID is required')
    }
    const id = String(record.id)
    if (byId.has(id)) throw new TypeError('duplicate record ID')
    byId.set(id, record)
  }
  return byId
}

function validateParentGraph(records, byId, parentKey) {
  for (const record of records) {
    const parentId = record[parentKey]
    if (parentId != null && !byId.has(String(parentId))) {
      throw new TypeError('parent record does not exist')
    }
  }

  const states = new Map()
  const visit = (id) => {
    const state = states.get(id)
    if (state === 'visiting') throw new TypeError('cyclic parent records')
    if (state === 'visited') return

    states.set(id, 'visiting')
    const parentId = byId.get(id)[parentKey]
    if (parentId != null) visit(String(parentId))
    states.set(id, 'visited')
  }

  for (const id of byId.keys()) visit(id)
}

function validateWorkspace(workspace) {
  if (!workspace || typeof workspace.migratedAt !== 'string' || workspace.migratedAt.trim() === '' || !Array.isArray(workspace.goals) || !Array.isArray(workspace.tasks)) {
    throw new TypeError('invalid workspace')
  }

  const goalsById = indexRecords(workspace.goals)
  const tasksById = indexRecords(workspace.tasks)
  validateParentGraph(workspace.goals, goalsById, 'parentGoalId')

  for (const task of workspace.tasks) {
    if (task.goalId != null && !goalsById.has(String(task.goalId))) {
      throw new TypeError('task goal does not exist')
    }
    if (task.parentTaskId != null) {
      const parent = tasksById.get(String(task.parentTaskId))
      if (!parent) throw new TypeError('parent task does not exist')
      const goalId = task.goalId == null ? null : String(task.goalId)
      const parentGoalId = parent.goalId == null ? null : String(parent.goalId)
      if (goalId !== parentGoalId) throw new TypeError('task parent goal differs')
    }
  }
  validateParentGraph(workspace.tasks, tasksById, 'parentTaskId')
}

function serializeWorkspace(workspace) {
  try {
    const data = withoutDerivedFields(workspace)
    validateWorkspace(data)
    const json = JSON.stringify(data)
    JSON.parse(json)
    return { data, json }
  } catch (error) {
    throw new Error('工作区保存失败', { cause: error })
  }
}

export function saveWorkspace(storage, workspace) {
  const { json } = serializeWorkspace(workspace)
  try {
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
  const workspace = { version: 2, migratedAt: now, goals, tasks }

  let backupJson
  let diagnosticsJson
  let workspaceJson
  try {
    backupJson = JSON.stringify({ goals: legacyGoals, todos: legacyTasks })
    diagnosticsJson = JSON.stringify({ orphanTaskIds })
    JSON.parse(backupJson)
    JSON.parse(diagnosticsJson)
    workspaceJson = serializeWorkspace(workspace).json
  } catch (error) {
    if (error.message === '工作区保存失败') throw error
    throw new Error('工作区保存失败', { cause: error })
  }

  const writes = [
    [BACKUP_KEY, backupJson],
    [DIAGNOSTICS_KEY, diagnosticsJson],
    [WORKSPACE_KEY, workspaceJson]
  ]
  let originals
  const touched = []
  try {
    originals = new Map(writes.map(([key]) => [key, storage.getItem(key)]))
    for (const [key, value] of writes) {
      touched.push(key)
      storage.setItem(key, value)
    }
  } catch (error) {
    if (originals) {
      for (const key of [...touched].reverse()) {
        try {
          const original = originals.get(key)
          if (original == null) storage.removeItem(key)
          else storage.setItem(key, original)
        } catch {
          // Continue restoring the remaining keys.
        }
      }
    }
    throw new Error('工作区保存失败', { cause: error })
  }
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
