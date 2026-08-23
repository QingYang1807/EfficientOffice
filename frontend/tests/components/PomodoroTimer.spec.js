import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it, vi } from 'vitest'
import PomodoroTimer from '@/components/PomodoroTimer.vue'
import { saveWorkspace } from '@/repositories/workspaceRepository'
import { useTaskStore } from '@/stores/tasks'

const route = { query: { taskId: 'task-string-id' } }
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: vi.fn() })
}))
vi.mock('ant-design-vue', () => ({ message: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))

const stubs = {
  'el-tag': { template: '<span><slot /></span>' },
  'el-icon': { template: '<span><slot /></span>' },
  'el-input': { template: '<input />' },
  'el-select': { template: '<select><slot /></select>' },
  'el-option': { template: '<option />' },
  'el-dialog': { template: '<section><slot /><slot name="footer" /></section>' },
  'el-button': { template: '<button type="button"><slot /></button>' }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  saveWorkspace(localStorage, {
    version: 2,
    migratedAt: '2026-08-23T09:00:00.000Z',
    goals: [],
    tasks: [{
      id: 'task-string-id', goalId: null, parentTaskId: null, title: '字符串任务', description: '',
      completed: false, weight: 1, priority: '中', deadline: null, pomodoros: 0,
      createdAt: '2026-08-23T09:00:00.000Z', updatedAt: '2026-08-23T09:00:00.000Z'
    }]
  })
})

it('selects a string V2 task and persists pomodoro completion without legacy todos', async () => {
  const wrapper = mount(PomodoroTimer, { global: { stubs } })
  await wrapper.vm.$nextTick()
  expect(useTaskStore().tasks.map(task => task.id)).toEqual(['task-string-id'])
  expect(wrapper.text()).toContain('字符串任务')

  await wrapper.get('.start-btn').trigger('click')
  expect(JSON.parse(localStorage.getItem('efficient-office.workspace.v2')).tasks[0].pomodoroStartedAt).toEqual(expect.any(String))
  wrapper.vm.commitPomodoro(false)
  expect(JSON.parse(localStorage.getItem('efficient-office.workspace.v2')).tasks[0].pomodoros).toBe(1)
  expect(localStorage.getItem('todos')).toBe(null)
})
