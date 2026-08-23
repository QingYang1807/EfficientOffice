import { mount } from '@vue/test-utils'
import { defineComponent, h, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import GoalTree from '@/components/goals/GoalTree.vue'

const goals = [
  { id: 'g1', parentGoalId: null, title: '年度目标' },
  { id: 'g2', parentGoalId: 'g1', title: '产品发布' },
  { id: 'g4', parentGoalId: 'g1', title: '员工成长' },
  { id: 'g3', parentGoalId: 'g2', title: '发布2.0' },
  { id: 'g5', parentGoalId: 'missing', title: '孤立目标' }
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

const KeyboardTreeStub = defineComponent({
  props: { data: Array, defaultExpandedKeys: Array },
  emits: ['node-click', 'node-expand', 'node-collapse'],
  setup(props, { slots, emit, expose }) {
    const nodes = new Map()
    const virtualRoot = reactive({ data: props.data, parent: null, level: 0, expanded: false, childNodes: [] })
    const build = (data, parent = virtualRoot) => {
      const node = reactive({ data, parent, level: parent.level + 1, expanded: props.defaultExpandedKeys.includes(String(data.id)), childNodes: [] })
      node.childNodes = (data.children || []).map(child => build(child, node))
      node.expand = () => { node.expanded = true; emit('node-expand', node.data, node) }
      node.collapse = () => { node.expanded = false; emit('node-collapse', node.data, node) }
      nodes.set(String(data.id), node)
      return node
    }
    const roots = props.data.map(data => build(data))
    virtualRoot.childNodes = roots
    expose({ getNode: id => nodes.get(String(id)) })
    const renderNode = node => h('div', [
      slots.default?.({ data: node.data, node }),
      ...(node.expanded ? node.childNodes.map(renderNode) : [])
    ])
    return () => h('div', roots.map(renderNode))
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

const mountKeyboardTree = () => mount(GoalTree, {
  props: { goals, selectedId: 'g1', search: '', expandedIds: [] },
  global: { stubs: {
    'el-tree': KeyboardTreeStub,
    'el-icon': { template: '<span><slot /></span>' },
    'el-empty': { template: '<span><slot /></span>' },
    Warning: true
  } },
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
    expect(wrapper.get('[data-testid="goal-node-g2"]').attributes('tabindex')).toBe('0')
    expect(wrapper.get('[data-testid="add-task-g2"]').attributes('aria-label')).toBe('为产品发布新增任务')
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

  it('supports tree keyboard navigation and names every action', async () => {
    const wrapper = mountKeyboardTree()
    const root = wrapper.get('[data-testid="goal-node-g1"]')
    root.element.focus()
    await root.trigger('keydown', { key: 'ArrowRight' })
    expect(root.attributes('aria-expanded')).toBe('true')
    await root.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(wrapper.get('[data-testid="goal-node-g2"]').element)

    const child = wrapper.get('[data-testid="goal-node-g2"]')
    await child.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(wrapper.get('[data-testid="goal-node-g4"]').element)
    await wrapper.get('[data-testid="goal-node-g4"]').trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(child.element)

    await child.trigger('keydown', { key: 'ArrowRight' })
    expect(child.attributes('aria-expanded')).toBe('true')
    await child.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(wrapper.get('[data-testid="goal-node-g3"]').element)
    await wrapper.get('[data-testid="goal-node-g3"]').trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(child.element)
    await child.trigger('keydown', { key: 'ArrowLeft' })
    expect(child.attributes('aria-expanded')).toBe('false')
    await child.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select').at(-1)).toEqual(['g2'])
    expect(wrapper.findAll('button').every(button => button.text().trim() || button.attributes('aria-label'))).toBe(true)
    wrapper.unmount()
  })
})
