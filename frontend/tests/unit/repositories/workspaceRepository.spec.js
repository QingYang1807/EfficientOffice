import { expect, it } from 'vitest'
import {
  BACKUP_KEY,
  DIAGNOSTICS_KEY,
  WORKSPACE_KEY,
  loadWorkspace,
  migrateLegacyWorkspace,
  patchWorkspace,
  saveWorkspace
} from '@/repositories/workspaceRepository'

const now = '2026-08-23T12:00:00.000Z'

function storageWith(items = {}) {
  const values = new Map(Object.entries(items))
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
    removeItem(key) {
      values.delete(key)
    }
  }
}

it('migrates legacy records, preserves their raw backup, and records orphan task IDs', () => {
  const goals = [{ id: 1, title: '目标', progress: 40 }]
  const todos = [
    { id: 2, text: '有效任务', goalId: 1 },
    { id: 3, text: '孤儿任务', goalId: 404 }
  ]
  localStorage.setItem('goals', JSON.stringify(goals))
  localStorage.setItem('todos', JSON.stringify(todos))

  const data = migrateLegacyWorkspace(localStorage, now)

  expect(data.version).toBe(2)
  expect(data.migratedAt).toBe(now)
  expect(data.goals[0]).toMatchObject({ id: '1', parentGoalId: null, manualProgress: 40 })
  expect(data.tasks.map((task) => task.goalId)).toEqual(['1', null])
  expect(JSON.parse(localStorage.getItem(BACKUP_KEY))).toEqual({ goals, todos })
  expect(JSON.parse(localStorage.getItem(DIAGNOSTICS_KEY))).toEqual({ orphanTaskIds: ['3'] })
  expect(localStorage.getItem('goals')).toBe(JSON.stringify(goals))
  expect(localStorage.getItem('todos')).toBe(JSON.stringify(todos))
})

it('preserves zero-valued weights and timestamps while migrating', () => {
  const storage = storageWith({
    goals: JSON.stringify([{ id: 'g1', weight: 0, createdAt: 0, updatedAt: 0 }]),
    todos: JSON.stringify([{ id: 't1', goalId: 'g1', weight: 0, createdAt: 0, updatedAt: 0 }])
  })

  const data = migrateLegacyWorkspace(storage, now)

  expect(data.goals[0]).toMatchObject({ weight: 0, createdAt: 0, updatedAt: 0 })
  expect(data.tasks[0]).toMatchObject({ weight: 0, createdAt: 0, updatedAt: 0 })
})

it('defaults only nullish or invalid legacy weights', () => {
  const storage = storageWith({
    goals: JSON.stringify([{ id: 'g1', weight: null }, { id: 'g2', weight: 'not-a-number' }, { id: 'g3', weight: '' }]),
    todos: JSON.stringify([{ id: 't1', goalId: 'g1', weight: null }, { id: 't2', goalId: 'g2', weight: 'not-a-number' }, { id: 't3', goalId: 'g3', weight: '' }])
  })

  const data = migrateLegacyWorkspace(storage, now)

  expect(data.goals.map((goal) => goal.weight)).toEqual([1, 1, 1])
  expect(data.tasks.map((task) => task.weight)).toEqual([1, 1, 1])
})

it('does not replace V2 data when either legacy value is malformed', () => {
  const existing = JSON.stringify({ version: 2, goals: [{ id: 'safe' }], tasks: [] })
  const storage = storageWith({
    [WORKSPACE_KEY]: existing,
    goals: '[{"id": 1}]',
    todos: '{bad json'
  })

  expect(() => migrateLegacyWorkspace(storage, now)).toThrow('旧数据无法解析')
  expect(storage.getItem(WORKSPACE_KEY)).toBe(existing)
  expect(storage.getItem(BACKUP_KEY)).toBe(null)
  expect(storage.getItem(DIAGNOSTICS_KEY)).toBe(null)
})

