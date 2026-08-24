<template>
  <a-modal
    :open="open"
    title="删除当日任务"
    ok-text="确认删除"
    cancel-text="取消"
    @ok="$emit('confirm', mode)"
    @cancel="$emit('update:open', false)"
  >
    <div class="impact-summary">
      <p>删除日期：<strong>{{ date }}</strong></p>
      <p><strong>{{ impact.selected.length }} 个当日任务</strong>将被删除：</p>
      <p class="task-list">{{ selectedText }}</p>
      <template v-if="impact.cascadeOnly.length">
        <p><strong>{{ impact.cascadeOnly.length }} 个其他日期或无日期后代</strong>需要处理：</p>
        <p class="task-list">{{ cascadeOnlyText }}</p>
      </template>
    </div>
    <fieldset class="delete-modes">
      <legend>处理后代任务</legend>
      <label>
        <input v-model="mode" type="radio" value="promote" />
        <span><strong>提升并保留（默认）</strong><small>仅删除当日任务，后代提升到最近保留的父级。</small></span>
      </label>
      <label>
        <input v-model="mode" type="radio" value="cascade" />
        <span><strong>级联删除</strong><small>同时删除以上其他日期或无日期后代。</small></span>
      </label>
    </fieldset>
  </a-modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  date: { type: String, default: '' },
  impact: { type: Object, default: () => ({ selected: [], cascadeOnly: [] }) }
})

defineEmits(['update:open', 'confirm'])

const mode = ref('promote')
watch(() => props.open, open => { if (open) mode.value = 'promote' })

const selectedText = computed(() => props.impact.selected.map(task => task.title).join('、'))
const cascadeOnlyText = computed(() => props.impact.cascadeOnly
  .map(task => `${task.title}（${task.deadline || '无日期'}）`)
  .join('、'))
</script>

<style scoped>
.impact-summary { border-radius: 8px; padding: 10px 12px; background: #fff7e6; color: #7c2d12; }
.impact-summary p { margin: 0 0 6px; }
.impact-summary p:last-child { margin-bottom: 0; }
.task-list { overflow-wrap: anywhere; color: #9a3412; font-size: 13px; }
.delete-modes { display: grid; gap: 10px; margin-top: 16px; border: 0; padding: 0; }
.delete-modes legend { margin-bottom: 8px; color: #334155; font-weight: 600; }
.delete-modes label { display: flex; align-items: flex-start; gap: 9px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; cursor: pointer; }
.delete-modes input { margin-top: 3px; }
.delete-modes span { display: grid; gap: 3px; }
.delete-modes small { color: #64748b; }
</style>
