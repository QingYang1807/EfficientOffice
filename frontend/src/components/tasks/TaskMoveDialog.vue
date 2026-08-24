<template>
  <el-dialog
    :model-value="modelValue"
    title="移动任务"
    width="min(92vw, 480px)"
    @close="$emit('update:modelValue', false)"
  >
    <form class="move-form" @submit.prevent="submit">
      <label>新父任务
        <select v-model="form.parentTaskId" data-testid="move-parent-task-select" @change="syncGoalFromParent">
          <option value="">作为目标根任务</option>
          <option v-for="candidate in parentCandidates" :key="candidate.id" :value="String(candidate.id)">
            {{ candidate.title }}
          </option>
        </select>
      </label>
      <label>所属目标
        <select v-model="form.goalId" data-testid="move-goal-select" :disabled="Boolean(selectedParent)">
          <option value="">未归属目标</option>
          <option v-for="goal in goals" :key="goal.id" :value="String(goal.id)">{{ goal.title }}</option>
        </select>
        <small v-if="selectedParent">子任务自动继承父任务的目标。</small>
      </label>
    </form>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" data-testid="task-move-submit" @click="submit">确认移动</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { getDescendantIds } from '@/domain/hierarchy'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  task: { type: Object, default: null },
  goals: { type: Array, default: () => [] },
  tasks: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'move'])
const form = reactive({ parentTaskId: '', goalId: '' })

const excludedIds = computed(() => {
  if (!props.task) return new Set()
  return new Set([String(props.task.id), ...getDescendantIds(props.tasks, props.task.id, 'parentTaskId')])
})
const parentCandidates = computed(() => props.tasks.filter(task => !excludedIds.value.has(String(task.id))))
const selectedParent = computed(() => form.parentTaskId === ''
  ? null
  : props.tasks.find(task => String(task.id) === form.parentTaskId) || null)

watch(() => [props.modelValue, props.task], () => {
  if (!props.modelValue || !props.task) return
  form.parentTaskId = props.task.parentTaskId == null ? '' : String(props.task.parentTaskId)
  form.goalId = props.task.goalId == null ? '' : String(props.task.goalId)
  syncGoalFromParent()
}, { immediate: true, deep: true })

function syncGoalFromParent() {
  if (selectedParent.value) {
    form.goalId = selectedParent.value.goalId == null ? '' : String(selectedParent.value.goalId)
  }
}

function submit() {
  if (!props.task) return
  emit('move', {
    taskId: String(props.task.id),
    parentTaskId: form.parentTaskId === '' ? null : form.parentTaskId,
    goalId: form.goalId === '' ? null : form.goalId
  })
}
</script>

<style scoped>
.move-form { display: grid; gap: 16px; }
.move-form label { display: grid; gap: 6px; color: #475569; font-size: 13px; font-weight: 600; }
.move-form select { box-sizing: border-box; width: 100%; border: 1px solid #dbe2ea; border-radius: 8px; padding: 9px 10px; background: white; color: #1f2937; font: inherit; font-weight: 400; }
.move-form select:disabled { background: #f1f5f9; color: #64748b; }
.move-form small { color: #64748b; font-weight: 400; }
</style>
