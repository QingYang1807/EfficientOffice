<template>
  <div class="h-full flex flex-col relative">
    <!-- 顶部标题区 -->
    <div class="flex-none flex items-center justify-between px-6 py-2 border-b border-gray-100">
      <div class="flex items-center gap-3">
        <div class="w-1 h-6 bg-blue-500 rounded-full"></div>
        <h1 class="text-xl font-medium text-gray-900">待办事项 📝</h1>
        <span class="text-sm text-gray-400">{{ today }}</span>
      </div>
      <div class="flex items-center gap-2">
        <a-tag :color="statusCount.active > 0 ? 'processing' : 'default'">
          待完成 {{ statusCount.active }}
        </a-tag>
        <a-tag color="success">
          已完成 {{ statusCount.completed }}
        </a-tag>
      </div>
    </div>

    <!-- 搜索和筛选区 -->
    <div class="flex-none flex items-center gap-3 px-6 py-2 bg-white border-b border-gray-100">
      <div class="flex-1 max-w-md">
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索待办事项..."
          class="!rounded-lg search-input"
          :bordered="false"
          @search="onSearch"
        >
          <template #prefix>
            <search-outlined class="text-gray-400" />
          </template>
        </a-input-search>
      </div>
      <a-select
        v-model:value="filterStatus"
        class="!rounded-lg min-w-[120px]"
        :bordered="false"
        @change="onFilterChange"
        :options="[
          { value: 'all', label: '全部任务' },
          { value: 'active', label: '未完成 ⏳' },
          { value: 'completed', label: '已完成 ✅' }
        ]"
      />
      <div 
        class="completed-tasks-control"
        @click="toggleCompletedTasks"
      >
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50">
          <div class="completed-count">
            <span class="number">{{ completedTodos.length }}</span>
            <span class="label">已完成</span>
          </div>
          <div class="toggle-icon" :class="{ 'rotated': !showCompletedTasks }">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 表格区域 - 使用 flex-1 让它占据剩余空间 -->
    <div class="flex-1 px-6 overflow-hidden">
      <a-table
        :dataSource="filteredTodos"
        :columns="columns"
        :pagination="false"
        :scroll="{ y: 'calc(100vh - 340px)' }"
        :bordered="false"
        size="middle"
        class="custom-table -mx-4"
        @change="handleTableChange"
        :rowClassName="getRowClassName"
      >
        <template #bodyCell="{ column, record }">
          <!-- 完成状态列 -->
          <template v-if="column.key === 'completed'">
            <a-checkbox
              :checked="record.completed"
              @change="e => toggleTodo(record, e.target.checked)"
              class="todo-checkbox"
            />
          </template>

          <!-- 优先级列 -->
          <template v-else-if="column.key === 'priority'">
            <a-dropdown :trigger="['hover']">
              <a-tag 
                :color="getPriorityColor(record.priority)"
                class="cursor-pointer"
              >
                {{ record.priority }}
              </a-tag>
              <template #overlay>
                <a-menu @click="({ key }) => changePriority(record, key)">
                  <a-menu-item key="高">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full bg-red-500"></div>
                      <span>高优先级</span>
                    </div>
                  </a-menu-item>
                  <a-menu-item key="中">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span>中优先级</span>
                    </div>
                  </a-menu-item>
                  <a-menu-item key="低">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>低优先级</span>
                    </div>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>

          <!-- 分类列 -->
          <template v-else-if="column.key === 'category'">
            <a-dropdown :trigger="['hover']">
              <a-tag 
                :color="getCategoryColor(record.category)"
                class="cursor-pointer"
              >
                {{ record.category || '其他目标' }}
              </a-tag>
              <template #overlay>
                <a-menu @click="({ key }) => changeCategory(record, key)">
                  <a-menu-item key="工作目标">
                    <div class="flex items-center gap-2">
                      <a-tag color="blue" size="small">工作</a-tag>
                      <span>工作目标</span>
                    </div>
                  </a-menu-item>
                  <a-menu-item key="学习目标">
                    <div class="flex items-center gap-2">
                      <a-tag color="success" size="small">学习</a-tag>
                      <span>学习目标</span>
                    </div>
                  </a-menu-item>
                  <a-menu-item key="生活目标">
                    <div class="flex items-center gap-2">
                      <a-tag color="warning" size="small">生活</a-tag>
                      <span>生活目标</span>
                    </div>
                  </a-menu-item>
                  <a-menu-item key="其他目标">
                    <div class="flex items-center gap-2">
                      <a-tag color="default" size="small">其他</a-tag>
                      <span>其他目标</span>
                    </div>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>

          <!-- 任务内容列 -->
          <template v-else-if="column.key === 'text'">
            <template v-if="editingId === record.id">
              <a-input
                v-model:value="editingText"
                @pressEnter="saveTodo"
                @blur="saveTodo"
                class="!rounded-lg !border-blue-200 focus:!border-blue-400"
                :bordered="true"
              />
            </template>
            <template v-else>
              <div class="group flex items-center relative">
                <span 
                  :class="{ 
                    'line-through text-gray-400': record.completed,
                    'in-progress-text': record.pomodoros > 0 && !record.completed 
                  }"
                  class="flex-1 truncate cursor-pointer"
                  @mouseenter="showDetails(record, $event)"
                  @mouseleave="hideDetails"
                >
                  {{ record.text }}
                </span>

                <!-- 快捷操作按钮 -->
                <div class="action-buttons flex items-center gap-2 transition-opacity">
                  <a-button 
                    v-if="!record.completed"
                    type="text" 
                    @click="startTask(record)"
                    class="action-btn !px-2 hover:!bg-blue-50 hover:!text-blue-500"
                    :title="record.pomodoros > 0 ? '继续任务' : '开始任务'"
                  >
                    <template #icon>
                      <clock-circle-outlined />
                    </template>
                  </a-button>
                  <a-button 
                    type="text" 
                    @click="startEdit(record)"
                    class="action-btn !px-2 hover:!bg-gray-100"
                    title="编辑"
                  >
                    <template #icon><edit-outlined /></template>
                  </a-button>
                  <a-button 
                    type="text" 
                    @click="deleteTodo(record)"
                    class="action-btn !px-2 hover:!bg-red-50 hover:!text-red-500"
                    title="删除"
                  >
                    <template #icon><delete-outlined /></template>
                  </a-button>
                </div>

                <!-- 悬浮面板 -->
                <div 
                  v-if="isHovering && hoveredTodo?.id === record.id" 
                  class="tooltip"
                >
                  <div class="tooltip-content">
                    <p class="font-medium mb-2">{{ record.text }}</p>
                    <p class="text-sm text-gray-500">优先级：{{ record.priority }}</p>
                    <p class="text-sm text-gray-500">分类：{{ record.category }}</p>
                    <p class="text-sm text-gray-500">创建时间：{{ formatDate(record.createdAt) }}</p>
                    <p class="text-sm text-gray-500" v-if="record.dueDate">
                      {{ record.completed ? '完成时间' : '截止时间' }}：
                      <span :class="{ 'text-red-500': !record.completed && isOverdue(record.dueDate) }">
                        {{ formatDate(record.dueDate) }}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </template>
          </template>

          <!-- 截止日期列 -->
          <template v-else-if="column.key === 'dueDate'">
            <div class="flex items-center gap-2">
              <span 
                :class="{ 
                  'text-red-500': !record.completed && isOverdue(record.dueDate),
                  'text-gray-400': record.completed
                }"
                class="cursor-pointer hover:text-blue-500"
                @click="openDatePicker(record)"
              >
                {{ record.completed ? '完成于：' + formatDate(record.dueDate) : formatDate(record.dueDate) || '设置截止日期' }}
              </span>
              <a-button
                v-if="record.dueDate"
                type="text"
                class="action-btn !px-1"
                @click="clearDueDate(record)"
                title="清除截止日期"
              >
                <template #icon>
                  <close-outlined />
                </template>
              </a-button>
            </div>
          </template>
          <!-- 番茄钟列 -->
          <template v-else-if="column.key === 'pomodoros'">
            <span class="pomodoro-count">🍅 x {{ record.pomodoros || 0 }}</span>
          </template>

          <!-- 创建时间列 -->
          <template v-else-if="column.key === 'createdAt'">
            <span>{{ formatDate(record.createdAt) }}</span>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 底部添加任务区 -->
    <div class="flex-none px-6 py-4">
      <a-input
        v-model:value="newTodo"
        placeholder="添加新任务..."
        class="add-task-input"
        :bordered="true"
        @keyup.enter="addTodo"
      >
        <!-- 左侧前缀图标和下拉菜单 -->
        <template #prefix>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-2">
              <!-- 分类标签 - 添加下拉菜单 -->
              <a-dropdown :trigger="['hover']" placement="bottomLeft">
                <a-tag 
                  v-if="newTodoCategory" 
                  :color="getCategoryColor(newTodoCategory)"
                  size="small"
                  class="hover:cursor-pointer"
                >
                  {{ getCategoryShortName(newTodoCategory) }}
                </a-tag>
                <template #overlay>
                  <a-menu @click="({ key }) => setCategory(key)">
                    <a-menu-item key="工作目标">
                      <a-tag color="blue" size="small">工作</a-tag>
                      <span class="ml-2">工作目标</span>
                    </a-menu-item>
                    <a-menu-item key="学习目标">
                      <a-tag color="success" size="small">学习</a-tag>
                      <span class="ml-2">学习目标</span>
                    </a-menu-item>
                    <a-menu-item key="生活目标">
                      <a-tag color="warning" size="small">生活</a-tag>
                      <span class="ml-2">生活目标</span>
                    </a-menu-item>
                    <a-menu-item key="其他目标">
                      <a-tag color="default" size="small">其他</a-tag>
                      <span class="ml-2">其他目标</span>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>

              <!-- 优先级标签 - 添加下拉菜单 -->
              <a-dropdown :trigger="['hover']" placement="bottomLeft">
                <a-tag 
                  v-if="newTodoPriority" 
                  :color="getPriorityColor(newTodoPriority)"
                  size="small"
                  class="hover:cursor-pointer"
                >
                  {{ newTodoPriority }}
                </a-tag>
                <template #overlay>
                  <a-menu @click="({ key }) => setPriority(key)">
                    <a-menu-item key="高">
                      <a-tag color="error" size="small">高</a-tag>
                      <span class="ml-2">高优先级</span>
                    </a-menu-item>
                    <a-menu-item key="中">
                      <a-tag color="warning" size="small">中</a-tag>
                      <span class="ml-2">中优先级</span>
                    </a-menu-item>
                    <a-menu-item key="低">
                      <a-tag color="success" size="small">低</a-tag>
                      <span class="ml-2">低优先级</span>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
            <a-dropdown>
              <plus-outlined class="text-gray-400 cursor-pointer hover:text-blue-500 text-lg" />
              <template #overlay>
                <a-menu>
                  <a-menu-item-group title="任务分类">
                    <a-menu-item key="work" @click="setCategory('工作目标')">
                      <div class="flex items-center gap-2">
                        <a-tag color="blue" size="small">工作</a-tag>
                        <span>工作目标</span>
                      </div>
                    </a-menu-item>
                    <a-menu-item key="study" @click="setCategory('学习目标')">
                      <div class="flex items-center gap-2">
                        <a-tag color="success" size="small">学习</a-tag>
                        <span>学习目标</span>
                      </div>
                    </a-menu-item>
                    <a-menu-item key="life" @click="setCategory('生活目标')">
                      <div class="flex items-center gap-2">
                        <a-tag color="warning" size="small">生活</a-tag>
                        <span>生活目标</span>
                      </div>
                    </a-menu-item>
                    <a-menu-item key="other" @click="setCategory('其他目标')">
                      <div class="flex items-center gap-2">
                        <a-tag color="default" size="small">其他</a-tag>
                        <span>其他目标</span>
                      </div>
                    </a-menu-item>
                  </a-menu-item-group>
                  <a-menu-divider />
                  <a-menu-item-group title="优先级">
                    <a-menu-item key="high" @click="setPriority('高')">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>高优先级</span>
                      </div>
                    </a-menu-item>
                    <a-menu-item key="medium" @click="setPriority('中')">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span>中优先级</span>
                      </div>
                    </a-menu-item>
                    <a-menu-item key="low" @click="setPriority('低')">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>低优先级</span>
                      </div>
                    </a-menu-item>
                  </a-menu-item-group>
                  <a-menu-divider />
                  <a-menu-item key="date" @click="setDueDate">
                    📅 设置截止日期
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </template>

        <!-- 右侧回车提示图标 -->
        <template #suffix>
          <enter-outlined 
            v-if="newTodo.trim()"
            class="text-gray-300 text-lg"
            title="按回车键添加任务"
          />
        </template>
      </a-input>
    </div>

    <!-- 添加日期选择器到模板中 -->
    <a-modal
      v-model:visible="datePickerVisible"
      title="设置截止日期"
      :footer="null"
    >
      <a-date-picker
        v-model:value="tempDueDate"
        show-time
        format="YYYY-MM-DD HH:mm"
        @ok="handleDateOk"
        @change="handleDateChange"
      />
    </a-modal>

    <!-- 添加撒花容器 -->
    <div v-if="showConfetti" class="confetti-container">
      <canvas ref="confettiCanvas" class="confetti-canvas"></canvas>
    </div>
    
    <!-- 添加完成确认对话框 -->
    <el-dialog
      v-model="showConfirmationModal"
      title="任务完成！"
      width="360px"
      :show-close="false"
      :close-on-click-modal="false"
      class="completion-dialog"
    >
      <div class="completion-content">
        <div class="completion-emoji">🎉</div>
        <div class="completion-message">
          恭喜完成任务
          <div class="task-name">{{ completedTask?.text }}</div>
          <div class="completion-time">
            用时：{{ formatDuration(Date.now() - completedTask?.createdAt) }}
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleTaskComplete">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SearchOutlined,
  EnterOutlined,  // 添加回车图标
  ClockCircleOutlined,
  CloseOutlined  // 添加关闭图标
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import confetti from 'canvas-confetti'

