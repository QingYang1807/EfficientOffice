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
  deleteGoal: vi.fn(),
  restoreWorkspaceBackup: vi.fn(),
  messageError: vi.fn()
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
vi.mock('@/repositories/workspaceRepository', () => ({
  BACKUP_KEY: 'efficient-office.workspace.v1.backup',
  restoreWorkspaceBackup: (...args) => mocks.restoreWorkspaceBackup(...args)
}))
vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: (...args) => mocks.messageError(...args) },
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
  emits: ['toggle', 'edit', 'move'],
  template: '<div><button data-testid="toggle-task" @click="$emit(\'toggle\', \'t1\')">toggle</button><button data-testid="edit-task" @click="$emit(\'edit\', \'t1\')">edit</button><button data-testid="move-task" @click="$emit(\'move\', \'t1\')">move</button></div>'
})

const GoalWorkspaceStub = defineComponent({
  name: 'GoalWorkspace',
  emits: ['view-tasks'],
  template: '<button data-testid="view-tasks" @click="$emit(\'view-tasks\', \'g2\')">view tasks</button>'
})

const GoalKanbanStub = defineComponent({ name: 'GoalKanban', template: '<div data-testid="kanban-view" />' })
const GoalMindMapStub = defineComponent({ name: 'GoalMindMap', template: '<div data-testid="mindmap-view" />' })
const TaskEditorDialogStub = defineComponent({ name: 'TaskEditorDialog', emits: ['save'], template: '<div />' })
const TaskMoveDialogStub = defineComponent({ name: 'TaskMoveDialog', emits: ['move'], template: '<div />' })

const stubs = {
  GoalTree: GoalTreeStub,
  GoalWorkspace: GoalWorkspaceStub,
  GoalTaskTree: GoalTaskTreeStub,
  GoalEditorDialog: { template: '<div />' },
  TaskEditorDialog: TaskEditorDialogStub,
  TaskMoveDialog: TaskMoveDialogStub,
  GoalKanban: GoalKanbanStub,
  GoalMindMap: GoalMindMapStub,
  'el-button': { template: '<button type="button"><slot /></button>' },
  'el-input': { template: '<input />' },
  'el-select': { template: '<select><slot /></select>' },
  'el-option': { props: ['label', 'value'], template: '<option :value="value">{{ label }}</option>' },
  'el-empty': { template: '<div><slot /></div>' },
  'el-result': { template: '<div><slot name="extra" /></div>' },
  'el-drawer': { template: '<aside><slot /></aside>' },
  'el-tabs': { template: '<div><slot /></div>' },
  'el-tab-pane': { template: '<section><slot /></section>' },
  'el-radio-group': { template: '<div><slot /></div>' },
  'el-radio-button': { template: '<button type="button"><slot /></button>' }
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
    moveGoal: vi.fn(),
    reload: vi.fn(), exportData: vi.fn(), lastError: null
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
  mocks.restoreWorkspaceBackup.mockReset()
  mocks.messageError.mockReset()
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
    toggleTask: vi.fn(),
    updateTask: vi.fn(),
    moveTask: vi.fn(),
    reload: vi.fn(), lastError: null
  })
})

