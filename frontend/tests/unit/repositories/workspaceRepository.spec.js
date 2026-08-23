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
  expect(data.goals[0]).toMatchObject({ id: '1', parentGoalId: null, manualProgress: 40 })
  expect(data.tasks.map((task) => task.goalId)).toEqual(['1', null])
  expect(JSON.parse(localStorage.getItem(BACKUP_KEY))).toEqual({ goals, todos })
  expect(JSON.parse(localStorage.getItem(DIAGNOSTICS_KEY))).toEqual({ orphanTaskIds: ['3'] })
  expect(localStorage.getItem('goals')).toBe(JSON.stringify(goals))
  expect(localStorage.getItem('todos')).toBe(JSON.stringify(todos))
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

  expect(() => saveWorkspace(failingStorage, { goals: [], tasks: [] })).toThrow('工作区保存失败')
  expect(failingStorage.getItem(WORKSPACE_KEY)).toBe(null)
})

it('saves and patches V2 workspaces without persisting derived fields', () => {
  const storage = storageWith()
  saveWorkspace(storage, { goals: [], tasks: [], progress: 100, status: 'completed' })

  const next = patchWorkspace(storage, { goals: [{ id: 'g1' }], status: 'late' })

  expect(next).toEqual({ version: 2, goals: [{ id: 'g1' }], tasks: [], status: 'late' })
  expect(loadWorkspace(storage)).toEqual({ version: 2, goals: [{ id: 'g1' }], tasks: [] })
})
