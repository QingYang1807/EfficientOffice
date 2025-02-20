<template>
  <div class="goal-management" @contextmenu.prevent>
    <div class="goal-header">
      <h1>目标追踪 🎯</h1>
      <el-button type="primary" @click="ShowCreateGoalDialog">
        <el-icon><Plus /></el-icon> 创建新目标
      </el-button>
    </div>
    
    <div class="goal-container">
      <div class="goal-cards">
        <el-card 
          v-for="goal in goals" 
          :key="goal.id" 
          class="goal-card"
          v-contextmenu:goalMenu
          @contextmenu="HandleRightClick($event, goal)"
        >
          <template #header>
            <div class="goal-card-header">
              <h3>{{ goal.title }}</h3>
              <el-progress :percentage="goal.progress" type="circle" />
            </div>
          </template>
          
          <div class="goal-content">
            <div class="goal-info">
              <p>{{ goal.description }}</p>
              <div class="goal-metrics">
                <span>截止日期: {{ formatDateTime(goal.deadline) }}</span>
                <span>已完成任务: {{ goal.completedTasks }}/{{ goal.totalTasks }}</span>
              </div>
            </div>
            
            <div class="goal-actions">
              <el-button @click="ShowAiAnalysis(goal)">AI分析</el-button>
              <el-button @click="ManageTasks(goal)">关联任务</el-button>
              <el-button @click="CelebrateProgress(goal)">庆祝进度</el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 创建目标对话框 -->
    <el-dialog 
      v-model="createDialogVisible" 
      title="创建新目标"
      width="500px"
    >
      <el-form 
        :model="newGoal" 
        ref="goalFormRef"
        :rules="rules"
      >
        <el-form-item label="目标标题" prop="title">
          <el-input v-model="newGoal.title" placeholder="请输入目标标题" />
        </el-form-item>
        <el-form-item label="目标描述" prop="description">
          <el-input 
            v-model="newGoal.description" 
            type="textarea" 
            placeholder="请描述你的目标"
          />
        </el-form-item>
        <el-form-item label="截止日期" prop="deadline">
          <el-date-picker 
            v-model="newGoal.deadline"
            type="date"
            placeholder="选择截止日期"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="ConfirmCreateGoal" :loading="creating">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- AI助手对话框 -->
    <el-dialog 
      v-model="aiDialogVisible" 
      title="AI目标助手 🤖"
      width="800px"
      class="ai-dialog"
      :fullscreen="false"
      :modal="true"
      :close-on-click-modal="false"
    >
      <div class="ai-assistant">
        <!-- AI助手头部 -->
        <div class="ai-header">
          <div class="ai-avatar">
            <el-avatar 
              :size="48" 
              src="/ai-assistant-avatar.png"
            />
            <div class="ai-status" :class="{ 'is-thinking': isAnalyzing }">
              {{ isAnalyzing ? '思考中...' : '在线' }}
            </div>
          </div>
          <div class="ai-info">
            <h3>目标管理助手</h3>
            <p>我可以帮你分析目标、拆解任务、提供建议</p>
          </div>
        </div>

        <!-- AI对话内容区 -->
        <div class="ai-chat" :class="{ 'is-loading': isAnalyzing }">
          <div v-if="isAnalyzing" class="ai-thinking">
            <div class="thinking-animation">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="thinking-text">AI助手正在思考...</div>
          </div>
          
          <div v-else class="ai-content">
            <!-- 任务建议展示 -->
            <div v-if="aiSuggestions.tasks" class="ai-tasks" :class="{ 'task-appear': aiSuggestions.tasks }">
              <div class="section-header">
                <div class="header-content">
                  <el-icon class="animate-bounce"><List /></el-icon>
                  <span>AI建议的任务清单</span>
                  <div class="task-counter">
                    已选择 {{ selectedTasks.length }} / {{ aiSuggestions.tasks?.length || 0 }} 个任务
                  </div>
                </div>
              </div>

              <div class="tasks-wrapper">
                <el-scrollbar height="500px">
                  <TransitionGroup 
                    name="task-list" 
                    tag="div" 
                    class="tasks-container"
                  >
                    <div v-for="(task, index) in aiSuggestions.tasks" 
                      :key="index" 
                      class="task-card"
                      :class="{
                        'is-selected': selectedTasks.includes(index),
                        'task-hover': hoveredTask === index
                      }"
                      @mouseenter="hoveredTask = index"
                      @mouseleave="hoveredTask = null"
                      @click="ToggleTaskSelection(index)"
                    >
                      <div class="task-selection">
                        <div class="selection-indicator" :class="{ 'selected': selectedTasks.includes(index) }">
                          <el-icon v-if="selectedTasks.includes(index)"><Check /></el-icon>
                        </div>
                      </div>

                      <div class="task-content">
                        <div class="task-header">
                          <div class="task-title">
                            <div class="task-number">#{{ index + 1 }}</div>
                            <h4>{{ task.name }}</h4>
                          </div>
                          <div class="task-meta">
                            <el-tag 
                              size="small" 
                              :type="getPriorityType(task.priority)"
                              effect="dark"
                              class="priority-tag animate-pulse"
                            >
                              {{ task.priority }}优先级
                            </el-tag>
                            <span class="time-estimate">
                              <el-icon><Timer /></el-icon>
                              {{ task.estimatedTime }}
                            </span>
                          </div>
                        </div>

                        <div class="task-steps">
                          <div class="steps-progress">
                            <div class="progress-bar">
                              <div 
                                class="progress-value"
                                :style="{ width: hoveredTask === index ? '100%' : '0%' }"
                              ></div>
                            </div>
                          </div>
                          <div class="steps-content">
                            <TransitionGroup name="step-list">
                              <div v-for="(step, stepIndex) in task.steps"
                                :key="stepIndex"
                                class="step-item"
                                :style="{
                                  '--delay': `${stepIndex * 0.1}s`
                                }"
                              >
                                <div class="step-number">{{ stepIndex + 1 }}</div>
                                <div class="step-text">{{ step }}</div>
                              </div>
                            </TransitionGroup>
                          </div>
                        </div>

                        <div class="task-details">
                          <div class="completion-criteria">
                            <el-icon><Aim /></el-icon>
                            <div class="criteria-content">
                              <div class="criteria-label">完成标准</div>
                              <div class="criteria-text">{{ task.completionCriteria }}</div>
                            </div>
                          </div>
                          
                          <div class="resources-section">
                            <div class="resources-header">
                              <el-icon><Collection /></el-icon>
                              <span>所需资源</span>
                            </div>
                            <div class="resources-tags">
                              <TransitionGroup name="tag-list">
                                <el-tag 
                                  v-for="(resource, rIndex) in task.resources"
                                  :key="rIndex"
                                  size="small"
                                  class="resource-tag"
                                  :style="{ '--delay': `${rIndex * 0.1}s` }"
                                >
                                  {{ resource }}
                                </el-tag>
                              </TransitionGroup>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TransitionGroup>
                </el-scrollbar>
              </div>

              <div class="tasks-actions">
                <div class="selection-info" v-if="selectedTasks.length">
                  <div class="selected-count">
                    已选择 {{ selectedTasks.length }} 个任务
                  </div>
                  <div class="total-time">
                    预计总用时: {{ calculateTotalTime() }}
                  </div>
                </div>
                <el-button 
                  type="primary" 
                  @click="ConvertToTasks" 
                  :disabled="!selectedTasks.length"
                  class="convert-button"
                >
                  <el-icon><Plus /></el-icon>
                  转换为任务
                  <template #suffix>
                    <span class="task-count-badge" v-if="selectedTasks.length">
                      {{ selectedTasks.length }}
                    </span>
                  </template>
                </el-button>
              </div>
            </div>

            <!-- 分析结果展示 -->
            <div v-else class="ai-analysis">
              <div class="analysis-content" v-html="formattedAnalysis"></div>
            </div>
          </div>
        </div>

        <!-- 底部操作区 -->
        <div class="ai-actions">
          <div class="action-buttons">
            <el-tooltip 
              content="让AI为你的目标生成具体可执行的子任务" 
              placement="top"
            >
              <el-button 
                @click="GenerateSubTasks" 
                :loading="isAnalyzing"
                :icon="List"
              >
                生成子任务
              </el-button>
            </el-tooltip>

            <el-tooltip 
              content="分析当前目标的完成进度和状态" 
              placement="top"
            >
              <el-button 
                @click="AnalyzeProgress" 
                :loading="isAnalyzing"
                :icon="DataAnalysis"
              >
                分析进度
              </el-button>
            </el-tooltip>

            <el-tooltip 
              content="获取改进建议和激励" 
              placement="top"
            >
              <el-button 
                @click="SuggestImprovements" 
                :loading="isAnalyzing"
                :icon="Magic"
              >
                改进建议
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 修改右键菜单实现 -->
    <el-dialog
      v-model="contextMenu.visible"
      :modal="false"
      :show-close="false"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      custom-class="context-menu-dialog"
      :style="{
        position: 'fixed',
        top: contextMenu.y + 'px',
        left: contextMenu.x + 'px',
        margin: 0,
        padding: 0
      }"
    >
      <div class="context-menu">
        <div class="context-menu-item" @click="DeleteGoal">
          <el-icon><Delete /></el-icon>
          <span>删除目标</span>
        </div>
        <div class="context-menu-item" @click="EditGoal">
          <el-icon><Edit /></el-icon>
          <span>编辑目标</span>
        </div>
      </div>
    </el-dialog>

    <!-- AI设置对话框 -->
    <el-dialog
      v-model="showAISettings"
      title="AI助手设置"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="API密钥">
          <el-input
            v-model="tempApiKey"
            type="password"
            placeholder="请输入 Moonshot API 密钥"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAISettings = false">取消</el-button>
        <el-button type="primary" @click="saveAISettings">保存</el-button>
      </template>
    </el-dialog>

    <!-- AI分析结果操作面板 -->
    <div class="analysis-actions" v-if="!aiSuggestions.tasks">
      <el-alert
        v-if="analysisComplete"
        title="AI分析完成"
        type="success"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>AI助手已完成分析，您可以：</p>
          <div class="action-suggestions">
            <el-button type="primary" @click="GenerateSubTasks">
              <el-icon><List /></el-icon>
              生成具体任务
            </el-button>
            <span class="action-desc">将分析转化为可执行的任务清单</span>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 任务转换确认对话框 -->
    <el-dialog
      v-model="taskConfirmVisible"
      title="确认创建任务"
      width="600px"
    >
      <div class="task-confirm-content">
        <div class="confirm-header">
          <el-icon><InfoFilled /></el-icon>
          <span>即将为目标 "{{ currentGoal?.title }}" 创建以下任务：</span>
        </div>

        <el-scrollbar height="300px">
          <div class="selected-tasks">
            <div 
              v-for="index in selectedTasks" 
              :key="index"
              class="selected-task-item"
            >
              <div class="task-overview">
                <el-tag size="small" :type="getPriorityType(aiSuggestions.tasks[index].priority)">
                  {{ aiSuggestions.tasks[index].priority }}
                </el-tag>
                <span class="task-name">{{ aiSuggestions.tasks[index].name }}</span>
                <span class="task-time">{{ aiSuggestions.tasks[index].estimatedTime }}</span>
              </div>
            </div>
          </div>
        </el-scrollbar>

        <div class="confirm-options">
          <el-checkbox v-model="addToCalendar">添加到日历提醒</el-checkbox>
          <el-checkbox v-model="setMilestones">设置为里程碑任务</el-checkbox>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="taskConfirmVisible = false">取消</el-button>
          <el-button type="primary" @click="ConfirmCreateTasks" :loading="creatingTasks">
            确认创建
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import confetti from 'canvas-confetti'
import { Plus, Delete, Edit, List, Timer, Guide, Aim, Collection, Magic, DataAnalysis, InfoFilled, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useAIStore } from '@/stores/ai'
import { useRouter } from 'vue-router'
import { useTaskStore } from '@/stores/tasks'
import { addDays } from 'date-fns'