// 初始化 router
const router = useRouter()

// 状态
const todos = ref([])
const newTodo = ref('')
const editingId = ref(null)
const editingText = ref('')
const searchText = ref('')
const filterStatus = ref('all')
const newTodoPriority = ref(null) // 新任务的优先级
const newDueDate = ref(null)
const datePickerVisible = ref(false)
const tempDueDate = ref(null)
const editingDueDate = ref(null)  // 当前正在编辑截止日期的任务
const newTodoCategory = ref(null) // 新任务的分类
const detailsVisible = ref(false)
const selectedTodoDetails = ref('')
const isHovering = ref(false)
const hoveredTodo = ref(null)

// 添加删除历史记录
const deleteHistory = ref([])

// 修改默认排序状态：默认按优先级降序排序
const sortState = ref({
  columnKey: 'priority',  // 默认按优先级排序
  order: 'descend'         // 默认降序排序
})

// 添加新的响应式状态
const showConfetti = ref(false)
const confettiCanvas = ref(null)
const showConfirmationModal = ref(false)
const completedTask = ref(null)
const showCompletedTasks = ref(false)

// 表格列定义
const columns = [
  {
    title: '状态',
    key: 'completed',
    width: 60,
    sorter: (a, b) => Number(a.completed) - Number(b.completed),
  },
  {
    title: '任务内容',
    key: 'text',
    ellipsis: true,
    sorter: (a, b) => a.text.localeCompare(b.text),
  },
  {
    title: '优先级',
    key: 'priority',
    width: 100,
    sorter: (a, b) => {
      const priorityWeight = { '高': 3, '中': 2, '低': 1 }
      return priorityWeight[a.priority] - priorityWeight[b.priority]
    },
  },
  {
    title: '分类',
    key: 'category',
    width: 120,
    sorter: (a, b) => (a.category || '').localeCompare(b.category || ''),
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    defaultSortOrder: 'descend', // 默认降序
    sorter: (a, b) => a.createdAt - b.createdAt,
  },
  {
    title: '截止日期',
    key: 'dueDate',
    width: 180,
    sorter: (a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate - b.dueDate
    },
  },
  {
    title: '番茄数',
    key: 'pomodoros',
    width: 100,
    sorter: (a, b) => (a.pomodoros || 0) - (b.pomodoros || 0),
  }
]

