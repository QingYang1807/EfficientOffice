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