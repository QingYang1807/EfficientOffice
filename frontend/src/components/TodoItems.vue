<template>
  <div class="h-full flex flex-col bg-white">
    <!-- 顶部标题区 -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
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
    <div class="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-100">
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

    <!-- 表格区域 -->
    <div class="flex-1 px-6 overflow-hidden">
      <a-table
        :dataSource="filteredTodos"
        :columns="columns"
        :pagination="false"
        :scroll="{ y: 'calc(100vh - 280px)' }"
        :bordered="false"
        size="middle"
        class="custom-table -mx-4"
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
              <div class="group flex items-center">
                <span 
                  :class="{ 'line-through text-gray-400': record.completed }"
                  class="flex-1"
                >
                  {{ record.text }}
                </span>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a-button 
                    type="text" 
                    @click="startEdit(record)"
                    class="!px-2 hover:!bg-gray-100"
                  >
                    <template #icon><edit-outlined /></template>
                  </a-button>
                  <a-popconfirm
                    title="确定要删除这个任务吗？"
                    @confirm="deleteTodo(record.id)"
                  >
                    <a-button 
                      type="text" 
                      class="!px-2 hover:!bg-red-50 hover:!text-red-500"
                    >
                      <template #icon><delete-outlined /></template>
                    </a-button>
                  </a-popconfirm>
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
        </template>
      </a-table>
    </div>

    <!-- 底部添加任务区 -->
    <div class="flex-none px-6 py-4 bg-white border-t border-gray-100">
      <div class="flex items-center gap-3">
        <a-input
          v-model:value="newTodo"
          placeholder="添加新任务..."
          class="add_task_input !rounded-full flex-1"
          :bordered="true"
          @keyup.enter="addTodo"
        >
          <template #prefix>
            <div class="flex items-center gap-2">
              <!-- 优先级标记点 -->
              <div 
                v-if="newTodoPriority" 
                class="w-3 h-3 rounded-full"
                :class="getPriorityDot(newTodoPriority)"
              ></div>
              <plus-outlined class="text-gray-400" />
            </div>
          </template>
        </a-input>
        <a-dropdown>
          <a-button class="!rounded-full">
            更多选项
            <down-outlined />
          </a-button>
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
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SearchOutlined,
  DownOutlined
} from '@ant-design/icons-vue'

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

// 表格列定义
const columns = [
  {
    title: '状态',
    key: 'completed',
    width: 80,
    align: 'center'
  },
  {
    title: '优先级',
    key: 'priority',
    width: 90,
    align: 'center',
    sorter: (a, b) => {
      const priority = { '高': 3, '中': 2, '低': 1 };
      return (priority[a.priority] || 0) - (priority[b.priority] || 0);
    }
  },
  {
    title: '任务内容',
    key: 'text',
    ellipsis: true,
    sorter: (a, b) => a.text.localeCompare(b.text)
  },
  {
    title: '截止日期',
    key: 'dueDate',
    width: 150,
    align: 'center',
    sorter: (a, b) => (a.dueDate || 0) - (b.dueDate || 0)
  },
  {
    title: '番茄钟',
    key: 'pomodoros',
    width: 100,
    align: 'center'
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 150,
    align: 'right',
    sorter: (a, b) => a.createdAt - b.createdAt,
    customRender: ({ text }) => formatDate(text)
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
  if (!newTodo.value.trim()) return
  
  todos.value.push({
    id: Date.now(),
    text: newTodo.value.trim(),
    completed: false,
    createdAt: Date.now(),
    priority: newTodoPriority.value,
    dueDate: newDueDate.value,
    pomodoros: 0
  })
  
  newTodo.value = ''
  newTodoPriority.value = null
  newDueDate.value = null
  saveTodosToStorage()
  message.success('任务添加成功')
}

const deleteTodo = (id) => {
  todos.value = todos.value.filter(todo => todo.id !== id)
  saveTodosToStorage()
  message.success('任务删除成功')
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

/* 优化表格排序图标 */
:deep(.ant-table-column-sorter) {
  @apply ml-1;
}

:deep(.ant-table-column-sorter-up.active),
:deep(.ant-table-column-sorter-down.active) {
  @apply text-blue-500;
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
</style>