// 计算属性
const today = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 修改过滤和排序的计算属性，先过滤再排序（默认先按优先级降序，再按创建时间降序）
const filteredTodos = computed(() => {
  const list = todos.value.filter(todo => {
    if (!showCompletedTasks.value && todo.completed) {
      return false // 隐藏已完成任务
    }
    return true // 显示其他任务
  })
  const priorityWeight = { '高': 3, '中': 2, '低': 1 }
  const localSortState = sortState.value
  if (localSortState && localSortState.order && localSortState.columnKey) {
    if (localSortState.columnKey === 'priority') {
      // 主要按照优先级降序排序，优先级相同则按创建时间降序
      list.sort((a, b) => {
        const diff = priorityWeight[b.priority] - priorityWeight[a.priority]
        if (diff !== 0) return diff
        return b.createdAt - a.createdAt
      })
    } else if (localSortState.columnKey === 'createdAt') {
      list.sort((a, b) =>
        localSortState.order === 'descend'
          ? b.createdAt - a.createdAt
          : a.createdAt - b.createdAt
      )
    } else if (localSortState.columnKey === 'text') {
      list.sort((a, b) =>
        localSortState.order === 'descend'
          ? b.text.localeCompare(a.text)
          : a.text.localeCompare(b.text)
      )
    } else if (localSortState.columnKey === 'dueDate') {
      list.sort((a, b) =>
        localSortState.order === 'descend'
          ? (b.dueDate || 0) - (a.dueDate || 0)
          : (a.dueDate || 0) - (b.dueDate || 0)
      )
    } else if (localSortState.columnKey === 'completed') {
      list.sort((a, b) =>
        localSortState.order === 'descend'
          ? Number(b.completed) - Number(a.completed)
          : Number(a.completed) - Number(b.completed)
      )
    } else if (localSortState.columnKey === 'pomodoros') {
      list.sort((a, b) =>
        localSortState.order === 'descend'
          ? (b.pomodoros || 0) - (a.pomodoros || 0)
          : (a.pomodoros || 0) - (b.pomodoros || 0)
      )
    } else {
      // 如果未识别，则使用默认排序：优先级降序，再按创建时间降序
      list.sort((a, b) => {
        const diff = priorityWeight[b.priority] - priorityWeight[a.priority]
        if (diff !== 0) return diff
        return b.createdAt - a.createdAt
      })
    }
  } else {
    // 默认排序：优先级降序，再按创建时间降序
    list.sort((a, b) => {
      const diff = priorityWeight[b.priority] - priorityWeight[a.priority]
      if (diff !== 0) return diff
      return b.createdAt - a.createdAt
    })
  }
  return list
})

