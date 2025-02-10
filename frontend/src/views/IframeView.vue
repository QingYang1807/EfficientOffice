<template>
  <div class="iframe-container">
    <!-- 使用代理服务方式 -->
    <iframe
      v-if="useProxy"
      :src="proxyUrl"
      :title="pageTitle"
      frameborder="0"
      class="iframe-content"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      referrerpolicy="no-referrer"
    ></iframe>
    
    <!-- 直接访问方式 -->
    <iframe
      v-else
      :src="iframeUrl"
      :title="pageTitle"
      frameborder="0"
      class="iframe-content"
    ></iframe>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const useProxy = ref(true) // 是否使用代理

const iframeUrl = computed(() => route.query.url || '')
const pageTitle = computed(() => route.query.title || '')

// 构建代理URL
const proxyUrl = computed(() => {
  if (!iframeUrl.value) return ''
  return `/api/proxy?url=${encodeURIComponent(iframeUrl.value)}`
})
</script>

<style scoped>
.iframe-container {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 100px); /* 减去头部高度 */
}

.iframe-content {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 100px);
  border: none;
}
</style> 