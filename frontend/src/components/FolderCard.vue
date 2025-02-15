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