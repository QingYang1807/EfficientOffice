<template>
  <div class="fancy-input-wrapper">
    <!-- 工具栏 -->
    <div class="fancy-toolbar">
      <!-- 分类标签 -->
      <a-dropdown :trigger="['hover']" placement="bottomLeft" v-if="showCategory">
        <a-tag 
          v-if="category" 
          :color="getCategoryColor(category)"
          size="small"
          class="hover:cursor-pointer toolbar-tag"
        >
          {{ getCategoryShortName(category) }}
        </a-tag>
        <template #overlay>
          <a-menu @click="({ key }) => handleCategorySelect(key)">
            <a-menu-item key="目标任务">
              <a-tag color="purple" size="small">目标</a-tag>
              <span class="ml-2">目标任务</span>
            </a-menu-item>
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

      <!-- 优先级标签 -->
      <a-dropdown :trigger="['hover']" placement="bottomLeft" v-if="showPriority">
        <a-tag 
          v-if="priority" 
          :color="getPriorityColor(priority)"
          size="small"
          class="hover:cursor-pointer toolbar-tag"
        >
          {{ priority }}
        </a-tag>
        <template #overlay>
          <a-menu @click="({ key }) => handlePrioritySelect(key)">
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
      
      <!-- 截止日期标签 -->
      <div v-if="dueDate || dueDateRange" class="due-date-tag">
        <a-tag 
          color="cyan" 
          size="small"
          class="hover:cursor-pointer toolbar-tag"
          @click="$emit('setDueDate')"
        >
          <div class="flex items-center gap-1">
            <span class="date-icon">📅</span>
            <span v-if="dueDateRange">
              {{ formatDate(dueDateRange[0]) }} ~ {{ formatDate(dueDateRange[1]) }}
            </span>
            <span v-else>
              {{ formatDate(dueDate) }}
            </span>
            <span 
              class="clear-date-icon" 
              @click.stop="clearDates"
              title="清除截止日期"
            >
              ×
            </span>
          </div>
        </a-tag>
      </div>

      <!-- 添加按钮 -->
      <a-dropdown v-if="showOptions">
        <div class="toolbar-icon">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <template #overlay>
          <a-menu>
            <a-menu-item-group title="任务分类">
              <a-menu-item key="work" @click="handleCategorySelect('工作目标')">
                <div class="flex items-center gap-2">
                  <a-tag color="blue" size="small">工作</a-tag>
                  <span>工作目标</span>
                </div>
              </a-menu-item>
              <a-menu-item key="study" @click="handleCategorySelect('学习目标')">
                <div class="flex items-center gap-2">
                  <a-tag color="success" size="small">学习</a-tag>
                  <span>学习目标</span>
                </div>
              </a-menu-item>
              <a-menu-item key="life" @click="handleCategorySelect('生活目标')">
                <div class="flex items-center gap-2">
                  <a-tag color="warning" size="small">生活</a-tag>
                  <span>生活目标</span>
                </div>
              </a-menu-item>
              <a-menu-item key="other" @click="handleCategorySelect('其他目标')">
                <div class="flex items-center gap-2">
                  <a-tag color="default" size="small">其他</a-tag>
                  <span>其他目标</span>
                </div>
              </a-menu-item>
            </a-menu-item-group>
            <a-menu-divider />
            <a-menu-item-group title="优先级">
              <a-menu-item key="high" @click="handlePrioritySelect('高')">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-red-500"></div>
                  <span>高优先级</span>
                </div>
              </a-menu-item>
              <a-menu-item key="medium" @click="handlePrioritySelect('中')">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span>中优先级</span>
                </div>
              </a-menu-item>
              <a-menu-item key="low" @click="handlePrioritySelect('低')">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>低优先级</span>
                </div>
              </a-menu-item>
            </a-menu-item-group>
            <a-menu-divider />
            <a-menu-item key="date" @click="$emit('setDueDate')">
              📅 设置截止日期
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>

    <div class="fancy-input-container">
      <!-- 左下角的纸飞机图标 -->
      <div class="paper-plane-icon" @click="$emit('enter')">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 12L3 21L21 12L3 3L5 12Z" stroke="#A78BFA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="white"/>
        </svg>
      </div>
      
      <!-- 胶囊形状的输入框 -->
      <div class="pill-input" :class="{ 'focused': isFocused }">
        <!-- 左侧星星图标 -->
        <div class="stars-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#A78BFA" />
            <path d="M17 4L18.5 7.5L22 8L19.5 10.5L20 14L17 12.5L14 14L14.5 10.5L12 8L15.5 7.5L17 4Z" fill="#C4B5FD" />
          </svg>
        </div>
        
        <!-- 输入框 -->
        <input
          ref="inputRef"
          :value="modelValue"
          :placeholder="placeholder || 'Generating reply...'"
          class="fancy-input"
          @input="updateValue"
          @focus="isFocused = true"
          @blur="isFocused = false"
          @keyup.enter="$emit('enter')"
        />

        <!-- 右侧回车提示图标 -->
        <div v-if="modelValue.trim()" class="enter-icon" title="按回车键添加任务">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H16M16 12L10 6M16 12L10 18" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 5V19" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Generating reply...'
  },
  category: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    default: ''
  },
  dueDate: {
    type: [Date, Number, String, null],
    default: null
  },
  dueDateRange: {
    type: Array,
    default: null
  },
  showCategory: {
    type: Boolean,
    default: true
  },
  showPriority: {
    type: Boolean,
    default: true
  },
  showOptions: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits([
  'update:modelValue', 
  'enter', 
  'update:category', 
  'update:priority',
  'update:dueDate',
  'update:dueDateRange',
  'setDueDate'
]);

