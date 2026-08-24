<template>
  <article class="goal-workspace">
    <el-breadcrumb separator="/" class="goal-path" aria-label="目标路径">
      <el-breadcrumb-item v-for="item in path" :key="item.id">{{ item.title }}</el-breadcrumb-item>
    </el-breadcrumb>

    <header class="workspace-header">
      <div class="heading-copy">
        <div class="status-line">
          <el-tag :type="statusType" effect="light">{{ statusLabel }}</el-tag>
          <span v-if="goal.deadline" class="deadline">截止 {{ formatDate(goal.deadline) }}</span>
        </div>
        <h2>{{ goal.title }}</h2>
        <p class="description">{{ goal.description || '暂无描述' }}</p>
      </div>
      <div class="progress-ring" :aria-label="`目标进度 ${view.progress}%`">
        <el-progress type="dashboard" :percentage="view.progress" :width="112" :stroke-width="9" />
        <strong :data-testid="`goal-progress-${goal.id}`" :id="`goal-progress-${goal.id}`">{{ view.progress }}%</strong>
      </div>
    </header>

    <div class="primary-actions">
      <el-button type="primary" data-testid="create-child-goal" @click="$emit('create-child', goal.id)">新增子目标</el-button>
      <el-button data-testid="create-goal-task" @click="$emit('create-task', goal.id)">新增任务</el-button>
      <el-button role="link" data-testid="view-goal-tasks" @click="$emit('view-tasks', goal.id)">查看任务管理</el-button>
      <el-button text @click="$emit('edit', goal.id)">编辑目标</el-button>
    </div>

    <section class="workspace-section">
      <div class="section-title">
        <h3>直属子目标</h3>
        <span>{{ childGoals.length }} 个</span>
      </div>
      <div v-if="childGoals.length" class="child-grid">
        <button
          v-for="child in childGoals"
          :key="child.id"
          type="button"
          class="child-card"
          @click="$emit('select', child.id)"
        >
          <span class="child-title">{{ child.title }}</span>
          <span>{{ child.progress ?? 0 }}%</span>
        </button>
      </div>
      <el-empty v-else description="暂无直属子目标" :image-size="64" />
    </section>

    <section class="workspace-section">
      <div class="section-title">
        <h3>进度构成</h3>
        <span>仅统计直属贡献项</span>
      </div>
      <div v-if="contributions.length" class="composition-list">
        <div v-for="item in contributions" :key="`${item.type}-${item.id}`" class="composition-row">
          <span class="type-dot" :class="item.type" aria-hidden="true"></span>
          <span class="composition-title">{{ item.title }}</span>
          <span class="weight">权重 {{ item.weight }}</span>
          <el-progress :percentage="item.progress" :show-text="false" />
          <strong>{{ item.progress }}%</strong>
        </div>
      </div>
      <p v-else class="empty-copy">当前进度来自手动进度，新增子目标或任务后将自动汇总。</p>
    </section>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  goal: { type: Object, required: true },
  path: { type: Array, default: () => [] },
  view: { type: Object, required: true },
  childGoals: { type: Array, default: () => [] },
  contributions: { type: Array, default: () => [] }
})

defineEmits(['create-child', 'create-task', 'view-tasks', 'edit', 'select'])

const status = computed(() => props.view.status)
const statusLabel = computed(() => ({
  completed: '已完成', overdue: '已逾期', in_progress: '进行中', not_started: '未开始'
})[status.value] || '未开始')
const statusType = computed(() => ({
  completed: 'success', overdue: 'danger', in_progress: 'primary', not_started: 'info'
})[status.value] || 'info')

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.goal-workspace { color: #1f2937; padding: 22px 24px 32px; min-width: 0; }
.goal-path { margin-bottom: 18px; font-size: 13px; }
.workspace-header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; }
.heading-copy { min-width: 0; }
.status-line { display: flex; align-items: center; gap: 10px; }
.deadline { color: #64748b; font-size: 13px; }
h2 { margin: 12px 0 8px; font-size: 26px; line-height: 1.25; }
.description { margin: 0; color: #4b5563; line-height: 1.7; }
.progress-ring { position: relative; flex: 0 0 112px; }
.progress-ring :deep(.el-progress__text) { display: none; }
.progress-ring strong { position: absolute; inset: 0; display: grid; place-items: center; color: #2564cf; font-size: 18px; }
.primary-actions { display: flex; gap: 8px; margin: 20px 0 24px; flex-wrap: wrap; }
.workspace-section { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px; }
.section-title { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.section-title h3 { margin: 0; font-size: 16px; }
.section-title span { color: #64748b; font-size: 12px; }
.child-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
.child-card { display: flex; justify-content: space-between; gap: 12px; padding: 13px 14px; border: 1px solid #e5e7eb; border-radius: 9px; background: white; color: #475569; cursor: pointer; text-align: left; }
.child-card:hover { border-color: #93c5fd; background: #eff6fc; }
.child-title { color: #1f2937; font-weight: 600; overflow: hidden; text-overflow: ellipsis; }
.composition-list { display: grid; gap: 12px; }
.composition-row { display: grid; grid-template-columns: 8px minmax(120px, 1fr) 58px minmax(100px, 1fr) 42px; align-items: center; gap: 10px; font-size: 13px; }
.type-dot { width: 8px; height: 8px; border-radius: 99px; background: #2564cf; }
.type-dot.task { background: #059669; }
.composition-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.weight, .empty-copy { color: #64748b; }
.empty-copy { font-size: 13px; }
@media (max-width: 640px) {
  .goal-workspace { padding: 18px 16px 28px; }
  .workspace-header { flex-direction: column; }
  .composition-row { grid-template-columns: 8px 1fr 42px; }
  .composition-row .weight, .composition-row :deep(.el-progress) { display: none; }
}
</style>
