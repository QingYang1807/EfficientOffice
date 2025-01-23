<template>
  <div class="goal-list">
    <el-table :data="goals" style="width: 100%">
      <el-table-column prop="title" label="目标名称" />
      <el-table-column prop="progress" label="进度" width="200">
        <template #default="{ row }">
          <el-progress :percentage="row.progress" />
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="deadline" label="截止日期" width="180" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button @click="handleSelect(row)" type="primary" link>
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { inject, defineProps, defineEmits } from 'vue'

defineProps({
  goals: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['select'])

// 注入工具函数
const { getStatusType } = inject('goalUtils')

const handleSelect = (goal) => {
  emit('select', goal)
}
</script>

<style scoped>
.goal-list {
  padding: 1rem;
}
</style> 