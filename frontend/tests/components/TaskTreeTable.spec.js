import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TaskTreeTable from '@/components/tasks/TaskTreeTable.vue'
import GoalBreadcrumb from '@/components/tasks/GoalBreadcrumb.vue'
import TaskEditorDialog from '@/components/tasks/TaskEditorDialog.vue'

const tasks = [
  { id: 't1', goalId: 'g3', parentTaskId: null, title: '发布', completed: false, priority: '中', deadline: null },
  { id: 't2', goalId: 'g3', parentTaskId: 't1', title: '验收', completed: false, priority: '高', deadline: '2026-08-30' },
  { id: 't3', goalId: null, parentTaskId: null, title: '整理资料', completed: false, priority: '低', deadline: null }
]
const goalPaths = {
  g3: [
    { id: 'g1', title: '年度目标' },
    { id: 'g2', title: '产品目标' },
    { id: 'g3', title: '发布2.0' }
  ]
}

describe('TaskTreeTable', () => {
  it('keeps child tasks hidden until expanded and emits ID-only row actions', async () => {
    const wrapper = mount(TaskTreeTable, { props: { tasks, goalPaths } })

    expect(wrapper.get('[data-testid="task-row-t1"]').text()).toContain('发布')
    expect(wrapper.find('[data-testid="task-row-t2"]').exists()).toBe(false)
    await wrapper.get('[data-testid="expand-task-t1"]').trigger('click')
    expect(wrapper.get('[data-testid="task-row-t2"]').text()).toContain('验收')
    expect(wrapper.get('[data-testid="goal-path-t2"]').text()).toBe('年度目标 / 产品目标 / 发布2.0')

    await wrapper.get('[data-testid="add-child-task-t2"]').trigger('click')
    expect(wrapper.emitted('create-child')).toEqual([['t2']])
  })

  it('shows unassigned root tasks and exposes the promotion/cascade delete choice', async () => {
    const wrapper = mount(TaskTreeTable, { props: { tasks, goalPaths } })

    expect(wrapper.get('[data-testid="goal-path-t3"]').text()).toBe('未归属目标')
    await wrapper.get('[data-testid="delete-task-t1"]').trigger('click')
    expect(wrapper.get('[data-testid="delete-mode-t1"]').exists()).toBe(true)
    await wrapper.get('[data-testid="promote-task-t1"]').trigger('click')
    expect(wrapper.emitted('delete')).toEqual([['t1', 'promote']])
  })

  it('keeps hidden descendants in parent semantics while filtering rows', async () => {
    const wrapper = mount(TaskTreeTable, {
      props: { tasks: [tasks[0]], allTasks: tasks.slice(0, 2), goalPaths }
    })

    const row = wrapper.get('[data-testid="task-row-t1"]')
    expect(row.get('input[type="checkbox"]').element.disabled).toBe(true)
    expect(row.get('[data-testid="expand-task-t1"]').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[data-testid="task-row-t2"]').exists()).toBe(false)

    await row.get('[data-testid="delete-task-t1"]').trigger('click')
    expect(wrapper.get('[data-testid="promote-task-t1"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="cascade-task-t1"]').exists()).toBe(true)
    await wrapper.get('[data-testid="promote-task-t1"]').trigger('click')
    expect(wrapper.emitted('delete')).toEqual([['t1', 'promote']])
  })

  it('exposes table headers and row cells to assistive technology', () => {
    const wrapper = mount(TaskTreeTable, { props: { tasks, goalPaths } })
    expect(wrapper.findAll('[role="columnheader"]')).toHaveLength(6)
    expect(wrapper.get('[data-testid="task-row-t1"]').findAll('[role="cell"]')).toHaveLength(6)
  })
})

describe('GoalBreadcrumb', () => {
  it('navigates with the ID of every clicked path segment', async () => {
    const wrapper = mount(GoalBreadcrumb, { props: { path: goalPaths.g3 } })
    await wrapper.get('[data-testid="goal-segment-g1"]').trigger('click')
    await wrapper.get('[data-testid="goal-segment-g3"]').trigger('click')
    expect(wrapper.emitted('navigate')).toEqual([['g1'], ['g3']])
  })
})

describe('TaskEditorDialog', () => {
  it('inherits and locks the parent task goal, then submits normalized IDs', async () => {
    const wrapper = mount(TaskEditorDialog, {
      props: {
        modelValue: true,
        goals: goalPaths.g3,
        tasks,
        context: { goalId: null, parentTaskId: 't1' }
      },
      global: {
        stubs: {
          'el-dialog': { template: '<section><slot /><slot name="footer" /></section>' },
          'el-button': { template: '<button type="button"><slot /></button>' }
        }
      }
    })

    const goal = wrapper.get('[data-testid="task-goal-select"]')
    expect(goal.element.disabled).toBe(true)
    expect(goal.element.value).toBe('g3')
    await wrapper.get('[data-testid="task-title-input"]').setValue('准备回滚')
    await wrapper.get('[data-testid="task-editor-submit"]').trigger('click')
    expect(wrapper.emitted('save')).toEqual([[
      expect.objectContaining({ title: '准备回滚', goalId: 'g3', parentTaskId: 't1' })
    ]])
  })
})
