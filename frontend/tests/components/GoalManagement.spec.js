import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, nextTick, reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GoalManagement from '@/views/GoalManagement.vue'

const mocks = vi.hoisted(() => ({
  route: { params: { goalId: 'g2' } },
  router: { push: vi.fn(), replace: vi.fn() },
  goalStore: null,
  taskStore: null,
  confirm: vi.fn(),
  prompt: vi.fn(),
  deleteGoal: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => mocks.router
}))
vi.mock('@/stores/goals', () => ({ useGoalStore: () => mocks.goalStore }))
vi.mock('@/stores/tasks', () => ({ useTaskStore: () => mocks.taskStore }))
vi.mock('@/services/workspaceCommands', () => ({
  deleteGoal: (...args) => mocks.deleteGoal(...args)
}))
vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn() },
  ElMessageBox: {
    confirm: (...args) => mocks.confirm(...args),
    prompt: (...args) => mocks.prompt(...args)
  }
}))

const GoalTreeStub = defineComponent({
  name: 'GoalTree',
  emits: ['move', 'delete'],
  template: '<div><button data-testid="move" @click="$emit(\'move\', \'g1\')">move</button><button data-testid="delete" @click="$emit(\'delete\', \'g1\')">delete</button></div>'
})

const GoalTaskTreeStub = defineComponent({
  name: 'GoalTaskTree',
  emits: ['toggle'],
  template: '<button data-testid="toggle-task" @click="$emit(\'toggle\', \'t1\')">toggle</button>'
})

const stubs = {
  GoalTree: GoalTreeStub,
  GoalWorkspace: { template: '<div />' },
  GoalTaskTree: GoalTaskTreeStub,
  GoalEditorDialog: { template: '<div />' },
  'el-button': { template: '<button type="button"><slot /></button>' },
  'el-input': { template: '<input />' },
  'el-empty': { template: '<div><slot /></div>' },
  'el-result': { template: '<div><slot name="extra" /></div>' },
  'el-drawer': { template: '<aside><slot /></aside>' },
  'el-tabs': { template: '<div><slot /></div>' },
  'el-tab-pane': { template: '<section><slot /></section>' }
}

function makeGoalStore() {
  const store = reactive({
    goals: [
      { id: 'g1', parentGoalId: null, title: '根目标', weight: 1 },
      { id: 'g2', parentGoalId: 'g1', title: '子目标', weight: 1 },
      { id: 'g3', parentGoalId: 'g2', title: '孙目标', weight: 1 }
    ],
    initialized: false,
    tree: [{ id: 'g1' }],
    initialize: vi.fn(),
    byId(id) { return this.goals.find(goal => goal.id === String(id)) || null },
    pathFor(id) { return this.goals.filter(goal => ['g1', String(id)].includes(goal.id)) },
    viewFor: vi.fn(() => ({ progress: 0, status: 'not_started' })),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    moveGoal: vi.fn()
  })
  return store
}

function mountPage() {
  return mount(GoalManagement, { global: { stubs } })
}

beforeEach(() => {
  localStorage.setItem('efficient-office.goal-ui.v1', JSON.stringify({
    expandedIds: ['g1', 'missing'], selectedId: 'stale'
  }))
  mocks.route.params.goalId = 'g2'
  mocks.router.push.mockReset()
  mocks.router.replace.mockReset()
  mocks.confirm.mockReset()
  mocks.prompt.mockReset()
  mocks.deleteGoal.mockReset()
  mocks.goalStore = makeGoalStore()
  mocks.taskStore = reactive({
    tasks: [
      { id: 't1', goalId: 'g1', parentTaskId: null, title: '根任务', completed: false, weight: 1 },
      { id: 't2', goalId: 'g2', parentTaskId: null, title: '子任务', completed: false, weight: 1 },
      { id: 't3', goalId: 'g3', parentTaskId: null, title: '孙任务', completed: false, weight: 1 }
    ],
    initialize: vi.fn(),
    viewFor: vi.fn(() => ({ progress: 0, completed: false })),
    byId: vi.fn(),
    toggleTask: vi.fn()
  })
})

describe('GoalManagement', () => {
  it('persists a valid first deep link and filters stale UI IDs again after goals change', async () => {
    mountPage()
    await flushPromises()

    expect(JSON.parse(localStorage.getItem('efficient-office.goal-ui.v1'))).toEqual({
      expandedIds: ['g1'], selectedId: 'g2'
    })

    mocks.goalStore.goals.splice(0, 2)
    await nextTick()
    expect(JSON.parse(localStorage.getItem('efficient-office.goal-ui.v1'))).toEqual({
      expandedIds: [], selectedId: null
    })
  })

  it('wires move and delete actions from the drawer tree', async () => {
    mocks.prompt.mockResolvedValue({ value: 'g3' })
    mocks.confirm.mockResolvedValue('confirm')
    const wrapper = mountPage()
    await flushPromises()
    const drawerTree = wrapper.findAllComponents(GoalTreeStub).at(-1)

    drawerTree.vm.$emit('move', 'g2')
    await flushPromises()
    expect(mocks.goalStore.moveGoal).toHaveBeenCalledWith('g2', 'g3')

    drawerTree.vm.$emit('delete', 'g1')
    await flushPromises()
    expect(mocks.deleteGoal).toHaveBeenCalledWith(expect.objectContaining({ goalId: 'g1', mode: 'promote' }))
  })

  it('passes only the task ID to the Store so it owns current-state toggling', async () => {
    const wrapper = mountPage()
    await flushPromises()

    wrapper.findAllComponents(GoalTaskTreeStub)[0].vm.$emit('toggle', 't1')
    expect(mocks.taskStore.toggleTask).toHaveBeenCalledWith('t1')
  })

  it('shows impact counts and supports both default promotion and explicit cascade deletion', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const tree = wrapper.findAllComponents(GoalTreeStub)[0]

    mocks.confirm.mockResolvedValueOnce('confirm')
    tree.vm.$emit('delete', 'g1')
    await flushPromises()
    expect(mocks.confirm.mock.calls[0][0]).toContain('2 个子目标')
    expect(mocks.confirm.mock.calls[0][0]).toContain('3 个任务')
    expect(mocks.confirm.mock.calls[0][2]).toEqual(expect.objectContaining({
      confirmButtonText: '提升并删除', cancelButtonText: '级联删除'
    }))
    expect(mocks.deleteGoal).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'promote' }))

    mocks.confirm.mockRejectedValueOnce('cancel')
    tree.vm.$emit('delete', 'g1')
    await flushPromises()
    expect(mocks.deleteGoal).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'cascade' }))
  })
})
