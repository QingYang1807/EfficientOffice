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
                <el-radio-button label="year">本年</el-radio-button>
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
          <div class="goal-progress-container">
            <!-- 进度条列表 -->
            <div v-for="goal in goalProgressData" :key="goal.name" class="goal-item">
              <div class="goal-info">
                <div class="goal-name">{{ goal.name }}</div>
                <div class="goal-percentage">{{ goal.value }}%</div>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-bg"></div>
                <div 
                  class="progress-bar-fill" 
                  :style="{ 
                    width: `${goal.value}%`, 
                    backgroundColor: goal.color 
                  }"
                ></div>
                <div 
                  class="target-marker" 
                  :style="{ 
                    left: `${goal.target}%`,
                    borderLeftColor: goal.color
                  }"
                  :title="`目标: ${goal.target}%`"
                ></div>
              </div>
              <div class="goal-stats">
                <span class="completed-count">已完成: {{ goal.completed }}</span>
                <span class="total-count">总任务: {{ goal.total }}</span>
              </div>
            </div>
            
            <!-- 图例 -->
            <div class="legend">
              <div class="legend-item">
                <div class="legend-marker"></div>
                <span>当前进度</span>
              </div>
              <div class="legend-item">
                <div class="legend-target"></div>
                <span>目标值</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 在 bottom-container 之前添加复盘区域 -->
    <el-row :gutter="20" class="review-container">
      <el-col :span="24">
        <el-card class="review-card">
          <template #header>
            <div class="card-header">
              <span>复盘记录</span>
              <div class="review-actions">
                <el-button-group>
                  <el-button 
                    type="primary" 
                    :plain="reviewType !== 'daily'"
                    @click="reviewType = 'daily'"
                  >
                    日复盘
                  </el-button>
                  <el-button 
                    type="primary" 
                    :plain="reviewType !== 'weekly'"
                    @click="reviewType = 'weekly'"
                  >
                    周复盘
                  </el-button>
                  <el-button 
                    type="primary" 
                    :plain="reviewType !== 'monthly'"
                    @click="reviewType = 'monthly'"
                  >
                    月复盘
                  </el-button>
                </el-button-group>
                <el-button type="primary" @click="openReviewDialog">
                  <el-icon><plus /></el-icon>新建复盘
                </el-button>
              </div>
            </div>
          </template>
          
          <!-- 复盘列表 -->
          <el-timeline>
            <el-timeline-item
              v-for="review in filteredReviews"
              :key="review.id"
              :timestamp="review.date"
              :type="getReviewType(review.type)"
            >
              <el-card class="review-item">
                <template #header>
                  <div class="review-item-header">
                    <el-tag :type="getReviewTagType(review.type)">
                      {{ getReviewTypeText(review.type) }}
                    </el-tag>
                    <span class="review-title">{{ review.title }}</span>
                  </div>
                </template>
                <div class="review-content">
                  <div v-if="review.achievements" class="review-section">
                    <h4>🎯 主要成就</h4>
                    <p>{{ review.achievements }}</p>
                  </div>
                  <div v-if="review.lessons" class="review-section">
                    <h4>📝 经验教训</h4>
                    <p>{{ review.lessons }}</p>
                  </div>
                  <div v-if="review.plans" class="review-section">
                    <h4>📋 下步计划</h4>
                    <p>{{ review.plans }}</p>
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
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
    <el-card class="recent-todos" style="margin-top: 20px;">
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

    <!-- 添加复盘对话框 -->
    <el-dialog
      v-model="reviewDialogVisible"
      :title="getReviewDialogTitle"
      width="60%"
    >
      <el-form :model="reviewForm" ref="reviewFormRef" :rules="reviewRules">
        <el-form-item label="复盘类型" prop="type">
          <el-select v-model="reviewForm.type">
            <el-option label="日复盘" value="daily" />
            <el-option label="周复盘" value="weekly" />
            <el-option label="月复盘" value="monthly" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="reviewForm.title" placeholder="请输入复盘标题" />
        </el-form-item>
        <el-form-item label="主要成就" prop="achievements">
          <el-input
            v-model="reviewForm.achievements"
            type="textarea"
            :rows="3"
            placeholder="记录本阶段的主要成就和进展"
          />
        </el-form-item>
        <el-form-item label="经验教训" prop="lessons">
          <el-input
            v-model="reviewForm.lessons"
            type="textarea"
            :rows="3"
            placeholder="总结经验教训和改进点"
          />
        </el-form-item>
        <el-form-item label="下步计划" prop="plans">
          <el-input
            v-model="reviewForm.plans"
            type="textarea"
            :rows="3"
            placeholder="制定下一阶段的计划和目标"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reviewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitReview">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
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
import { ElMessage } from 'element-plus'
import {
  Plus,
  Timer,
  List,
  Check,
  Warning,
  InfoFilled,
  ArrowRight,
} from '@element-plus/icons-vue'
import { useReviewStore } from '@/stores/review'

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