it('does not replace V2 data when normalized legacy IDs duplicate', () => {
  const existing = JSON.stringify({ version: 2, goals: [{ id: 'safe' }], tasks: [] })
  const storage = storageWith({
    [WORKSPACE_KEY]: existing,
    goals: JSON.stringify([{ id: 1 }, { id: '1' }]),
    todos: '[]'
  })

  expect(() => migrateLegacyWorkspace(storage, now)).toThrow('检测到重复ID')
  expect(storage.getItem(WORKSPACE_KEY)).toBe(existing)
  expect(storage.getItem(BACKUP_KEY)).toBe(null)
  expect(storage.getItem(DIAGNOSTICS_KEY)).toBe(null)
})

it.each([
  ['a missing goal ID', JSON.stringify([{}]), '[]'],
  ['an invalid goal ID', JSON.stringify([{ id: ' ' }]), '[]'],
  ['a missing task ID', JSON.stringify([{ id: 'g1' }]), JSON.stringify([{}])],
  ['an invalid task ID', JSON.stringify([{ id: 'g1' }]), JSON.stringify([{ id: {} }])]
])('rejects legacy records with %s before replacing V2 bytes', (_name, goals, todos) => {
  const existing = '{"version":2,"migratedAt":"old","goals":[],"tasks":[]}'
  const storage = storageWith({ [WORKSPACE_KEY]: existing, goals, todos })

  expect(() => migrateLegacyWorkspace(storage, now)).toThrow('旧数据无法解析')
  expect(storage.getItem(WORKSPACE_KEY)).toBe(existing)
  expect(storage.getItem(BACKUP_KEY)).toBe(null)
  expect(storage.getItem(DIAGNOSTICS_KEY)).toBe(null)
})

it('rejects an unsupported V2 version', () => {
  const storage = storageWith({
    [WORKSPACE_KEY]: JSON.stringify({ version: 3, goals: [], tasks: [] })
  })

  expect(() => loadWorkspace(storage)).toThrow('工作区数据版本不受支持')
})

it('does not write a workspace when storage rejects the save', () => {
  const failingStorage = {
    getItem() {
      return null
    },
    setItem() {
      throw new Error('quota exceeded')
    }
  }

  expect(() => saveWorkspace(failingStorage, { migratedAt: now, goals: [], tasks: [] })).toThrow('工作区保存失败')
  expect(failingStorage.getItem(WORKSPACE_KEY)).toBe(null)
})

it('saves and patches V2 workspaces without persisting derived fields', () => {
  const storage = storageWith()
  saveWorkspace(storage, { migratedAt: now, goals: [], tasks: [], progress: 100, status: 'completed' })

  const next = patchWorkspace(storage, { goals: [{ id: 'g1' }], status: 'late' })

  expect(next).toEqual({ version: 2, migratedAt: now, goals: [{ id: 'g1' }], tasks: [], status: 'late' })
  expect(loadWorkspace(storage)).toEqual({ version: 2, migratedAt: now, goals: [{ id: 'g1' }], tasks: [] })
})

it('rejects a workspace without migratedAt without changing existing V2 bytes', () => {
  const existing = '{"version":2,"migratedAt":"old","goals":[],"tasks":[]}'
  const storage = storageWith({ [WORKSPACE_KEY]: existing })

  expect(() => saveWorkspace(storage, { goals: [], tasks: [] })).toThrow('工作区保存失败')
  expect(storage.getItem(WORKSPACE_KEY)).toBe(existing)
})

it.each([0, {}, '', '  '])('rejects non-string migratedAt %j without changing existing V2 bytes', (migratedAt) => {
  const existing = '{"version":2,"migratedAt":"old","goals":[],"tasks":[]}'
  const storage = storageWith({ [WORKSPACE_KEY]: existing })

  expect(() => saveWorkspace(storage, { migratedAt, goals: [], tasks: [] })).toThrow('工作区保存失败')
  expect(storage.getItem(WORKSPACE_KEY)).toBe(existing)
})

