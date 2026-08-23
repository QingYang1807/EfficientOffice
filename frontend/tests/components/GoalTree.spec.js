import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import GoalTree from '@/components/goals/GoalTree.vue'

const goals = [
  { id: 'g1', parentGoalId: null, title: '年度目标' },
  { id: 'g2', parentGoalId: 'g1', title: '产品发布' },
  { id: 'g4', parentGoalId: 'g1', title: '员工成长' },
  { id: 'g3', parentGoalId: 'missing', title: '孤立目标' }
]

const TreeStub = defineComponent({
  props: { data: Array },
  emits: ['node-click'],
  setup(props, { slots, emit }) {
    const renderNode = node => h('div', { onClick: event => { event.stopPropagation(); emit('node-click', node) } }, [
      slots.default?.({ data: node }),
      ...(node.children || []).map(renderNode)
    ])
    return () => h('div', props.data.flatMap(renderNode))
  }
})

const mountTree = props => mount(GoalTree, {
  props: { goals, selectedId: 'g1', search: '', ...props },
  global: {
    stubs: {
      'el-tree': TreeStub,
      'el-icon': { template: '<span><slot /></span>' },
      'el-empty': { template: '<span><slot /></span>' },
      Warning: true
    }
  },
  attachTo: document.body
})

describe('GoalTree', () => {
  it('emits IDs only for selecting a node and creating its children', async () => {
    const wrapper = mountTree()

    await wrapper.get('[data-testid="goal-node-g2"]').trigger('click')
    await wrapper.get('[data-testid="add-child-g2"]').trigger('click')
    await wrapper.get('[data-testid="add-task-g2"]').trigger('click')

    expect(wrapper.emitted('select')).toEqual([['g2']])
    expect(wrapper.emitted('create-child')).toEqual([['g2']])
    expect(wrapper.emitted('create-task')).toEqual([['g2']])
    wrapper.unmount()
  })

  it('retains ancestors of search matches and groups missing-parent goals for repair', () => {
    const wrapper = mountTree({ search: '产品发布' })

    expect(wrapper.text()).toContain('年度目标')
    expect(wrapper.text()).toContain('产品发布')
    expect(wrapper.text()).not.toContain('员工成长')
    expect(wrapper.text()).toContain('待修复')
    expect(wrapper.text()).toContain('孤立目标')
    wrapper.unmount()
  })
})
