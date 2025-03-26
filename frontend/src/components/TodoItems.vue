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
      <div class="flex-1 max-w-md relative group">
        <a-input
          v-model:value="searchText"
          placeholder="搜索待办事项... (按 '/' 快速搜索)"
          class="search-input"
          :bordered="false"
          @focus="showSearchTips = true"
          @blur="handleSearchBlur"
          @input="handleSearchInput"
          @pressEnter="onSearch"
        >
          <template #prefix>
            <div class="search-prefix">
              <search-outlined 
                class="search-icon"
                :class="{ 'searching': isSearching }"
              />
            </div>
          </template>
          <template #suffix>
            <div class="search-suffix" v-if="searchText">
              <close-circle-outlined
                class="clear-icon"
                @click="clearSearch"
              />
            </div>
          </template>
        </a-input>

        <!-- 优化搜索提示面板 -->
        <div 
          class="search-tooltip"
          :class="{ 'visible': showSearchTips }"
        >
          <div class="tooltip-header">
            <span class="tooltip-title">搜索技巧</span>
            <span class="tooltip-subtitle">点击标签快速筛选</span>
          </div>
          
          <!-- 分类搜索区域 -->
          <div class="tooltip-section">
            <div class="section-header">
              <tag-outlined class="text-green-500" />
              <span>按分类筛选</span>
            </div>
            <div class="tooltip-tags">
              <a-tag 
                v-for="cat in categories" 
                :key="cat"
                :color="getCategoryColor(cat)"
                class="search-tag"
                @click="handleTagClick('#' + cat)"
              >
                {{ getCategoryShortName(cat) }}
              </a-tag>
            </div>
          </div>

          <!-- 优先级搜索区域 -->
          <div class="tooltip-section">
            <div class="section-header">
              <fire-outlined class="text-orange-500" />
              <span>按优先级筛选</span>
            </div>
            <div class="tooltip-tags">
              <a-tag 
                v-for="priority in priorities" 
                :key="priority"
                :color="getPriorityColor(priority)"
                class="search-tag"
                @click="handleTagClick('!' + priority)"
              >
                {{ priority }}优先级
              </a-tag>
            </div>
          </div>

          <!-- 快捷搜索提示 -->
          <div class="tooltip-footer">
            <keyboard-outlined class="text-gray-400" />
            <span>按 <kbd>/</kbd> 快速聚焦搜索框</span>
          </div>
        </div>
      </div>

      <!-- 添加时间筛选区域 -->
      <div class="flex items-center gap-2">
        <!-- 日期选择器 -->
        <a-dropdown :trigger="['hover']" :mouseEnterDelay="0.3">
          <div class="filter-btn">
            <calendar-outlined />
            <span class="ml-1">{{ getDateFilterText }}</span>
            <down-outlined class="ml-1 text-xs" />
          </div>
          <template #overlay>
            <a-menu @click="handleDateFilterClick">
              <a-menu-item key="all">
                <calendar-outlined class="mr-2" />
                全部时间
              </a-menu-item>
              <a-menu-item key="today">
                <thunderbolt-outlined class="mr-2" />
                今日完成
                <a-tag v-if="todayCompletedCount" color="success" class="ml-2">
                  {{ todayCompletedCount }}
                </a-tag>
              </a-menu-item>
              <a-menu-item key="yesterday">
                <history-outlined class="mr-2" />
                昨日完成
                <a-tag v-if="yesterdayCompletedCount" color="processing" class="ml-2">
                  {{ yesterdayCompletedCount }}
                </a-tag>
              </a-menu-item>
              <a-menu-item key="thisWeek">
                <calendar-outlined class="mr-2" />
                本周完成
                <a-tag v-if="thisWeekCompletedCount" color="warning" class="ml-2">
                  {{ thisWeekCompletedCount }}
                </a-tag>
              </a-menu-item>
              <a-menu-item key="lastWeek">
                <calendar-outlined class="mr-2" />
                上周完成
                <a-tag v-if="lastWeekCompletedCount" color="warning" class="ml-2">
                  {{ lastWeekCompletedCount }}
                </a-tag>
              </a-menu-item>
              <a-menu-item key="lastMonth">
                <calendar-outlined class="mr-2" />
                上月完成
                <a-tag v-if="lastMonthCompletedCount" color="warning" class="ml-2">
                  {{ lastMonthCompletedCount }}
                </a-tag>
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="custom">
                <field-time-outlined class="mr-2" />
                自定义时间
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>

        <!-- 任务状态筛选 -->
        <a-dropdown :trigger="['hover']" :mouseEnterDelay="0.3">
          <div class="filter-btn">
            <span class="ml-1">{{ filterStatus === 'all' ? '全部任务' : filterStatus === 'active' ? '未完成' : '已完成' }}</span>
            <down-outlined class="ml-1 text-xs" />
          </div>
          <template #overlay>
            <a-menu @click="handleStatusFilterClick">
              <a-menu-item key="all">
                <span>全部任务</span>
              </a-menu-item>
              <a-menu-item key="active">
                <span>未完成 ⏳</span>
              </a-menu-item>
              <a-menu-item key="completed">
                <span>已完成 ✅</span>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>

        <!-- 已完成任务控制按钮 -->
        <a-dropdown :trigger="['hover']" :mouseEnterDelay="0.3">
          <div class="filter-btn completed-count">
            <div class="flex items-center gap-2">
              <span class="number">{{ completedTodos.length }}</span>
              <span class="label">已完成</span>
              <down-outlined 
                class="ml-1 text-xs toggle-icon" 
                :class="{ 'rotated': !showCompletedTasks }" 
              />
            </div>
          </div>
          <template #overlay>
            <a-menu @click="handleCompletedMenuClick">
              <a-menu-item key="expand">
                <span class="flex items-center gap-2">
                  <eye-outlined class="text-green-500" />
                  显示已完成
                </span>
              </a-menu-item>
              <a-menu-item key="collapse">
                <span class="flex items-center gap-2">
                  <eye-invisible-outlined class="text-red-500" />
                  隐藏已完成
                </span>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
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
                  <a-menu-item key="目标任务">
                    <div class="flex items-center gap-2">
                      <a-tag color="purple" size="small">目标</a-tag>
                      <span>目标任务</span>
                    </div>
                  </a-menu-item>
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
              <div 
                class="group flex items-center relative"
              >
                <span 
                  :class="{ 
                    'line-through text-gray-400': record.completed,
                    'in-progress-text': record.pomodoros > 0 && !record.completed 
                  }"
                  class="flex-1 truncate cursor-pointer"
                  @click="openDrawer(record)"
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
      <FancyInput
        v-model="newTodo"
        :category="newTodoCategory"
        :priority="newTodoPriority"
        :dueDate="newDueDate"
        :dueDateRange="dateRange"
        placeholder="添加新任务..."
        @enter="addTodo"
        @update:category="setCategory"
        @update:priority="setPriority"
        @update:dueDate="newDueDate = $event"
        @update:dueDateRange="dateRange = $event"
        @setDueDate="setDueDate"
      >
      </FancyInput>
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

    <!-- 添加日期选择弹窗 -->
    <a-modal
      v-model:visible="datePickerVisible"
      title="选择日期范围"
      @ok="handleDateRangeOk"
      :maskClosable="false"
    >
      <div class="date-picker-container">
        <a-range-picker
          v-model:value="dateRange"
          :show-time="{ format: 'HH:mm' }"
          format="YYYY-MM-DD HH:mm"
          :placeholder="['开始时间', '结束时间']"
        />
      </div>
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

    <!-- 在 template 最后添加抽屉组件 -->
    <a-drawer
      :visible="drawerVisible"
      :width="380"
      placement="right"
      @close="closeDrawer"
      class="todo-detail-drawer"
    >
      <template #title>
        <div class="flex items-center gap-2">
          <span class="text-lg">✨ 任务详情</span>
          <a-tag :color="getPriorityColor(selectedTodo?.priority)" v-if="selectedTodo">
            {{ selectedTodo.priority }}优先级
          </a-tag>
        </div>
      </template>
      
      <template #extra>
        <a-space>
          <a-button 
            type="text" 
            @click="toggleEditMode"
            v-if="selectedTodo"
          >
            <template #icon>
              <edit-outlined v-if="!isEditing" />
              <check-outlined v-else />
            </template>
            {{ isEditing ? '保存' : '编辑' }}
          </a-button>
        </a-space>
      </template>

      <div v-if="selectedTodo" class="todo-detail-content">
        <!-- 任务状态区 -->
        <div class="status-section">
          <div class="status-badge" :class="{ 'completed': selectedTodo.completed }">
            {{ selectedTodo.completed ? '已完成 ✅' : '进行中 ⏳' }}
          </div>
          <div class="completion-rate">
            完成率: {{ calculateCompletionRate() }}%
          </div>
        </div>

        <!-- 任务内容区 -->
        <div class="content-section">
          <h3 class="section-title">📝 任务内容</h3>
          <template v-if="isEditing">
            <a-textarea
              v-model:value="editingData.text"
              :auto-size="{ minRows: 2, maxRows: 6 }"
              class="edit-textarea"
              placeholder="请输入任务内容"
            />
          </template>
          <template v-else>
            <p class="task-text" :class="{ 'completed': selectedTodo.completed }">
              {{ selectedTodo.text }}
            </p>
          </template>
        </div>

        <!-- 任务信息区 -->
        <div class="info-section">
          <!-- 优先级选择 -->
          <div class="info-item">
            <fire-outlined />
            <span class="label">优先级:</span>
            <template v-if="isEditing">
              <a-select
                v-model:value="editingData.priority"
                class="edit-select"
                :options="[
                  { value: '高', label: '高优先级' },
                  { value: '中', label: '中优先级' },
                  { value: '低', label: '低优先级' }
                ]"
              />
            </template>
            <template v-else>
              <a-tag :color="getPriorityColor(selectedTodo.priority)">
                {{ selectedTodo.priority }}
              </a-tag>
            </template>
          </div>

          <!-- 分类选择 -->
          <div class="info-item">
            <folder-outlined />
            <span class="label">分类:</span>
            <template v-if="isEditing">
              <a-select
                v-model:value="editingData.category"
                class="edit-select"
                :options="[
                  { value: '工作目标', label: '工作目标' },
                  { value: '学习目标', label: '学习目标' },
                  { value: '生活目标', label: '生活目标' },
                  { value: '其他目标', label: '其他目标' }
                ]"
              />
            </template>
            <template v-else>
              <a-tag :color="getCategoryColor(selectedTodo.category)">
                {{ selectedTodo.category || '其他目标' }}
              </a-tag>
            </template>
          </div>

          <!-- 截止日期选择 -->
          <div class="info-item">
            <clock-circle-outlined />
            <span class="label">截止于:</span>
            <template v-if="isEditing">
              <a-date-picker
                v-model:value="editingData.dueDate"
                show-time
                format="YYYY-MM-DD HH:mm"
                class="edit-date-picker"
              />
            </template>
            <template v-else>
              <span class="value" :class="{ 'overdue': !selectedTodo.completed && isOverdue(selectedTodo.dueDate) }">
                {{ formatDate(selectedTodo.dueDate) || '未设置' }}
              </span>
            </template>
          </div>

          <div class="info-item">
            <coffee-outlined />
            <span class="label">番茄数:</span>
            <span class="value">🍅 x {{ selectedTodo.pomodoros || 0 }}</span>
          </div>
        </div>

        <!-- 任务进度区 -->
        <div class="progress-section" v-if="!selectedTodo.completed">
          <h3 class="section-title">📊 任务进度</h3>
          <div class="progress-bar">
            <div 
              class="progress-fill"
              :style="{ width: `${calculateProgress()}%` }"
            ></div>
          </div>
          <p class="progress-text">已完成 {{ calculateProgress() }}%</p>
        </div>

        <!-- 操作按钮区 -->
        <div class="action-section">
          <a-button-group>
            <a-button 
              type="primary"
              @click="startTask(selectedTodo)"
              v-if="!selectedTodo.completed"
            >
              <template #icon><play-circle-outlined /></template>
              开始任务
            </a-button>
            <a-button 
              @click="toggleTodo(selectedTodo, !selectedTodo.completed)"
            >
              <template #icon>
                <check-circle-outlined v-if="!selectedTodo.completed" />
                <undo-outlined v-else />
              </template>
              {{ selectedTodo.completed ? '取消完成' : '标记完成' }}
            </a-button>
            <a-button 
              danger
              @click="deleteTodo(selectedTodo)"
            >
              <template #icon><delete-outlined /></template>
              删除任务
            </a-button>
          </a-button-group>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h, nextTick, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SearchOutlined,
  EnterOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CoffeeOutlined,
  CalendarOutlined,
  FolderOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  UndoOutlined,
  FireOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  FieldTimeOutlined,
  DownOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  KeyboardOutlined,
  TagOutlined,
  CloseCircleOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import confetti from 'canvas-confetti'