const store = useStore()
const aiStore = useAIStore()
const goals = ref([])
const aiDialogVisible = ref(false)
const aiSuggestions = ref('')
const selectedGoalId = ref(null)
const createDialogVisible = ref(false)
const creating = ref(false)
const isAnalyzing = computed(() => {
  try {
    return store.state?.ai?.isAnalyzing || false
  } catch (error) {
    console.error('访问store状态失败:', error)
    return false
  }
})
const selectedTasks = ref([])
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  targetGoal: null
})
const showAISettings = ref(false)
const tempApiKey = ref('')
const taskConfirmVisible = ref(false)
const addToCalendar = ref(true)
const setMilestones = ref(false)
const creatingTasks = ref(false)
const analysisComplete = ref(false)
const currentGoal = ref(null)
const router = useRouter()
const taskStore = useTaskStore()
const hoveredTask = ref(null)

const newGoal = ref({
  title: '',
  description: '',
  deadline: ''
})

const rules = {
  title: [{ required: true, message: '请输入目标标题', trigger: 'blur' }],
  description: [{ required: true, message: '请描述你的目标', trigger: 'blur' }],
  deadline: [{ required: true, message: '请选择截止日期', trigger: 'blur' }]
}

// 添加表单引用
const goalFormRef = ref(null)

