import { describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createTasksFromAi } from '@/services/aiTaskAdapter'
import { buildGoalSummaries } from '@/services/dashboardGoalAdapter'
import aiModule from '@/store/modules/ai'
import { aiAPI } from '@/api/ai'
import { useTaskStore } from '@/stores/tasks'
import { useGoalStore } from '@/stores/goals'

vi.mock('@/api/ai', () => ({ aiAPI: { chat: vi.fn() } }))

describe('AI task integration', () => {
  it('creates root suggestions atomically in their goal', () => {
    const suggestions = [{ name: '发布检查', steps: ['构建', '验收'], priority: '高' }]
    const createBatchTasks = vi.fn(inputs => inputs)

    const created = createTasksFromAi({
      suggestions,
      goalId: 'g1',
      taskStore: { createBatchTasks }
    })

    expect(createBatchTasks).toHaveBeenCalledTimes(1)
    expect(createBatchTasks).toHaveBeenCalledWith([{
      title: '发布检查',
      description: '构建\n验收',
      priority: '高',
      deadline: null,
      goalId: 'g1',
      parentTaskId: null,
      weight: 1
    }])
    expect(created).toEqual(createBatchTasks.mock.results[0].value)
  })

  it('inherits the parent goal when creating child suggestions', () => {
    const createBatchTasks = vi.fn(inputs => inputs)
    const taskStore = {
      byId: vi.fn(() => ({ id: 'parent', goalId: 'g-parent' })),
      createBatchTasks
    }

    createTasksFromAi({
      suggestions: [{ name: '子任务', steps: [], priority: '中' }],
      goalId: 'g-wrong',
      parentTaskId: 'parent',
      taskStore
    })

    expect(createBatchTasks.mock.calls[0][0][0]).toMatchObject({
      goalId: 'g-parent',
      parentTaskId: 'parent'
    })
  })

  it('persists validated AI output through the canonical task store', async () => {
    setActivePinia(createPinia())
    useGoalStore().createGoal({ id: 'g1', title: '发布' })
    aiAPI.chat.mockResolvedValue(JSON.stringify({
      tasks: [{
        name: '发布检查',
        estimatedTime: '2小时',
        priority: '高',
        steps: ['构建', '验收', '发布'],
        completionCriteria: '通过验收',
        resources: ['CI']
      }]
    }))

    const result = await aiModule.actions.generateTasks(
      { commit: vi.fn() },
      { id: 'g1', title: '发布', description: '', deadline: null }
    )

    expect(result.tasks).toHaveLength(1)
    expect(useTaskStore().tasks[0]).toMatchObject({
      title: '发布检查',
      goalId: 'g1',
      parentTaskId: null,
      description: '构建\n验收\n发布'
    })
    expect(localStorage.getItem('todos')).toBeNull()
  })
})

describe('dashboard goal integration', () => {
  it('uses goal views derived from current tasks and time', () => {
    const tasks = [{ id: 't1', goalId: 'g1', completed: true }]
    const now = Date.parse('2026-08-23T10:00:00.000Z')
    const viewFor = vi.fn(() => ({ progress: 100, status: 'completed' }))
    const goalStore = { goals: [{ id: 'g1', title: '发布' }], viewFor }

    expect(buildGoalSummaries({ goalStore, taskStore: { tasks }, now })).toEqual([
      { id: 'g1', title: '发布', progress: 100, status: 'completed' }
    ])
    expect(viewFor).toHaveBeenCalledWith('g1', tasks, now)
  })
})
