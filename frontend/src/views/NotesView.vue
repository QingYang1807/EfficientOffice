<template>
  <div class="notes-container">
    <div class="notes-sidebar">
      <div class="sidebar-header">
        <el-input
          v-model="searchQuery"
          placeholder="搜索便签"
          prefix-icon="Search"
          class="search-input"
        />
        <el-button type="primary" @click="createNote" class="create-btn">
          <el-icon><plus /></el-icon>新建便签
        </el-button>
      </div>
      
      <div class="notes-list">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="全部" name="all">
            <note-list 
              :notes="filteredNotes" 
              @select="selectNote"
              @delete="deleteNote"
              @undoDelete="undoDelete"
            />
          </el-tab-pane>
          <el-tab-pane label="未归档" name="unarchived">
            <note-list 
              :notes="unarchivedNotes" 
              @select="selectNote"
              @delete="deleteNote"
            />
          </el-tab-pane>
          <el-tab-pane label="已归档" name="archived">
            <note-list 
              :notes="archivedNotes" 
              @select="selectNote"
              @delete="deleteNote"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    
    <div class="note-editor">
      <template v-if="currentNote">
        <div class="note-title-section">
          <div class="title-content" @mouseenter="showTitleEdit = true" @mouseleave="showTitleEdit = false">
            <template v-if="isEditingTitle">
              <el-input
                v-model="currentNote.title"
                placeholder="标题"
                @blur="finishTitleEdit"
                @keyup.enter="finishTitleEdit"
                ref="titleInputRef"
              />
            </template>
            <template v-else>
              <h2 class="note-title" @click="startTitleEdit">
                {{ currentNote.title || formatDateTime(currentNote.createdAt) }}
                <el-icon v-show="showTitleEdit"><edit /></el-icon>
              </h2>
            </template>
          </div>
          <div class="editor-actions">
            <el-button-group>
              <el-button 
                :type="currentNote.isPinned ? 'primary' : ''"
                @click="togglePin" 
                :title="currentNote.isPinned ? '取消收藏' : '收藏'"
              >
                <el-icon><component :is="currentNote.isPinned ? 'StarFilled' : 'Star'" /></el-icon>
              </el-button>
              <el-button 
                @click="toggleArchive" 
                :type="currentNote.isArchived ? 'warning' : ''"
                :title="currentNote.isArchived ? '取消归档' : '归档'"
              >
                <el-icon><Box /></el-icon>
              </el-button>
              <el-button 
                @click="deleteNote"
                title="删除"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-button-group>
          </div>
        </div>
        
        <div class="note-tags-section">
          <div class="tags-row">
            <div class="tags-container">
              <el-tag
                v-for="tag in currentNote.tags"
                :key="tag"
                closable
                @close="removeTag(tag)"
                class="note-tag"
              >
                {{ tag }}
              </el-tag>
              <el-button link @click="showTagInputAndFocus" v-if="!showTagInput">
                + 新标签
              </el-button>
              <el-input
                v-else
                v-model="newTag"
                ref="tagInputRef"
                @keyup.enter="addTag"
                @blur="showTagInput = false"
                size="small"
                style="width: 100px"
              />
            </div>
            <div class="note-info">
              <span class="update-time">更新时间：{{ formatDateTime(currentNote.updatedAt) }}</span>
              <span class="word-count">当前字数：{{ currentNote.content?.length || 0 }}</span>
            </div>
          </div>
        </div>
        
        <div class="note-content-section">
          <el-input
            v-model="currentNote.content"
            type="textarea"
            placeholder="开始输入..."
          />
        </div>
      </template>
      
      <div v-else class="empty-state">
        <el-empty description="选择或创建一个便签" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { 
  Star, 
  StarFilled, 
  Box,
  Delete, 
  Plus, 
  Search, 
  Edit 
} from '@element-plus/icons-vue'
import NoteList from '../components/NoteList.vue'
import { useNoteStore } from '../stores/noteStore'
import { ElMessageBox } from 'element-plus'

const tagInputRef = ref(null)
const noteStore = useNoteStore()
const searchQuery = ref('')
const activeTab = ref('all')
const currentNote = ref(null)
const showTagInput = ref(false)
const newTag = ref('')
const showTitleEdit = ref(false)
const isEditingTitle = ref(false)
const titleInputRef = ref(null)

// 过滤笔记
const filteredNotes = computed(() => {
  const notes = [...noteStore.pinnedNotes, ...noteStore.unpinnedNotes]
  
  if (!searchQuery.value) return notes
  
  const query = searchQuery.value.toLowerCase()
  return notes.filter(note => 
    note.title.toLowerCase().includes(query) || 
    note.content.toLowerCase().includes(query) ||
    note.tags.some(tag => tag.toLowerCase().includes(query))
  )
})