// 加载目标列表
const LoadGoals = () => {
  const storedGoals = localStorage.getItem('goals')
  if (storedGoals) {
    goals.value = JSON.parse(storedGoals)
  }
}

// 保存目标列表
const SaveGoals = () => {
  localStorage.setItem('goals', JSON.stringify(goals.value))
}

// 显示创建目标对话框
const ShowCreateGoalDialog = () => {
  createDialogVisible.value = true
  newGoal.value = {
    title: '',
    description: '',
    deadline: ''
  }
}

// 确认创建目标
const ConfirmCreateGoal = async () => {
  if (!goalFormRef.value) return
  
  const valid = await goalFormRef.value.validate()
  if (!valid) return
  
  creating.value = true
  try {
    const goal = {
      ...newGoal.value,
      id: Date.now().toString(),
      progress: 0,
      completedTasks: 0,
      totalTasks: 0,
      tasks: [],
      createdAt: new Date().toISOString()
    }
    
    goals.value.push(goal)
    SaveGoals()
    createDialogVisible.value = false
    ElMessage.success('目标创建成功')
    
    // 重置表单
    goalFormRef.value.resetFields()
    
    // 询问是否需要AI分析
    ElMessageBox.confirm(
      '是否需要AI助手帮你分析这个目标？',
      '目标创建成功',
      {
        confirmButtonText: '好的',
        cancelButtonText: '暂不需要',
        type: 'info'
      }
    ).then(() => {
      ShowAiAnalysis(goal)
    }).catch(() => {})
    
  } finally {
    creating.value = false
  }
}

