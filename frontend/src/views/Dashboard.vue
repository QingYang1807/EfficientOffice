<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6" v-for="stat in stats" :key="stat.title">
          <el-card 
            class="stat-card" 
            :class="[stat.class, 'clickable']" 
            shadow="hover"
            @click="handleStatClick(stat.type)"
          >
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><component :is="stat.icon" /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-title">{{ stat.title }}</div>
                <div class="stat-number">{{ stat.value }}</div>
                <div class="stat-desc">{{ stat.description }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-container">
      <!-- 任务完成趋势图 -->
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>任务完成趋势</span>
              <el-radio-group v-model="trendTimeRange" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart class="chart" :option="taskTrendOption" autoresize />
        </el-card>
      </el-col>

      <!-- 目标完成进度 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>目标完成进度</span>
            </div>
          </template>
          <v-chart class="chart" :option="goalProgressOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 活动时间线和活跃度图表 -->
    <el-row :gutter="20" class="bottom-container">
      <!-- 近期活动时间线 -->
      <el-col :span="12">
        <el-card class="timeline-card">
          <template #header>
            <div class="card-header">
              <span>近期活动</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :timestamp="activity.time"
              :type="activity.type"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <!-- 活跃度热力图 -->
      <el-col :span="12">
        <el-card class="heatmap-card">
          <template #header>
            <div class="card-header">
              <span>活跃度统计</span>
              <el-tooltip content="统计近一年的活动数据">
                <el-icon><info-filled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <v-chart class="heatmap-chart" :option="heatmapOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近待办列表 -->
    <el-card class="recent-todos">
      <template #header>
        <div class="card-header">
          <span>最近待办</span>
          <el-button type="primary" link @click="goToTodo">
            查看全部
            <el-icon class="el-icon--right"><arrow-right /></el-icon>
          </el-button>
        </div>
      </template>
      <el-table :data="recentTodos" style="width: 100%">
        <el-table-column prop="text" label="任务内容"></el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="截止日期" width="180">
          <template #default="{ row }">
            <span :class="{ 'text-danger': isOverdue(row.dueDate) }">
              {{ formatDate(row.dueDate) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  LineChart,
  PieChart,
  HeatmapChart,
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  CalendarComponent,
  VisualMapComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  Plus,
  Timer,
  List,
  Check,
  Warning,
  InfoFilled,
  ArrowRight,
} from '@element-plus/icons-vue'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  CalendarComponent,
  VisualMapComponent,
])

const router = useRouter()
const todos = ref([])
const trendTimeRange = ref('week')

// 从 localStorage 加载待办事项
const loadTodos = () => {
  const stored = localStorage.getItem('todos')
  if (stored) {
    todos.value = JSON.parse(stored)
  }
}

// 添加保存到 localStorage 的函数
const saveTodosToStorage = () => {
  localStorage.setItem('todos', JSON.stringify(todos.value))
}

// 添加 todos 的 watch
watch(() => todos.value, () => {
  saveTodosToStorage()
}, { deep: true })

// 修改统计数据计算方式
const stats = computed(() => [
  {
    title: '待办任务',
    value: todos.value.filter(t => !t.completed).length,
    description: '个待处理任务',
    class: 'todo-card',
    icon: 'List',
    type: 'todo'
  },
  {
    title: '专注时长',
    value: getTotalPomodoros(),
    description: '个番茄钟',
    class: 'focus-card',
    icon: 'Timer',
    type: 'pomodoro'
  },
  {
    title: '完成率',
    value: getCompletionRate(),
    description: getCompletionTrend(),
    class: 'completed-card',
    icon: 'Check',
    type: 'completed'
  },
  {
    title: '逾期任务',
    value: getOverdueTasks().length,
    description: '需要关注',
    class: 'overdue-card',
    icon: 'Warning',
    type: 'overdue'
  }
])

// 计算番茄钟总数
const getTotalPomodoros = () => {
  return todos.value.reduce((sum, task) => sum + (task.pomodoros || 0), 0)
}

// 计算完成率
const getCompletionRate = () => {
  const total = todos.value.length
  if (total === 0) return '0%'
  const completed = todos.value.filter(t => t.completed).length
  return Math.round((completed / total) * 100) + '%'
}

// 计算完成率趋势
const getCompletionTrend = () => {
  // 获取一周前的完成率
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)
  
  const oldTasks = todos.value.filter(t => t.createdAt < lastWeek.getTime())
  const oldCompleted = oldTasks.filter(t => t.completed).length
  const oldRate = oldTasks.length ? oldCompleted / oldTasks.length : 0
  
  const currentRate = parseFloat(getCompletionRate()) / 100
  const diff = currentRate - oldRate
  
  if (Math.abs(diff) < 0.01) return '持平'
  return diff > 0 ? `较上周 +${Math.round(diff * 100)}%` : `较上周 ${Math.round(diff * 100)}%`
}

// 获取逾期任务
const getOverdueTasks = () => {
  return todos.value.filter(t => !t.completed && isOverdue(t.dueDate))
}

// 修改任务完成趋势图数据
const taskTrendOption = computed(() => {
  const dates = getLast7Days()
  const completedData = dates.map(date => getCompletedTasksForDate(date))
  const newData = dates.map(date => getNewTasksForDate(date))
  
  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['已完成', '新增']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates.map(date => formatDateShort(date))
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '已完成',
        type: 'line',
        data: completedData,
        smooth: true,
        areaStyle: {}
      },
      {
        name: '新增',
        type: 'line',
        data: newData,
        smooth: true,
        areaStyle: {}
      }
    ]
  }
})

// 获取最近7天的日期
const getLast7Days = () => {
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    dates.push(date)
  }
  return dates
}

