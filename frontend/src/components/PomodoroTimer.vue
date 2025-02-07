<template>
  <div class="pomodoro-container">
    <!-- 左侧番茄钟计时区域 -->
    <div class="timer-section">
      <div class="clock-display">
        <span class="time">{{ formattedTime }}</span>
        <span class="emoji">{{ currentEmoji }}</span>
      </div>
      <div class="controls">
        <button class="start-btn" @click="toggleTimer" :disabled="!selectedTask">
          <span v-if="!timerRunning">▶️</span>
          <span v-else>⏸️</span>
        </button>
        <button class="reset-btn" @click="resetTimer">🔄</button>
      </div>
      <div class="progress-bar">
        <div class="progress" :style="{ width: `${percentage}%` }"></div>
      </div>
      <div class="settings">
        <label for="pomodoro-time">番茄钟时长 (分钟):</label>
        <input type="number" id="pomodoro-time" v-model.number="pomodoroDuration" min="1" max="60" />
      </div>
    </div>

    <!-- 中间待办任务列表 -->
    <div class="task-section">
      <div class="section-header">
        <div class="w-1 h-6 bg-blue-500 rounded-full"></div>
        <h2>待办任务</h2>
      </div>
      <div class="search-box">
        <input 
          v-model="searchText" 
          placeholder="搜索待办任务..." 
          class="search-input"
        />
      </div>
      <div class="task-list-container">
        <div v-if="filteredIncompleteTodos.length === 0" class="no-tasks-prompt">
          暂无任务，<span class="add-task-link" @click="goToTodoPage">去添加任务</span>
        </div>
        <ul v-else class="task-list">
          <li
            v-for="task in filteredIncompleteTodos"
            :key="task.id"
            class="task-item"
            :class="{ 'selected-task': selectedTask && selectedTask.id === task.id }"
            @click="selectTask(task)"
            @mouseenter="showTaskCard(task)"
            @mouseleave="hideTaskCard"
          >
            <div class="task-content">
              <span class="task-name">{{ task.text }}</span>
              <span class="pomodoro-count" v-if="task.pomodoros">🍅 x {{ task.pomodoros }}</span>
            </div>
            
            <!-- 悬浮卡片 -->
            <div v-if="hoveredTask?.id === task.id" class="task-hover-card">
              <h4 class="task-title">{{ task.text }}</h4>
              <div class="task-info">
                <div class="info-item">
                  <span class="info-label">优先级：</span>
                  <el-tag :type="getPriorityType(task.priority)" size="small">
                    {{ task.priority }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="info-label">创建时间：</span>
                  <span>{{ formatDate(task.createdAt) }}</span>
                </div>
                <div class="info-item" v-if="task.dueDate">
                  <span class="info-label">截止时间：</span>
                  <span :class="{ 'text-red-500': isOverdue(task.dueDate) }">
                    {{ formatDate(task.dueDate) }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">番茄数：</span>
                  <span>{{ task.pomodoros || 0 }} 个</span>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- 右侧已完成任务列表 -->
    <div class="completed-section">
      <div class="section-header" @click="toggleCompletedTasks">
        <div class="w-1 h-6 bg-green-500 rounded-full"></div>
        <h2>已完成任务</h2>
        <div class="flex items-center gap-2 ml-auto">
          <span class="completed-count">{{ filteredCompletedTodos.length }}个</span>
          <el-icon class="transform transition-transform" :class="{ 'rotate-180': !showCompletedTasks }">
            <ArrowDown />
          </el-icon>
        </div>
      </div>

      <!-- 添加工具栏 -->
      <div v-show="showCompletedTasks" class="task-toolbar">
        <div class="search-box">
          <el-input
            v-model="completedSearchText"
            placeholder="搜索已完成任务..."
            prefix-icon="Search"
            clearable
          />
        </div>
        <div class="filter-sort-controls">
          <el-select v-model="sortBy" placeholder="排序方式" size="small">
            <el-option label="完成时间 ↑" value="completedTime-asc" />
            <el-option label="完成时间 ↓" value="completedTime-desc" />
            <el-option label="番茄数量 ↑" value="pomodoros-asc" />
            <el-option label="番茄数量 ↓" value="pomodoros-desc" />
          </el-select>
          <el-select v-model="filterPriority" placeholder="优先级" size="small" clearable>
            <el-option label="高优先级" value="高" />
            <el-option label="中优先级" value="中" />
            <el-option label="低优先级" value="低" />
          </el-select>
        </div>
      </div>

      <div v-show="showCompletedTasks" class="completed-list-container">
        <div v-if="filteredCompletedTodos.length === 0" class="no-tasks-prompt">
          暂无完成的任务
        </div>
        <ul v-else class="task-list">
          <li 
            v-for="task in filteredCompletedTodos" 
            :key="task.id" 
            class="task-item"
            @mouseenter="showTaskCard(task)"
            @mouseleave="hideTaskCard"
          >
            <div class="task-content">
              <span class="task-name completed">{{ task.text }}</span>
              <span class="pomodoro-count">🍅 x {{ task.pomodoros || 0 }}</span>
            </div>
            
            <!-- 已完成任务的悬浮卡片 -->
            <div v-if="hoveredTask?.id === task.id" class="task-hover-card">
              <h4 class="task-title">{{ task.text }}</h4>
              <div class="task-info">
                <div class="info-item">
                  <span class="info-label">优先级：</span>
                  <el-tag :type="getPriorityType(task.priority)" size="small">
                    {{ task.priority }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="info-label">创建时间：</span>
                  <span>{{ formatDate(task.createdAt) }}</span>
                </div>
                <div class="info-item" v-if="task.dueDate">
                  <span class="info-label">截止时间：</span>
                  <span>{{ formatDate(task.dueDate) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">番茄数：</span>
                  <span>{{ task.pomodoros || 0 }} 个</span>
                </div>
                <div class="info-item">
                  <span class="info-label">完成时间：</span>
                  <span>{{ formatDate(task.completedAt) }}</span>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- 添加撒花容器 -->
    <div v-if="showConfetti" class="confetti-container">
      <canvas ref="confettiCanvas" class="confetti-canvas"></canvas>
    </div>

    <!-- 添加完成确认对话框 -->
    <el-dialog
      v-model="showConfirmationModal"
      title="番茄钟完成！"
      width="360px"
      :show-close="false"
      :close-on-click-modal="false"
      class="pomodoro-dialog"
    >
      <div class="completion-content">
        <div class="completion-emoji">🎉</div>
        <div class="completion-message">
          太棒了！你完成了一个番茄钟
          <div class="task-name">{{ selectedTask?.text }}</div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleContinuePomodoro">继续专注</el-button>
          <el-button type="primary" @click="handleTaskComplete">完成任务</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加继续确认对话框 -->
    <el-dialog
      v-model="showContinueModal"
      title="继续专注"
      width="360px"
      :show-close="false"
      :close-on-click-modal="false"
      class="pomodoro-dialog"
    >
      <div class="continue-content">
        <div class="continue-emoji">💪</div>
        <div class="continue-message">要开始下一个番茄钟吗？</div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelPomodoro">休息一下</el-button>
          <el-button type="primary" @click="handleContinueNextPomodoro">继续专注</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { ArrowDown } from '@element-plus/icons-vue'

const route = useRoute();
const todos = ref([]);
const timer = ref(null);
const time = ref(0);
const percentage = ref(0);
const timerRunning = ref(false);
const currentEmoji = ref('🍅');
const selectedTask = ref(null);
const pomodoroDuration = ref(25); // Default Pomodoro time in minutes
const showConfetti = ref(false);
const confettiCanvas = ref(null);
const searchText = ref('');
const showConfirmationModal = ref(false);
const showContinueModal = ref(false);
const router = useRouter();
const startTime = ref(null); // 添加开始时间引用
const lastTickTime = ref(null); // 添加上次计时引用
const animationFrameId = ref(null); // 添加动画帧ID引用
const showCompletedTasks = ref(false)
const sortBy = ref('completedTime-desc')
const filterPriority = ref('')

const emojis = ['🍅', '📚', '☕', '🧘', '💻'];

const formattedTime = computed(() => {
  const minutes = String(Math.floor(time.value / 60)).padStart(2, '0');
  const seconds = String(time.value % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
});

const loadTodosFromStorage = () => {
  const stored = localStorage.getItem('todos');
  if (stored) {
    todos.value = JSON.parse(stored);
  }
};

const saveTodosToStorage = () => {
  localStorage.setItem('todos', JSON.stringify(todos.value));
};

const incompleteTodos = computed(() => {
  return todos.value.filter(task => !task.completed);
});

const completedTodos = computed(() => {
  return todos.value.filter(task => task.completed);
});

const filteredIncompleteTodos = computed(() => {
  return incompleteTodos.value.filter(task =>
    task.text.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

const completedSearchText = ref('')

const filteredCompletedTodos = computed(() => {
  let result = completedTodos.value

  // 搜索过滤
  if (completedSearchText.value) {
    result = result.filter(task =>
      task.text.toLowerCase().includes(completedSearchText.value.toLowerCase())
    )
  }

  // 优先级过滤
  if (filterPriority.value) {
    result = result.filter(task => task.priority === filterPriority.value)
  }

  // 排序
  result = [...result].sort((a, b) => {
    switch (sortBy.value) {
      case 'completedTime-asc':
        return new Date(a.completedAt) - new Date(b.completedAt)
      case 'completedTime-desc':
        return new Date(b.completedAt) - new Date(a.completedAt)
      case 'pomodoros-asc':
        return (a.pomodoros || 0) - (b.pomodoros || 0)
      case 'pomodoros-desc':
        return (b.pomodoros || 0) - (a.pomodoros || 0)
      default:
        return 0
    }
  })

  return result
});

const selectTask = (task) => {
  // 先停止当前计时器
  if (timer.value) {
    cancelAnimationFrame(timer.value);
    timer.value = null;
  }
  
  // 重置计时器状态
  timerRunning.value = false;
  time.value = 0;
  percentage.value = 0;
  currentEmoji.value = '🍅';
  
  // 设置新的选中任务
  selectedTask.value = task;
};

const toggleTimer = () => {
  if (!selectedTask.value) {
    message.warning('请先选择一个任务');
    return;
  }

  if (timerRunning.value) {
    // 暂停计时器
    cancelAnimationFrame(timer.value);
    timer.value = null;
    timerRunning.value = false;
    currentEmoji.value = '⏸️';
  } else {
    // 开始或继续计时器
    startTimer();
  }
};

const startTimer = () => {
  if (timer.value) {
    cancelAnimationFrame(timer.value);
    timer.value = null;
  }
  
  timerRunning.value = true;
  currentEmoji.value = '🍅';
  const pomodoroTimeInSeconds = pomodoroDuration.value * 60;
  
  // 记录开始时间
  startTime.value = performance.now();
  lastTickTime.value = startTime.value;
  
  const tick = (currentTime) => {
    if (!timerRunning.value) return;
    
    // 计算实际经过的时间
    const elapsedSeconds = Math.floor((currentTime - startTime.value) / 1000);
    time.value = elapsedSeconds;
    percentage.value = (elapsedSeconds / pomodoroTimeInSeconds) * 100;
    
    // 每5分钟更换一次表情
    if (Math.floor(elapsedSeconds / 300) > Math.floor((elapsedSeconds - 1) / 300)) {
      currentEmoji.value = emojis[Math.floor(Math.random() * emojis.length)];
    }
    
    if (elapsedSeconds >= pomodoroTimeInSeconds) {
      onPomodoroComplete();
      return;
    }
    
    lastTickTime.value = currentTime;
    timer.value = requestAnimationFrame(tick);
  };
  
  timer.value = requestAnimationFrame(tick);
};

const resetTimer = () => {
  if (timerRunning.value) {
    const shouldReset = confirm('计时器正在运行，确定要重置吗？');
    if (!shouldReset) return;
  }
  
  cancelAnimationFrame(timer.value);
  timer.value = null;
  timerRunning.value = false;
  time.value = 0;
  percentage.value = 0;
  currentEmoji.value = '🍅';
  startTime.value = null;
  lastTickTime.value = null;
};

const handleTaskComplete = () => {
  showConfirmationModal.value = false;
  completeTask();
};

const handleContinuePomodoro = () => {
  showConfirmationModal.value = false;
  showContinueModal.value = true;
};

const handleContinueNextPomodoro = () => {
  showContinueModal.value = false;
  recordPomodoro();
  resetTimer();
  startTimer();
};

const handleCancelPomodoro = () => {
  showContinueModal.value = false;
};

const completeTask = () => {
  if (selectedTask.value) {
    const task = todos.value.find(t => t.id === selectedTask.value.id);
    if (task) {
      task.completed = true;
      recordPomodoro();
      saveTodosToStorage();
      // 完成任务时全屏撒花
      showFullScreenConfetti();
      // 5秒后重置状态
      setTimeout(() => {
        selectedTask.value = null;
        resetTimer();
      }, 5000);
    }
  }
};

const recordPomodoro = () => {
  if (selectedTask.value) {
    const task = todos.value.find(t => t.id === selectedTask.value.id);
    if (task) {
      task.pomodoros = (task.pomodoros || 0) + 1;
      saveTodosToStorage();
      // 显示番茄钟累计提示
      message.success(`已累计完成 ${task.pomodoros} 个番茄钟`);
    }
  }
};

// 全屏撒花效果
const showFullScreenConfetti = async () => {
  showConfetti.value = true;
  await nextTick();
  const confetti = require('canvas-confetti').default;
  
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      showConfetti.value = false;
      return;
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // 从随机位置发射
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
    });
  }, 250);
};

const goToTodoPage = () => {
  router.push('/todos');
  // Focus on the input after navigation
  nextTick(() => {
    const input = document.querySelector('.add_task_input input');
    if (input) {
      input.focus();
    }
  });
};

const selectTaskFromRoute = () => {
  const taskId = route.query.taskId;
  if (taskId) {
    const task = todos.value.find(t => t.id === Number(taskId));
    if (task) {
      selectedTask.value = task;
      // 将选中的任务移到列表顶部
      const index = todos.value.findIndex(t => t.id === task.id);
      if (index > 0) {
        todos.value.splice(index, 1);
        todos.value.unshift(task);
        localStorage.setItem('todos', JSON.stringify(todos.value));
      }
      // 显示提醒消息
      message.success(`已选择任务"${task.text}"，准备开始番茄钟`);
    }
  }
};

// 监听路由变化
watch(
  () => route.query.taskId,
  (newTaskId) => {
    if (newTaskId) {
      selectTaskFromRoute();
    }
  }
);

// 添加悬浮卡片相关状态
const hoveredTask = ref(null)

// 添加鼠标位置状态
const mousePosition = ref({ x: 0, y: 0 })

const showTaskCard = (task) => {
  hoveredTask.value = task
  // 获取鼠标位置并设置悬浮卡片位置
  nextTick(() => {
    const card = document.querySelector('.task-hover-card')
    if (card) {
      const cardRect = card.getBoundingClientRect()
      const x = mousePosition.value.x - cardRect.width / 2
      const y = mousePosition.value.y - cardRect.height - 20 // 在鼠标上方20px处
      
      // 确保卡片不超出视口边界
      const maxX = window.innerWidth - cardRect.width - 20
      const minX = 20
      const maxY = 20
      const minY = 20
      
      card.style.left = `${Math.min(Math.max(x, minX), maxX)}px`
      card.style.top = `${Math.min(Math.max(y, minY), maxY)}px`
    }
  })
}

// 添加鼠标移动事件监听
const handleMouseMove = (event) => {
  mousePosition.value = {
    x: event.clientX,
    y: event.clientY
  }
}

const hideTaskCard = () => {
  hoveredTask.value = null
}

// 添加优先级样式方法
const getPriorityType = (priority) => {
  const types = {
    '高': 'danger',
    '中': 'warning',
    '低': 'success'
  }
  return types[priority] || 'info'
}

// 添加日期格式化方法
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

// 添加截止日期检查方法
const isOverdue = (date) => {
  if (!date) return false
  return new Date(date) < new Date()
}

// 修改番茄钟结束时的处理
const onPomodoroComplete = () => {
  cancelAnimationFrame(timer.value);
  timer.value = null;
  timerRunning.value = false;
  currentEmoji.value = '🎉';
  showConfirmationModal.value = true;
};

// 修改页面可见性变化处理函数
const handleVisibilityChange = () => {
  if (document.hidden) {
    // 页面隐藏时记录当前时间
    if (timerRunning.value) {
      cancelAnimationFrame(timer.value);
      lastTickTime.value = performance.now();
    }
  } else {
    // 页面可见时，如果计时器在运行，则从上次时间继续计时
    if (timerRunning.value) {
      const currentTime = performance.now();
      const elapsedTime = Math.floor((currentTime - lastTickTime.value) / 1000);
      
      // 更新开始时间，保持原有进度
      startTime.value = startTime.value + (elapsedTime * 1000);
      
      // 继续计时
      const tick = (currentTime) => {
        if (!timerRunning.value) return;
        
        const elapsedSeconds = Math.floor((currentTime - startTime.value) / 1000);
        const pomodoroTimeInSeconds = pomodoroDuration.value * 60;
        
        time.value = elapsedSeconds;
        percentage.value = (elapsedSeconds / pomodoroTimeInSeconds) * 100;
        
        if (Math.floor(elapsedSeconds / 300) > Math.floor((elapsedSeconds - 1) / 300)) {
          currentEmoji.value = emojis[Math.floor(Math.random() * emojis.length)];
        }
        
        if (elapsedSeconds >= pomodoroTimeInSeconds) {
          onPomodoroComplete();
          return;
        }
        
        lastTickTime.value = currentTime;
        timer.value = requestAnimationFrame(tick);
      };
      
      timer.value = requestAnimationFrame(tick);
    }
  }
};

// 切换已完成任务显示状态
const toggleCompletedTasks = () => {
  showCompletedTasks.value = !showCompletedTasks.value
}

onMounted(() => {
  loadTodosFromStorage();
  selectTaskFromRoute();
  window.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  if (timer.value) {
    cancelAnimationFrame(timer.value);
    timer.value = null;
  }
  window.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<style scoped>
.pomodoro-container {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  display: grid;
  grid-template-columns: 320px 1fr 1fr;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
  background: #f5f7fa;
}

/* 左侧番茄钟区域 */
.timer-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.clock-display {
  font-size: 3rem;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: clockPulse 1s ease-in-out infinite;
}

.time {
  font-weight: bold;
}

.emoji {
  font-size: 2.5rem;
}

.controls {
  display: flex;
  gap: 0.8rem;
}

.start-btn,
.reset-btn {
  font-size: 1.8rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
  opacity: 1;
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.start-btn:not(:disabled):hover,
.reset-btn:hover {
  transform: scale(1.1);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #81c784);
  background-size: 200% 100%;
  animation: progressGradient 2s linear infinite;
  border-radius: 5px;
  transition: width 0.3s ease-in-out;
}

.settings {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.settings label {
  font-size: 0.9rem;
}

.settings input {
  width: 45px;
  padding: 0.2rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* 中间任务列表区域 */
.task-section,
.completed-section {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.task-list-container,
.completed-list-container {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #d9d9d9 #f5f5f5;
}

/* 列表头部样式 */
.section-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.section-header:hover {
  background: #f5f7fa;
}

.section-header h2 {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

/* 任务项样式 */
.task-item {
  position: relative;
  z-index: auto;
  padding: 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: default;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.task-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  margin: 0;
  background: white;
  text-align: left;
}

.task-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.pomodoro-count {
  margin-left: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  flex-shrink: 0;
}

/* 选中状态样式 */
.selected-task {
  background: #e6f4ff;
  border-left: 3px solid #1890ff;
  animation: taskSelected 0.3s ease;
}

.selected-task .task-content {
  padding-left: 17px; /* 20px - 3px(border-left) */
}

/* 悬浮效果 */
.task-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 搜索框样式 */
.search-box {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.search-input {
  width: 100%;
  height: 32px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.3s;
}

.search-input:hover {
  border-color: #40a9ff;
}

.search-input:focus {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
}

/* 滚动条样式 */
.task-list-container::-webkit-scrollbar,
.completed-list-container::-webkit-scrollbar {
  width: 4px;
}

.task-list-container::-webkit-scrollbar-thumb,
.completed-list-container::-webkit-scrollbar-thumb {
  background-color: #d9d9d9;
  border-radius: 3px;
}

.task-list-container::-webkit-scrollbar-track,
.completed-list-container::-webkit-scrollbar-track {
  background-color: #f5f5f5;
}

.no-tasks-prompt {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.add-task-link {
  color: #4caf50;
  cursor: pointer;
  font-weight: bold;
}

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

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  height: 100%;
}

/* 悬浮卡片样式 */
.task-hover-card {
  position: fixed;
  z-index: 9999;
  width: 250px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  padding: 12px;
  pointer-events: none;
  animation: fadeIn 0.2s ease;
}

/* 修改箭头样式 */
.task-hover-card::before {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-style: solid;
  border-width: 6px 6px 0 6px;
  border-color: white transparent transparent transparent;
  filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.05));
}

/* 修改动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 确保卡片内容样式正确 */
.task-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  word-break: break-all;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 1.4;
}

.info-label {
  color: var(--el-text-color-secondary);
  width: 70px;
  flex-shrink: 0;
}

/* 优化截止日期样式 */
.text-red-500 {
  color: #f56c6c;
}

/* 对话框样式 */
.pomodoro-dialog :deep(.el-dialog__header) {
  text-align: center;
  margin-right: 0;
  padding: 20px 20px 0;
}

.pomodoro-dialog :deep(.el-dialog__body) {
  padding: 30px 20px;
}

.pomodoro-dialog :deep(.el-dialog__footer) {
  padding: 10px 20px 20px;
  text-align: center;
}

/* 完成内容样式 */
.completion-content,
.continue-content {
  text-align: center;
}

.completion-emoji,
.continue-emoji {
  font-size: 36px;
  margin-bottom: 12px;
}

.completion-message,
.continue-message {
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

/* 对话框按钮样式 */
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.dialog-footer .el-button {
  min-width: 100px;
}

/* 已完成任务的文字样式 */
.task-name.completed {
  color: var(--el-text-color-secondary);
  text-decoration: line-through;
}

.pomodoro-dialog :deep(.el-dialog) {
  width: 320px !important;
}

/* 添加工具栏样式 */
.task-toolbar {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.filter-sort-controls {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

/* 添加列表动画效果 */
.completed-list-container {
  transition: max-height 0.3s ease;
}

/* 添加选中任务的动画效果 */
@keyframes taskSelected {
  0% {
    background: white;
  }
  50% {
    background: #e6f4ff;
  }
  100% {
    background: #f0f7ff;
  }
}

/* 添加番茄钟动画效果 */
@keyframes clockPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

/* 优化进度条动画 */
@keyframes progressGradient {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 200% 0%;
  }
}
</style>
  