it('keeps existing V2 bytes when a patch makes migratedAt invalid', () => {
  const existing = '{"version":2,"migratedAt":"old","goals":[],"tasks":[]}'
  const storage = storageWith({ [WORKSPACE_KEY]: existing })

  expect(() => patchWorkspace(storage, { migratedAt: 0 })).toThrow('工作区保存失败')
  expect(storage.getItem(WORKSPACE_KEY)).toBe(existing)
})

it('keeps existing V2 bytes when migration receives an invalid migratedAt', () => {
  const existing = '{"version":2,"migratedAt":"old","goals":[],"tasks":[]}'
  const storage = storageWith({
    [WORKSPACE_KEY]: existing,
    goals: JSON.stringify([{ id: 'g1' }]),
    todos: '[]'
  })

  expect(() => migrateLegacyWorkspace(storage, 0)).toThrow('工作区保存失败')
  expect(storage.getItem(WORKSPACE_KEY)).toBe(existing)
})

it.each([
  ['non-array goals', { migratedAt: now, goals: {}, tasks: [] }],
  ['duplicate goal IDs', { migratedAt: now, goals: [{ id: 'g1' }, { id: 'g1' }], tasks: [] }],
  ['missing goal parent', { migratedAt: now, goals: [{ id: 'g1', parentGoalId: 'gone' }], tasks: [] }],
  ['cyclic goal parents', { migratedAt: now, goals: [{ id: 'g1', parentGoalId: 'g2' }, { id: 'g2', parentGoalId: 'g1' }], tasks: [] }],
  ['duplicate task IDs', { migratedAt: now, goals: [], tasks: [{ id: 't1' }, { id: 't1' }] }],
  ['missing task parent', { migratedAt: now, goals: [], tasks: [{ id: 't1', parentTaskId: 'gone' }] }],
  ['cyclic task parents', { migratedAt: now, goals: [], tasks: [{ id: 't1', parentTaskId: 't2' }, { id: 't2', parentTaskId: 't1' }] }],
  ['a task parent in a different goal', {
    migratedAt: now,
    goals: [{ id: 'g1' }, { id: 'g2' }],
    tasks: [{ id: 'parent', goalId: 'g1' }, { id: 'child', goalId: 'g2', parentTaskId: 'parent' }]
  }],
  ['a task goal that does not exist', { migratedAt: now, goals: [], tasks: [{ id: 't1', goalId: 'gone' }] }]
])('rejects %s without changing existing V2 bytes', (_name, workspace) => {
  const existing = '{"version":2,"migratedAt":"old","goals":[],"tasks":[]}'
  const storage = storageWith({ [WORKSPACE_KEY]: existing })

  expect(() => saveWorkspace(storage, workspace)).toThrow('工作区保存失败')
  expect(storage.getItem(WORKSPACE_KEY)).toBe(existing)
})

it('keeps existing V2 bytes when a legacy relationship is invalid', () => {
  const existing = '{"version":2,"migratedAt":"old","goals":[],"tasks":[]}'
  const storage = storageWith({
    [WORKSPACE_KEY]: existing,
    goals: JSON.stringify([{ id: 'g1', parentGoalId: 'gone' }]),
    todos: '[]'
  })

  expect(() => migrateLegacyWorkspace(storage, now)).toThrow('工作区保存失败')
  expect(storage.getItem(WORKSPACE_KEY)).toBe(existing)
})

it('keeps existing V2 bytes when a patch violates workspace integrity', () => {
  const existing = '{"version":2,"migratedAt":"old","goals":[],"tasks":[]}'
  const storage = storageWith({ [WORKSPACE_KEY]: existing })

  expect(() => patchWorkspace(storage, { goals: [{ id: 'g1', parentGoalId: 'gone' }] })).toThrow('工作区保存失败')
  expect(storage.getItem(WORKSPACE_KEY)).toBe(existing)
})