// 获取归档笔记
const archivedNotes = computed(() => {
  const notes = noteStore.archivedNotes
  if (!searchQuery.value) return notes
  
  const query = searchQuery.value.toLowerCase()
  return notes.filter(note => 
    note.title.toLowerCase().includes(query) || 
    note.content.toLowerCase().includes(query) ||
    note.tags.some(tag => tag.toLowerCase().includes(query))
  )
})

// 获取未归档笔记
const unarchivedNotes = computed(() => {
  const notes = [...noteStore.pinnedNotes, ...noteStore.unpinnedNotes]
    .filter(note => !note.isArchived)
  
  if (!searchQuery.value) return notes
  
  const query = searchQuery.value.toLowerCase()
  return notes.filter(note => 
    note.title.toLowerCase().includes(query) || 
    note.content.toLowerCase().includes(query) ||
    note.tags.some(tag => tag.toLowerCase().includes(query))
  )
})

// 创建新便签
const createNote = () => {
  const newNote = noteStore.addNote({
    title: '',
    content: '',
    tags: []
  })
  currentNote.value = newNote
}

// 选择便签
const selectNote = (note) => {
  currentNote.value = { ...note }
}

// 保存便签
const saveNote = () => {
  if (currentNote.value) {
    noteStore.updateNote(currentNote.value.id, currentNote.value)
  }
}

// 删除便签
const deleteNote = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这个便签吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    noteStore.deleteNote(currentNote.value.id)
    currentNote.value = null
  } catch {
    // 用户取消删除
  }
}

// 切换置顶状态
const togglePin = () => {
  if (currentNote.value) {
    noteStore.togglePin(currentNote.value.id)
    currentNote.value.isPinned = !currentNote.value.isPinned
  }
}

// 切换归档状态
const toggleArchive = () => {
  if (currentNote.value) {
    noteStore.toggleArchive(currentNote.value.id)
    const isArchived = !currentNote.value.isArchived
    currentNote.value = {
      ...currentNote.value,
      isArchived,
      isPinned: isArchived ? false : currentNote.value.isPinned
    }
    // 如果当前在归档标签页，且取消归档，则清空当前笔记
    if (activeTab.value === 'archived' && !isArchived) {
      currentNote.value = null
    }
  }
}

// 添加标签
const addTag = () => {
  if (newTag.value?.trim() && currentNote.value) {
    const tag = newTag.value.trim()
    // 检查标签是否已存在
    if (currentNote.value.tags.includes(tag)) {
      return
    }
    // 从 store 获取更新后的标签数组
    const updatedTags = noteStore.addTag(currentNote.value.id, tag)
    // 确保 updatedTags 是数组
    if (Array.isArray(updatedTags)) {
      // 使用 store 返回的标签数组更新当前笔记
      currentNote.value = {
        ...currentNote.value,
        tags: [...updatedTags]
      }
    }
    newTag.value = ''
    showTagInput.value = false
  }
}

// 移除标签
const removeTag = (tag) => {
  if (currentNote.value) {
    noteStore.removeTag(currentNote.value.id, tag)
    // 更新当前笔记的引用，触发视图更新
    currentNote.value = {
      ...currentNote.value,
      tags: currentNote.value.tags.filter(t => t !== tag)
    }
  }
}

// 自动保存
let autoSaveTimer = null
const autoSave = () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(saveNote, 1000)
}

// 监听便签内容变化
watch(() => currentNote.value?.content, autoSave)
watch(() => currentNote.value?.title, autoSave)

// 显示标签输入框并聚焦
const showTagInputAndFocus = async () => {
  showTagInput.value = true
  await nextTick()
  tagInputRef.value?.input?.focus()
}

// 编辑标题
const startTitleEdit = () => {
  isEditingTitle.value = true
  nextTick(() => {
    titleInputRef.value?.input?.focus()
  })
}

const finishTitleEdit = () => {
  isEditingTitle.value = false
  showTitleEdit.value = false
  saveNote()
}

// 格式化时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}年${month}月${day}日 ${hour}:${minute}:${second}`
}

// 监听标签页切换
watch(activeTab, () => {
  // 切换标签页时清空当前笔记
  currentNote.value = null
})

// 撤销删除
const undoDelete = (note) => {
  noteStore.restoreNote(note)
}
</script>

<style scoped>
.notes-container {
  display: flex;
  height: 100vh;
  gap: 20px;
  padding: 20px;
  background-color: var(--el-bg-color);
  overflow: hidden;  /* 防止整个页面滚动 */
}

