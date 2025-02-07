<template>
  <div class="gratitude-diary">
    <div class="diary-header">
      <h2>
        <el-icon><StarFilled /></el-icon>
        今日感恩
      </h2>
      <div class="diary-stats">
        <el-tooltip content="已记录天数">
          <el-tag type="info">
            <el-icon><Calendar /></el-icon>
            {{ totalDays }}天
          </el-tag>
        </el-tooltip>
        <el-tooltip content="感恩事项总数">
          <el-tag type="success">
            <el-icon><Star /></el-icon>
            {{ totalItems }}条
          </el-tag>
        </el-tooltip>
      </div>
    </div>

    <div class="diary-content">
      <div class="diary-input-section">
        <el-card class="input-card" :body-style="{ padding: '20px' }">
          <template #header>
            <div class="card-header">
              <span>{{ isEditing ? '修改感恩日记' : '记录新的感恩' }}</span>
              <el-button v-if="isEditing" link @click="cancelEdit">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </template>
          
          <el-form>
            <div v-for="n in 3" :key="n" class="diary-input-item">
              <el-input
                v-model="diaryEntry[`item${n}`]"
                type="textarea"
                :placeholder="`第${n}件感恩的事...`"
                :rows="2"
                maxlength="200"
                show-word-limit
              >
                <template #prefix>
                  <el-icon><Star /></el-icon>
                </template>
              </el-input>
            </div>
            
            <el-form-item>
              <el-button 
                type="primary" 
                @click="saveDiary"
                :icon="isEditing ? 'Check' : 'Plus'"
              >
                {{ isEditing ? '保存修改' : '记录感恩' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <div class="diary-list-section">
        <gratitude-diary-items
          :diaries="diaryHistory"
          @edit="editDiary"
          @delete="confirmDelete"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { StarFilled, Star, Calendar, Close } from '@element-plus/icons-vue'
import GratitudeDiaryItems from '../components/GratitudeDiaryItems.vue'

const STORAGE_KEY = 'gratitude-diaries'

const diaryEntry = ref({
  item1: '',
  item2: '',
  item3: '',
})
const diaryHistory = ref([])
const isEditing = ref(false)
const editingIndex = ref(-1)

// 统计数据
const totalDays = computed(() => diaryHistory.value.length)
const totalItems = computed(() => 
  diaryHistory.value.reduce((sum, diary) => sum + diary.items.length, 0)
)

// 从 localStorage 加载数据
onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    diaryHistory.value = JSON.parse(stored)
  }
})

// 保存到 localStorage
const saveToStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diaryHistory.value))
}

const saveDiary = () => {
  const items = [
    diaryEntry.value.item1,
    diaryEntry.value.item2,
    diaryEntry.value.item3
  ].filter(item => item.trim() !== '')

  if (items.length === 0) {
    ElMessage.warning('请至少填写一件感恩的事')
    return
  }

  if (isEditing.value) {
    diaryHistory.value[editingIndex.value] = {
      ...diaryHistory.value[editingIndex.value],
      items
    }
    isEditing.value = false
    editingIndex.value = -1
    ElMessage.success('修改成功')
  } else {
    const today = new Date().toLocaleDateString('zh-CN')
    if (diaryHistory.value.some(d => d.date === today)) {
      ElMessage.warning('今天已经记录过啦，请明天再来~')
      return
    }
    
    const newEntry = {
      date: today,
      items
    }
    diaryHistory.value.unshift(newEntry)
    ElMessage.success('记录成功')
  }

  saveToStorage()
  resetForm()
}

const editDiary = (index) => {
  const entry = diaryHistory.value[index]
  diaryEntry.value = {
    item1: entry.items[0] || '',
    item2: entry.items[1] || '',
    item3: entry.items[2] || ''
  }
  isEditing.value = true
  editingIndex.value = index
}

const cancelEdit = () => {
  isEditing.value = false
  editingIndex.value = -1
  resetForm()
}

const confirmDelete = (index) => {
  ElMessageBox.confirm(
    '确定要删除这条感恩日记吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    diaryHistory.value.splice(index, 1)
    saveToStorage()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const resetForm = () => {
  diaryEntry.value = {
    item1: '',
    item2: '',
    item3: ''
  }
}
</script>

<style scoped>
.gratitude-diary {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
}

.diary-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.diary-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-color-primary);
}

.diary-stats {
  display: flex;
  gap: 12px;
}

.diary-content {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
}

.diary-input-section {
  width: 400px;
  min-width: 400px;
}

.input-card {
  position: sticky;
  top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diary-input-item {
  margin-bottom: 16px;
}

.diary-list-section {
  flex: 1;
  overflow: hidden;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.el-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>