// 添加错误处理
const handleError = (error) => {
  console.error('组件错误:', error)
  ElMessage.error('操作失败，请刷新页面重试')
}

// 为异步操作添加错误处理
const safeDispatch = async (type, payload) => {
  try {
    if (!store.state.ai) {
      throw new Error('AI模块未初始化')
    }
    return await store.dispatch(type, payload)
  } catch (error) {
    handleError(error)
    throw error
  }
}

// 检查AI配置状态
const checkAIConfig = () => {
  if (!aiStore.isConfigured) {
    ElMessageBox.confirm(
      '需要先配置AI助手才能使用此功能，是否现在配置？',
      '提示',
      {
        confirmButtonText: '去配置',
        cancelButtonText: '取消',
        type: 'info'
      }
    ).then(() => {
      showAISettings.value = true
    }).catch(() => {})
    return false
  }
  return true
}

// 保存AI设置
const saveAISettings = () => {
  if (!tempApiKey.value) {
    ElMessage.warning('请输入API密钥')
    return
  }
  
  aiStore.setApiKey(tempApiKey.value)
  showAISettings.value = false
  ElMessage.success('设置已保存')
  tempApiKey.value = ''
}

// 显示AI分析对话框
const ShowAiAnalysis = async (goal) => {
  currentGoal.value = goal
  aiDialogVisible.value = true
  isAnalyzing.value = true
  
  try {
    // 直接生成任务列表，跳过分析步骤
    const result = await store.dispatch('ai/generateTasks', goal)
    aiSuggestions.value = result
    
  } catch (error) {
    ElMessage.error(error.message || 'AI分析失败')
  } finally {
    isAnalyzing.value = false
  }
}

