# Shared UI Components

## Stack and scope

- Framework: Vue 3 single-file components (Composition API and Options API coexist).
- UI libraries: Element Plus is primary; Ant Design Vue is used by richer task inputs.
- Styling: scoped component CSS plus Tailwind utilities; Bootstrap is also globally available.
- Scope: reusable UI primitives and cross-feature patterns only. Page-level feature containers are intentionally excluded.

## FancyInput

- File: `frontend/src/components/FancyInput.vue`
- Description: 带分类、优先级、日期与快捷操作的富任务输入框。
- Key props/events: modelValue, category, priority, dueDate, dueDateRange, showCategory, showPriority, showOptions

```vue
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
    year: 'numeric',
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
```

## EditDialog

- File: `frontend/src/components/EditDialog.vue`
- Description: 用于新增或编辑网站/文件夹条目的 Element Plus 对话框。
- Key props/events: modelValue, currentItem; emits update:modelValue, confirm

```vue
<template>
  <el-dialog
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :title="currentItem ? '编辑' : '添加'"
    width="500px"
  >
    <el-form :model="form" label-width="80px">
      <el-form-item label="标题">
        <el-input v-model="form.title" />
      </el-form-item>

      <template v-if="form.type === 'site'">
        <el-form-item label="URL">
          <el-input v-model="form.url" />
        </el-form-item>

        <el-form-item label="图标">
          <el-radio-group v-model="form.iconType">
            <el-radio label="url">URL</el-radio>
            <el-radio label="upload">上传</el-radio>
            <el-radio label="random">随机</el-radio>
          </el-radio-group>

          <div class="icon-input" v-if="form.iconType === 'url'">
            <el-input v-model="form.icon" />
          </div>

          <div class="icon-upload" v-if="form.iconType === 'upload'">
            <el-upload
              class="avatar-uploader"
              action="/api/upload"
              :show-file-list="false"
              :on-success="handleIconUpload"
            >
              <img v-if="form.icon" :src="form.icon" class="avatar">
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
          </div>
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean,
  currentItem: Object
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const form = ref({
  type: 'site',
  title: '',
  url: '',
  icon: '',
  iconType: 'url'
})

watch(() => props.currentItem, (newVal) => {
  if (newVal) {
    form.value = { ...newVal }
  } else {
    form.value = {
      type: 'site',
      title: '',
      url: '',
      icon: '',
      iconType: 'url'
    }
  }
}, { immediate: true })

const handleIconUpload = (res) => {
  form.value.icon = res.url
}

const handleConfirm = () => {
  emit('confirm', form.value)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.icon-input {
  margin-top: 10px;
}

.avatar-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
  margin-top: 10px;
}

.avatar-uploader:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
}
</style>
```

## FolderCard

- File: `frontend/src/components/FolderCard.vue`
- Description: 可点击并可编辑/删除的文件夹卡片。
- Key props/events: folder; emits click, edit, delete

```vue
<template>
  <div
    class="folder-card"
    @click="handleClick"
    @contextmenu.prevent="$emit('contextmenu', $event)"
  >
    <div class="icon">
      <el-icon :size="48"><Folder /></el-icon>
    </div>
    <div class="title">{{ title }}</div>
  </div>
</template>

<script setup>
import { Folder } from '@element-plus/icons-vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['click', 'contextmenu'])

const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.folder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  transition: transform 0.2s;
}

.folder-card:hover {
  transform: scale(1.05);
}

.icon {
  margin-bottom: 8px;
  color: var(--el-color-primary);
}

.title {
  font-size: 14px;
  text-align: center;
  color: var(--el-text-color-primary);
}
</style>
```

## WebsiteCard

- File: `frontend/src/components/WebsiteCard.vue`
- Description: 展示站点图标与名称的网站快捷卡片。
- Key props/events: website; emits click, edit, delete

```vue
<template>
  <div
    class="website-card"
    @click="handleClick"
    @contextmenu.prevent="$emit('contextmenu', $event)"
  >
    <div class="icon">
      <img :src="icon" :alt="title">
    </div>
    <div class="title">{{ title }}</div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['click', 'contextmenu'])

const handleClick = () => {
  emit('click', props.url)
}
</script>

<style scoped>
.website-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  transition: transform 0.2s;
}

.website-card:hover {
  transform: scale(1.05);
}

.icon {
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
}

.icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.title {
  font-size: 14px;
  text-align: center;
  color: var(--el-text-color-primary);
}
</style>
```

