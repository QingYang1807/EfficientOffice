<template>
  <div class="goal-manager">
    <!-- 引导提示 -->
    <el-empty
      v-if="!goals.length"
      description="开始创建你的第一个目标吧！"
      class="empty-state"
    >
      <el-button type="primary" @click="showCreateDialog = true">
        创建新目标
      </el-button>
      <div class="guide-text">
        <p>💡 目标管理可以帮助你：</p>
        <ul>
          <li>📝 制定清晰的目标计划</li>
          <li>✅ 分解目标为可执行的子任务</li>
          <li>📊 追踪目标完成进度</li>
          <li>🎯 保持专注和动力</li>
        </ul>
      </div>
    </el-empty>

    <!-- 主界面内容 -->
    <template v-else>
      <!-- 左侧导航优化 -->
      <div class="nav-section">
        <div class="nav-header">
          <h2 class="nav-title">目标管理</h2>
          <el-tooltip content="目标完成概览" placement="right">
            <div class="goal-stats">
              <el-progress
                type="circle"
                :percentage="completionRate"
                :status="completionRate >= 80 ? 'success' : 'primary'"
                :width="60"
                :stroke-width="8"
              />
              <div class="stats-text">
                <div class="stats-item">
                  <span class="stats-label">总目标:</span>
                  <span class="stats-value">{{ goals.length }}</span>
                </div>
                <div class="stats-item">
                  <span class="stats-label">已完成:</span>
                  <span class="stats-value">{{ completedGoals }}</span>
                </div>
              </div>
            </div>
          </el-tooltip>
        </div>

        <el-button 
          type="primary" 
          class="create-button" 
          @click="showCreateDialog = true"
        >
          <el-icon><Plus /></el-icon>
          创建新目标
        </el-button>

        <div class="view-switcher">
          <el-radio-group v-model="viewMode">
            <el-radio-button label="mind-map">思维导图</el-radio-button>
            <el-radio-button label="list">列表视图</el-radio-button>
            <el-radio-button label="kanban">看板视图</el-radio-button>
          </el-radio-group>
        </div>
        
        <!-- 优化筛选器显示 -->
        <div class="filter-section">
          <h4>快速筛选</h4>
          <div class="quick-filters">
            <el-tag 
              v-for="filter in quickFilters" 
              :key="filter.value"
              :type="filter.type"
              :effect="currentFilter === filter.value ? 'dark' : 'light'"
              @click="applyFilter(filter)"
              class="filter-tag"
            >
              <el-icon><component :is="filter.icon" /></el-icon>
              {{ filter.label }}
              <span class="count">({{ getFilterCount(filter.value) }})</span>
            </el-tag>
          </div>
        </div>

        <!-- 添加帮助提示 -->
        <div class="help-section">
          <el-collapse>
            <el-collapse-item title="使用帮助" name="1">
              <div class="help-content">
                <p>1. 创建目标并设置关键信息</p>
                <p>2. 将目标分解为可执行的子任务</p>
                <p>3. 使用不同视图管理目标</p>
                <p>4. 实时追踪目标完成进度</p>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>

      <!-- 主内容区优化 -->
      <div class="main-content">
        <div class="content-header">
          <div class="view-switcher">
            <el-radio-group v-model="viewMode" size="large">
              <el-radio-button label="mind-map">
                <el-icon><Connection /></el-icon>
                思维导图
              </el-radio-button>
              <el-radio-button label="list">
                <el-icon><List /></el-icon>
                列表视图
              </el-radio-button>
              <el-radio-button label="kanban">
                <el-icon><Grid /></el-icon>
                看板视图
              </el-radio-button>
            </el-radio-group>
          </div>
          
          <div class="view-info">
            <el-alert
              v-if="viewMode === 'mind-map'"
              type="info"
              show-icon
              :closable="false"
              class="view-alert"
            >
              思维导图视图可以帮助你更好地理解目标之间的关系
            </el-alert>
            <el-alert
              v-if="viewMode === 'kanban'"
              type="info"
              show-icon
              :closable="false"
            >
              看板视图适合管理目标的执行状态和进度
            </el-alert>
          </div>
        </div>

        <div class="content-body">
          <component
            :is="currentViewComponent"
            :goals="filteredGoals"
            @select="handleGoalSelect"
            @update="handleGoalUpdate"
          />
        </div>
      </div>
    </template>

    <!-- 目标详情抽屉 -->
    <el-drawer
      v-model="showDetail"
      title="目标详情"
      size="500px"
      :show-close="true"
      :with-header="true"
    >
      <template #header>
        <div class="drawer-header">
          <h3>目标详情</h3>
          <el-button-group>
            <el-button size="small" @click="editGoal">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteGoal">删除</el-button>
          </el-button-group>
        </div>
      </template>
      <goal-detail
        v-if="selectedGoal"
        :goal="selectedGoal"
        @update="handleGoalUpdate"
      />
    </el-drawer>

    <!-- 创建目标对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建新目标"
      width="60%"
      :before-close="handleCreateDialogClose"
    >
      <div class="dialog-header">
        <el-steps :active="createStep" finish-status="success">
          <el-step title="基本信息" />
          <el-step title="分解任务" />
          <el-step title="确认创建" />
        </el-steps>
      </div>
      <goal-creator
        :ai-enabled="true"
        @create="handleGoalCreate"
        @cancel="showCreateDialog = false"
        :current-step="createStep"
        @step-change="handleStepChange"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, provide, nextTick, getCurrentInstance, watch, onMounted } from 'vue'