const reviewStore = useReviewStore()

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

// 获取指定日期完成的任务数
const getCompletedTasksForDate = (date) => {
  if (trendTimeRange.value === 'year') {
    // 按月统计
    const year = date.getFullYear()
    const month = date.getMonth()
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)
    return todos.value.filter(task => 
      task.completed && 
      task.completedAt >= startDate.getTime() && 
      task.completedAt <= endDate.getTime()
    ).length
  } else {
    // 按日统计
    const nextDay = new Date(date)
    nextDay.setDate(date.getDate() + 1)
    return todos.value.filter(task => 
      task.completed && 
      task.completedAt >= date.getTime() && 
      task.completedAt < nextDay.getTime()
    ).length
  }
}

// 获取指定日期新增的任务数
const getNewTasksForDate = (date) => {
  if (trendTimeRange.value === 'year') {
    // 按月统计
    const year = date.getFullYear()
    const month = date.getMonth()
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)
    return todos.value.filter(task => 
      task.createdAt >= startDate.getTime() && 
      task.createdAt <= endDate.getTime()
    ).length
  } else {
    // 按日统计
    const nextDay = new Date(date)
    nextDay.setDate(date.getDate() + 1)
    return todos.value.filter(task => 
      task.createdAt >= date.getTime() && 
      task.createdAt < nextDay.getTime()
    ).length
  }
}

// 修改获取日期范围的函数
const getDateRange = computed(() => {
  const dates = []
  const today = new Date()
  let year, month, daysInMonth, currentYear
  
  switch (trendTimeRange.value) {
    case 'week': {
      // 获取最近7天
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        dates.push(date)
      }
      break
    }
      
    case 'month': {
      // 获取本月所有日期
      year = today.getFullYear()
      month = today.getMonth()
      daysInMonth = new Date(year, month + 1, 0).getDate()
      
      for (let i = 0; i < daysInMonth; i++) {
        const date = new Date(year, month, i + 1)
        date.setHours(0, 0, 0, 0)
        dates.push(date)
      }
      break
    }
      
    case 'year': {
      // 获取本年每月的数据
      currentYear = today.getFullYear()
      for (let month = 0; month < 12; month++) {
        const date = new Date(currentYear, month, 1)
        dates.push(date)
      }
      break
    }
  }
  
  return dates
})

// 修改任务完成趋势图配置
const taskTrendOption = computed(() => {
  const dates = getDateRange.value
  const completedData = dates.map(date => getCompletedTasksForDate(date))
  const newData = dates.map(date => getNewTasksForDate(date))
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const date = dates[params[0].dataIndex]
        return formatDate(date) + '<br/>' +
          params.map(param => 
            param.seriesName + ': ' + param.value
          ).join('<br/>')
      }
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
      data: dates.map(date => formatDateShort(date)),
      axisLabel: {
        interval: trendTimeRange.value === 'week' ? 0 : 'auto',
        rotate: trendTimeRange.value === 'month' ? 30 : 0
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '已完成',
        type: 'line',
        data: completedData,
        smooth: true,
        areaStyle: {
          opacity: 0.1
        },
        itemStyle: {
          color: '#67C23A'
        },
        lineStyle: {
          width: 2
        }
      },
      {
        name: '新增',
        type: 'line',
        data: newData,
        smooth: true,
        areaStyle: {
          opacity: 0.1
        },
        itemStyle: {
          color: '#409EFF'
        },
        lineStyle: {
          width: 2
        }
      }
    ]
  }
})