## TodoItem

- File: `frontend/src/components/TodoItem.vue`
- Description: 单条待办的查看、完成与编辑控件。
- Key props/events: todo; emits update, delete

```vue
<template>
  <div class="todo-item" @mouseover="hover=true" @mouseout="hover=false">
    <el-checkbox v-model="todoItem.completed" class="todo-checkbox"></el-checkbox>
    <el-input v-if="hover" v-model="todoItem.text" @blur="updateTodo" class=""></el-input>
    <p v-else>{{ todoItem.text }}</p>
    <el-button @click="deleteTodo" class="todo-button">删除</el-button>
  </div>
</template>

<script>
import { ElCheckbox, ElButton, ElInput } from 'element-plus';

export default {
  props: ['todo-item'],
  components: {
    ElCheckbox,
    ElButton,
    ElInput
  },
  data() {
    return {
      hover: false,
    }
  },
  methods: {
    deleteTodo() {
      this.$emit('delete', this.todoItem.id);
    },
    updateTodo() {
      this.$emit('update', this.todoItem);
    }
  }
}
</script>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.todo-checkbox {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
/*
.todo-input {
  flex-grow: 1;
  margin-left: 1rem;
} */

.todo-input {
    margin-right: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #ced4da;
}

.todo-button {
  position: absolute;
  right: 1rem;
  background-color: #dc3545;
  color: white;
  display: none;
}

.todo-item:hover .todo-button {
  display: block;
}
</style>
```

## NoteList

- File: `frontend/src/components/NoteList.vue`
- Description: 带置顶、选择与删除交互的便签列表。
- Key props/events: notes, selectedNote; emits select, toggle-pin, delete

```vue
<template>
  <div class="note-list">
    <div
      v-for="note in notes"
      :key="note.id"
      class="note-item-wrapper"
      @touchstart="touchStart($event, note)"
      @touchmove="touchMove($event, note)"
      @touchend="touchEnd(note)"
      @mouseenter="hoveredNote = note"
      @mouseleave="hoveredNote = null"
    >
      <div
        class="note-item"
        :class="{
          'is-pinned': note.isPinned,
          'sliding': note === slidingNote,
          'deleting': note === deletedNote
        }"
        :style="{ transform: `translateX(${note === slidingNote ? slideOffset : 0}px)` }"
        @click="$emit('select', note)"
      >
        <div class="note-header">
          <h3 class="note-title">{{ note.title || '无标题便签' }}</h3>
          <div class="note-actions">
            <el-icon v-if="note.isPinned"><star-filled /></el-icon>
            <el-button
              v-if="hoveredNote === note"
              class="delete-btn"
              @click.stop="deleteNote(note)"
            >
              <el-icon><delete /></el-icon>
            </el-button>
          </div>
        </div>
        <p class="note-preview">{{ note.content }}</p>
        <div class="note-footer">
          <span class="note-date">{{ formatDate(note.updatedAt) }}</span>
          <div class="note-tags">
            <el-tag
              v-for="tag in note.tags"
              :key="tag"
              size="small"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
      <div
        class="delete-button"
        :class="{ 'visible': note === slidingNote && slideOffset <= -50 }"
        @click="handleSlideDelete(note)"
      >
        <el-icon><delete /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { StarFilled, Delete } from '@element-plus/icons-vue'
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select', 'delete'])

// 滑动相关状态
const slidingNote = ref(null)
const slideOffset = ref(0)
let touchStartX = 0
let currentOffset = 0

// 触摸开始
const touchStart = (event, note) => {
  touchStartX = event.touches[0].clientX
  currentOffset = note === slidingNote.value ? slideOffset.value : 0
  slidingNote.value = note
}

// 触摸移动
const touchMove = (event) => {
  if (!slidingNote.value) return

  const deltaX = event.touches[0].clientX - touchStartX
  const newOffset = Math.min(0, Math.max(-80, currentOffset + deltaX))
  slideOffset.value = newOffset
}

// 触摸结束
const touchEnd = (note) => {
  if (!slidingNote.value) return

  if (slideOffset.value <= -40) {
    slideOffset.value = -80 // 展开删除按钮
  } else {
    slideOffset.value = 0 // 回弹
    slidingNote.value = null
  }
}

const hoveredNote = ref(null)
const deletedNote = ref(null)
const deleteTimeout = ref(null)
const deletedNotes = ref([]) // 存储最近删除的便签

// 左滑删除
const handleSlideDelete = (note) => {
  deletedNotes.value.push(note)
  emit('delete', note)
  slidingNote.value = null
  slideOffset.value = 0

  // 3秒后清除撤销历史
  deleteTimeout.value = setTimeout(() => {
    deletedNotes.value.shift()
  }, 3000)
}

const deleteNote = (note) => {
  // 保存到删除历史
  deletedNotes.value.push(note)
  // 立即删除
  emit('delete', note)

  // 3秒后清除撤销历史
  deleteTimeout.value = setTimeout(() => {
    deletedNotes.value.shift()
  }, 3000)
}

const undoDelete = () => {
  if (deleteTimeout.value) {
    clearTimeout(deleteTimeout.value)
    deleteTimeout.value = null
  }

  // 从删除历史中恢复最后一个便签
  const lastDeleted = deletedNotes.value.pop()
  if (lastDeleted) {
    emit('undoDelete', lastDeleted)
  }
}

// 监听键盘事件
const handleKeydown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
    event.preventDefault()
    undoDelete()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.note-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.note-item-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
}

.note-item {
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  transform: translateX(0);
  background-color: white;
  position: relative;
  z-index: 1;
}

.note-item:hover {
  background-color: var(--el-fill-color-light);
}

.note-item.is-pinned {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.note-item.sliding {
  transition: transform 0.3s ease;
}

.delete-button {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 80px;
  background-color: var(--el-color-danger);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
}

.delete-button.visible {
  opacity: 1;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.note-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.note-preview {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
}

.note-date {
  color: var(--el-text-color-secondary);
}

.note-tags {
  display: flex;
  gap: 4px;
}

.note-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.delete-btn {
  padding: 4px;
  border: none;
  background: transparent;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.delete-btn:hover {
  opacity: 1;
  color: var(--el-color-danger);
}

.note-item.deleting {
  animation: fadeOut 0.2s ease-in-out forwards;
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-100%);
  }
}
</style>
```

