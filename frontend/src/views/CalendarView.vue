<template>
  <div class="calendar-container">
    <a-calendar v-model:value="currentDate">
      <!-- 自定义头部，添加今天按钮 -->
      <template #headerRender="{ value, type, onChange, onTypeChange }">
        <div class="calendar-header">
          <div class="calendar-header-left">
            <!-- 月份选择器 -->
            <a-select
              size="small"
              :value="value.month()"
              style="width: 80px; margin-right: 8px;"
              @change="(selectedMonth) => {
                const newValue = value.clone().month(selectedMonth)
                onChange(newValue)
              }"
            >
              <a-select-option v-for="i in 12" :key="i-1" :value="i-1">
                {{ i }}月
              </a-select-option>
            </a-select>
            <!-- 年份选择器 -->
            <a-select
              size="small"
              :value="value.year()"
              style="width: 100px;"
              @change="(selectedYear) => {
                const newValue = value.clone().year(selectedYear)
                onChange(newValue)
              }"
            >
              <a-select-option v-for="i in 10" :key="startYear + i" :value="startYear + i">
                {{ startYear + i }}年
              </a-select-option>
            </a-select>
          </div>
          <div class="calendar-header-right">
            <!-- 视图切换 -->
            <a-radio-group
              size="small"
              :value="type"
              @change="e => onTypeChange(e.target.value)"
              style="margin-right: 8px;"
            >
              <a-radio-button value="month">月</a-radio-button>
              <a-radio-button value="year">年</a-radio-button>
            </a-radio-group>
            <!-- 今天按钮 -->
            <a-button
              type="primary"
              size="small"
              @click="() => {
                const now = dayjs()
                onChange(now)
                currentDate = now
              }"
            >
              今天
            </a-button>
          </div>
        </div>
      </template>

      <template #dateCellRender="{ current }">
        <div 
          class="date-cell"
          @contextmenu.prevent="handleContextMenu($event, current)"
        >
          <!-- 日期信息容器 -->
          <div class="date-info">
            <!-- 休息日标记 -->
            <span v-if="isHoliday(current)" class="holiday-mark">休</span>
            <!-- 公历日期 -->
            <span class="solar-date" :class="{ 'is-holiday': isHoliday(current) }">
              {{ current.date() }}
            </span>
            <!-- 农历日期 -->
            <span class="lunar-date">{{ getLunarDate(current) }}</span>
          </div>
          <!-- 待办事项列表 -->
          <div class="todo-list">
            <div
              v-for="item in getTodosByDate(current)"
              :key="item.id"
              class="todo-item"
              :class="[
                item.priority, 
                { 
                  completed: item.completed,
                  'due-date': isDueDate(current, item),
                  'create-date': isCreateDate(current, item)
                }
              ]"
            >
              <span class="todo-tag" v-if="isDueDate(current, item)">截止</span>
              <span class="todo-tag" v-if="isCreateDate(current, item)">开始</span>
              {{ item.text }}
            </div>
          </div>
        </div>
      </template>
    </a-calendar>

    <!-- 右键菜单 -->
    <div v-if="showContextMenu" :style="contextMenuStyle" class="context-menu">
      <div class="menu-item" @click="handleAddTodo">
        <plus-outlined />
        <span>添加待办事项</span>
      </div>
      <div 
        v-if="todoStore.getTodosByDate(selectedDate).length"
        class="menu-item" 
        @click="handleViewTodos"
      >
        <file-outlined />
        <span>查看待办事项</span>
      </div>
      <div 
        v-if="todoStore.getTodosByDate(selectedDate).length"
        class="menu-item" 
        @click="handleDeleteTodo"
      >
        <delete-outlined />
        <span>删除待办事项</span>
      </div>
    </div>

    <!-- 添加待办事项对话框 -->
    <a-modal
      v-model:open="dialogVisible"
      :title="dragMode ? '批量添加待办事项' : '添加待办事项'"
      @ok="saveTodo"
      @cancel="dialogVisible = false"
    >
      <a-form :model="todoForm" layout="vertical">
        <a-form-item label="标题" required>
          <a-input v-model:value="todoForm.title" placeholder="请输入待办事项标题" />
        </a-form-item>
        
        <a-form-item label="描述">
          <a-textarea
            v-model:value="todoForm.description"
            :rows="3"
            placeholder="请输入详细描述"
          />
        </a-form-item>
        
        <a-form-item label="优先级">
          <a-select v-model:value="todoForm.priority">
            <a-select-option value="高">高</a-select-option>
            <a-select-option value="中">中</a-select-option>
            <a-select-option value="低">低</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="分类">
          <a-select v-model:value="todoForm.category">
            <a-select-option value="工作目标">工作目标</a-select-option>
            <a-select-option value="学习目标">学习目标</a-select-option>
            <a-select-option value="生活目标">生活目标</a-select-option>
            <a-select-option value="其他目标">其他目标</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { 
  PlusOutlined, 
  FileOutlined, 
  DeleteOutlined 
} from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { Lunar } from 'lunar-javascript'
import { useTodoStore } from '@/stores/todo'

