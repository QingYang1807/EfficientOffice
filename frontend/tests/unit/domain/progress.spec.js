import { expect, it } from 'vitest'
import { deriveGoalView, deriveStatus, deriveTaskView, deriveWorkspaceViews } from '@/domain/progress'

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

it('derives every workspace view without changing recursive progress semantics', () => {
  const goals = [
    { id: 'root', parentGoalId: null, manualProgress: 0, weight: 1 },
    { id: 'leaf', parentGoalId: 'root', manualProgress: 0, weight: 1 }
  ]
  const tasks = [
    { id: 'parent', goalId: 'leaf', parentTaskId: null, completed: false, weight: 1 },
    { id: 'child', goalId: 'leaf', parentTaskId: 'parent', completed: true, weight: 1 }
  ]

  const views = deriveWorkspaceViews(goals, tasks, now)

  expect(views.tasks.get('parent')).toEqual({ progress: 100, completed: true, status: 'completed' })
  expect(views.goals.get('leaf')).toEqual({ progress: 100, status: 'completed' })
  expect(views.goals.get('root')).toEqual({ progress: 100, status: 'completed' })
})
