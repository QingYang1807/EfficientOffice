import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GoalWorkspace from '@/components/goals/GoalWorkspace.vue'
import GoalEditorDialog from '@/components/goals/GoalEditorDialog.vue'
import GoalTaskTree from '@/components/goals/GoalTaskTree.vue'

const goal = {
  id: 'g2',
  parentGoalId: 'g1',
  title: '产品发布',
  description: '在月底前完成正式发布',
  deadline: '2026-09-30',
  manualProgress: null,
  weight: 1
}

const stubs = {
  'el-breadcrumb': { template: '<nav><slot /></nav>' },
  'el-breadcrumb-item': { template: '<span><slot /></span>' },
  'el-tag': { template: '<span><slot /></span>' },
  'el-button': { template: '<button type="button"><slot /></button>' },
  'el-progress': { template: '<span />' },
  'el-empty': { template: '<span />' },
  'el-switch': { template: '<button type="button" />' },
  'el-checkbox': {
    props: ['ariaLabel'],
    emits: ['change'],
    template: '<input type="checkbox" :aria-label="ariaLabel" @change="$emit(\'change\', $event.target.checked)" />'
  },
  'el-dialog': {
    props: ['modelValue'],
    template: '<section v-if="modelValue"><slot /><slot name="footer" /></section>'
  }
}

describe('GoalWorkspace', () => {
  it('renders the full path, derived progress, direct children and progress composition', async () => {
    const wrapper = mount(GoalWorkspace, {
      props: {
        goal,
        path: [{ id: 'g1', title: '年度目标' }, goal],
        view: { progress: 65, status: 'in_progress' },
        childGoals: [{ id: 'g3', title: '灰度上线', deadline: null }],
        contributions: [
          { id: 'g3', type: 'goal', title: '灰度上线', progress: 50, weight: 1 },
          { id: 't1', type: 'task', title: '验收清单', progress: 80, weight: 1 }
        ]
      },
      global: { stubs }
    })

    expect(wrapper.text()).toContain('年度目标')
    expect(wrapper.text()).toContain('产品发布')
    expect(wrapper.get('[data-testid="goal-progress-g2"]').text()).toBe('65%')
    expect(wrapper.get('#goal-progress-g2').text()).toBe('65%')
    expect(wrapper.text()).toContain('直属子目标')
    expect(wrapper.text()).toContain('灰度上线')
    expect(wrapper.text()).toContain('进度构成')
    expect(wrapper.text()).toContain('验收清单')

    await wrapper.get('[data-testid="create-child-goal"]').trigger('click')
    await wrapper.get('[data-testid="create-goal-task"]').trigger('click')
    await wrapper.get('[data-testid="view-goal-tasks"]').trigger('click')
    expect(wrapper.emitted('create-child')).toEqual([['g2']])
    expect(wrapper.emitted('create-task')).toEqual([['g2']])
    expect(wrapper.emitted('view-tasks')).toEqual([['g2']])
  })
})

