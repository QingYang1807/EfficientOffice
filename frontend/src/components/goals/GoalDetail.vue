<template>
  <div class="goal-detail">
    <div class="detail-header">
      <h2>{{ goal.title }}</h2>
      <el-tag :type="getStatusType(goal.status)">{{ goal.status }}</el-tag>
    </div>

    <div class="detail-section">
      <h4>进度</h4>
      <el-progress
        :percentage="goal.progress"
        :status="getProgressStatus(goal.progress)"
      />
    </div>

    <div class="detail-section">
      <h4>描述</h4>
      <p>{{ goal.description }}</p>
    </div>

    <div class="detail-section">
      <h4>时间信息</h4>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="开始时间">
          {{ goal.startDate }}
        </el-descriptions-item>
        <el-descriptions-item label="截止时间">
          {{ goal.deadline }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="detail-section">
      <h4>子任务</h4>
      <div class="steps-list">
        <div
          v-for="(step, index) in goal.steps"
          :key="index"
          class="step-item"
        >
          <el-checkbox
            v-model="step.completed"
            @change="(val) => handleStepChange(index, val)"
          >
            {{ step.title }}
          </el-checkbox>
          <el-tag
            :type="getTaskStatusType(step.status)"
            size="small"
          >
            {{ step.status }}
          </el-tag>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h4>备注</h4>
      <el-input
        :model-value="goal.notes"
        type="textarea"
        rows="4"
        placeholder="添加备注..."
        @update:model-value="handleNotesChange"
      />
    </div>

    <div class="detail-actions">
      <el-button type="primary" @click="handleUpdate">保存更改</el-button>
      <el-button @click="handleDelete" type="danger">删除目标</el-button>
    </div>
  </div>
</template>

<script setup>
import { inject, defineProps, defineEmits } from 'vue'

const props = defineProps({
  goal: {
    type: Object,
    required: true
  }
})

const emits = defineEmits(['update'])

// 注入工具函数
const { getStatusType, getProgressStatus, getTaskStatusType } = inject('goalUtils')

// 处理子任务状态变更
const handleStepChange = (index, completed) => {
  const updatedSteps = [...props.goal.steps]
  updatedSteps[index] = { 
    ...updatedSteps[index], 
    completed,
    status: completed ? 'completed' : 'in_progress'
  }
  
  // 计算新的进度
  const totalSteps = updatedSteps.length
  const completedSteps = updatedSteps.filter(s => s.completed).length
  const progress = Math.round((completedSteps / totalSteps) * 100)
  
  // 发送更新事件
  emits('update', {
    ...props.goal,
    steps: updatedSteps,
    progress,
    status: progress === 100 ? 'completed' : 'in_progress'
  })
}

// 处理备注更新
const handleNotesChange = (notes) => {
  emits('update', { ...props.goal, notes })
}

// 更新目标
const handleUpdate = () => {
  emits('update', props.goal)
}

// 删除目标
const handleDelete = () => {
  // TODO: 实现删除逻辑
}
</script>

<style scoped>
.goal-detail {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.detail-header h2 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-section h4 {
  margin-bottom: 1rem;
  color: var(--el-text-color-primary);
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.step-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: var(--el-bg-color-page);
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--el-border-color-light);
}
</style> 