import { message, ElMessage } from 'ant-design-vue'
import { ElMessageBox } from 'element-plus'

// 导入需要的组件
import MindMapView from '../components/goals/GoalMindMap.vue'
import ListView from '../components/goals/GoalList.vue'
import KanbanView from '../components/goals/GoalKanban.vue'
import GoalDetail from '../components/goals/GoalDetail.vue'
import GoalCreator from '../components/goals/GoalCreator.vue'

// 视图模式
const viewMode = ref('mind-map')
const showDetail = ref(false)
const showCreateDialog = ref(false)
const goals = ref([])
const selectedGoal = ref(null)

// 快速筛选器
const quickFilters = [
  { label: '全部', value: 'all', type: '' },
  { label: '进行中', value: 'in_progress', type: 'primary' },
  { label: '已完成', value: 'completed', type: 'success' },
  { label: '已延期', value: 'overdue', type: 'danger' }
]

// 当前选中的筛选器
const currentFilter = ref('all')

// 筛选后的目标列表
const filteredGoals = computed(() => {
  if (!currentFilter.value || currentFilter.value === 'all') {
    return goals.value
  }
  
  return goals.value.filter(goal => {
    switch (currentFilter.value) {
      case 'in_progress':
        return goal.status === 'in_progress'
      case 'completed':
        return goal.status === 'completed'
      case 'overdue': {
        const deadline = new Date(goal.deadline)
        return deadline < new Date() && goal.status !== 'completed'
      }
      default:
        return true
    }
  })
})

// 处理筛选
const applyFilter = (filter) => {
  currentFilter.value = filter.value
}

// 处理目标选择
const handleGoalSelect = (goal) => {
  selectedGoal.value = goal
  showDetail.value = true
}

// 处理目标更新
const handleGoalUpdate = (updatedGoal) => {
  // 更新目标数据
  const index = goals.value.findIndex(g => g.id === updatedGoal.id)
  if (index !== -1) {
    goals.value[index] = updatedGoal
    message.success('目标更新成功')
  }
}

// 处理目标创建
const handleGoalCreate = (newGoal) => {
  // 确保新目标有必要的属性
  const goalToAdd = {
    id: Date.now(), // 使用时间戳作为临时ID
    title: newGoal.title || '',
    description: newGoal.description || '',
    status: newGoal.status || 'in_progress',
    progress: newGoal.progress || 0,
    deadline: newGoal.deadline || null,
    tasks: newGoal.tasks || [],
    createdAt: Date.now(),
    ...newGoal // 保留其他属性
  }

  // 添加到目标列表
  goals.value = [...goals.value, goalToAdd]
  
  showCreateDialog.value = false
  ElMessage.success('目标创建成功')
  
  // 强制更新思维导图
  nextTick(() => {
    if (viewMode.value === 'mind-map') {
      const mindMapComponent = getCurrentInstance()?.refs?.mindMap
      if (mindMapComponent) {
        mindMapComponent.initMindMap()
      }
    }
  })
}