// 获取优先级对应的标签类型
const getPriorityType = (priority) => {
  const types = {
    '高': 'danger',
    '中': 'warning',
    '低': 'info'
  }
  return types[priority] || 'info'
}

// 生成子任务
const GenerateSubTasks = async () => {
  if (!checkAIConfig()) return
  
  try {
    const response = await store.dispatch('ai/generateTasks', contextMenu.value.targetGoal)
    aiSuggestions.value = response
  } catch (error) {
    ElMessage.error(error.message || '生成任务失败')
  }
}

// 分析进度
const AnalyzeProgress = async () => {
  if (!checkAIConfig()) return
  
  const goal = contextMenu.value.targetGoal
  if (!goal) return
  
  try {
    const analysis = await store.dispatch('ai/analyzeProgress', goal)
    aiSuggestions.value = analysis
  } catch (error) {
    ElMessage.error(error.message || '分析进度失败')
  }
}

// 改进建议
const SuggestImprovements = async () => {
  if (!checkAIConfig()) return
  
  const goal = contextMenu.value.targetGoal
  if (!goal) return
  
  try {
    const suggestions = await store.dispatch('ai/suggestImprovements', goal)
    aiSuggestions.value = suggestions
  } catch (error) {
    ElMessage.error(error.message || '获取建议失败')
  }
}

// 管理关联任务
const ManageTasks = (goal) => {
  // TODO: 打开任务管理对话框
}

// 庆祝进度达成
const CelebrateProgress = (goal) => {
  if (goal.progress % 25 === 0 && goal.progress > 0) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }
}

// 更新目标进度
const UpdateProgress = (goal) => {
  if (goal.tasks.length === 0) return
  
  const completed = goal.tasks.filter(task => task.completed).length
  goal.completedTasks = completed
  goal.totalTasks = goal.tasks.length
  goal.progress = Math.round((completed / goal.tasks.length) * 100)
  
  SaveGoals()
  
  if (goal.progress % 25 === 0) {
    CelebrateProgress(goal)
  }
}

// 处理右键点击
const HandleRightClick = (event, goal) => {
  event.preventDefault()
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    targetGoal: goal
  }
}

// 关闭右键菜单
const CloseContextMenu = () => {
  contextMenu.value.visible = false
}

// 删除目标
const DeleteGoal = () => {
  const { targetGoal } = contextMenu.value
  if (!targetGoal) return
  
  ElMessageBox.confirm(
    '确定要删除这个目标吗？',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    goals.value = goals.value.filter(g => g.id !== targetGoal.id)
    SaveGoals()
    ElMessage.success('目标已删除')
    CloseContextMenu()
  })
}

// 格式化分析结果
const formattedAnalysis = computed(() => {
  if (!aiSuggestions.value || typeof aiSuggestions.value !== 'string') return ''
  return aiSuggestions.value.replace(/\n/g, '<br>')
})

// 转换AI建议为实际任务
const ConvertToTasks = () => {
  if (!selectedTasks.value.length) {
    ElMessage.warning('请至少选择一个任务')
    return
  }
  
  // 设置当前目标
  currentGoal.value = contextMenu.value.targetGoal
  
  // 打开确认对话框
  taskConfirmVisible.value = true
}