import FancyInput from './FancyInput.vue'

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
const drawerVisible = ref(false)
const selectedTodo = ref(null)
const isEditing = ref(false)
const editingData = ref({})

// 添加新的状态
const dateFilterType = ref('all')
const dateRange = ref(null)

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

// 计算属性：过滤待办事项
const filteredTodos = computed(() => {
  let filtered = todos.value || []

  // 应用日期筛选
  if (dateFilterType.value !== 'all') {
    filtered = applyDateFilter(dateFilterType.value)
  }

  // 应用状态筛选
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(todo => 
      filterStatus.value === 'completed' ? todo.completed : !todo.completed
    )
  }

  // 应用搜索筛选
  if (searchText.value) {
    const text = searchText.value.trim()
    if (text.startsWith('#')) {
      // 搜索分类
      const category = text.slice(1)
      filtered = filtered.filter(todo => 
        todo.category?.toLowerCase().includes(category.toLowerCase())
      )
    } else if (text.startsWith('!')) {
      // 搜索优先级
      const priority = text.slice(1)
      filtered = filtered.filter(todo => 
        todo.priority?.toLowerCase().includes(priority.toLowerCase())
      )
    } else {
      // 普通文本搜索
      filtered = filtered.filter(todo =>
        todo.text.toLowerCase().includes(text.toLowerCase())
      )
    }
  }

  // 如果未显示已完成任务，过滤掉已完成的任务
  if (!showCompletedTasks.value) {
    filtered = filtered.filter(todo => !todo.completed)
  }

  return filtered
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
  datePickerVisible.value = true;
  tempDueDate.value = newDueDate.value ? dayjs(newDueDate.value) : dayjs();
  editingDueDate.value = null; // 表示我们正在为新任务设置截止日期
}

