import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GoalMindMap from '@/components/goals/GoalMindMap.vue'
import GoalKanban from '@/components/goals/GoalKanban.vue'

const mindMapInstances = vi.hoisted(() => [])

vi.mock('simple-mind-map', () => ({
  default: class {
    constructor(options) { this.options = options; this.view = {}; this.command = { execute: vi.fn() }; mindMapInstances.push(this) }
    on(event, handler) { this.handlers = { ...(this.handlers || {}), [event]: handler } }
    off() {}
    render() {}
    resize() {}
    setData() {}
    destroy() {}
  }
}))

const goalTree = [{
  id: 'g1', title: '年度目标', progress: 50, children: [{
    id: 'g2', title: '产品目标', progress: 50, children: [{ id: 'g3', title: '发布2.0', progress: 50, children: [] }]
  }]
}]

describe('goal auxiliary views', () => {
  beforeEach(() => mindMapInstances.splice(0))

  it('uses the real simple-mind-map node protocol recursively', () => {
    const wrapper = mount(GoalMindMap, { props: { goals: goalTree } })
    const result = wrapper.vm.toMindMap(goalTree)
    expect(result).toEqual([{
      data: { id: 'g1', text: '年度目标', progress: 50, expand: true },
      children: [{
        data: { id: 'g2', text: '产品目标', progress: 50, expand: true },
        children: [{
          data: { id: 'g3', text: '发布2.0', progress: 50, expand: true },
          children: []
        }]
      }]
    }])
    expect(mindMapInstances[0].options.data).toEqual({
      data: expect.objectContaining({ id: '__goals__', text: '目标' }),
      children: result
    })
    mindMapInstances[0].handlers.node_click({ getData: key => key === 'id' ? 'g3' : null })
    expect(wrapper.emitted('node-click')).toEqual([['g3']])
    expect(JSON.stringify(result)).not.toContain('steps')
    wrapper.unmount()
  })

  it('renders derived status cards as read-only navigation with parent context', async () => {
    const wrapper = mount(GoalKanban, {
      props: { goals: [{ id: 'g3', title: '发布2.0', status: 'in_progress', progress: 50, parentPath: '年度目标 / 产品目标' }] },
      global: { stubs: {
        'el-tag': defineComponent({ template: '<span><slot /></span>' }),
        'el-progress': true
      } }
    })
    const card = wrapper.get('[data-testid="goal-card-g3"]')
    expect(card.text()).toContain('年度目标 / 产品目标')
    expect(wrapper.findComponent({ name: 'VueDraggable' }).exists()).toBe(false)
    await card.trigger('click')
    expect(wrapper.emitted('card-click')).toEqual([[expect.objectContaining({ id: 'g3' })]])
  })
})