// 修改日期格式化函数
const formatDateShort = (date) => {
  switch (trendTimeRange.value) {
    case 'week':
      return `${date.getMonth() + 1}/${date.getDate()}`
    case 'month':
      return `${date.getDate()}日`
    case 'year':
      return `${date.getMonth() + 1}月`
    default:
      return `${date.getMonth() + 1}/${date.getDate()}`
  }
}

// 添加 watch 以监听时间范围变化
watch(() => trendTimeRange.value, () => {
  // 时间范围改变时自动更新图表
  // Vue会自动重新计算 taskTrendOption
})

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

// 修改目标完成进度图表的配置
const goalProgressOption = computed(() => ({
  // 删除原有的图表配置
}))

// 添加目标进度数据计算属性
const goalProgressData = computed(() => {
  // 从本地存储加载待办事项
  const storedTodos = localStorage.getItem('todos')
  const todos = storedTodos ? JSON.parse(storedTodos) : []
  
  // 定义目标类别及其配置
  const categories = [
    { 
      name: '工作目标', 
      color: '#409EFF', 
      target: 80,
      completed: 0,
      total: 0
    },
    { 
      name: '学习目标', 
      color: '#67C23A', 
      target: 70,
      completed: 0,
      total: 0
    },
    { 
      name: '生活目标', 
      color: '#E6A23C', 
      target: 60,
      completed: 0,
      total: 0
    },
    { 
      name: '其他目标', 
      color: '#909399', 
      target: 50,
      completed: 0,
      total: 0
    }
  ]
  
  // 统计每个分类的任务数量和完成数量
  todos.forEach(todo => {
    const category = todo.category || '其他目标'
    const categoryData = categories.find(c => c.name === category)
    
    if (categoryData) {
      categoryData.total++
      if (todo.completed) {
        categoryData.completed++
      }
    }
  })
  
  // 计算完成百分比并返回数据
  return categories.map(category => ({
    ...category,
    value: category.total ? Math.round((category.completed / category.total) * 100) : 0
  }))
})

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
  reviewStore.loadReviews()
})

// 复盘相关的状态
const reviewType = ref('daily')
const reviewDialogVisible = ref(false)
const reviewFormRef = ref(null)

const reviewForm = ref({
  type: 'daily',
  title: '',
  achievements: '',
  lessons: '',
  plans: '',
})

const reviewRules = {
  type: [{ required: true, message: '请选择复盘类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入复盘标题', trigger: 'blur' }],
  achievements: [{ required: true, message: '请输入主要成就', trigger: 'blur' }],
  lessons: [{ required: true, message: '请输入经验教训', trigger: 'blur' }],
  plans: [{ required: true, message: '请输入下步计划', trigger: 'blur' }],
}

// 获取最近的复盘记录
const recentReviews = computed(() => {
  return reviewStore.getRecentReviews(5)
})

// 计算属性：根据类型筛选复盘记录
const filteredReviews = computed(() => {
  return reviewStore.getFilteredReviews(reviewType.value)
})

// 获取复盘对话框标题
const getReviewDialogTitle = computed(() => {
  const typeMap = {
    daily: '日复盘',
    weekly: '周复盘',
    monthly: '月复盘',
  }
  return `新建${typeMap[reviewForm.value.type]}`
})

// 打开复盘对话框
const openReviewDialog = () => {
  reviewForm.value = {
    type: reviewType.value,
    title: '',
    achievements: '',
    lessons: '',
    plans: '',
  }
  reviewDialogVisible.value = true
}

