<template>
  <el-dialog
    :model-value="modelValue"
    :title="goal ? '编辑目标' : (parentGoalId ? '新增子目标' : '新增目标')"
    width="520px"
    destroy-on-close
    @close="close"
  >
    <form class="goal-editor" @submit.prevent="submit">
      <label>
        <span>目标标题 <b aria-hidden="true">*</b></span>
        <input
          v-model.trim="form.title"
          data-testid="goal-title-input"
          maxlength="80"
          autocomplete="off"
          placeholder="清晰描述期望达成的结果"
        />
      </label>
      <p v-if="errors.title" class="field-error" role="alert">{{ errors.title }}</p>
      <label>
        <span>描述</span>
        <textarea v-model="form.description" rows="4" maxlength="600" placeholder="补充范围、标准或背景"></textarea>
      </label>
      <div class="date-grid">
        <label>
          <span>开始日期</span>
          <input v-model="form.startDate" data-testid="goal-start-input" type="date" />
        </label>
        <label>
          <span>截止日期</span>
          <input v-model="form.deadline" data-testid="goal-deadline-input" type="date" />
        </label>
      </div>
      <p v-if="errors.deadline" class="field-error" role="alert">{{ errors.deadline }}</p>
      <label>
        <span>手动进度（0-100）</span>
        <input
          v-model="form.manualProgress"
          data-testid="goal-manual-progress-input"
          type="number"
          min="0"
          max="100"
          step="1"
          :disabled="hasContributions"
        />
        <small v-if="hasContributions" class="field-help">已有直属子目标或根任务，进度由贡献项自动汇总。</small>
        <small v-else class="field-help">无贡献项时可手动维护；留空按 0% 计算。</small>
      </label>
      <p v-if="errors.manualProgress" class="field-error" role="alert">{{ errors.manualProgress }}</p>
      <label>
        <span>同级权重</span>
        <input v-model.number="form.weight" type="number" min="0.01" step="0.01" />
      </label>
      <p v-if="errors.weight" class="field-error" role="alert">{{ errors.weight }}</p>
    </form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" data-testid="goal-editor-submit" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  parentGoalId: { type: String, default: null },
  goal: { type: Object, default: null },
  hasContributions: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'save'])

const form = reactive(blankForm())
const errors = reactive({ title: '', deadline: '', manualProgress: '', weight: '' })

function blankForm() {
  return {
    title: '', description: '', startDate: '', deadline: '', manualProgress: '', weight: 1
  }
}

function reset() {
  Object.assign(form, blankForm(), props.goal ? {
    title: props.goal.title || '',
    description: props.goal.description || '',
    startDate: props.goal.startDate || '',
    deadline: props.goal.deadline || '',
    manualProgress: props.goal.manualProgress == null ? '' : props.goal.manualProgress,
    weight: props.goal.weight ?? 1
  } : {})
  Object.assign(errors, { title: '', deadline: '', manualProgress: '', weight: '' })
}

watch(() => props.modelValue, open => { if (open) reset() }, { immediate: true })

function validate() {
  errors.title = form.title ? '' : '请输入目标标题'
  errors.deadline = form.startDate && form.deadline && form.deadline < form.startDate
    ? '截止日期不能早于开始日期' : ''
  const manualProgress = form.manualProgress === '' ? null : Number(form.manualProgress)
  errors.manualProgress = manualProgress == null || (Number.isFinite(manualProgress) && manualProgress >= 0 && manualProgress <= 100)
    ? '' : '手动进度必须在0到100之间'
  errors.weight = Number.isFinite(Number(form.weight)) && Number(form.weight) > 0
    ? '' : '权重必须大于0'
  return !errors.title && !errors.deadline && !errors.manualProgress && !errors.weight
}

function submit() {
  if (!validate()) return
  emit('save', {
    ...(props.goal ? { id: props.goal.id } : {}),
    parentGoalId: props.goal ? props.goal.parentGoalId : props.parentGoalId,
    title: form.title,
    description: form.description,
    manualProgress: form.manualProgress === '' ? null : Number(form.manualProgress),
    startDate: form.startDate || null,
    deadline: form.deadline || null,
    weight: Number(form.weight)
  })
}

function close() { emit('update:modelValue', false) }
</script>

<style scoped>
.goal-editor { display: grid; gap: 14px; }
.goal-editor label { display: grid; gap: 7px; color: #334155; font-size: 13px; font-weight: 600; }
.goal-editor b { color: #dc2626; }
.goal-editor input, .goal-editor textarea { width: 100%; box-sizing: border-box; border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 11px; color: #1f2937; font: inherit; font-weight: 400; outline: none; }
.goal-editor input:focus, .goal-editor textarea:focus { border-color: #2564cf; box-shadow: 0 0 0 2px rgba(37,100,207,.12); }
.date-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field-error { margin: -8px 0 0; color: #dc2626; font-size: 12px; }
.field-help { color: #64748b; font-size: 12px; font-weight: 400; }
.goal-editor input:disabled { background: #f1f5f9; color: #64748b; cursor: not-allowed; }
@media (max-width: 520px) { .date-grid { grid-template-columns: 1fr; } }
</style>
