<template>
  <el-dialog :model-value="modelValue" :title="task ? '编辑任务' : (parentTask ? '新增子任务' : '新增任务')" width="min(92vw, 520px)" @close="$emit('update:modelValue', false)">
    <form class="task-form" @submit.prevent="submit">
      <label>任务标题<input v-model.trim="form.title" data-testid="task-title-input" maxlength="120" required /></label>
      <label>描述<textarea v-model="form.description" rows="3" /></label>
      <label>所属目标
        <select v-model="form.goalId" data-testid="task-goal-select" :disabled="Boolean(parentTask)">
          <option value="">未归属目标</option>
          <option v-for="goal in goals" :key="goal.id" :value="String(goal.id)">{{ goal.title }}</option>
        </select>
      </label>
      <div class="form-grid">
        <label>优先级<select v-model="form.priority"><option>高</option><option>中</option><option>低</option></select></label>
        <label>截止日期<input v-model="form.deadline" type="date" /></label>
      </div>
    </form>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" data-testid="task-editor-submit" :disabled="!form.title" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  goals: { type: Array, default: () => [] },
  tasks: { type: Array, default: () => [] },
  task: { type: Object, default: null },
  context: { type: Object, default: () => ({ goalId: null, parentTaskId: null }) }
})
const emit = defineEmits(['update:modelValue', 'save'])
const parentTask = computed(() => props.context.parentTaskId == null ? null : props.tasks.find(task => String(task.id) === String(props.context.parentTaskId)))
const form = reactive({ title: '', description: '', goalId: '', parentTaskId: null, priority: '中', deadline: '' })

watch(() => [props.modelValue, props.task, props.context, parentTask.value], reset, { immediate: true, deep: true })

function reset() {
  const source = props.task || {}
  const inheritedGoalId = parentTask.value ? parentTask.value.goalId : (source.goalId ?? props.context.goalId)
  form.title = source.title || source.text || ''
  form.description = source.description || ''
  form.goalId = inheritedGoalId == null ? '' : String(inheritedGoalId)
  form.parentTaskId = source.parentTaskId ?? props.context.parentTaskId ?? null
  form.priority = source.priority || '中'
  const deadline = source.deadline ?? source.dueDate ?? ''
  form.deadline = deadline ? String(deadline).slice(0, 10) : ''
}

function submit() {
  if (!form.title.trim()) return
  emit('save', {
    ...(props.task?.id == null ? {} : { id: String(props.task.id) }),
    title: form.title.trim(),
    description: form.description,
    goalId: form.goalId === '' ? null : String(form.goalId),
    parentTaskId: form.parentTaskId == null ? null : String(form.parentTaskId),
    priority: form.priority,
    deadline: form.deadline || null
  })
}
</script>

<style scoped>
.task-form { display: grid; gap: 15px; }
.task-form label { display: grid; gap: 6px; color: #475569; font-size: 13px; font-weight: 600; }
.task-form input, .task-form select, .task-form textarea { box-sizing: border-box; width: 100%; border: 1px solid #dbe2ea; border-radius: 8px; padding: 9px 10px; background: white; color: #1f2937; font: inherit; font-weight: 400; }
.task-form select:disabled { background: #f8fafc; color: #64748b; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 520px) { .form-grid { grid-template-columns: 1fr; } }
</style>
