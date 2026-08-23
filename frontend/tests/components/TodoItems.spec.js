import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TodoItems from '@/components/TodoItems.vue'

const mocks = vi.hoisted(() => ({
  route: null,
  router: { push: vi.fn(), replace: vi.fn() },
  goalStore: null,
  taskStore: null
}))

vi.mock('vue-router', () => ({ useRoute: () => mocks.route, useRouter: () => mocks.router }))
vi.mock('@/stores/goals', () => ({ useGoalStore: () => mocks.goalStore }))
vi.mock('@/stores/tasks', () => ({ useTaskStore: () => mocks.taskStore }))
vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  ElMessageBox: { prompt: vi.fn() }
}))

const TaskTableStub = defineComponent({
  name: 'TaskTreeTable',
  props: { tasks: Array, goalPaths: Object },
  emits: ['navigate-goal', 'start'],
  template: '<div><button data-testid="navigate-goal" @click="$emit(\'navigate-goal\', \'g2\')" /><button data-testid="start" @click="$emit(\'start\', \'t1\')" /></div>'
})

const stubs = {
  TaskTreeTable: TaskTableStub,
  TaskEditorDialog: { template: '<div />' },
  'el-tag': { template: '<span><slot /></span>' },
  'el-button': { template: '<button type="button"><slot /></button>' },
  'el-input': { template: '<input />' },
  'el-select': { template: '<select><slot /></select>' },
  'el-option': { template: '<option />' },
  'el-switch': { template: '<input type="checkbox" />' },
  'el-date-picker': { template: '<input />' }
}

beforeEach(() => {
  mocks.route = reactive({ query: { goalId: 'g1', includeDescendants: '0' } })
  mocks.router.push.mockReset()
  mocks.router.replace.mockReset()
  const goals = [
    { id: 'g1', parentGoalId: null, title: '年度目标' },
    { id: 'g2', parentGoalId: 'g1', title: '发布目标' }
  ]
  const tasks = [
    { id: 't1', goalId: 'g1', parentTaskId: null, title: '根目标任务', completed: false },
    { id: 't2', goalId: 'g2', parentTaskId: null, title: '后代目标任务', completed: false },
    { id: 't3', goalId: null, parentTaskId: null, title: '未归属任务', completed: false }
  ]
  mocks.goalStore = {
    goals, initialize: vi.fn(), byId: id => goals.find(goal => goal.id === String(id)) || null,
    pathFor: id => id === 'g2' ? goals : [goals[0]]
  }
  mocks.taskStore = {
    tasks, initialize: vi.fn(), viewFor: id => ({ completed: tasks.find(task => task.id === id).completed }),
    tasksForGoal: (id, descendants) => tasks.filter(task => task.goalId === id || (descendants && task.goalId === 'g2'))
  }
})

describe('TodoItems route context', () => {
  it('uses goalId and includeDescendants from the URL without hiding all unassigned tasks globally', async () => {
    const wrapper = mount(TodoItems, { global: { stubs } })
    expect(wrapper.getComponent(TaskTableStub).props('tasks').map(task => task.id)).toEqual(['t1'])

    mocks.route.query.includeDescendants = '1'
    await nextTick()
    expect(wrapper.getComponent(TaskTableStub).props('tasks').map(task => task.id)).toEqual(['t1', 't2'])

    delete mocks.route.query.goalId
    await nextTick()
    expect(wrapper.getComponent(TaskTableStub).props('tasks').map(task => task.id)).toEqual(['t1', 't2', 't3'])
  })

  it('supports task-to-goal and task-to-pomodoro navigation', async () => {
    const wrapper = mount(TodoItems, { global: { stubs } })
    await wrapper.get('[data-testid="navigate-goal"]').trigger('click')
    await wrapper.get('[data-testid="start"]').trigger('click')
    expect(mocks.router.push).toHaveBeenNthCalledWith(1, { name: 'GoalDetail', params: { goalId: 'g2' } })
    expect(mocks.router.push).toHaveBeenNthCalledWith(2, { path: '/pomodoro-timer', query: { taskId: 't1' } })
  })
})