// 处理日期选择
const handleDateChange = (date) => {
  tempDueDate.value = date
}

const handleDateOk = () => {
  if (editingDueDate.value) {
    // 为现有任务设置截止日期
    const todo = todos.value.find(t => t.id === editingDueDate.value.id);
    if (todo) {
      todo.dueDate = tempDueDate.value.valueOf();
      saveTodosToStorage(); // 修改这里，使用正确的函数名
    }
  } else {
    // 为新任务设置截止日期
    newDueDate.value = tempDueDate.value.valueOf();
  }
  datePickerVisible.value = false;
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
    '目标任务': 'purple',
    '工作目标': 'blue',
    '学习目标': 'success',
    '生活目标': 'warning',
    '其他目标': 'default'
  }
  return colors[category] || 'default'
}

// 添加获取分类简短名称的方法
const getCategoryShortName = (category) => {
  const shortNames = {
    '目标任务': '目标',
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
  if (record.completed) {
    return 'completed-row'
  }
  return ''
}

// 初始化
loadTodosFromStorage()

// 添加打开抽屉函数
const openDrawer = (todo) => {
  selectedTodo.value = todo
  drawerVisible.value = true
}

// 添加关闭抽屉函数
const closeDrawer = () => {
  drawerVisible.value = false
  selectedTodo.value = null
  isEditing.value = false
  editingData.value = {}
}

// 添加计算完成率的函数
const calculateCompletionRate = () => {
  const total = todos.value.length
  const completed = todos.value.filter(t => t.completed).length
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

// 添加计算进度函数
const calculateProgress = () => {
  // 这里可以根据实际需求计算进度
  // 例如：基于番茄钟数量或时间等
  return selectedTodo.value?.pomodoros ? 
    Math.min(Math.round((selectedTodo.value.pomodoros / 8) * 100), 100) : 0
}

// 添加编辑模式切换函数
const toggleEditMode = () => {
  if (isEditing.value) {
    // 保存编辑
    if (selectedTodo.value) {
      const updatedTodo = {
        ...selectedTodo.value,
        text: editingData.value.text,
        priority: editingData.value.priority,
        category: editingData.value.category,
        dueDate: editingData.value.dueDate?.valueOf()
      }
      
      // 更新 todos 数组中的对应项
      const index = todos.value.findIndex(t => t.id === selectedTodo.value.id)
      if (index !== -1) {
        todos.value[index] = updatedTodo
        selectedTodo.value = updatedTodo
        saveTodosToStorage()
        message.success('保存成功')
      }
    }
  } else {
    // 进入编辑模式
    editingData.value = {
      text: selectedTodo.value.text,
      priority: selectedTodo.value.priority,
      category: selectedTodo.value.category,
      dueDate: selectedTodo.value.dueDate ? dayjs(selectedTodo.value.dueDate) : null
    }
  }
  isEditing.value = !isEditing.value
}

// 计算属性：获取日期筛选文本
const getDateFilterText = computed(() => {
  switch (dateFilterType.value) {
    case 'today':
      return '今日完成'
    case 'yesterday':
      return '昨日完成'
    case 'thisWeek':
      return '本周完成'
    case 'custom':
      return dateRange.value ? 
        `${dayjs(dateRange.value[0]).format('MM-DD')} 至 ${dayjs(dateRange.value[1]).format('MM-DD')}` : 
        '自定义时间'
    default:
      return '全部时间'
  }
})

// 计算已完成任务数量
const todayCompletedCount = computed(() => {
  const today = dayjs().startOf('day')
  return todos.value.filter(todo => 
    todo.completed && 
    dayjs(todo.dueDate).isSame(today, 'day')
  ).length
})

const yesterdayCompletedCount = computed(() => {
  const yesterday = dayjs().subtract(1, 'day').startOf('day')
  return todos.value.filter(todo => 
    todo.completed && 
    dayjs(todo.dueDate).isSame(yesterday, 'day')
  ).length
})

const thisWeekCompletedCount = computed(() => {
  const startOfWeek = dayjs().startOf('week')
  return todos.value.filter(todo => 
    todo.completed && 
    dayjs(todo.dueDate).isAfter(startOfWeek)
  ).length
})

const lastWeekCompletedCount = computed(() => {
  const startOfLastWeek = dayjs().subtract(1, 'week').startOf('week')
  const endOfLastWeek = dayjs().subtract(1, 'week').endOf('week')
  return todos.value.filter(todo => 
    todo.completed && 
    dayjs(todo.dueDate).isAfter(startOfLastWeek) && 
    dayjs(todo.dueDate).isBefore(endOfLastWeek)
  ).length
})

const lastMonthCompletedCount = computed(() => {
  const startOfLastMonth = dayjs().subtract(1, 'month').startOf('month')
  const endOfLastMonth = dayjs().subtract(1, 'month').endOf('month')
  return todos.value.filter(todo => 
    todo.completed && 
    dayjs(todo.dueDate).isAfter(startOfLastMonth) && 
    dayjs(todo.dueDate).isBefore(endOfLastMonth)
  ).length
})

// 处理日期筛选点击
const handleDateFilterClick = ({ key }) => {
  dateFilterType.value = key
  if (key === 'custom') {
    datePickerVisible.value = true
  }
  // 不再需要显式调用 applyDateFilter，因为它已经在 computed 中处理了
}

// 应用日期筛选
const applyDateFilter = (filterType) => {
  let filtered = todos.value || []
  
  switch (filterType) {
    case 'today': {
      const today = dayjs().startOf('day')
      const tomorrow = dayjs().endOf('day')
      filtered = filtered.filter(todo =>
        todo.completed && 
        dayjs(todo.dueDate).isAfter(today) &&
        dayjs(todo.dueDate).isBefore(tomorrow)
      )
      break
    }
    case 'yesterday': {
      const yesterday = dayjs().subtract(1, 'day').startOf('day')
      const today = dayjs().startOf('day')
      filtered = filtered.filter(todo =>
        todo.completed && 
        dayjs(todo.dueDate).isAfter(yesterday) &&
        dayjs(todo.dueDate).isBefore(today)
      )
      break
    }
    case 'thisWeek': {
      const startOfWeek = dayjs().startOf('week')
      const endOfWeek = dayjs().endOf('week')
      filtered = filtered.filter(todo =>
        todo.completed && 
        dayjs(todo.dueDate).isAfter(startOfWeek) &&
        dayjs(todo.dueDate).isBefore(endOfWeek)
      )
      break
    }
    case 'lastWeek': {
      const startOfLastWeek = dayjs().subtract(1, 'week').startOf('week')
      const endOfLastWeek = dayjs().subtract(1, 'week').endOf('week')
      filtered = filtered.filter(todo =>
        todo.completed && 
        dayjs(todo.dueDate).isAfter(startOfLastWeek) && 
        dayjs(todo.dueDate).isBefore(endOfLastWeek)
      )
      break
    }
    case 'lastMonth': {
      const startOfLastMonth = dayjs().subtract(1, 'month').startOf('month')
      const endOfLastMonth = dayjs().subtract(1, 'month').endOf('month')
      filtered = filtered.filter(todo =>
        todo.completed && 
        dayjs(todo.dueDate).isAfter(startOfLastMonth) && 
        dayjs(todo.dueDate).isBefore(endOfLastMonth)
      )
      break
    }
    case 'custom': {
      if (dateRange.value) {
        filtered = filtered.filter(todo =>
          todo.completed && 
          dayjs(todo.dueDate).isAfter(dateRange.value[0]) &&
          dayjs(todo.dueDate).isBefore(dateRange.value[1])
        )
      }
      break
    }
  }

  return filtered
}

// 处理日期范围确认
const handleDateRangeOk = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    // 设置日期范围
    const [start, end] = dateRange.value;
    // 如果是为新任务设置日期范围
    if (!editingDueDate.value) {
      newDueDate.value = start.valueOf(); // 设置开始日期作为截止日期
    } else {
      // 为现有任务设置日期范围
      const todo = todos.value.find(t => t.id === editingDueDate.value.id);
      if (todo) {
        todo.dueDate = start.valueOf();
        saveTodosToStorage();
      }
    }
  }
  datePickerVisible.value = false;
}

