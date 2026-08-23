<template>
  <section class="kanban-board" aria-label="目标看板">
    <article v-for="column in columns" :key="column.value" class="kanban-column">
      <header><h3>{{ column.label }}</h3><span>{{ goalsFor(column.value).length }}</span></header>
      <div class="kanban-list">
        <button
          v-for="goal in goalsFor(column.value)"
          :key="goal.id"
          type="button"
          class="goal-card"
          :data-testid="`goal-card-${goal.id}`"
          @click="$emit('card-click', goal)"
        >
          <span class="card-title">{{ goal.title }}</span>
          <span v-if="goal.parentPath" class="parent-path">{{ goal.parentPath }}</span>
          <el-progress :percentage="goal.progress || 0" :status="goal.status === 'completed' ? 'success' : undefined" />
          <span class="deadline">{{ goal.deadline ? `截止 ${goal.deadline}` : '未设置截止日期' }}</span>
        </button>
      </div>
    </article>
  </section>
</template>

<script setup>
const props = defineProps({ goals: { type: Array, default: () => [] } })
defineEmits(['card-click'])
const columns = [
  { label: '未开始', value: 'not_started' },
  { label: '进行中', value: 'in_progress' },
  { label: '已逾期', value: 'overdue' },
  { label: '已完成', value: 'completed' }
]
const goalsFor = status => props.goals.filter(goal => goal.status === status)
</script>

<style scoped>
.kanban-board { display: grid; grid-template-columns: repeat(4, minmax(240px, 1fr)); gap: 12px; overflow-x: auto; }
.kanban-column { min-height: 420px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #f8fafc; }
.kanban-column header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.kanban-column h3 { margin: 0; font-size: 14px; }
.kanban-column header span { color: #6b7280; font-size: 12px; }
.kanban-list { display: grid; gap: 8px; }
.goal-card { display: grid; gap: 8px; width: 100%; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; background: #fff; color: #1f2937; text-align: left; box-shadow: 0 1px 3px rgba(15,23,42,.08); cursor: pointer; }
.goal-card:hover, .goal-card:focus-visible { border-color: #2564cf; outline: none; box-shadow: 0 4px 12px rgba(37,100,207,.12); }
.card-title { font-weight: 600; }
.parent-path, .deadline { color: #6b7280; font-size: 12px; }
</style>
