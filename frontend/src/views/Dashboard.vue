<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="dashboard-container">
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="4" v-for="stat in stats" :key="stat.title">
          <el-card class="stat-card" :class="stat.class" shadow="hover">
            <div class="stat-content">
              <div class="stat-title">{{ stat.title }}</div>
              <div class="stat-number">{{ stat.value }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card add-task-card" shadow="hover" @click="goToTodo">
            <div class="stat-content">
              <div class="stat-title">添加任务</div>
              <div class="stat-icon">
                <el-icon><Plus /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="recent-todos">
      <h3>最近待办</h3>
      <el-table :data="recentTodos" style="width: 100%">
        <el-table-column prop="text" label="任务内容"></el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="截止日期" width="180">
          <template #default="{ row }">
            <span :class="{ 'text-red-500': isOverdue(row.dueDate) }">
              {{ formatDate(row.dueDate) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()
const todos = ref([])

// 从 localStorage 加载待办事项
const loadTodos = () => {
  const stored = localStorage.getItem('todos')
  if (stored) {
    todos.value = JSON.parse(stored)
  }
}

// 统计数据
const stats = computed(() => [
  {
    title: '待办任务',
    value: todos.value.filter(t => !t.completed).length,
    class: 'todo-card'
  },
  {
    title: '已完成',
    value: todos.value.filter(t => t.completed).length,
    class: 'completed-card'
  },
  {
    title: '进行中',
    value: todos.value.filter(t => !t.completed && t.pomodoros > 0).length,
    class: 'in-progress-card'
  },
  {
    title: '已逾期',
    value: todos.value.filter(t => !t.completed && isOverdue(t.dueDate)).length,
    class: 'overdue-card'
  }
])

// 最近的待办任务（未完成的前5个）
const recentTodos = computed(() => {
  return todos.value
    .filter(t => !t.completed)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5)
})

// 跳转到待办事项页面
const goToTodo = () => {
  router.push('/todos')
  // 等待路由切换完成后聚焦输入框
  setTimeout(() => {
    const input = document.querySelector('.add_task_input input')
    if (input) {
      input.focus()
    }
  }, 100)
}

// 辅助函数
const getPriorityType = (priority) => {
  const types = {
    '高': 'danger',
    '中': 'warning',
    '低': 'success'
  }
  return types[priority] || 'info'
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isOverdue = (date) => {
  if (!date) return false
  return new Date(date) < new Date()
}

// 初始化
onMounted(() => {
  loadTodos()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.stats-container {
  margin-bottom: 30px;
}

.stat-card {
  height: 120px;
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.stat-title {
  font-size: 16px;
  color: #666;
  margin-bottom: 10px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-icon {
  font-size: 24px;
  color: #409EFF;
}

.todo-card {
  background-color: #e3f2fd;
}

.completed-card {
  background-color: #e8f5e9;
}

.in-progress-card {
  background-color: #fff3e0;
}

.overdue-card {
  background-color: #ffebee;
}

.add-task-card {
  background-color: #f5f5f5;
}

.recent-todos {
  margin-top: 20px;
}

.recent-todos h3 {
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}

:deep(.el-card__body) {
  height: 100%;
  padding: 15px;
}
</style> 