// 处理已完成任务菜单点击
const handleCompletedMenuClick = ({ key }) => {
  showCompletedTasks.value = key === 'expand'
  
  message.success({
    content: h('div', [
      h('span', key === 'expand' ? '已显示' : '已隐藏'),
      h('span', '已完成任务 '),
      h('span', { style: { marginLeft: '4px' } }, key === 'expand' ? '👀' : '🙈')
    ]),
    duration: 1.5
  })
}

// 添加新的状态
const isSearching = ref(false)

// 添加清除搜索方法
const clearSearch = () => {
  searchText.value = ''
  loadTodosFromStorage() // 重置为原始数据
  message.success('已清除搜索')
}

// 添加键盘快捷键处理
onMounted(() => {
  window.addEventListener('keydown', handleSearchShortcut)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleSearchShortcut)
})

const handleSearchShortcut = (e) => {
  // 当按下 '/' 键且不在输入框中时，聚焦搜索框
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault()
    const searchInput = document.querySelector('.search-input input')
    if (searchInput) {
      searchInput.focus()
    }
  }
}

// 添加新的响应式状态
const showSearchTips = ref(false)
const categories = ['工作目标', '学习目标', '生活目标', '其他目标']
const priorities = ['高', '中', '低']

// 修改搜索相关方法
const handleSearchBlur = () => {
  setTimeout(() => {
    showSearchTips.value = false
  }, 200)
}

