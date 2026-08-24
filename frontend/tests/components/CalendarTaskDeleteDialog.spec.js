import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import CalendarTaskDeleteDialog from '@/components/tasks/CalendarTaskDeleteDialog.vue'

const ModalStub = defineComponent({
  props: { open: Boolean },
  emits: ['ok', 'cancel'],
  template: '<section v-if="open" role="dialog"><slot /><button type="button" @click="$emit(\'ok\')">确认删除</button></section>'
})

const impact = {
  selected: [
    { id: 'parent', title: '当日父任务', deadline: '2026-08-23' },
    { id: 'child', title: '当日子任务', deadline: '2026-08-23' }
  ],
  cascadeOnly: [
    { id: 'other', title: '其他日期后代', deadline: '2026-08-24' },
    { id: 'none', title: '无日期后代', deadline: null }
  ]
}

function mountDialog() {
  return mount(CalendarTaskDeleteDialog, {
    props: { open: true, date: '2026-08-23', impact },
    global: { stubs: { 'a-modal': ModalStub } }
  })
}

describe('CalendarTaskDeleteDialog', () => {
  it('shows the exact affected tasks and confirms promotion by default', async () => {
    const wrapper = mountDialog()

    expect(wrapper.text()).toContain('2026-08-23')
    expect(wrapper.text()).toContain('2 个当日任务')
    expect(wrapper.text()).toContain('当日父任务、当日子任务')
    expect(wrapper.text()).toContain('2 个其他日期或无日期后代')
    expect(wrapper.text()).toContain('其他日期后代（2026-08-24）、无日期后代（无日期）')
    expect(wrapper.get('input[value="promote"]').element.checked).toBe(true)

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('confirm')).toEqual([['promote']])
  })

  it('requires an explicit cascade choice before confirming destructive descendants', async () => {
    const wrapper = mountDialog()

    await wrapper.get('input[value="cascade"]').setValue(true)
    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('confirm')).toEqual([['cascade']])
  })
})
