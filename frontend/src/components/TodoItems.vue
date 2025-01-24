<template>
  <div class="h-full flex flex-col">
    <!-- 顶部标题区 -->
    <div class="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-100">
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
    <div class="flex-none flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-100">
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
            <a-tag :color="getPriorityColor(record.priority)">
              {{ record.priority }}
            </a-tag>
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
              <div class="group flex items-center" :class="{ 'in-progress': record.pomodoros > 0 && !record.completed }">
                <span 
                  :class="{ 
                    'line-through text-gray-400': record.completed,
                    'in-progress-text': record.pomodoros > 0 && !record.completed 
                  }"
                  class="flex-1"
                >
                  {{ record.text }}
                </span>
                <div class="action-buttons flex items-center gap-2 transition-opacity">
                  <!-- 开始任务按钮 -->
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
              </div>
            </template>
          </template>

          <!-- 截止日期列 -->
          <template v-else-if="column.key === 'dueDate'">
            <span :class="{ 'text-red-500': isOverdue(record.dueDate) }">
              {{ formatDate(record.dueDate) }}
            </span>
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
            <div 
              v-if="newTodoPriority" 
              class="w-3 h-3 rounded-full"
              :class="getPriorityDot(newTodoPriority)"
            ></div>
            <a-dropdown>
              <plus-outlined class="text-gray-400 cursor-pointer hover:text-blue-500 text-lg" />
              <template #overlay>
                <a-menu>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SearchOutlined,
  EnterOutlined,  // 添加回车图标
  ClockCircleOutlined
} from '@ant-design/icons-vue'

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

// 添加删除历史记录
const deleteHistory = ref([])

// 添加排序状态
const sortState = ref({
  columnKey: 'createdAt',  // 默认按创建时间排序
  order: 'descend'         // 默认降序
})

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

const filteredTodos = computed(() => {
  let result = [...todos.value]
  
  // 搜索过滤
  if (searchText.value) {
    result = result.filter(todo => 
      todo.text.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }
  
  // 状态过滤
  if (filterStatus.value !== 'all') {
    result = result.filter(todo => 
      filterStatus.value === 'completed' ? todo.completed : !todo.completed
    )
  }
  
  // 排序
  if (sortState.value.columnKey && sortState.value.order) {
    const { columnKey, order } = sortState.value
    const column = columns.find(col => col.key === columnKey)
    
    if (column && column.sorter) {
      result.sort((a, b) => {
        const result = column.sorter(a, b)
        return order === 'ascend' ? result : -result
      })
    }
  }
  
  return result
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
    priority: newTodoPriority.value || '中',
    dueDate: newDueDate.value,
    pomodoros: 0,
    createdAt: Date.now() // 添加创建时间
  }

  todos.value.push(todo)
  saveTodosToStorage()
  newTodo.value = ''
  newTodoPriority.value = null
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

const startEdit = (todo) => {
  editingId.value = todo.id
  editingText.value = todo.text
}

const saveTodo = () => {
  if (editingId.value === null) return
  
  const todo = todos.value.find(t => t.id === editingId.value)
  if (todo && editingText.value.trim()) {
    todo.text = editingText.value.trim()
    saveTodosToStorage()
    message.success('任务更新成功')
  }
  
  editingId.value = null
  editingText.value = ''
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
  if (tempDueDate.value) {
    newDueDate.value = tempDueDate.value.valueOf()
    datePickerVisible.value = false
    message.success('已设置截止日期')
  }
}

// 添加优先级相关的辅助函数
const getPriorityDot = (priority) => {
  const colors = {
    '高': 'bg-red-500',
    '中': 'bg-yellow-500',
    '低': 'bg-green-500'
  }
  return colors[priority] || ''
}

const toggleTodo = (todo, checked) => {
  todo.completed = checked
  saveTodosToStorage()
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

/* 添加优先级点样式 */
:deep(.ant-input-prefix) {
  @apply mr-2;
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
  position: relative;
  opacity: 0.6;
  padding-left: 8px;
  z-index: 1;
}

.group:hover .action-buttons {
  opacity: 1;
}

.action-btn {
  position: relative;
  color: #666;
  transition: all 0.2s ease-in-out;
}

.action-btn:hover {
  transform: scale(1.1);
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
</style>