const handleSearchInput = () => {
  const text = searchText.value
  if (text) {
    isSearching.value = true
  } else {
    isSearching.value = false
    loadTodosFromStorage() // 当搜索框清空时重置数据
  }
}

// 修改标签点击处理
const handleTagClick = (searchQuery) => {
  searchText.value = searchQuery
  onSearch()
  // 保持面板可见
  showSearchTips.value = true
}

// 修改搜索逻辑
const onSearch = () => {
  const text = searchText.value.trim()
  if (!text) {
    loadTodosFromStorage()
    return
  }

  // 不直接修改 todos.value，而是通过 filteredTodos 计算属性来过滤
  message.success({
    content: h('div', [
      h('span', '搜索完成 '),
      h('span', { style: { marginLeft: '4px' } }, '🔍')
    ]),
    duration: 1
  })
}

// 添加状态筛选处理函数
const handleStatusFilterClick = ({ key }) => {
  filterStatus.value = key
  loadTodosFromStorage() // 重新加载数据并应用筛选
}

// 监视 newDueDate 的变化
watch(newDueDate, (newVal) => {
  console.log('newDueDate changed:', newVal);
});
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
  @apply bg-white hover:bg-gray-50 transition-all duration-300 !important;
  border-radius: 12px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

:deep(.search-input .ant-input) {
  @apply bg-transparent text-gray-700 !important;
  font-size: 14px !important;
  padding: 8px 12px !important;
}

