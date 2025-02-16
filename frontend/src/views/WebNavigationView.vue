<template>
  <div class="web-navigation-container">
    <WebNav 
      @search="handleSearch"
      :class="{ 'fullscreen-mode': isFullscreen }"
    />
    
    <iframe
      v-if="currentUrl"
      :src="currentUrl"
      class="web-frame"
      ref="webFrame"
    ></iframe>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import WebNav from './WebNav.vue'

// 添加 emit 定义
const emit = defineEmits(['toggle-menu'])

const isFullscreen = ref(false)
const currentUrl = ref('')
const webFrame = ref(null)

const handleSearch = ({ engine, query }) => {
  currentUrl.value = `${engine.url}${encodeURIComponent(query)}`
}

// 处理全屏切换
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  // 发送事件给父组件隐藏/显示菜单
  emit('toggle-menu', isFullscreen.value)
}
</script>

<style scoped>
.web-navigation-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.fullscreen-mode {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.web-frame {
  flex: 1;
  border: none;
  width: 100%;
  height: 100%;
}
</style> 