<template>
  <div class="kanban-board">
    <div class="kanban-column" v-for="status in statuses" :key="status.value">
      <div class="column-header">
        <h3>{{ status.label }}</h3>
        <span class="count">{{ getGoalsByStatus(status.value).length }}</span>
      </div>
      <VueDraggable
        :model-value="getGoalsByStatus(status.value)"
        @update:model-value="(newList) => handleListUpdate(newList, status.value)"
        :group="{ name: 'goals', pull: true, put: true }"
        item-key="id"
        class="kanban-list"
        :data-status="status.value"
      >
        <template #item="{ element }">
          <div class="goal-card" @click="$emit('card-click', element)">
            <div class="card-header">
              <h4>{{ element.title }}</h4>
              <el-tag :type="getStatusType(element.status)" size="small">
                {{ element.status }}
              </el-tag>
            </div>
            <div class="card-content">
              <p>{{ element.description }}</p>
              <el-progress
                :percentage="element.progress || 0"
                :status="getProgressStatus(element.progress)"
              />
            </div>
            <div class="card-footer">
              <span class="deadline">
                截止日期: {{ formatDate(element.deadline) }}
              </span>
            </div>
          </div>
        </template>
      </VueDraggable>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { VueDraggable } from 'vuedraggable'
import { ElTag, ElProgress } from 'element-plus'

const props = defineProps({
  goals: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['card-click', 'update'])

// 看板状态定义
const statuses = [
  { label: '待处理', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' }
]

// 根据状态获取目标列表
const getGoalsByStatus = (status) => {
  return props.goals.filter(goal => goal.status === status)
}

// 处理列表更新
const handleListUpdate = (newList, newStatus) => {
  // 找出发生变化的目标
  const updatedGoals = props.goals.map(goal => {
    const updatedGoal = newList.find(item => item.id === goal.id)
    if (updatedGoal) {
      return {
        ...updatedGoal,
        status: newStatus
      }
    }
    return goal
  })
  emit('update', updatedGoals)
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    pending: 'info',
    in_progress: 'primary',
    completed: 'success'
  }
  return statusMap[status] || 'default'
}

// 获取进度状态
const getProgressStatus = (progress) => {
  if (progress >= 100) return 'success'
  if (progress >= 60) return 'primary'
  if (progress >= 30) return 'warning'
  return 'exception'
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '未设置'
  return new Date(date).toLocaleDateString()
}
</script>

<style scoped>
.kanban-board {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  height: 100%;
  overflow-x: auto;
}

.kanban-column {
  flex: 1;
  min-width: 300px;
  background: var(--el-bg-color-page);
  border-radius: 4px;
  padding: 1rem;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.count {
  background: var(--el-color-info-light-9);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
}

.kanban-list {
  min-height: 200px;
  padding: 0.5rem;
}

.goal-card {
  background: white;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.goal-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.card-content {
  margin: 0.5rem 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
}

.deadline {
  font-size: 0.75rem;
}
</style> 