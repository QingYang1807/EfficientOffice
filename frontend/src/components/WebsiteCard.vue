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