// 提交复盘
const submitReview = async () => {
  if (!reviewFormRef.value) return
  
  await reviewFormRef.value.validate((valid) => {
    if (valid) {
      const now = new Date()
      let reviewDate = now
      
      // 设置日期和标题
      if (!reviewForm.value.title) {
        // ... 原有的标题生成逻辑保持不变 ...
      }

      const newReview = {
        id: Date.now(),
        ...reviewForm.value,
        date: formatDate(reviewDate),
      }

      reviewStore.addReview(newReview)
      reviewDialogVisible.value = false
      reviewFormRef.value.resetFields()
      ElMessage.success('复盘记录已保存')
    }
  })
}

// 获取复盘类型对应的样式
const getReviewType = (type) => {
  const typeMap = {
    daily: 'primary',
    weekly: 'success',
    monthly: 'warning',
  }
  return typeMap[type] || 'info'
}

// 获取复盘标签类型
const getReviewTagType = (type) => {
  const typeMap = {
    daily: '',
    weekly: 'success',
    monthly: 'warning',
  }
  return typeMap[type] || 'info'
}

// 获取复盘类型文本
const getReviewTypeText = (type) => {
  const typeMap = {
    daily: '日复盘',
    weekly: '周复盘',
    monthly: '月复盘',
  }
  return typeMap[type] || '未知类型'
}
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
  margin-bottom: 10px;
}

.chart-card {
  height: 420px;
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

.review-container {
  margin-bottom: 20px;
}

.review-card {
  margin-bottom: 20px;
}

.review-actions {
  display: flex;
  gap: 16px;
}

.review-item {
  margin-bottom: 16px;
}

.review-item-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-title {
  font-weight: 500;
}

.review-content {
  padding: 8px 0;
}

.review-section {
  margin-bottom: 12px;
}

.review-section h4 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-regular);
}

.review-section p {
  margin: 0;
  color: var(--el-text-color-primary);
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.goal-progress-container {
  padding: 10px 0;
  height: 320px;
  display: flex;
  flex-direction: column;
}

.goal-item {
  margin-bottom: 16px;
}

.goal-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.goal-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.goal-percentage {
  font-weight: 600;
  color: var(--el-color-primary);
}

.progress-bar-container {
  position: relative;
  height: 10px;
  margin-bottom: 6px;
}

.progress-bar-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f0f2f5;
  border-radius: 5px;
}

.progress-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 5px;
  transition: width 0.5s ease;
}

.target-marker {
  position: absolute;
  top: -5px;
  height: 20px;
  width: 0;
  border-left: 2px dashed;
  z-index: 1;
}

.goal-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.legend {
  margin-top: auto;
  display: flex;
  justify-content: center;
  gap: 20px;
  padding-top: 10px;
  border-top: 1px solid #f0f2f5;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.legend-marker {
  width: 16px;
  height: 6px;
  background: linear-gradient(90deg, #409EFF, #67C23A);
  border-radius: 3px;
  margin-right: 6px;
}

.legend-target {
  height: 12px;
  width: 0;
  border-left: 2px dashed #666;
  margin-right: 6px;
}

/* 为每个目标类别添加不同的颜色 */
.goal-item:nth-child(1) .goal-percentage {
  color: #409EFF;
}

.goal-item:nth-child(2) .goal-percentage {
  color: #67C23A;
}

.goal-item:nth-child(3) .goal-percentage {
  color: #E6A23C;
}

.goal-item:nth-child(4) .goal-percentage {
  color: #909399;
}

/* 添加动画效果 */
.progress-bar-fill {
  animation: progressAnimation 1s ease-out;
}

@keyframes progressAnimation {
  from {
    width: 0;
  }
}

/* 添加悬浮效果 */
.goal-item:hover .progress-bar-fill {
  filter: brightness(1.1);
}

.goal-item:hover .goal-name {
  color: var(--el-color-primary);
}
</style> 