const statusCount = computed(() => ({
  active: todos.value.filter(t => !t.completed).length,
  completed: todos.value.filter(t => t.completed).length
}))

const getPriorityColor = (priority) => {
  const colors = { '高': 'error', '中': 'warning', '低': 'success' }
  return colors[priority] || 'default'
}

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const isOverdue = (date) => {
  if (!date) return false
  return new Date(date) < new Date()
}

// 方法
const addTodo = () => {
  if (!newTodo.value.trim()) {
    message.warning('请输入任务内容')
    return
  }

  const todo = {
    id: Date.now(),
    text: newTodo.value.trim(),
    completed: false,
    category: newTodoCategory.value || '其他目标',
    priority: newTodoPriority.value || '中',
    dueDate: newDueDate.value,
    pomodoros: 0,
    createdAt: Date.now()
  }

  todos.value.push(todo)
  saveTodosToStorage()
  newTodo.value = ''
  newTodoPriority.value = null
  newTodoCategory.value = null
  newDueDate.value = null
  message.success('添加成功')
}

const deleteTodo = (todo) => {
  const index = todos.value.findIndex(t => t.id === todo.id)
  if (index !== -1) {
    // 保存删除记录
    deleteHistory.value.push({
      todo: { ...todo },
      index,
      timestamp: Date.now()
    })
    
    // 从列表中删除
    todos.value.splice(index, 1)
    saveTodosToStorage()
    
    // 显示可撤销提示，修改为3秒
    message.info({
      content: h('div', {
        class: 'undo-message'
      }, [
        h('span', '任务已删除 '),
        h('a', {
          style: {
            color: '#1890ff',
            cursor: 'pointer',
            marginLeft: '4px'
          },
          onClick: () => undoDelete(deleteHistory.value[deleteHistory.value.length - 1])
        }, 'Ctrl+Z撤销'),
        h('span', {
          style: {
            color: '#999',
            fontSize: '12px',
            marginLeft: '4px'
          }
        }, '(3秒内有效)')
      ]),
      duration: 3,  // 修改为3秒
      class: 'custom-message'
    })
  }
}

const startEdit = (record) => {
  editingId.value = record.id
  editingText.value = record.text
}