const router = useRouter()
const todoStore = useTodoStore()

const currentDate = ref(dayjs())
const dialogVisible = ref(false)
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const selectedDate = ref(null)
const dragMode = ref(false)
const selectedDates = ref([])

const todoForm = ref({
  title: '',
  date: null,
  description: '',
  priority: '中',
  category: '其他目标',
  dueDate: null
})

// 计算起始年份（当前年份前5年）
const startYear = dayjs().year() - 5

// 获取农历日期
const getLunarDate = (date) => {
  try {
    const lunar = Lunar.fromDate(date.toDate())
    
    // 获取节日
    const festivals = lunar.getFestivals()
    if (festivals.length > 0) {
      return festivals[0]
    }
    
    // 获取节气
    const jieQi = lunar.getJieQi()
    if (jieQi) {
      return jieQi
    }
    
    // 如果是初一，显示月份
    if (lunar.getDay() === 1) {
      return lunar.getMonthInChinese() + '月'
    }
    
    // 其他日期显示农历日期
    return lunar.getDayInChinese()
  } catch (error) {
    console.error('getLunarDate error:', error)
    return ''
  }
}

// 获取指定日期的待办事项
const getTodosByDate = (date) => {
  return todoStore.getTodosByDate(date)
}

// 格式化日期范围
const formatDateRange = (dates) => {
  if (!dates.length) return ''
  return dates
    .sort()
    .map(date => dayjs(date).format('YYYY年MM月DD日'))
    .join(' 至 ')
}

// 右键菜单样式
const contextMenuStyle = computed(() => ({
  left: `${contextMenuPosition.value.x}px`,
  top: `${contextMenuPosition.value.y}px`
}))

// 处理右键点击
const handleContextMenu = (e, date) => {
  e.preventDefault()
  showContextMenu.value = true
  contextMenuPosition.value = {
    x: Math.min(e.clientX, window.innerWidth - 200),
    y: Math.min(e.clientY, window.innerHeight - 150)
  }
  selectedDate.value = date
  dragMode.value = false
  selectedDates.value = [date]
}

// 添加待办事项
const handleAddTodo = () => {
  todoForm.value = {
    title: '',
    description: '',
    priority: '中',
    category: '其他目标',
    date: dayjs(selectedDate.value).format('YYYY-MM-DD'),
    dueDate: null
  }
  dialogVisible.value = true
  showContextMenu.value = false
}

// 查看待办事项
const handleViewTodos = () => {
  router.push('/todos')
  showContextMenu.value = false
}

// 删除待办事项
const handleDeleteTodo = () => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这天的所有待办事项吗？',
    onOk: () => {
      todoStore.deleteTodosByDate(selectedDate.value)
      message.success('删除成功')
      showContextMenu.value = false
    }
  })
}

// 保存待办事项
const saveTodo = () => {
  if (!todoForm.value.title) {
    message.warning('请输入待办事项标题')
    return
  }

  todoStore.addTodo(todoForm.value)
  message.success('添加成功')
  dialogVisible.value = false
}

// 重置表单
const resetForm = () => {
  todoForm.value = {
    title: '',
    date: null,
    description: '',
    priority: '中',
    category: '其他目标',
    dueDate: null
  }
  selectedDates.value = []
}

// 点击外部关闭右键菜单
const handleClickOutside = (e) => {
  if (showContextMenu.value && !e.target.closest('.context-menu')) {
    showContextMenu.value = false
  }
}

// 监听点击事件
window.addEventListener('click', handleClickOutside)

