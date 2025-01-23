<template>
  <div class="goal-manager">
    <!-- 左侧导航 -->
    <div class="nav-section">
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
      
      <div class="quick-filters">
        <el-tag 
          v-for="filter in quickFilters" 
          :key="filter.value"
          :type="filter.type"
          :effect="currentFilter === filter.value ? 'dark' : 'light'"
          @click="applyFilter(filter)"
        >
          {{ filter.label }}
        </el-tag>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 思维导图视图 -->
      <mind-map-view 
        v-if="viewMode === 'mind-map'"
        :goals="filteredGoals"
        @node-click="handleNodeClick"
      />
      
      <!-- 列表视图 -->
      <list-view 
        v-else-if="viewMode === 'list'"
        :goals="filteredGoals"
        @select="handleGoalSelect"
      />
      
      <!-- 看板视图 -->
      <kanban-view
        v-else
        :goals="filteredGoals"
        @card-click="handleGoalSelect"
      />
    </div>

    <!-- 右侧详情面板 -->
    <el-drawer
      v-model="showDetail"
      title="目标详情"
      size="500px"
      :with-header="false"
    >
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
    >
      <goal-creator
        :ai-enabled="true"
        @create="handleGoalCreate"
        @cancel="showCreateDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, provide } from 'vue'
import { message } from 'ant-design-vue'

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
  goals.value.push(newGoal)
  showCreateDialog.value = false
  message.success('目标创建成功')
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
</style> 