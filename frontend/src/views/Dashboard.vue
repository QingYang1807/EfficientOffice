<template>
  <div class="dashboard">
    <!-- 统计卡片行 -->
    <el-row :gutter="20" class="statistics-row">
      <el-col :span="6" v-for="stat in statistics" :key="stat.title">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <el-row align="middle">
            <el-col :span="16">
              <h3>{{ stat.title }}</h3>
              <div class="stat-value">{{ stat.value }}</div>
            </el-col>
            <el-col :span="8" class="stat-icon">
              <el-icon :size="40" :color="stat.color">
                <component :is="stat.icon" />
              </el-icon>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content-row">
      <!-- 左侧待办事项 -->
      <el-col :span="16">
        <el-card class="todo-card">
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
              <el-button type="primary" size="small">添加任务</el-button>
            </div>
          </template>
          <el-table :data="todoList" style="width: 100%">
            <el-table-column prop="title" label="任务" />
            <el-table-column prop="priority" label="优先级" width="100" />
            <el-table-column prop="deadline" label="截止日期" width="120" />
            <el-table-column prop="status" label="状态" width="100" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧快捷工具 -->
      <el-col :span="8">
        <el-card class="tools-card">
          <template #header>
            <div class="card-header">
              <span>快捷工具</span>
            </div>
          </template>
          <div class="tools-grid">
            <el-button v-for="tool in quickTools" 
                       :key="tool.name"
                       class="tool-button"
                       @click="navigateTo(tool.route)">
              <el-icon><component :is="tool.icon" /></el-icon>
              <span>{{ tool.name }}</span>
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'dash-board',
  setup() {
    const router = useRouter()

    const statistics = ref([
      { title: '待办任务', value: '8', icon: 'List', color: '#409EFF' },
      { title: '已完成', value: '12', icon: 'Check', color: '#67C23A' },
      { title: '进行中', value: '3', icon: 'Loading', color: '#E6A23C' },
      { title: '已逾期', value: '2', icon: 'Warning', color: '#F56C6C' },
    ])

    const todoList = ref([
      { title: '完成周报', priority: '高', deadline: '2024-03-20', status: '进行中' },
      { title: '项目会议', priority: '中', deadline: '2024-03-21', status: '待处理' },
      { title: '代码审查', priority: '高', deadline: '2024-03-22', status: '待处理' },
    ])

    const quickTools = ref([
      { name: '番茄钟', icon: 'Timer', route: '/pomodoro-timer' },
      { name: '密码生成', icon: 'Key', route: '/password-generator' },
      { name: '周报生成', icon: 'Document', route: '/report-summary' },
    ])

    const navigateTo = (route) => {
      router.push(route)
    }

    return {
      statistics,
      todoList,
      quickTools,
      navigateTo
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.statistics-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-top: 8px;
}

.stat-icon {
  text-align: right;
}

.main-content-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.tool-button {
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.tool-button .el-icon {
  font-size: 24px;
}
</style> 