describe('GoalManagement', () => {
  it('persists a valid first deep link and filters stale UI IDs again after goals change', async () => {
    mountPage()
    await flushPromises()

    expect(JSON.parse(localStorage.getItem('efficient-office.goal-ui.v1'))).toEqual({
      expandedIds: ['g1'], selectedId: 'g2', search: ''
    })

    mocks.goalStore.goals.splice(0, 2)
    await nextTick()
    expect(JSON.parse(localStorage.getItem('efficient-office.goal-ui.v1'))).toEqual({
      expandedIds: [], selectedId: null, search: ''
    })
  })

  it('restores the saved goal search filter with the hierarchy UI state', async () => {
    localStorage.setItem('efficient-office.goal-ui.v1', JSON.stringify({
      expandedIds: ['g1'], selectedId: 'g2', search: '子目标'
    }))

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.get('[data-testid="goal-search"]').attributes('modelvalue')).toBe('子目标')
    expect(JSON.parse(localStorage.getItem('efficient-office.goal-ui.v1'))).toEqual({
      expandedIds: ['g1'], selectedId: 'g2', search: '子目标'
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

  it('opens task management with an explicit current-goal-only URL', async () => {
    const wrapper = mountPage()
    await flushPromises()

    wrapper.findAllComponents(GoalWorkspaceStub)[0].vm.$emit('view-tasks', 'g2')
    expect(mocks.router.push).toHaveBeenCalledWith({
      name: 'TodoList', query: { goalId: 'g2', includeDescendants: '0' }
    })
  })

  it('edits and moves goal-side tasks through Task Store commands and follows the new goal path', async () => {
    mocks.taskStore.byId.mockImplementation(id => mocks.taskStore.tasks.find(task => task.id === id))
    mocks.taskStore.moveTask.mockReturnValue({ id: 't1', goalId: 'g3' })
    const wrapper = mountPage()
    await flushPromises()
    const taskTree = wrapper.findAllComponents(GoalTaskTreeStub)[0]

    taskTree.vm.$emit('edit', 't1')
    await flushPromises()
    wrapper.getComponent(TaskEditorDialogStub).vm.$emit('save', { id: 't1', title: '已编辑', goalId: 'g1', parentTaskId: null })
    expect(mocks.taskStore.updateTask).toHaveBeenCalledWith('t1', expect.objectContaining({ title: '已编辑' }))

    taskTree.vm.$emit('move', 't1')
    await flushPromises()
    wrapper.getComponent(TaskMoveDialogStub).vm.$emit('move', { taskId: 't1', goalId: 'g3', parentTaskId: null })
    expect(mocks.taskStore.moveTask).toHaveBeenCalledWith('t1', { goalId: 'g3', parentTaskId: null })
    expect(mocks.router.push).toHaveBeenCalledWith({ name: 'GoalDetail', params: { goalId: 'g3' } })
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

  it('switches all three derived views and requires an explicit refresh after external updates', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="kanban-view"]').exists()).toBe(false)

    await wrapper.get('[data-testid="view-kanban"]').trigger('click')
    expect(wrapper.get('[data-testid="kanban-view"]').exists()).toBe(true)
    await wrapper.get('[data-testid="view-mindmap"]').trigger('click')
    expect(wrapper.get('[data-testid="mindmap-view"]').exists()).toBe(true)

    window.dispatchEvent(new CustomEvent('workspace:stale'))
    await nextTick()
    const banner = wrapper.get('[data-testid="stale-workspace"]')
    expect(banner.text()).toContain('刷新数据')
    expect(banner.find('[aria-label="关闭"]').exists()).toBe(false)
    await banner.get('button').trigger('click')
    expect(mocks.goalStore.reload).toHaveBeenCalledOnce()
    expect(mocks.taskStore.reload).toHaveBeenCalledOnce()
    expect(wrapper.find('[data-testid="stale-workspace"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('restores the validated backup only after confirmation and reloads both stores', async () => {
    mocks.goalStore.lastError = '工作区保存失败'
    localStorage.setItem('efficient-office.workspace.v1.backup', JSON.stringify({ goals: [], todos: [] }))
    mocks.confirm.mockResolvedValue('confirm')
    mocks.restoreWorkspaceBackup.mockReturnValue({ goals: [], tasks: [] })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-testid="restore-workspace-backup"]').trigger('click')
    await flushPromises()

    expect(mocks.confirm).toHaveBeenCalledWith(
      expect.stringContaining('备份'),
      '恢复工作区',
      expect.objectContaining({ type: 'warning' })
    )
    expect(mocks.restoreWorkspaceBackup).toHaveBeenCalledWith(localStorage)
    expect(mocks.goalStore.reload).toHaveBeenCalledOnce()
    expect(mocks.taskStore.reload).toHaveBeenCalledOnce()
  })

  it('does not offer backup restore when no automatic backup exists', async () => {
    mocks.goalStore.lastError = '工作区保存失败'
    localStorage.removeItem('efficient-office.workspace.v1.backup')

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-testid="restore-workspace-backup"]').exists()).toBe(false)
  })

  it('reports an export failure without breaking recovery controls', async () => {
    mocks.goalStore.lastError = '工作区保存失败'
    mocks.goalStore.exportData.mockImplementation(() => { throw new Error('浏览器阻止下载') })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('.error-banner').findAll('button')[0].trigger('click')

    expect(mocks.messageError).toHaveBeenCalledWith('浏览器阻止下载')
    expect(wrapper.get('.error-banner').text()).toContain('导出数据')
  })
})