const isFocused = ref(false);
const inputRef = ref(null);

const updateValue = (event) => {
  emit('update:modelValue', event.target.value);
};

const handleCategorySelect = (category) => {
  emit('update:category', category);
};

const handlePrioritySelect = (priority) => {
  emit('update:priority', priority);
};

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取分类对应的 Tag 颜色
const getCategoryColor = (category) => {
  const colors = {
    '目标任务': 'purple',
    '工作目标': 'blue',
    '学习目标': 'success',
    '生活目标': 'warning',
    '其他目标': 'default'
  };
  return colors[category] || 'default';
};

// 获取分类简短名称
const getCategoryShortName = (category) => {
  const shortNames = {
    '目标任务': '目标',
    '工作目标': '工作',
    '学习目标': '学习',
    '生活目标': '生活',
    '其他目标': '其他'
  };
  return shortNames[category] || '其他';
};

// 获取优先级对应的颜色
const getPriorityColor = (priority) => {
  const colors = { '高': 'error', '中': 'warning', '低': 'success' };
  return colors[priority] || 'default';
};

// 暴露聚焦方法
defineExpose({
  focus() {
    inputRef.value?.focus();
  }
});

// 监视 dueDate prop 的变化
watch(() => props.dueDate, (newVal) => {
  console.log('FancyInput dueDate prop:', newVal);
});

const clearDates = (e) => {
  e.stopPropagation();
  emit('update:dueDate', null);
  emit('update:dueDateRange', null);
};
</script>

<style scoped>
.fancy-input-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.fancy-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-left: 4px;
}

.toolbar-tag {
  transition: all 0.2s ease;
}

.toolbar-tag:hover {
  transform: translateY(-1px);
}

.toolbar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(196, 181, 253, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-icon:hover {
  background-color: rgba(196, 181, 253, 0.4);
  transform: rotate(90deg);
}

.due-date-tag {
  position: relative;
}

.date-icon {
  font-size: 12px;
  margin-right: 2px;
}

.clear-date-icon {
  margin-left: 4px;
  font-weight: bold;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.clear-date-icon:hover {
  opacity: 1;
  color: #f56c6c;
}

.fancy-input-container {
  position: relative;
  width: 100%;
  padding: 8px 0;
}

.pill-input {
  display: flex;
  align-items: center;
  background: linear-gradient(90deg, rgba(196, 181, 253, 0.3) 0%, rgba(167, 139, 250, 0.4) 100%);
  border-radius: 9999px;
  padding: 8px 16px;
  box-shadow: 0 4px 12px rgba(167, 139, 250, 0.2);
  border: 1px solid rgba(167, 139, 250, 0.3);
  transition: all 0.3s ease;
}

.pill-input.focused {
  box-shadow: 0 6px 16px rgba(167, 139, 250, 0.3);
  border-color: rgba(167, 139, 250, 0.5);
  transform: translateY(-1px);
}

.stars-icon {
  display: flex;
  align-items: center;
  margin-right: 12px;
  opacity: 0.9;
}

.fancy-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #4B5563;
  font-size: 16px;
  padding: 8px 0;
  width: 100%;
}

.fancy-input::placeholder {
  color: #9CA3AF;
}

.paper-plane-icon {
  position: absolute;
  bottom: -10px;
  left: 20px;
  width: 24px;
  height: 24px;
  transform: rotate(-45deg);
  opacity: 0.7;
  transition: all 0.3s ease;
}

.paper-plane-icon:hover {
  transform: rotate(-45deg) translateX(2px) translateY(-2px);
  opacity: 1;
  cursor: pointer;
}

.enter-icon {
  display: flex;
  align-items: center;
  margin-left: 8px;
  opacity: 0.6;
  position: relative;
}

.enter-icon:hover {
  opacity: 1;
}

.enter-icon::after {
  content: attr(title);
  position: absolute;
  top: -30px;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(5px);
  transition: all 0.2s ease;
  pointer-events: none;
}

.enter-icon:hover::after {
  opacity: 1;
  transform: translateY(0);
}

/* 添加背景效果 */
.fancy-input-container::before {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(0deg, rgba(167, 139, 250, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  z-index: -1;
  pointer-events: none;
}

/* 添加星光点缀效果 */
.fancy-input-container::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  right: 0;
  height: 30px;
  background-image: radial-gradient(circle, rgba(167, 139, 250, 0.3) 1px, transparent 1px);
  background-size: 16px 16px;
  z-index: -1;
  opacity: 0.3;
  pointer-events: none;
}
</style> 