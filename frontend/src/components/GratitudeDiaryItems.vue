<template>
  <div class="diary-list">
    <div class="diary-list-header">
      <el-input
        v-model="searchText"
        placeholder="搜索感恩内容..."
        prefix-icon="Search"
        clearable
        class="search-input"
      />
      <el-select v-model="sortBy" placeholder="排序方式" class="sort-select">
        <el-option label="最新日期" value="newest" />
        <el-option label="最早日期" value="oldest" />
      </el-select>
    </div>

    <div class="diary-list-content">
      <el-empty
        v-if="filteredDiaries.length === 0"
        description="还没有记录感恩的事呢"
      >
        <el-button type="primary" @click="scrollToInput">现在开始记录</el-button>
      </el-empty>
      
      <el-timeline v-else>
        <el-timeline-item
          v-for="(entry, index) in filteredDiaries"
          :key="entry.date"
          :timestamp="entry.date"
          :type="entry.items.length >= 3 ? 'success' : 'primary'"
        >
          <div class="diary-entry" :class="{ 'diary-entry-highlight': isToday(entry.date) }">
            <div class="diary-content">
              <div class="diary-date">
                {{ formatDate(entry.date) }}
                <el-tag size="small" v-if="isToday(entry.date)" type="success">Today</el-tag>
              </div>
              <ul class="diary-items">
                <li 
                  v-for="(item, itemIndex) in entry.items" 
                  :key="itemIndex"
                  class="diary-item"
                >
                  <el-icon><Star /></el-icon>
                  {{ item }}
                </li>
              </ul>
            </div>
            <div class="diary-actions">
              <el-button type="primary" link @click="$emit('edit', index)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button type="danger" link @click="$emit('delete', index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Star, Edit, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  diaries: {
    type: Array,
    required: true
  }
})

defineEmits(['edit', 'delete'])

const searchText = ref('')
const sortBy = ref('newest')

const filteredDiaries = computed(() => {
  let result = [...props.diaries]
  
  // 搜索过滤
  if (searchText.value) {
    result = result.filter(diary => 
      diary.items.some(item => 
        item.toLowerCase().includes(searchText.value.toLowerCase())
      )
    )
  }
  
  // 排序
  result.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return sortBy.value === 'newest' ? dateB - dateA : dateA - dateB
  })
  
  return result
})

const isToday = (dateStr) => {
  const today = new Date().toLocaleDateString('zh-CN')
  return dateStr === today
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

const scrollToInput = () => {
  document.querySelector('.diary-input')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.diary-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.diary-list-header {
  padding: 16px;
  display: flex;
  gap: 16px;
  background: white;
  border-bottom: 1px solid var(--el-border-color-light);
}

.search-input {
  max-width: 300px;
}

.sort-select {
  width: 120px;
}

.diary-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.diary-entry {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  transition: all 0.3s;
}

.diary-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(0,0,0,0.1);
}

.diary-entry-highlight {
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-5);
}

.diary-content {
  flex: 1;
}

.diary-date {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.diary-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.diary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.diary-item .el-icon {
  color: var(--el-color-warning);
}

.diary-actions {
  display: flex;
  gap: 8px;
}

:deep(.el-timeline-item__node) {
  background-color: transparent;
  border: 2px solid var(--el-color-primary);
}

:deep(.el-timeline-item__tail) {
  border-left: 2px solid var(--el-border-color-light);
}
</style> 