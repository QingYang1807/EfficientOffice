import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNoteStore = defineStore('note', () => {
  // 状态
  const notes = ref(JSON.parse(localStorage.getItem('notes') || '[]'))
  
  // 计算属性
  const pinnedNotes = computed(() => notes.value.filter(note => note.isPinned))
  const unpinnedNotes = computed(() => notes.value.filter(note => !note.isPinned))
  const archivedNotes = computed(() => notes.value.filter(note => note.isArchived))
  
  // 方法
  const saveToLocal = () => {
    localStorage.setItem('notes', JSON.stringify(notes.value))
  }
  
  const addNote = (note) => {
    const newNote = {
      id: Date.now().toString(),
      title: note.title || '',
      content: note.content || '',
      tags: note.tags || [],
      isPinned: note.isPinned || false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    notes.value.unshift(newNote)
    saveToLocal()
    return newNote
  }
  
  const updateNote = (id, updates) => {
    const index = notes.value.findIndex(note => note.id === id)
    if (index > -1) {
      notes.value[index] = {
        ...notes.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      saveToLocal()
    }
  }
  
  const deleteNote = (id) => {
    const index = notes.value.findIndex(note => note.id === id)
    if (index > -1) {
      notes.value.splice(index, 1)
      saveToLocal()
    }
  }
  
  const togglePin = (id) => {
    const note = notes.value.find(note => note.id === id)
    if (note) {
      note.isPinned = !note.isPinned
      saveToLocal()
    }
  }
  
  const toggleArchive = (id) => {
    const note = notes.value.find(note => note.id === id)
    if (note) {
      note.isArchived = !note.isArchived
      note.isPinned = false // 归档时取消置顶
      saveToLocal()
    }
  }
  
  const addTag = (noteId, tag) => {
    const note = notes.value.find(note => note.id === noteId)
    if (note) {
      // 确保 tags 数组存在
      if (!Array.isArray(note.tags)) {
        note.tags = []
      }
      // 移除可能存在的重复标签
      note.tags = [...new Set([...note.tags, tag])]
      saveToLocal()
      return [...note.tags]  // 返回一个新数组
    }
    return []  // 确保总是返回一个数组
  }
  
  const removeTag = (noteId, tag) => {
    const note = notes.value.find(note => note.id === noteId)
    if (note) {
      note.tags = note.tags.filter(t => t !== tag)
      saveToLocal()
    }
  }

  // 恢复便签
  const restoreNote = (note) => {
    notes.value.push(note)
    saveToLocal()
  }

  return {
    notes,
    pinnedNotes,
    unpinnedNotes,
    archivedNotes,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
    addTag,
    removeTag,
    restoreNote
  }
}) 