.search-prefix {
  @apply flex items-center mr-2;
}

.search-icon {
  @apply text-gray-400 text-lg transition-all duration-300;
}

.search-icon.searching {
  @apply text-blue-500;
  animation: pulse 2s infinite;
}

.search-suffix {
  @apply flex items-center gap-2;
}

.clear-icon {
  @apply text-gray-400 hover:text-red-500 cursor-pointer transition-colors;
  font-size: 16px;
}

.keyboard-icon {
  @apply text-gray-400 opacity-60;
  font-size: 14px;
}

/* 搜索提示框样式 */
.search-tooltip {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 8px;
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 1000;
}

.search-tooltip.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.tooltip-item {
  @apply flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50;
  transition: all 0.2s ease;
}

.tooltip-item:hover {
  @apply bg-gray-50;
}

/* 添加动画效果 */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* 添加搜索框聚焦效果 */
:deep(.search-input:focus-within) {
  @apply ring-2 ring-blue-100 !important;
}

/* 优化placeholder样式 */
:deep(.search-input .ant-input::placeholder) {
  @apply text-gray-400 !important;
}

/* 添加图标提示效果 */
.keyboard-icon::after {
  content: attr(title);
  position: absolute;
  bottom: -30px;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.2s ease;
  pointer-events: none;
}

