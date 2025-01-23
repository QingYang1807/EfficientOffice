<template>
  <div class="pomodoro-container">
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
    <div class="tasks-layout">
      <div class="completed-section">
        <div class="section-header">
          <div class="w-1 h-6 bg-blue-500 rounded-full"></div>
          <h2>已完成任务 ✅</h2>
        </div>
        <ul class="completed-list">
          <li v-if="filteredCompletedTodos.length === 0" class="no-tasks">
            暂无
          </li>
          <li v-else v-for="task in filteredCompletedTodos" :key="task.id" class="completed-item">
            <span class="task-name">{{ task.text }}</span>
            <span class="pomodoro-count">🍅 x {{ task.pomodoros || 0 }}</span>
          </li>
        </ul>
      </div>
      <div class="task-section">
        <div class="section-header">
          <div class="w-1 h-6 bg-blue-500 rounded-full"></div>
          <h2>任务 📝</h2>
        </div>
        <div v-if="filteredIncompleteTodos.length > 0" class="search-input">
          <input v-model="searchText" placeholder="搜索任务..." />
        </div>
        <div v-else class="no-tasks-prompt">
          暂无，
          <span class="add-task-link" @click="goToTodoPage">去添加任务</span>
        </div>
        <ul class="task-list">
          <template v-if="filteredIncompleteTodos.length > 0">
            <li
              v-for="task in filteredIncompleteTodos"
              :key="task.id"
              class="task-item"
              :class="{ 'selected-task': selectedTask && selectedTask.id === task.id }"
            >
              <span class="task-name">{{ task.text }}</span>
              <button class="start-task-btn" @click="selectTask(task)">▶️</button>
            </li>
          </template>
        </ul>
      </div>
    </div>
    <div v-if="showConfetti" class="confetti-container">
      <canvas ref="confettiCanvas" class="confetti-canvas"></canvas>
    </div>
    <a-modal
      v-model:visible="showConfirmationModal"
      title="任务完成"
      @ok="handleTaskComplete"
      @cancel="handleContinuePomodoro"
      :closable="false"
    >
      <p>这个任务完成了吗？</p>
    </a-modal>
    <a-modal
      v-model:visible="showContinueModal"
      title="继续番茄钟"
      @ok="handleContinueNextPomodoro"
      @cancel="handleCancelPomodoro"
      :closable="false"
    >
      <p>是否继续下一个番茄钟？</p>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';

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

const filteredCompletedTodos = computed(() => {
    return completedTodos.value.filter(task =>
        task.text.toLowerCase().includes(searchText.value.toLowerCase())
    );
});

const selectTask = (task) => {
  selectedTask.value = task;
  startTimer();
};

const toggleTimer = () => {
  if (!selectedTask.value) {
    message.warning('请先选择一个任务');
    return;
  }

  if (timerRunning.value) {
    // 暂停计时器
    clearInterval(timer.value);
    timerRunning.value = false;
    currentEmoji.value = '⏸️';
  } else {
    // 开始或继续计时器
    startTimer();
  }
};

const startTimer = () => {
  timerRunning.value = true;
  currentEmoji.value = '🍅';
  const pomodoroTimeInSeconds = pomodoroDuration.value * 60;
  
  timer.value = setInterval(() => {
    time.value++;
    percentage.value = (time.value / pomodoroTimeInSeconds) * 100;
    
    if (time.value % 300 === 0) {
      currentEmoji.value = emojis[Math.floor(Math.random() * emojis.length)];
    }
    
    if (time.value >= pomodoroTimeInSeconds) {
      clearInterval(timer.value);
      timerRunning.value = false;
      currentEmoji.value = '🎉';
      showConfirmationModal.value = true;
    }
  }, 1000);
};

const resetTimer = () => {
  if (timerRunning.value) {
    const shouldReset = confirm('计时器正在运行，确定要重置吗？');
    if (!shouldReset) return;
  }
  
  clearInterval(timer.value);
  timerRunning.value = false;
  time.value = 0;
  percentage.value = 0;
  currentEmoji.value = '🍅';
};

const handleTaskComplete = () => {
  completeTask();
  showConfirmationModal.value = false;
};

const handleContinuePomodoro = () => {
  showConfirmationModal.value = false;
  showContinueModal.value = true;
};

const handleContinueNextPomodoro = () => {
  recordPomodoro();
  showContinueModal.value = false;
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
      showConfettiAnimation();
    }
  }
};

const recordPomodoro = () => {
  if (selectedTask.value) {
    const task = todos.value.find(t => t.id === selectedTask.value.id);
    if (task) {
      task.pomodoros = (task.pomodoros || 0) + 1;
      saveTodosToStorage();
    }
  }
};

const showConfettiAnimation = async () => {
  showConfetti.value = true;
  await nextTick();
  startConfetti();
  setTimeout(() => {
    showConfetti.value = false;
  }, 5000);
};

const startConfetti = () => {
  const canvas = confettiCanvas.value;
  if (!canvas) return;

  const confetti = require('canvas-confetti').create(canvas, {
    resize: true,
  });

  confetti({
    particleCount: 200,
    spread: 160,
    origin: { y: 0.6 },
  });
};

const goToTodoPage = () => {
  router.push('/todo');
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

onMounted(() => {
  loadTodosFromStorage();
  selectTaskFromRoute();
});

onUnmounted(() => {
  clearInterval(timer.value);
});
</script>

<style scoped>
.pomodoro-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  gap: 2rem;
  position: relative;
}

.timer-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.clock-display {
  font-size: 4rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time {
  font-weight: bold;
}

.emoji {
  font-size: 3rem;
}

.controls {
  display: flex;
  gap: 1rem;
}

.start-btn,
.reset-btn {
  font-size: 2rem;
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
  height: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: #4caf50;
  border-radius: 5px;
  transition: width 0.3s ease;
}

.settings {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.settings label {
  font-size: 1rem;
}

.settings input {
  width: 50px;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.tasks-layout {
  display: flex;
  width: 100%;
  max-width: 800px;
  gap: 2rem;
}

.task-section,
.completed-section {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.section-header h2 {
  font-size: 1.2rem;
  font-weight: 500;
}

.task-list,
.completed-list {
  list-style: none;
  padding: 0;
}

.task-item,
.completed-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.task-name {
  flex: 1;
}

.start-task-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}

.pomodoro-count {
  font-size: 1rem;
  color: #777;
}

.search-input {
  margin-bottom: 1rem;
}

.search-input input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.no-tasks {
  text-align: center;
  color: #888;
  padding: 1rem;
}

.no-tasks-prompt {
  text-align: center;
  color: #888;
  padding: 1rem;
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
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.confetti-canvas {
  width: 100%;
  height: 100%;
}

.selected-task {
  background-color: #e3f2fd;
  border-left: 3px solid #1976d2;
}

.task-item {
  transition: all 0.3s ease;
}
</style>
  