// 确认创建任务
const ConfirmCreateTasks = async () => {
  if (!selectedTasks.value.length) return
  
  creatingTasks.value = true
  try {
    // 将选中的任务转换为待办事项格式
    const todos = selectedTasks.value.map(index => {
      const task = aiSuggestions.value.tasks[index]
      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text: task.name,
        description: task.steps.join('\n'),
        completionCriteria: task.completionCriteria,
        priority: task.priority,
        category: '目标任务',
        completed: false,
        createdAt: new Date().toISOString(),
        deadline: task.estimatedTime ? addDays(new Date(), 7).toISOString() : null,
        goalId: currentGoal.value.id,
        goalTitle: currentGoal.value.title,
        estimatedTime: task.estimatedTime,
        resources: task.resources,
        pomodoros: 0,
        isCalendarEvent: addToCalendar.value,
        isMilestone: setMilestones.value
      }
    })

    // 获取现有的待办事项
    const existingTodos = JSON.parse(localStorage.getItem('todos') || '[]')
    
    // 合并新的待办事项
    const updatedTodos = [...existingTodos, ...todos]
    
    // 保存到 localStorage
    localStorage.setItem('todos', JSON.stringify(updatedTodos))
    
    ElMessage.success('任务创建成功！')
    taskConfirmVisible.value = false
    aiDialogVisible.value = false
    
    // 更新目标的任务计数
    if (currentGoal.value) {
      const goal = goals.value.find(g => g.id === currentGoal.value.id)
      if (goal) {
        goal.totalTasks = (goal.totalTasks || 0) + todos.length
        SaveGoals()
      }
    }
    
    // 显示成功提示
    ElMessageBox.alert(
      `已成功创建 ${todos.length} 个待办事项！是否现在就开始执行第一个任务？`,
      '创建成功',
      {
        confirmButtonText: '开始执行',
        cancelButtonText: '稍后再说',
        type: 'success',
        showCancelButton: true
      }
    ).then(() => {
      // 跳转到待办列表页面
      router.push({
        name: 'TodoList',
        query: { highlight: todos[0].id }
      })
    }).catch(() => {})
    
  } catch (error) {
    ElMessage.error('创建待办事项失败：' + error.message)
  } finally {
    creatingTasks.value = false
  }
}

// 编辑目标
const EditGoal = () => {
  const { targetGoal } = contextMenu.value
  if (!targetGoal) return
  
  // TODO: 实现编辑功能
  ElMessage.info('编辑功能开发中...')
  CloseContextMenu()
}

// 添加日期格式化函数
const formatDateTime = (date) => {
  if (!date) return ''
  return format(new Date(date), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })
}

// 切换任务选择状态
const ToggleTaskSelection = (index) => {
  const taskIndex = selectedTasks.value.indexOf(index)
  if (taskIndex === -1) {
    selectedTasks.value.push(index)
  } else {
    selectedTasks.value.splice(taskIndex, 1)
  }
}