const saveTodo = () => {
  if (editingId.value) {
    const todo = todos.value.find(t => t.id === editingId.value)
    if (todo) {
      todo.text = editingText.value
      saveTodosToStorage()
    }
    editingId.value = null
    editingText.value = ''
  }
}

const onSearch = () => {
  // 仅执行搜索逻辑
  loadTodosFromStorage()
}

const onFilterChange = () => {
  // 仅执行过滤逻辑
  loadTodosFromStorage()
}

const saveTodosToStorage = () => {
  localStorage.setItem('todos', JSON.stringify(todos.value))
}

const loadTodosFromStorage = () => {
  const stored = localStorage.getItem('todos')
  if (stored) {
    todos.value = JSON.parse(stored)
  }
}

const setPriority = (priority) => {
  newTodoPriority.value = priority
  message.success(`已设置为${priority}优先级`)
}

const setDueDate = () => {
  datePickerVisible.value = true
}

// 处理日期选择
const handleDateChange = (date) => {
  tempDueDate.value = date
}

const handleDateOk = () => {
  if (editingDueDate.value) {
    // 更新现有任务的截止日期
    editingDueDate.value.dueDate = tempDueDate.value ? tempDueDate.value.valueOf() : null
    saveTodosToStorage()
    datePickerVisible.value = false
    editingDueDate.value = null
    tempDueDate.value = null
    message.success('已设置截止日期')
  }
}

// 获取优先级对应的样式类
const getPriorityDot = (priority) => {
  switch (priority) {
    case '高':
      return 'bg-red-500'
    case '中':
      return 'bg-yellow-500'
    case '低':
      return 'bg-green-500'
    default:
      return 'bg-gray-300'
  }
}

const toggleTodo = async (todo, checked) => {
  if (checked) {
    // 显示完成对话框
    completedTask.value = todo
    showConfirmationModal.value = true
    // 显示撒花效果
    showFullScreenConfetti()
  } else {
    // 直接更新状态
    todo.completed = checked
    saveTodosToStorage()
  }
}

// 处理任务完成确认
const handleTaskComplete = () => {
  if (completedTask.value) {
    completedTask.value.completed = true
    completedTask.value.dueDate = Date.now()
    saveTodosToStorage()
    
    // 关闭对话框
    showConfirmationModal.value = false
    completedTask.value = null
  }
}

// 添加全屏撒花效果
const showFullScreenConfetti = async () => {
  showConfetti.value = true
  await nextTick()
  
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      clearInterval(interval)
      showConfetti.value = false
      return
    }

    const particleCount = 50 * (timeLeft / duration)
    
    // 从随机位置发射
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
    })
  }, 250)
}

// 添加时间格式化函数
const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}天${hours % 24}小时`
  } else if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟`
  } else {
    return `${seconds}秒`
  }
}

// 开始任务函数
const startTask = (task) => {
  router.push({
    path: '/pomodoro-timer',
    query: { taskId: task.id }
  })
}

// 修改撤销时间检查为3秒
const undoDelete = (deleteRecord) => {
  if (!deleteRecord) return
  
  // 检查是否在3秒内
  if (Date.now() - deleteRecord.timestamp > 3000) {  // 修改为3000毫秒
    message.error('撤销时间已过')
    return
  }
  
  // 恢复任务
  todos.value.splice(deleteRecord.index, 0, deleteRecord.todo)
  saveTodosToStorage()
  
  // 从历史记录中移除
  const index = deleteHistory.value.findIndex(h => h.timestamp === deleteRecord.timestamp)
  if (index !== -1) {
    deleteHistory.value.splice(index, 1)
  }
  
  message.success('已撤销删除')
}

// 修改清理时间为3秒
const cleanupDeleteHistory = () => {
  const now = Date.now()
  deleteHistory.value = deleteHistory.value.filter(
    record => now - record.timestamp <= 3000  // 修改为3000毫秒
  )
}

// 添加键盘快捷键监听
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

const handleKeyDown = (e) => {
  // 检查是否按下 Ctrl+Z
  if (e.ctrlKey && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    const lastDelete = deleteHistory.value[deleteHistory.value.length - 1]
    if (lastDelete) {
      undoDelete(lastDelete)
    }
  }
}

// 每秒清理一次历史记录
onMounted(() => {
  const cleanup = setInterval(cleanupDeleteHistory, 1000)
  onUnmounted(() => clearInterval(cleanup))
})

// 添加表格变化处理函数
const handleTableChange = (pagination, filters, sorter) => {
  sortState.value = {
    columnKey: sorter.field,
    order: sorter.order
  }
}

// 修改优先级
const changePriority = (todo, priority) => {
  const updatedTodo = {
    ...todo,
    priority
  }
  todos.value = todos.value.map(t => 
    t.id === todo.id ? updatedTodo : t
  )
  saveTodosToStorage()
}

// 打开日期选择器
const openDatePicker = (todo) => {
  editingDueDate.value = todo
  tempDueDate.value = todo.dueDate ? dayjs(todo.dueDate) : null
  datePickerVisible.value = true
}

// 清除截止日期
const clearDueDate = (todo) => {
  todo.dueDate = null
  saveTodosToStorage()
  message.success('已清除截止日期')
}

// 在 script 部分添加分类相关方法
const setCategory = (category) => {
  newTodoCategory.value = category
  message.success(`已设置为${category}`)
}