// 获取状态类型 - 用于标签颜色
const getStatusType = (status) => {
  const statusMap = {
    '进行中': 'primary',
    '已完成': 'success',
    '已暂停': 'warning',
    '已取消': 'info'
  }
  return statusMap[status] || 'default'
}

// 获取进度状态 - 用于进度条
const getProgressStatus = (progress) => {
  if (progress >= 100) return 'success'
  if (progress >= 60) return 'primary'
  if (progress >= 30) return 'warning'
  return 'exception'
}

// 获取任务状态类型 - 用于关联任务
const getTaskStatusType = (status) => {
  const statusMap = {
    '待处理': 'info',
    '进行中': 'primary',
    '已完成': 'success',
    '已延期': 'danger'
  }
  return statusMap[status] || 'default'
}

// 创建新目标按钮点击处理
const createNewGoal = () => {
  showCreateDialog.value = true
}

// 提供这些函数给子组件使用
provide('goalUtils', {
  getStatusType,
  getProgressStatus,
  getTaskStatusType
})

// 提供目标相关的状态和方法
provide('goalState', {
  goals,
  selectedGoal,
  createNewGoal,
  handleGoalUpdate,
  handleGoalCreate,
  handleGoalSelect
})

// 添加新的响应式数据
const createStep = ref(1)
const completedGoals = computed(() => goals.value.filter(g => g.status === 'completed').length)
const completionRate = computed(() => Math.round((completedGoals.value / goals.value.length) * 100) || 0)

// 获取当前视图组件
const currentViewComponent = computed(() => {
  switch (viewMode.value) {
    case 'mind-map': return MindMapView
    case 'list': return ListView
    case 'kanban': return KanbanView
    default: return ListView
  }
})

// 获取筛选器数量
const getFilterCount = (filterValue) => {
  switch (filterValue) {
    case 'all': return goals.value.length
    case 'in_progress': return goals.value.filter(g => g.status === 'in_progress').length
    case 'completed': return completedGoals.value
    case 'overdue': return goals.value.filter(g => {
      const deadline = new Date(g.deadline)
      return deadline < new Date() && g.status !== 'completed'
    }).length
    default: return 0
  }
}

// 处理创建对话框关闭
const handleCreateDialogClose = (done) => {
  ElMessageBox.confirm('确认关闭？未保存的内容将会丢失')
    .then(() => {
      createStep.value = 1
      done()
    })
    .catch(() => {})
}

// 处理创建步骤变化
const handleStepChange = (step) => {
  createStep.value = step
}

// 添加初始化数据
const initGoals = () => {
  // 从本地存储加载数据
  const savedGoals = localStorage.getItem('goals')
  if (savedGoals) {
    try {
      goals.value = JSON.parse(savedGoals)
    } catch (e) {
      console.error('Failed to parse saved goals:', e)
      goals.value = []
    }
  }
}

// 添加保存数据方法
const saveGoals = () => {
  try {
    localStorage.setItem('goals', JSON.stringify(goals.value))
  } catch (e) {
    console.error('Failed to save goals:', e)
  }
}

// 监听goals变化自动保存
watch(goals, () => {
  saveGoals()
}, { deep: true })

// 在组件挂载时初始化数据
onMounted(() => {
  initGoals()
})
</script>

<style scoped>
.goal-manager {
  display: flex;
  height: 100vh;
  background-color: var(--el-bg-color-page);
}

.nav-section {
  width: 280px;
  padding: 1.5rem;
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.nav-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.goal-stats {
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.stats-text {
  margin-left: 1rem;
}

.stats-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stats-label {
  color: var(--el-text-color-secondary);
}

.stats-value {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.create-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 40px;
  font-size: 1rem;
}

.main-content {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden;
}

.content-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.view-switcher {
  display: flex;
  justify-content: center;
}

.view-alert {
  margin: 0;
}

.content-body {
  flex: 1;
  overflow: auto;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.filter-section {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 1rem;
}

.filter-tag {
  padding: 0.5rem 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
}

.help-section {
  margin-top: auto;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .goal-manager {
    flex-direction: column;
  }
  
  .nav-section {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}
</style> 