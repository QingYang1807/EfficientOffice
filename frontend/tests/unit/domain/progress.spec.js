import { expect, it } from 'vitest'
import { deriveGoalView, deriveStatus, deriveTaskView } from '@/domain/progress'

const now = new Date('2026-08-23T12:00:00Z').getTime()

it('weights direct task children', () => {
  const tasks = [
    { id: 'p', parentTaskId: null, completed: false, weight: 1 },
    { id: 'a', parentTaskId: 'p', completed: true, weight: 3 },
    { id: 'b', parentTaskId: 'p', completed: false, weight: 1 },
    { id: 'b1', parentTaskId: 'b', completed: true, weight: 1 }
  ]

  expect(deriveTaskView('p', tasks, now).progress).toBe(100)
})

it('combines direct child goals and root tasks', () => {
  const goals = [
    { id: 'g1', parentGoalId: null, manualProgress: 10, weight: 1 },
    { id: 'g2', parentGoalId: 'g1', manualProgress: 100, weight: 1 }
  ]
  const tasks = [{ id: 't1', goalId: 'g1', parentTaskId: null, completed: false, weight: 1 }]

  expect(deriveGoalView('g1', goals, tasks, now).progress).toBe(50)
  expect(deriveStatus(100, '2026-08-01', now)).toBe('completed')
})

it('handles boundaries and cycles', () => {
  expect(deriveGoalView('leaf', [{ id: 'leaf', manualProgress: 33 }], [], now).progress).toBe(33)
  expect(deriveTaskView('p', [
    { id: 'p', completed: false },
    { id: 'c', parentTaskId: 'p', completed: true, weight: 0 }
  ], now).progress).toBe(0)
  expect(() => deriveTaskView('missing', [], now)).toThrow('任务不存在')
  expect(() => deriveTaskView('x', [
    { id: 'x', parentTaskId: 'y' },
    { id: 'y', parentTaskId: 'x' }
  ], now)).toThrow('检测到循环任务层级')
})

it('treats an infinite child weight as zero', () => {
  const view = deriveTaskView('p', [
    { id: 'p', completed: false },
    { id: 'c', parentTaskId: 'p', completed: true, weight: Infinity }
  ], now)

  expect(view.progress).toBe(0)
  expect(view.status).toBe('not_started')
})