.notes-sidebar {
  width: 300px;
  height: calc(100vh - 40px);
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  overflow: hidden;  /* 防止侧边栏本身滚动 */
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;  /* 防止头部被压缩 */
}

.search-input {
  margin-bottom: 12px;
}

.create-btn {
  width: 100%;
}

.notes-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
  /* 自定义滚动条样式 - Webkit 浏览器 */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #e4e4e4;
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background-color: #d4d4d4;
  }
  
  /* Firefox 滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #e4e4e4 transparent;
}

.note-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px);
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  padding: 20px;
  overflow: hidden;  /* 防止编辑器本身滚动 */
}

.note-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;  /* 防止标题区域被压缩 */
}

.title-content {
  flex: 1;
  margin-right: 16px;
}

.note-title {
  margin: 0;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.note-content-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100% - 140px);
  min-height: 0;
  overflow: hidden;  /* 防止内容区域本身滚动 */
}

.note-content-section .el-textarea {
  flex: 1;
}

/* 设置textarea本身的样式 */
.note-content-section :deep(.el-textarea__inner) {
  height: 100% !important;
  resize: none;
  overflow-y: auto;
  /* 自定义滚动条样式 - Webkit 浏览器 */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #e4e4e4;
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background-color: #d4d4d4;
  }
  
  /* Firefox 滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #e4e4e4 transparent;
}

.note-tags-section {
  padding: 8px 0 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.tags-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 32px;
}

.tags-container {
  display: flex;
  flex-wrap: nowrap;  /* 防止标签换行 */
  align-items: center;
  gap: 8px;
  overflow-x: auto;  /* 允许水平滚动 */
  overflow-y: hidden;  /* 隐藏垂直滚动条 */
  flex: 1;          /* 占据剩余空间 */
  margin-right: 16px;  /* 与信息区域保持间距 */
  /* 隐藏滚动条 - Webkit 浏览器 */
  &::-webkit-scrollbar {
    display: none;
  }
  /* 隐藏滚动条 - Firefox */
  scrollbar-width: none;
  /* 启用水平滚动的触摸操作 */
  -webkit-overflow-scrolling: touch;
  /* 防止标签被压缩 */
  min-width: 0;
}

.note-tag {
  margin: 0;
  flex-shrink: 0;  /* 防止标签被压缩 */
  /* 确保标签不会被压缩 */
  white-space: nowrap;
}

.note-info {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  flex-shrink: 0;
  gap: 16px;
  white-space: nowrap;  /* 防止信息换行 */
}

/* 添加标签按钮样式 */
.el-button.is-link {
  flex-shrink: 0;  /* 防止按钮被压缩 */
}

/* 标签输入框样式 */
.el-input {
  flex-shrink: 0;  /* 防止输入框被压缩 */
}

/* 优化标签页样式 */
:deep(.el-tabs__header) {
  margin: 0;
  padding: 16px 16px 0;
  flex-shrink: 0;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.el-tab-pane) {
  height: 100%;
  overflow: hidden;
}

/* 确保新增标签按钮和输入框始终显示 */
.el-button.is-link,
.el-input {
  position: sticky;
  right: 0;
  background: white;
  margin-left: 8px;
  /* 添加渐变遮罩效果 */
  &::before {
    content: '';
    position: absolute;
    left: -20px;
    top: 0;
    bottom: 0;
    width: 20px;
    background: linear-gradient(to right, transparent, white);
  }
}

/* 按钮组样式 */
.editor-actions .el-button-group {
  display: flex;
  gap: 1px;  /* 按钮之间的间隔 */
}

.editor-actions .el-button {
  padding: 8px 16px;  /* 统一按钮大小 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-actions .el-icon {
  font-size: 16px;  /* 统一图标大小 */
}

/* 按钮悬浮效果 */
.editor-actions .el-button:hover {
  background-color: var(--el-color-primary-light-8);
}

/* 归档按钮样式 */
.editor-actions .el-button:nth-child(2) {
  &:hover {
    color: var(--el-color-warning);
  }
  &.el-button--warning {
    background-color: var(--el-color-warning);
    border-color: var(--el-color-warning);
    color: white;
    &:hover {
      background-color: var(--el-color-warning-light-3);
      border-color: var(--el-color-warning-light-3);
      color: white;
    }
  }
}

/* 删除按钮样式 */
.editor-actions .el-button:last-child:hover {
  color: var(--el-color-danger);
}

/* 调整标签页顺序和样式 */
:deep(.el-tabs__nav) {
  display: flex;
}

:deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
  min-width: 80px;
}
</style> 