// 获取分类对应的 Tag 颜色（用于表格中的标签）
const getCategoryColor = (category) => {
  const colors = {
    '工作目标': 'blue',
    '学习目标': 'success',
    '生活目标': 'warning',
    '其他目标': 'default'  // 修改为 default 而不是空字符串
  }
  return colors[category] || 'default'
}

// 添加获取分类简短名称的方法
const getCategoryShortName = (category) => {
  const shortNames = {
    '工作目标': '工作',
    '学习目标': '学习',
    '生活目标': '生活',
    '其他目标': '其他'
  }
  return shortNames[category] || '其他'
}

// 添加分类切换函数
const changeCategory = (todo, category) => {
  const updatedTodo = {
    ...todo,
    category
  }
  todos.value = todos.value.map(t => 
    t.id === todo.id ? updatedTodo : t
  )
  saveTodosToStorage()
  message.success(`已更新分类为：${category}`)
}

// 修复悬浮面板显示
const showDetails = (record, event) => {
  hoveredTodo.value = record
  isHovering.value = true
  // 计算悬浮面板位置
  const rect = event.target.getBoundingClientRect()
  const tooltipEl = document.querySelector('.tooltip')
  if (tooltipEl) {
    tooltipEl.style.top = `${rect.top - 10}px`
    tooltipEl.style.left = `${rect.left + (rect.width / 2)}px`
  }
}

const hideDetails = () => {
  hoveredTodo.value = null
  isHovering.value = false
}

// 添加已完成任务的数量计算属性
const completedTodos = computed(() => {
  return todos.value.filter(todo => todo.completed)
})

// 切换已完成任务的显示状态
const toggleCompletedTasks = () => {
  showCompletedTasks.value = !showCompletedTasks.value
  
  // 添加有趣的动画效果
  const emoji = showCompletedTasks.value ? '👀' : '🙈'
  message.success({
    content: h('div', [
      h('span', showCompletedTasks.value ? '显示已完成任务 ' : '隐藏已完成任务 '),
      h('span', emoji)
    ]),
    duration: 2
  })
}

// 获取行的类名
const getRowClassName = (record) => {
  return {
    'completed-row': record.completed,
    'completed-row-hidden': record.completed && !showCompletedTasks.value
  }
}

// 初始化
loadTodosFromStorage()
</script>

<style scoped>
/* 自定义表格样式 */
.custom-table :deep(.ant-table) {
  @apply bg-transparent;
}

.custom-table :deep(.ant-table-thead > tr > th) {
  @apply bg-transparent !important;
  @apply text-gray-500 font-medium !important;
  @apply border-b border-gray-100 !important;
  @apply before:hidden !important;
  @apply py-3 !important;
}

.custom-table :deep(.ant-table-tbody > tr > td) {
  @apply border-none !important;
  @apply py-3 !important;
}

.custom-table :deep(.ant-table-tbody > tr) {
  @apply hover:bg-gray-50/80;
}

/* 自定义复选框样式 */
:deep(.todo-checkbox .ant-checkbox-inner) {
  @apply w-5 h-5 rounded-full border-gray-300;
}

:deep(.todo-checkbox .ant-checkbox-checked .ant-checkbox-inner) {
  @apply bg-blue-500 border-blue-500;
}

/* 美化滚动条 */
:deep(.ant-table-body::-webkit-scrollbar) {
  @apply w-1.5;
}

:deep(.ant-table-body::-webkit-scrollbar-track) {
  @apply bg-transparent;
}

:deep(.ant-table-body::-webkit-scrollbar-thumb) {
  @apply bg-gray-200 rounded-full;
}

:deep(.ant-table-body::-webkit-scrollbar-thumb:hover) {
  @apply bg-gray-300;
}

/* 添加优先级标签样式 */
:deep(.ant-tag) {
  margin-right: 0;
  line-height: 1.2;
}

/* 调整输入框前缀区域的样式 */
:deep(.ant-input-prefix) {
  @apply mr-2 flex items-center;
  gap: 8px;
}

/* 美化搜索框 */
.search-input {
  @apply bg-gray-50/80 hover:bg-gray-100/80 transition-colors;
}

:deep(.search-input .ant-input) {
  @apply bg-transparent;
}

:deep(.search-input .ant-input-group-addon) {
  @apply bg-transparent border-none;
}

/* 确保表格底部可见 */
.custom-table {
  @apply flex flex-col h-full;
}

:deep(.ant-table-wrapper) {
  @apply h-full flex flex-col;
}

:deep(.ant-table-body) {
  @apply overflow-y-auto !important;
  /* 添加底部边距确保最后一行可见 */
  @apply pb-4;
}

/* 添加排序图标样式 */
:deep(.ant-table-column-sorter) {
  margin-left: 4px;
}

:deep(.ant-table-column-sorter-up.active),
:deep(.ant-table-column-sorter-down.active) {
  color: var(--ant-color-primary);
}

/* 优化表头悬浮样式 */
:deep(.ant-table-thead th.ant-table-column-sort) {
  background-color: rgba(0, 0, 0, 0.02);
}

:deep(.ant-table-thead th:hover) {
  background-color: rgba(0, 0, 0, 0.04) !important;
}

/* 添加选择框样式 */
:deep(.ant-checkbox-wrapper) {
  @apply !my-0;
}

:deep(.ant-table-selection-column) {
  @apply !pr-2;
}

/* 优化复选框样式 */
:deep(.ant-checkbox) {
  @apply !border-0;
}