.keyboard-icon:hover::after {
  opacity: 1;
  transform: translateY(0);
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
  @apply flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer;
}

.completed-count:hover {
  @apply bg-gray-50;
}

.completed-count .number {
  @apply text-base font-medium text-green-500;
}

.completed-count .label {
  @apply text-sm text-gray-500;
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
  display: none !important;
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

/* 抽屉样式 */
.todo-detail-drawer {
  :deep(.ant-drawer-header) {
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
  }

  :deep(.ant-drawer-body) {
    padding: 24px;
  }
}

.todo-detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.status-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 16px;
  background-color: #e6f7ff;
  color: #1890ff;
  font-weight: 500;
  
  &.completed {
    background-color: #f6ffed;
    color: #52c41a;
  }
}

.completion-rate {
  font-size: 14px;
  color: #666;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
}

.task-text {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  
  &.completed {
    color: #999;
    text-decoration: line-through;
  }
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #fafafa;
  padding: 16px;
  border-radius: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  
  .label {
    color: #999;
    width: 60px;
  }
  
  .value {
    color: #333;
    
    &.overdue {
      color: #ff4d4f;
    }
  }
}

.progress-section {
  .progress-bar {
    height: 8px;
    background-color: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #1890ff, #52c41a);
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 14px;
    color: #666;
    text-align: center;
  }
}

.action-section {
  margin-top: auto;
  padding-top: 24px;
  
  :deep(.ant-btn-group) {
    display: flex;
    gap: 8px;
    
    .ant-btn {
      flex: 1;
    }
  }
}

