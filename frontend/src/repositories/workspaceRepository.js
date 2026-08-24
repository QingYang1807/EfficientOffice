export const WORKSPACE_KEY = 'efficient-office.workspace.v2'
export const BACKUP_KEY = 'efficient-office.workspace.v1.backup'
export const DIAGNOSTICS_KEY = 'efficient-office.workspace.v2.diagnostics'

const knownRevisions = new WeakMap()

const priorities = new Set(['高', '中', '低'])

function storageFailure(error) {
  return error?.name === 'QuotaExceededError'
    ? new Error('本地存储空间不足，请先导出或清理数据', { cause: error })
    : new Error('工作区保存失败', { cause: error })
}

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

function nextRevision(previous) {
  const candidate = new Date().toISOString()
  const previousTime = Date.parse(previous)
  const candidateTime = Date.parse(candidate)
  return Number.isFinite(previousTime) && candidateTime <= previousTime
    ? new Date(previousTime + 1).toISOString()
    : candidate
}

function currentRevision(storage) {
  const raw = storage.getItem(WORKSPACE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw).updatedAt ?? null
  } catch (error) {
    throw storageFailure(error)
  }
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

function normalizeLegacyWorkspace(legacyGoals, legacyTasks, now) {
  assertUniqueIds(legacyGoals)
  assertUniqueIds(legacyTasks)
  const goals = legacyGoals.map(goal => normalizeGoal(goal, now))
  const validGoalIds = new Set(goals.map(goal => goal.id))
  const tasks = legacyTasks.map(task => normalizeTask(task, validGoalIds, now))
  const orphanTaskIds = legacyTasks
    .filter(task => task.goalId != null && !validGoalIds.has(String(task.goalId)))
    .map(task => String(task.id))
  return {
    workspace: { version: 2, migratedAt: now, updatedAt: now, goals, tasks },
    orphanTaskIds
  }
}

export function saveWorkspace(storage, workspace, options = {}) {
  const hasExpectedRevision = Object.prototype.hasOwnProperty.call(options, 'expectedUpdatedAt')
  const expectedUpdatedAt = hasExpectedRevision ? options.expectedUpdatedAt : null
  const persistedUpdatedAt = currentRevision(storage)
  if (hasExpectedRevision && persistedUpdatedAt !== expectedUpdatedAt) {
    throw new Error('数据已在其他页面更新，请刷新后重试')
  }
  const next = { ...workspace, updatedAt: nextRevision(persistedUpdatedAt) }
  const { json } = serializeWorkspace(next)
  try {
    storage.setItem(WORKSPACE_KEY, json)
  } catch (error) {
    throw storageFailure(error)
  }
  knownRevisions.set(storage, next.updatedAt)
  return next
}

export function migrateLegacyWorkspace(storage, now) {
  const legacyGoals = parseLegacyArray(storage, 'goals')
  const legacyTasks = parseLegacyArray(storage, 'todos')
  const { workspace, orphanTaskIds } = normalizeLegacyWorkspace(legacyGoals, legacyTasks, now)

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
    throw storageFailure(error)
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
    throw storageFailure(error)
  }
  knownRevisions.set(storage, workspace.updatedAt)
  return workspace
}

export function restoreWorkspaceBackup(storage, now = new Date().toISOString()) {
  let workspace
  let orphanTaskIds
  let workspaceJson
  let diagnosticsJson
  try {
    const raw = storage.getItem(BACKUP_KEY)
    if (!raw) throw new TypeError('backup is missing')
    const backup = JSON.parse(raw)
    if (!backup || !Array.isArray(backup.goals) || !Array.isArray(backup.todos)) {
      throw new TypeError('backup has invalid shape')
    }
    const normalized = normalizeLegacyWorkspace(backup.goals, backup.todos, now)
    workspace = normalized.workspace
    orphanTaskIds = normalized.orphanTaskIds
    workspaceJson = serializeWorkspace(workspace).json
    diagnosticsJson = JSON.stringify({ orphanTaskIds })
  } catch (error) {
    throw new Error('备份数据无法恢复', { cause: error })
  }

  const writes = [
    [DIAGNOSTICS_KEY, diagnosticsJson],
    [WORKSPACE_KEY, workspaceJson]
  ]
  const originals = new Map(writes.map(([key]) => [key, storage.getItem(key)]))
  const touched = []
  try {
    for (const [key, value] of writes) {
      touched.push(key)
      storage.setItem(key, value)
    }
  } catch (error) {
    for (const key of [...touched].reverse()) {
      try {
        const original = originals.get(key)
        if (original == null) storage.removeItem(key)
        else storage.setItem(key, original)
      } catch {
        // Continue restoring the remaining keys.
      }
    }
    throw storageFailure(error)
  }
  knownRevisions.set(storage, workspace.updatedAt)
  return workspace
}

export function loadWorkspace(storage, options = {}) {
  const raw = storage.getItem(WORKSPACE_KEY)
  if (!raw) {
    knownRevisions.delete(storage)
    return migrateLegacyWorkspace(storage, new Date().toISOString())
  }
  const data = JSON.parse(raw)
  if (data.version !== 2) throw new Error('工作区数据版本不受支持')
  if (options.trackRevision !== false) knownRevisions.set(storage, data.updatedAt ?? null)
  return data
}

export function patchWorkspace(storage, patch, options = {}) {
  const persistedUpdatedAt = currentRevision(storage)
  const hasExplicitRevision = Object.prototype.hasOwnProperty.call(options, 'expectedUpdatedAt')
  const hasExpectedRevision = hasExplicitRevision || knownRevisions.has(storage)
  const expectedUpdatedAt = hasExplicitRevision
    ? options.expectedUpdatedAt
    : knownRevisions.get(storage)
  if (hasExpectedRevision && persistedUpdatedAt !== expectedUpdatedAt) {
    throw new Error('数据已在其他页面更新，请刷新后重试')
  }
  const next = { ...loadWorkspace(storage), ...patch, version: 2 }
  return hasExpectedRevision
    ? saveWorkspace(storage, next, { expectedUpdatedAt })
    : saveWorkspace(storage, next)
}

export function workspaceForExport(storage) {
  const current = storage.getItem(WORKSPACE_KEY)
  if (current) return JSON.parse(current)
  const readLegacy = key => {
    const raw = storage.getItem(key)
    if (!raw) return []
    try { return JSON.parse(raw) } catch { return raw }
  }
  return { version: 1, goals: readLegacy('goals'), todos: readLegacy('todos') }
}

export function exportWorkspace(workspace) {
  const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: 'efficient-office-workspace-v2.json'
  })
  link.click()
  URL.revokeObjectURL(url)
}