// 获取指定日期完成的任务数
const getCompletedTasksForDate = (date) => {
  const nextDay = new Date(date)
  nextDay.setDate(date.getDate() + 1)
  return todos.value.filter(task => 
    task.completed && 
    task.completedAt >= date.getTime() && 
    task.completedAt < nextDay.getTime()
  ).length
}

// 获取指定日期新增的任务数
const getNewTasksForDate = (date) => {
  const nextDay = new Date(date)
  nextDay.setDate(date.getDate() + 1)
  return todos.value.filter(task => 
    task.createdAt >= date.getTime() && 
    task.createdAt < nextDay.getTime()
  ).length
}

// 格式化短日期（仅显示月日）
const formatDateShort = (date) => {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 修改活跃度热力图数据
const getVirtualData = (year) => {
  const data = []
  const startDate = new Date(year, 0, 1)
  const endDate = new Date()
  
  for (let time = startDate.getTime(); time <= endDate.getTime(); time += 86400000) {
    const date = new Date(time)
    const dateStr = formatDate(date, 'yyyy-MM-dd')
    const completedCount = getCompletedTasksForDate(date)
    const newCount = getNewTasksForDate(date)
    data.push([dateStr, completedCount + newCount])
  }
  
  return data
}

// 修改最近活动数据
const updateRecentActivities = () => {
  const activities = []
  const now = Date.now()
  const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000)
  
  // 添加完成的任务
  todos.value
    .filter(task => task.completed && task.completedAt > threeDaysAgo)
    .forEach(task => {
      activities.push({
        id: `complete-${task.id}`,
        content: `完成了任务 "${task.text}"`,
        time: formatDate(task.completedAt),
        type: 'success'
      })
    })
    
  // 添加新建的任务
  todos.value
    .filter(task => task.createdAt > threeDaysAgo)
    .forEach(task => {
      activities.push({
        id: `create-${task.id}`,
        content: `创建了新任务 "${task.text}"`,
        time: formatDate(task.createdAt),
        type: 'primary'
      })
    })
  
  // 按时间排序并只保留最近的活动
  recentActivities.value = activities
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 5)
}

// 监听 todos 变化，更新活动列表
watch(() => todos.value, () => {
  updateRecentActivities()
}, { deep: true })

// 目标完成进度图配置
const goalProgressOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c}%'  // 显示百分比
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: '目标完成情况',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'inside',
        formatter: '{c}%',  // 显示百分比
        fontSize: 14,
        color: '#fff'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '20',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { 
          value: 35, 
          name: '工作目标',
          itemStyle: { color: '#409EFF' }  // 主要
        },
        { 
          value: 25, 
          name: '学习目标',
          itemStyle: { color: '#67C23A' }  // 成功
        },
        { 
          value: 20, 
          name: '生活目标',
          itemStyle: { color: '#E6A23C' }  // 警告
        },
        { 
          value: 15, 
          name: '其他目标',
          itemStyle: { color: '#909399' }  // 信息
        }
      ]
    }
  ]
}))

// 活跃度热力图配置
const heatmapOption = computed(() => {
  const date = new Date()
  const data = getVirtualData(date.getFullYear())
  return {
    visualMap: {
      min: 0,
      max: 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
      }
    },
    calendar: {
      top: 30,
      left: 30,
      right: 30,
      cellSize: ['auto', 13],
      range: date.getFullYear(),
      itemStyle: {
        borderWidth: 0.5
      },
      yearLabel: { show: false }
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: data
    }
  }
})

// 近期活动数据
const recentActivities = ref([
  {
    id: 1,
    content: '完成了任务 "完善仪表盘设计"',
    time: '2024-01-20 10:30:00',
    type: 'success'
  },
  {
    id: 2,
    content: '新建目标 "学习 Vue.js 高级特性"',
    time: '2024-01-20 09:15:00',
    type: 'primary'
  },
  {
    id: 3,
    content: '完成了 25 分钟专注',
    time: '2024-01-20 08:45:00',
    type: 'warning'
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

// 处理统计卡片点击
const handleStatClick = (type) => {
  switch (type) {
    case 'todo':
      router.push('/todos')  // 跳转到待办列表
      break
    case 'pomodoro':
      router.push('/pomodoro-timer')  // 跳转到番茄钟页面
      break
    case 'completed':
      router.push({ 
        path: '/todos',
        query: { filter: 'completed' }  // 跳转到待办列表并筛选已完成
      })
      break
    case 'overdue':
      router.push({
        path: '/todos',
        query: { filter: 'overdue' }  // 跳转到待办列表并筛选逾期
      })
      break
  }
}

// 初始化
onMounted(() => {
  loadTodos()
  updateRecentActivities()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
  transition: transform 0.2s;
}

.stat-content {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.stat-icon {
  font-size: 48px;
  margin-right: 20px;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin: 8px 0;
}

.stat-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.charts-container {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart {
  height: 300px;
}

.heatmap-chart {
  height: 200px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-card,
.heatmap-card {
  height: 400px;
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 统计卡片颜色 */
.todo-card .stat-icon { color: var(--el-color-primary); }
.focus-card .stat-icon { color: var(--el-color-success); }
.completed-card .stat-icon { color: var(--el-color-warning); }
.overdue-card .stat-icon { color: var(--el-color-danger); }

/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background-color: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 4px;
  transition: background-color 0.2s;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #a8a8a8;
  border: 2px solid transparent;
}

::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

/* Firefox 滚动条样式 */
* {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 transparent;
}

/* 卡片内部滚动条样式 */
.timeline-card,
.heatmap-card {
  &:hover::-webkit-scrollbar-thumb {
    background-color: #c1c1c1;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: transparent;
  }
  
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
    background-color: transparent;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 4px;
  }
}

/* 添加可点击样式 */
.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style> 