// 计算总时间
const calculateTotalTime = () => {
  if (!aiSuggestions.value?.tasks) return '0分钟'
  
  const totalMinutes = selectedTasks.value.reduce((total, index) => {
    const time = aiSuggestions.value.tasks[index].estimatedTime
    const minutes = parseInt(time) || 0
    return total + minutes
  }, 0)
  
  if (totalMinutes < 60) {
    return `${totalMinutes}分钟`
  }
  
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}小时${minutes > 0 ? ` ${minutes}分钟` : ''}`
}

onMounted(() => {
  LoadGoals()
  document.addEventListener('click', CloseContextMenu)
})

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('click', CloseContextMenu)
})
</script>

<style scoped>
.goal-management {
  height: 100%;
  padding: 20px;
  overflow: hidden;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.goal-container {
  height: calc(100% - 60px);
  overflow-y: auto;
}

.goal-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 10px;
}

.goal-card {
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  cursor: pointer;
  user-select: none;
}

.goal-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

.goal-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-content {
  padding: 15px;
}

.goal-info {
  margin-bottom: 15px;
}

.goal-metrics {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.9em;
  margin-top: 10px;
}

.goal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.ai-assistant {
  padding: 20px;
}

.ai-chat {
  min-height: 200px;
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  background: #f5f7fa;
}

.ai-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.ai-suggestions {
  padding: 15px;
}

.task-item {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
  background: #f9f9f9;
}

.task-content {
  margin-left: 10px;
}

.task-meta {
  display: flex;
  gap: 10px;
  margin: 5px 0;
  color: #666;
  font-size: 0.9em;
}

.task-actions {
  margin-top: 20px;
  text-align: right;
}

.is-loading {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.context-menu-dialog {
  background: transparent !important;
  box-shadow: none !important;
}

.context-menu-dialog :deep(.el-dialog__header),
.context-menu-dialog :deep(.el-dialog__body) {
  padding: 0;
  margin: 0;
}

.context-menu {
  min-width: 160px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  padding: 5px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.context-menu-item:hover {
  background-color: #f5f7fa;
}

.context-menu-item .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

.ai-settings-btn {
  margin-left: 8px;
}

/* AI对话框样式 */
.ai-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
    height: calc(90vh - 100px);
    overflow: hidden;
  }
  
  :deep(.el-dialog__header) {
    padding: 16px 20px;
    margin: 0;
    border-bottom: 1px solid #e5e7eb;
  }
}

.ai-assistant {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
}

/* AI助手头部样式 */
.ai-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.ai-avatar {
  position: relative;
  margin-right: 16px;
}

.ai-status {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 12px;
  padding: 2px 8px;
  background: #10b981;
  color: white;
  border-radius: 12px;
  border: 2px solid white;
}

.ai-status.is-thinking {
  background: #f59e0b;
}

.ai-info h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.ai-info p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

/* 思考动画 */
.ai-thinking {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.thinking-animation {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.thinking-animation span {
  width: 12px;
  height: 12px;
  background: #60a5fa;
  border-radius: 50%;
  animation: thinking 1.4s infinite ease-in-out both;
}

.thinking-animation span:nth-child(1) { animation-delay: -0.32s; }
.thinking-animation span:nth-child(2) { animation-delay: -0.16s; }

@keyframes thinking {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.thinking-text {
  color: #6b7280;
  font-size: 14px;
}

/* 内容区样式 */
.ai-content {
  flex: 1;
  overflow: hidden;
  padding: 20px;
}

/* 任务区域容器 */
.ai-tasks {
  margin: 0;
  padding: 24px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* 头部样式优化 */
.section-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.task-counter {
  margin-left: auto;
  font-size: 14px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 12px;
  border-radius: 20px;
}

/* 任务列表包装器 */
.tasks-wrapper {
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
  margin: 0;
  height: 500px;
}

/* 任务列表容器 */
.tasks-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  padding: 4px;
}

/* 任务卡片样式优化 */
.task-card {
  display: flex;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  height: fit-content;
}

/* 选择指示器容器 */
.task-selection {
  width: 48px;
  padding: 20px 12px;
  background: #f9fafb;
  display: flex;
  justify-content: center;
  border-right: 1px solid #e5e7eb;
}

/* 任务内容区域 */
.task-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 任务标题区域 */
.task-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-number {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
}

.task-title h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}

/* 任务元信息 */
.task-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.priority-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.time-estimate {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 13px;
}

/* 步骤列表样式 */
.task-steps {
  margin-top: 8px;
}

.steps-content {
  margin-top: 16px;
}

.step-item {
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.step-number {
  width: 24px;
  height: 24px;
  font-size: 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.step-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

/* 完成标准区域 */
.completion-criteria {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.criteria-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.criteria-text {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
}

/* 资源标签区域 */
.resources-section {
  margin-top: 16px;
}

.resources-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.resources-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.resource-tag {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #4b5563;
  border: none;
}

/* 底部操作区优化 */
.tasks-actions {
  margin-top: 24px;
  padding: 16px 24px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.selected-count {
  font-size: 14px;
  font-weight: 600;
  color: #059669;
}

.total-time {
  font-size: 14px;
  color: #6b7280;
}

.convert-button {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
}

/* 选中状态优化 */
.task-card.is-selected {
  border-color: #059669;
  background: #f0fdf4;
}

.task-card.is-selected .task-selection {
  background: #ecfdf5;
}

.selection-indicator {
  width: 24px;
  height: 24px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.selection-indicator.selected {
  background: #059669;
  border-color: #059669;
  color: white;
}

/* 滚动条美化 */
:deep(.el-scrollbar__bar.is-vertical) {
  width: 6px;
}

:deep(.el-scrollbar__thumb) {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}

/* 悬浮效果优化 */
.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  border-color: #60a5fa;
}

/* 进度条动画优化 */
.progress-bar {
  height: 3px;
  background: #e5e7eb;
  border-radius: 1.5px;
  overflow: hidden;
}

.progress-value {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 标签动画优化 */
.tag-list-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: var(--delay);
}

.tag-list-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}
</style> 