/* 添加一些动画效果 */
.todo-detail-content {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 添加悬浮效果 */
.info-item:hover {
  background-color: #f0f0f0;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.status-badge {
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
}

/* 编辑模式样式 */
.edit-textarea {
  @apply rounded-lg border-gray-200 hover:border-blue-400 focus:border-blue-500;
  transition: all 0.3s ease;
}

.edit-select {
  @apply min-w-[120px];
}

.edit-date-picker {
  @apply w-full;
}

/* 编辑字段的动画效果 */
.edit-textarea,
.edit-select,
.edit-date-picker {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 优化编辑模式下的表单控件样式 */
:deep(.ant-input),
:deep(.ant-select-selector),
:deep(.ant-picker) {
  @apply rounded-lg !important;
  @apply border-gray-200 hover:border-blue-400 focus:border-blue-500 !important;
  transition: all 0.3s ease;
}

:deep(.ant-select-selector) {
  @apply h-8 !important;
}

:deep(.ant-select-selection-item) {
  @apply leading-8 !important;
}

/* 添加新样式 */
.filter-btn {
  @apply flex items-center px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors;
  color: var(--ant-color-text);
}

.filter-btn:hover {
  color: var(--ant-color-primary);
}

.date-picker-container {
  @apply flex justify-center items-center py-4;
}

:deep(.ant-picker-range) {
  @apply w-full;
}

/* 添加动画效果 */
.filter-btn {
  position: relative;
  overflow: hidden;
}

.filter-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(24, 144, 255, 0.2);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.filter-btn:hover::after {
  animation: ripple 1s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(40, 40);
    opacity: 0;
  }
}

/* 优化标签样式 */
:deep(.ant-tag) {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}

/* 优化下拉菜单样式 */
:deep(.ant-dropdown-menu-item) {
  @apply py-2 px-4;
}

:deep(.ant-dropdown-menu-item:hover) {
  background-color: rgba(24, 144, 255, 0.1);
}

/* 添加图标动画 */
.calendar-icon {
  transition: transform 0.3s ease;
}

.filter-btn:hover .calendar-icon {
  transform: rotate(360deg);
}

/* 隐藏排序提示 */
.ant-table-column-sorter:hover .ant-table-column-sorter-inner::after {
  display: none !important;
}

/* 隐藏Ant Design的默认tooltip */
.ant-tooltip {
  display: none !important;
}

/* 禁用表头单元格的title属性 */
:deep(.ant-table-thead th) {
  pointer-events: none;
}

/* 保留排序交互功能 */
:deep(.ant-table-column-sorter) {
  pointer-events: auto;
  cursor: pointer;
}

/* 优化搜索框样式 */
.search-input {
  @apply bg-white hover:bg-gray-50 transition-all duration-300 !important;
  border-radius: 12px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-input:hover,
.search-input:focus-within {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 搜索按钮样式 */
.search-btn {
  @apply rounded-lg text-sm font-medium !important;
  height: 32px !important;
  padding: 0 16px !important;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%) !important;
  border: none !important;
  transition: all 0.3s ease !important;
}

.search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.35);
}

/* 搜索提示框样式优化 */
.search-tooltip {
  @apply bg-white rounded-xl shadow-lg;
  min-width: 300px;
  border: 1px solid #f0f0f0;
}

.tooltip-header {
  @apply text-sm font-medium text-gray-700 px-4 py-2 border-b border-gray-100;
}

.tooltip-item {
  @apply px-4 py-3 hover:bg-gray-50 cursor-pointer;
}

.tooltip-item kbd {
  @apply bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-sm font-mono;
}

.tooltip-tags {
  @apply mt-2 flex flex-wrap gap-2;
}

.search-tag {
  @apply cursor-pointer transition-transform hover:scale-105;
}

/* 搜索图标动画优化 */
.search-icon.searching {
  @apply text-blue-500;
  animation: searching 1.5s ease-in-out infinite;
}

@keyframes searching {
  0% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(180deg);
  }
  100% {
    transform: scale(1) rotate(360deg);
  }
}

/* 清除图标样式优化 */
.clear-icon {
  @apply mr-2 text-gray-400 hover:text-red-500 transition-colors;
}

/* 搜索框内部布局优化 */
:deep(.ant-input-affix-wrapper) {
  padding: 4px 8px !important;
}

:deep(.ant-input) {
  font-size: 14px !important;
}

/* 添加键盘快捷键提示样式 */
:deep(.ant-input::placeholder) {
  color: #a0aec0 !important;
}

.tooltip-header {
  @apply flex items-center justify-between mb-4 pb-3 border-b border-gray-100;
}

.tooltip-title {
  @apply text-base font-medium text-gray-700;
}

.tooltip-subtitle {
  @apply text-sm text-gray-400;
}

.tooltip-section {
  @apply mb-4;
}

.section-header {
  @apply flex items-center gap-2 mb-2 text-sm text-gray-600;
}

.tooltip-tags {
  @apply flex flex-wrap gap-2;
}

.search-tag {
  @apply cursor-pointer transition-all hover:scale-105;
  padding: 4px 8px;
}

.tooltip-footer {
  @apply flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500;
}

.tooltip-footer kbd {
  @apply bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-sm font-mono;
}

/* 输入框内部布局优化 */
:deep(.ant-input-affix-wrapper) {
  padding: 8px 12px !important;
}

:deep(.ant-input) {
  font-size: 14px !important;
}

:deep(.ant-input::placeholder) {
  color: #a0aec0 !important;
}
</style>