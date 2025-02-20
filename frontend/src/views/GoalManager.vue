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
      <!-- 左侧导航 -->
      <div class="nav-section">
        <div class="nav-header">
          <h2>目标管理</h2>
          <el-tooltip content="目标完成概览" placement="right">
            <div class="goal-stats">
              <el-progress
                type="circle"
                :percentage="completionRate"
                :status="completionRate >= 80 ? 'success' : 'primary'"
                :width="60"
              />
              <div class="stats-text">
                <div>总目标: {{ goals.length }}</div>
                <div>已完成: {{ completedGoals }}</div>
              </div>
            </div>
          </el-tooltip>
        </div>

        <el-button 
          type="primary" 
          class="create-button" 
          @click="showCreateDialog = true"
        >
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

      <!-- 主内容区 -->
      <div class="main-content">
        <!-- 视图切换提示 -->
        <div class="view-info">
          <el-alert
            v-if="viewMode === 'mind-map'"
            type="info"
            show-icon
            :closable="false"
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

        <!-- 各种视图组件 -->
        <component
          :is="currentViewComponent"
          :goals="filteredGoals"
          @select="handleGoalSelect"
          @update="handleGoalUpdate"
        />
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
  height: 100%;
  gap: 2rem;
  padding: 1rem;
}

.mind-map-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color-light);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--el-border-color-light);
}

.mind-map {
  flex: 1;
  min-height: 500px;
  height: calc(100vh - 200px);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  margin: 1rem;
  position: relative;
  overflow: hidden;
}

.goal-detail-section {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.detail-header {
  margin-bottom: 2rem;
}

.goal-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
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

.nav-section {
  width: 200px;
  padding: 1rem;
  border-right: 1px solid var(--el-border-color-light);
}

.view-switcher {
  margin-bottom: 1rem;
}

.quick-filters {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.main-content {
  flex: 1;
  overflow: hidden;
}

.el-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.el-tag:hover {
  transform: translateX(5px);
}

.create-button {
  width: 100%;
  margin-bottom: 1rem;
}

/* 添加新样式 */
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.guide-text {
  margin-top: 2rem;
  text-align: left;
}

.guide-text ul {
  list-style: none;
  padding: 0;
}

.guide-text li {
  margin: 0.5rem 0;
}

.nav-header {
  margin-bottom: 1rem;
}

.goal-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
  padding: 1rem;
  background: var(--el-bg-color-page);
  border-radius: 8px;
}

.stats-text {
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
}

.filter-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-tag:hover {
  transform: translateX(5px);
}

.count {
  font-size: 0.75rem;
  opacity: 0.8;
}

.help-section {
  margin-top: auto;
  padding-top: 1rem;
}

.help-content {
  font-size: 0.875rem;
  color: var(--el-text-color-regular);
}

.view-info {
  margin-bottom: 1rem;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header {
  margin-bottom: 2rem;
}
</style> 