:deep(.ant-checkbox-inner) {
  @apply w-5 h-5 rounded-full border-gray-300 transition-all duration-200 !important;
}

:deep(.ant-checkbox-checked .ant-checkbox-inner) {
  @apply bg-blue-500 border-blue-500 !important;
}

:deep(.ant-checkbox-wrapper:hover .ant-checkbox-inner),
:deep(.ant-checkbox:hover .ant-checkbox-inner) {
  @apply border-blue-400 !important;
}

/* 移除复选框的方形悬浮效果 */
:deep(.ant-checkbox-wrapper:hover),
:deep(.ant-checkbox:hover)::after {
  @apply !border-0 !shadow-none !important;
}

/* 优化表格选择列样式 */
:deep(.ant-table-selection-column) {
  @apply !pr-1 !pl-4;
}

/* 优化表格行样式 */
:deep(.ant-table-row) {
  @apply cursor-pointer transition-colors duration-200;
}

:deep(.ant-table-row.ant-table-row-selected > td) {
  @apply !bg-blue-50/50;
}

:deep(.ant-table-row:hover > td) {
  @apply !bg-gray-50/80;
}

/* 优化选择框对齐 */
:deep(.ant-table-selection) {
  @apply flex items-center justify-center;
}

/* 自定义复选框样式 */
:deep(.custom-checkbox) {
  @apply !my-0;
}

:deep(.custom-checkbox .ant-checkbox-inner) {
  @apply !border-2;
}

:deep(.custom-checkbox.ant-checkbox-wrapper:hover .ant-checkbox-inner) {
  @apply !border-blue-400;
}

/* 进行中任务的流光溢彩效果 */
.in-progress {
  position: relative;
  overflow: hidden;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: linear-gradient(
    90deg,
    rgba(64, 158, 255, 0.1),
    rgba(64, 158, 255, 0.2),
    rgba(64, 158, 255, 0.1)
  );
}

.in-progress::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shine 2s infinite linear;
}