## GoalCreator

- File: `frontend/src/components/goals/GoalCreator.vue`
- Description: 目标创建表单，收集标题、类型、描述、日期和里程碑。
- Key props/events: visible; emits close, create

```vue
<template>
  <div class="goal-creator">
    <el-form
      ref="formRef"
      :model="goalForm"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="目标名称" prop="title">
        <el-input v-model="goalForm.title" placeholder="请输入目标名称" />
      </el-form-item>

      <el-form-item label="目标类别" prop="category">
        <el-select v-model="goalForm.category" placeholder="请选择目标类别">
          <el-option label="工作" value="work" />
          <el-option label="学习" value="study" />
          <el-option label="生活" value="life" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>

      <el-form-item label="优先级" prop="priority">
        <el-radio-group v-model="goalForm.priority">
          <el-radio-button label="high">高</el-radio-button>
          <el-radio-button label="medium">中</el-radio-button>
          <el-radio-button label="low">低</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="时间范围" required>
        <el-col :span="11">
          <el-form-item prop="startDate">
            <el-date-picker
              v-model="goalForm.startDate"
              type="date"
              placeholder="开始日期"
              style="width: 100%"
              :disabled-date="disablePastDates"
            />
          </el-form-item>
        </el-col>
        <el-col :span="2" class="text-center">-</el-col>
        <el-col :span="11">
          <el-form-item prop="deadline">
            <el-date-picker
              v-model="goalForm.deadline"
              type="date"
              placeholder="截止日期"
              style="width: 100%"
              :disabled-date="(date) => disableDates(date, goalForm.startDate)"
            />
          </el-form-item>
        </el-col>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="goalForm.description"
          type="textarea"
          rows="4"
          placeholder="请描述你的目标..."
        />
      </el-form-item>

      <div class="sub-tasks-section">
        <h3>子任务列表</h3>
        <div class="steps-container">
          <el-form-item
            v-for="(step, index) in goalForm.steps"
            :key="index"
            :prop="`steps.${index}.title`"
            :rules="stepRules.title"
          >
            <div class="step-item">
              <el-input
                v-model="step.title"
                placeholder="子任务名称"
                style="width: 200px"
              />
              <el-input
                v-model="step.criteria"
                placeholder="完成标准"
                style="width: 200px"
              />
              <el-date-picker
                v-model="step.deadline"
                type="date"
                placeholder="截止日期"
              />
              <el-input-number
                v-model="step.weight"
                :min="0"
                :max="100"
                placeholder="权重"
              />
              <el-button type="danger" link @click="removeStep(index)">
                删除
              </el-button>
            </div>
          </el-form-item>
          <el-button type="primary" link @click="addStep">
            <el-icon><Plus /></el-icon> 添加子任务
          </el-button>
        </div>
      </div>

      <el-form-item>
        <el-button type="primary" @click="submitForm(formRef)">
          创建目标
        </el-button>
        <el-button @click="resetForm(formRef)">重置</el-button>
        <el-button
          v-if="aiEnabled"
          type="success"
          @click="generateWithAI"
          :loading="aiLoading"
        >
          AI 辅助
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

defineProps({
  aiEnabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['create', 'cancel'])

const formRef = ref(null)

// 表单数据
const goalForm = ref({
  title: '',
  description: '',
  startDate: '',
  deadline: '',
  priority: 'medium',
  steps: [],
  status: 'not_started',
  progress: 0,
  year: new Date().getFullYear(),
  category: '',
  expectedResults: '',
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入目标名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入目标描述', trigger: 'blur' }
  ],
  startDate: [
    { type: 'date', required: true, message: '请选择开始日期', trigger: 'change' }
  ],
  deadline: [
    { type: 'date', required: true, message: '请选择截止日期', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  category: [
    { required: true, message: '请选择目标类别', trigger: 'change' }
  ]
}

// 添加子任务
const addStep = () => {
  goalForm.value.steps.push({
    title: '',
    description: '',
    completed: false,
    status: 'not_started',
    deadline: '',
    criteria: '',
    weight: 0,
  })
}

// 删除子任务
const removeStep = (index) => {
  goalForm.value.steps.splice(index, 1)
}

// 添加 AI 加载状态
const aiLoading = ref(false)

// 日期禁用函数
const disablePastDates = (date) => {
  return date < new Date(new Date().setHours(0, 0, 0, 0))
}

const disableDates = (date, startDate) => {
  if (!startDate) return disablePastDates(date)
  return date < startDate
}

// 生成唯一ID
const generateId = () => {
  return 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 提交表单
const submitForm = async (formEl) => {
  if (!formEl) return

  await formEl.validate((valid) => {
    if (valid) {
      // 添加必要的字段
      const newGoal = {
        ...goalForm.value,
        id: generateId(), // 生成唯一ID
        status: 'not_started',
        progress: 0,
        createdAt: new Date().toISOString(),
        steps: goalForm.value.steps.map((step, index) => ({
          ...step,
          id: `step_${index}_${Date.now()}`,
          completed: false,
          status: 'not_started'
        }))
      }

      emit('create', newGoal)
      ElMessage.success('目标创建成功')
      resetForm(formEl)
    } else {
      ElMessage.error('请完善表单信息')
    }
  })
}

// 重置表单
const resetForm = (formEl) => {
  if (!formEl) return
  formEl.resetFields()
  goalForm.value.steps = []
}

// AI 辅助生成
const generateWithAI = () => {
  // TODO: 实现 AI 辅助生成功能
  ElMessage.info('AI 辅助功能开发中...')
}

// 添加日期验证
const validateDates = (rule, value, callback) => {
  if (goalForm.value.startDate && goalForm.value.deadline) {
    if (goalForm.value.startDate > goalForm.value.deadline) {
      callback(new Error('开始日期不能晚于截止日期'))
    } else {
      callback()
    }
  }
  callback()
}

// 子任务表单验证
const stepRules = {
  title: [{ required: true, message: '请输入子任务名称', trigger: 'blur' }],
  criteria: [{ required: true, message: '请设置完成标准', trigger: 'blur' }],
  deadline: [{ required: true, message: '请设置截止日期', trigger: 'change' }],
  weight: [{
    required: true,
    type: 'number',
    min: 0,
    max: 100,
    message: '权重需在0-100之间',
    trigger: 'change'
  }]
}
</script>

<style scoped>
.goal-creator {
  padding: 20px;
}

.sub-tasks-section {
  margin: 20px 0;
  padding: 20px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
}

.sub-tasks-section h3 {
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-item {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.text-center {
  text-align: center;
  line-height: 32px;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .step-item {
    flex-direction: column;
    align-items: stretch;
  }

  .step-item > * {
    width: 100% !important;
    margin-bottom: 10px;
  }
}
</style>
```