// 判断是否为节假日（周末或法定节假日）
const isHoliday = (date) => {
  // 判断是否为周末
  const isWeekend = date.day() === 0 || date.day() === 6
  
  // 获取农历信息
  const lunar = Lunar.fromDate(date.toDate())
  const festivals = lunar.getFestivals()
  
  // 法定节假日列表（可以根据实际需求扩展）
  const legalHolidays = [
    '春节',
    '元宵节',
    '清明节',
    '劳动节',
    '端午节',
    '中秋节',
    '国庆节'
  ]
  
  // 判断是否为法定节假日
  const isLegalHoliday = festivals.some(festival => 
    legalHolidays.some(holiday => festival.includes(holiday))
  )
  
  return isWeekend || isLegalHoliday
}

// 判断是否为截止日期
const isDueDate = (date, todo) => {
  if (!todo.dueDate) return false
  return dayjs(todo.dueDate).format('YYYY-MM-DD') === dayjs(date).format('YYYY-MM-DD')
}

// 判断是否为创建日期
const isCreateDate = (date, todo) => {
  if (!todo.date) return false
  return todo.date === dayjs(date).format('YYYY-MM-DD')
}
</script>

<style scoped>
.calendar-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}

.date-cell {
  position: relative;
  min-height: 80px;
  display: flex;
  flex-direction: column;
}

/* 日期信息容器样式 */
.date-info {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
  min-height: 48px; /* 确保有足够的高度显示两行文字 */
}

/* 休息日标记样式 */
.holiday-mark {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 12px;
  color: #f5222d;
  font-weight: bold;
}

/* 公历日期样式 */
.solar-date {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.85);
}

/* 节假日公历日期样式 */
.solar-date.is-holiday {
  color: #f5222d;
  font-weight: bold;
}

/* 农历日期样式 */
.lunar-date {
  font-size: 12px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 2px;
}

/* 待办事项列表容器 */
.todo-list {
  flex: 1;
  margin-top: 4px;
  overflow-y: auto;
}

.todo-item {
  padding: 2px 4px;
  margin: 2px 0;
  font-size: 12px;
  border-radius: 2px;
  background: #f0f5ff;
  color: #1890ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 截止日期待办项样式 */
.todo-item.due-date {
  background: #fff2e8;
  color: #fa541c;
  border-left: 2px solid #fa541c;
}

/* 创建日期待办项样式 */
.todo-item.create-date {
  background: #f6ffed;
  color: #52c41a;
  border-left: 2px solid #52c41a;
}

/* 标签样式 */
.todo-tag {
  font-size: 10px;
  padding: 0 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.1);
  color: inherit;
}

/* 优先级样式 */
.todo-item.高 {
  background: #fff1f0;
  color: #f5222d;
}

.todo-item.中 {
  background: #fff7e6;
  color: #fa8c16;
}

.todo-item.低 {
  background: #f6ffed;
  color: #52c41a;
}

/* 完成状态样式 */
.todo-item.completed {
  text-decoration: line-through;
  opacity: 0.6;
}

/* 当同时具有多个状态时的样式 */
.todo-item.completed.due-date,
.todo-item.completed.create-date {
  opacity: 0.4;
}

/* 确保待办事项列表容器可以容纳多个待办项 */
.todo-list {
  max-height: 80px;
  overflow-y: auto;
  padding: 2px;
}

/* 美化滚动条 */
.todo-list::-webkit-scrollbar {
  width: 4px;
}

.todo-list::-webkit-scrollbar-track {
  background: transparent;
}

.todo-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 2px;
  padding: 4px 0;
  box-shadow: 0 3px 6px -4px rgba(0,0,0,.12);
  z-index: 1050;
  min-width: 160px;
}

.menu-item {
  padding: 5px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item .anticon {
  margin-right: 8px;
}

.selected-dates {
  color: rgba(0, 0, 0, 0.45);
}

/* 今天的日期特殊样式 */
:deep(.ant-picker-calendar-date-today) .solar-date {
  color: #1890ff;
  font-weight: bold;
}

:deep(.ant-picker-calendar-date-today) .solar-date.is-holiday {
  color: #f5222d;
}

:deep(.ant-picker-calendar-date-today) .lunar-date {
  color: #1890ff;
}

/* 选中日期的样式 */
:deep(.ant-picker-calendar-date-selected) .date-info {
  background: #e6f7ff;
  border-radius: 2px;
}

/* 日历头部样式 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.calendar-header-left,
.calendar-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 确保下拉菜单在其他元素之上 */
:deep(.ant-select-dropdown) {
  z-index: 1100;
}
</style> 