.in-progress-text {
  position: relative;
  color: #409EFF;
  font-weight: 500;
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* 添加一个小图标表示进行中状态 */
.in-progress-text::after {
  content: '🔄';
  margin-left: 8px;
  font-size: 0.9em;
  animation: spin 2s infinite linear;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 确保表格行有足够的高度来显示动画效果 */
:deep(.ant-table-row) {
  height: 54px;
  overflow: visible !important;
}

:deep(.ant-table-cell) {
  overflow: visible !important;
}

/* 优化进行中任务的悬停效果 */
.in-progress:hover {
  background: linear-gradient(
    90deg,
    rgba(64, 158, 255, 0.15),
    rgba(64, 158, 255, 0.25),
    rgba(64, 158, 255, 0.15)
  );
}

/* 操作按钮样式 */
.action-buttons {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.group:hover .action-buttons {
  opacity: 1;
}

.action-btn {
  padding: 2px 8px;
  border-radius: 4px;
}

/* 修改之前的按钮组样式 */
.group .opacity-0 {
  opacity: 0.6 !important;
}

.group:hover .opacity-0 {
  opacity: 1 !important;
}

/* 确保表格行有足够的空间显示按钮 */
:deep(.ant-table-row) {
  height: 54px;
}

/* 修改按钮提示效果 */
.action-btn::after {
  content: attr(title);
  position: absolute;
  bottom: 130%;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease-in-out;
  white-space: nowrap;
  z-index: 1000;
}

.action-btn:hover::after {
  opacity: 1;
  z-index: 9999;
}

/* 修改表格单元格样式 */
:deep(.ant-table-cell) {
  position: relative;
}

/* 添加删除动画 */
.ant-table-tbody > tr {
  transition: all 0.3s ease-out;
}

.ant-table-tbody > tr.deleting {
  opacity: 0;
  transform: translateX(100%);
}

/* 修改底部输入框样式 */
.add-task-input {
  height: 56px !important;
  border-radius: 28px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  transition: all 0.3s ease;
}

.add-task-input:hover,
.add-task-input:focus {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
  transform: translateY(-1px);
}

:deep(.add-task-input .ant-input) {
  font-size: 16px !important;
  padding: 0 !important;
}

:deep(.add-task-input .ant-input-prefix) {
  margin-right: 13px !important;
  margin-left: 8px !important;
  margin-bottom: 4px;
  font-size: 18px !important;
  cursor: pointer;
}

:deep(.add-task-input .ant-input-suffix) {
  margin-left: 12px !important;
  margin-right: 11px !important;
  margin-bottom: 6px;
}

.options-btn {
  padding: 0 12px !important;
  font-size: 16px !important;
  color: var(--ant-color-text-secondary) !important;
}

.options-btn:hover {
  color: var(--ant-color-primary) !important;
}

/* 调整表格滚动区域的高度，为底部输入框留出空间 */
:deep(.ant-table-body) {
  height: calc(100vh - 380px) !important;
}

/* 确保父容器占满整个视口高度 */
.h-full {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 调整表格容器样式 */
.flex-1 {
  flex: 1;
  min-height: 0; /* 重要：防止 flex 子项溢出 */
}

/* 优化表格在小屏幕上的显示 */
:deep(.ant-table-body) {
  overflow-y: auto !important;
}

/* 确保底部区域不会被表格内容遮挡 */
.bottom-container {
  position: relative;
  z-index: 11;
  background: white;
}

/* 添加自定义消息样式 */
:deep(.custom-message) {
  .ant-message-notice-content {
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.undo-message {
  display: flex;
  align-items: center;
  gap: 4px;
  
  a {
    font-weight: 500;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

/* 添加加号图标悬浮效果 */
.plus-icon {
  transition: all 0.3s ease;
}

.plus-icon:hover {
  transform: rotate(90deg);
  color: var(--ant-color-primary);
}

/* 右侧回车图标样式 */
:deep(.add-task-input .ant-input-suffix .anticon) {
  position: relative;
}

:deep(.add-task-input .ant-input-suffix .anticon::after) {
  content: attr(title);
  position: absolute;
  bottom: 130%;
  right: 0;
  white-space: nowrap;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

:deep(.add-task-input .ant-input-suffix .anticon:hover::after) {
  opacity: 1;
}

/* 优先级点的样式调整 */
.priority-dot {
  margin-right: 8px !important;  /* 优先级点与加号的间距 */
}

/* 优先级下拉按钮样式 */
.priority-dropdown {
  @apply flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors;
}

.priority-dot {
  @apply w-2 h-2 rounded-full;
}

/* 截止日期样式 */
.due-date {
  @apply cursor-pointer hover:text-blue-500 transition-colors;
}

/* 日期选择器弹窗样式 */
:deep(.ant-modal-body) {
  @apply flex justify-center py-6;
}

:deep(.ant-picker) {
  @apply w-full;
}

/* 优化标签样式 */
:deep(.ant-tag) {
  margin: 0;
  padding: 0 6px;
  line-height: 1.4;
  font-size: 12px;
}

/* 调整标签间距 */
.flex.items-center.gap-2 {
  gap: 4px;
}

/* 添加标签悬浮效果 */
:deep(.ant-tag.hover\:cursor-pointer:hover) {
  opacity: 0.85;
  transform: translateY(-1px);
  transition: all 0.2s;
}

/* 优化下拉菜单样式 */
:deep(.ant-dropdown-menu-item) {
  padding: 8px 12px;
  display: flex;
  align-items: center;
}

:deep(.ant-dropdown-menu-item:hover) {
  background-color: rgba(0, 0, 0, 0.02);
}

/* 调整下拉菜单中标签的样式 */
:deep(.ant-dropdown-menu .ant-tag) {
  min-width: 32px;
  text-align: center;
}

/* 调整下拉菜单的间距 */
:deep(.ant-dropdown-menu) {
  padding: 4px;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; /* 确保文本不换行 */
}

/* 添加列宽拖拽样式 */
.table-column-resizer {
  cursor: col-resize;
  position: relative;
  width: 5px; /* 调整拖拽宽度 */
  background-color: transparent; /* 背景透明 */
}

/* 悬浮提示样式 */
.tooltip {
  position: fixed;
  background-color: white;
  border: 1px solid #eee;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 99999;
  min-width: 200px;
  pointer-events: none;
  transform: translate(-50%, -100%);
}

.tooltip::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 12px;
  height: 12px;
  background-color: white;
  border-right: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.tooltip-content {
  position: relative;
  z-index: 1;
}

/* 优化完成时间显示样式 */
.completed-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 添加完成状态的文字样式 */
.text-gray-400 {
  transition: color 0.3s ease;
}

/* 撒花容器样式 */
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
}

.confetti-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 完成对话框样式 */
.completion-dialog :deep(.el-dialog__header) {
  text-align: center;
  margin-right: 0;
  padding: 20px 20px 0;
}

.completion-dialog :deep(.el-dialog__body) {
  padding: 30px 20px;
}

.completion-content {
  text-align: center;
}

.completion-emoji {
  font-size: 36px;
  margin-bottom: 12px;
}

.completion-message {
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.6;
}

.task-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-color-primary);
  margin-top: 8px;
  word-break: break-all;
}

.completion-time {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.dialog-footer {
  text-align: center;
  padding-top: 20px;
}

.dialog-footer .el-button {
  min-width: 100px;
}

/* 已完成任务控制按钮样式 */
.completed-tasks-control {
  position: relative;
  transition: all 0.3s ease;
}

.completed-tasks-control:hover {
  transform: translateY(-1px);
}

.completed-count {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.completed-count .number {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-color-success);
}

.completed-count .label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.toggle-icon {
  transition: transform 0.3s ease;
}

.toggle-icon.rotated {
  transform: rotate(-180deg);
}

/* 已完成任务行的动画效果 */
.completed-row {
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.completed-row-hidden {
  opacity: 0;
  transform: translateX(100%);
  height: 0;
  padding: 0;
  margin: 0;
  pointer-events: none;
}

/* 添加任务完成时的动画效果 */
@keyframes taskComplete {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  50% {
    transform: translateX(50px);
    opacity: 0.5;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

.task-completing {
  animation: taskComplete 0.5s ease-in-out;
}

/* 优化表格样式 */
:deep(.ant-table-tbody > tr.completed-row > td) {
  transition: all 0.3s ease;
  color: var(--el-text-color-secondary);
}

:deep(.ant-table-tbody > tr.completed-row:hover > td) {
  background: #f0f2f5;
}

/* 添加完成任务数量的动画效果 */
.completed-count .number {
  display: inline-block;
  animation: countChange 0.3s ease-out;
}

@keyframes countChange {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>