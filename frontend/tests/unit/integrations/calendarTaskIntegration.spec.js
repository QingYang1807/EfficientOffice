import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { useTaskStore } from '@/stores/tasks'
import { WORKSPACE_KEY } from '@/repositories/workspaceRepository'
import {
  createCalendarTask,
  deleteCalendarTasks,
  getCalendarTasksByDate,
  toggleCalendarTask,
  updateCalendarTask
} from '@/services/calendarTaskAdapter'

describe('calendar task integration', () => {
  it('maps a calendar entry to an unassigned V2 root task', () => {
    const createTask = vi.fn(input => ({ id: 'task-1', ...input }))

    const created = createCalendarTask({
      title: '项目复盘',
      description: '记录结论',
      priority: '高',
      deadline: '2026-08-23'
    }, { createTask })

    expect(createTask).toHaveBeenCalledWith({
      title: '项目复盘',
      description: '记录结论',
      priority: '高',
      deadline: '2026-08-23',
      goalId: null,
      parentTaskId: null,
      weight: 1
    })
    expect(created.id).toBe('task-1')
  })

  it('uses canonical update, completion and one atomic date deletion', () => {
    const taskStore = {
      tasks: [
        { id: 1, title: '甲', deadline: '2026-08-23', completed: false },
        { id: '2', title: '乙', deadline: '2026-08-23T18:00:00.000Z', completed: true },
        { id: '3', title: '丙', deadline: '2026-08-24', completed: false }
      ],
      viewFor: vi.fn(id => ({ completed: String(id) === '2' })),
      updateTask: vi.fn(),
      toggleTask: vi.fn(),
      deleteBatchTasks: vi.fn()
    }

    expect(getCalendarTasksByDate(taskStore, '2026-08-23').map(task => task.id)).toEqual(['1', '2'])
    updateCalendarTask('1', { title: '新标题', deadline: '2026-08-25' }, taskStore)
    toggleCalendarTask(1, true, taskStore)
    deleteCalendarTasks('2026-08-23', taskStore)

    expect(taskStore.updateTask).toHaveBeenCalledWith('1', expect.objectContaining({ title: '新标题', deadline: '2026-08-25' }))
    expect(taskStore.toggleTask).toHaveBeenCalledWith('1', true)
    expect(taskStore.deleteBatchTasks).toHaveBeenCalledTimes(1)
    expect(taskStore.deleteBatchTasks).toHaveBeenCalledWith(['1', '2'])
  })

  it('deletes all dated task trees in one persisted mutation', () => {
    setActivePinia(createPinia())
    const taskStore = useTaskStore()
    taskStore.createBatchTasks([
      { id: 'root', title: '根任务', deadline: '2026-08-23' },
      { id: 'child', title: '子任务', parentTaskId: 'root' },
      { id: 'keep', title: '保留', deadline: '2026-08-24' }
    ])

    deleteCalendarTasks('2026-08-23', taskStore)

    expect(taskStore.tasks.map(task => task.id)).toEqual(['keep'])
    expect(JSON.parse(localStorage.getItem(WORKSPACE_KEY)).tasks.map(task => task.id)).toEqual(['keep'])
  })
})