describe('GoalEditorDialog', () => {
  it('does not submit an empty title or a deadline before the start date', async () => {
    const wrapper = mount(GoalEditorDialog, {
      props: { modelValue: true, parentGoalId: 'g1' },
      global: { stubs },
      attachTo: document.body
    })

    await wrapper.get('[data-testid="goal-editor-submit"]').trigger('click')
    expect(wrapper.emitted('save')).toBeUndefined()

    await wrapper.get('[data-testid="goal-title-input"]').setValue('子目标')
    await wrapper.get('[data-testid="goal-start-input"]').setValue('2026-09-10')
    await wrapper.get('[data-testid="goal-deadline-input"]').setValue('2026-09-01')
    await wrapper.get('[data-testid="goal-editor-submit"]').trigger('click')
    expect(wrapper.emitted('save')).toBeUndefined()
    wrapper.unmount()
  })

  it('submits the parent ID and normalized optional dates for a valid child goal', async () => {
    const wrapper = mount(GoalEditorDialog, {
      props: { modelValue: true, parentGoalId: 'g1' },
      global: { stubs }
    })

    await wrapper.get('[data-testid="goal-title-input"]').setValue('子目标')
    await wrapper.get('[data-testid="goal-editor-submit"]').trigger('click')

    expect(wrapper.emitted('save')).toEqual([[{
      parentGoalId: 'g1', title: '子目标', description: '', manualProgress: null,
      startDate: null, deadline: null, weight: 1
    }]])
  })

  it('edits 0-100 manual progress only when the goal has no contributions', async () => {
    const wrapper = mount(GoalEditorDialog, {
      props: { modelValue: true, goal: { ...goal, manualProgress: 35 }, hasContributions: false },
      global: { stubs }
    })
    const progress = wrapper.get('[data-testid="goal-manual-progress-input"]')
    expect(progress.element.disabled).toBe(false)
    expect(progress.element.value).toBe('35')

    await progress.setValue('72')
    await wrapper.get('[data-testid="goal-editor-submit"]').trigger('click')

    expect(wrapper.emitted('save')[0][0]).toEqual(expect.objectContaining({ id: 'g2', manualProgress: 72 }))
  })

  it('disables manual progress with a derived-progress explanation when contributions exist', () => {
    const wrapper = mount(GoalEditorDialog, {
      props: { modelValue: true, goal: { ...goal, manualProgress: 35 }, hasContributions: true },
      global: { stubs }
    })

    expect(wrapper.get('[data-testid="goal-manual-progress-input"]').element.disabled).toBe(true)
    expect(wrapper.text()).toContain('已有直属子目标或根任务，进度由贡献项自动汇总')
  })
})

describe('GoalTaskTree', () => {
  it('shows only the current goal until descendant inclusion is explicit', async () => {
    const tasks = [
      { id: 't1', goalId: 'g1', parentTaskId: null, title: '当前目标任务', completed: false, weight: 1 },
      { id: 't2', goalId: 'g2', parentTaskId: null, title: '后代目标任务', completed: false, weight: 1 }
    ]
    const wrapper = mount(GoalTaskTree, {
      props: { tasks, goalId: 'g1', descendantGoalIds: ['g2'] },
      global: { stubs }
    })

    expect(wrapper.text()).toContain('当前目标任务')
    expect(wrapper.text()).not.toContain('后代目标任务')
    await wrapper.setProps({ includeDescendants: true })
    expect(wrapper.text()).toContain('后代目标任务')
  })

  it('labels completion controls and emits only the selected task ID', async () => {
    const tasks = [
      { id: 't1', goalId: 'g1', parentTaskId: null, title: '验收发布', completed: false, weight: 1 }
    ]
    const wrapper = mount(GoalTaskTree, {
      props: { tasks, goalId: 'g1' },
      global: { stubs }
    })

    const checkbox = wrapper.get('input[type="checkbox"]')
    expect(checkbox.attributes('aria-label')).toBe('完成验收发布')
    expect(wrapper.get('[data-testid="task-progress-t1"]').text()).toBe('0%')
    await checkbox.setValue(true)
    expect(wrapper.emitted('toggle')).toEqual([['t1']])
    await wrapper.get('[data-testid="edit-goal-task-t1"]').trigger('click')
    await wrapper.get('[data-testid="move-goal-task-t1"]').trigger('click')
    expect(wrapper.emitted('edit')).toEqual([['t1']])
    expect(wrapper.emitted('move')).toEqual([['t1']])
  })

  it('reuses a parent-provided task view map instead of deriving the full workspace again', () => {
    const tasks = [
      { id: 't1', goalId: 'g1', parentTaskId: null, title: '验收发布', completed: false, weight: 1 }
    ]
    const taskViews = new Map([['t1', { progress: 73, completed: false, status: 'in_progress' }]])

    const wrapper = mount(GoalTaskTree, {
      props: { tasks, goalId: 'g1', taskViews },
      global: { stubs }
    })

    expect(wrapper.get('[data-testid="task-progress-t1"]').text()).toBe('73%')
  })
})
