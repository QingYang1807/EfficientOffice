<template>
  <div class="web-view">
    <div class="web-header">
      <div class="url-bar">
        <el-input
          v-model="currentUrl"
          placeholder="输入网址"
          clearable
          @keyup.enter="loadUrl"
        >
          <template #prefix>
            <el-icon><Link /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="controls">
        <el-button-group>
          <el-button @click="refresh">
            <el-icon><Refresh /></el-icon>
          </el-button>
          <el-button @click="openInNewTab">
            <el-icon><Position /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div class="web-content">
      <el-alert
        v-if="showError"
        title="无法在iframe中显示此网站"
        type="warning"
        description="由于安全限制，此网站不允许被嵌入。点击'在新窗口打开'按钮访问。"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />
      
      <iframe
        ref="iframeRef"
        :src="currentUrl"
        class="iframe-content"
        @load="handleLoad"
        @error="handleError"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Link, Refresh, Position } from '@element-plus/icons-vue'

const route = useRoute()
const iframeRef = ref(null)
const currentUrl = ref('')
const showError = ref(false)

onMounted(() => {
  // 从路由参数获取初始URL
  currentUrl.value = route.query.url || ''
  if (currentUrl.value) {
    loadUrl()
  }
})

const loadUrl = () => {
  currentUrl.value = route.query.url || ''
  if (!currentUrl.value) return
  showError.value = false
  // 如果URL不是以http或https开头，自动添加https://
  if (!/^https?:\/\//i.test(currentUrl.value)) {
    currentUrl.value = 'https://' + currentUrl.value
  }
}

const refresh = () => {
  const iframe = iframeRef.value
  if (iframe) {
    // 使用一个临时变量保存当前URL
    const currentSrc = iframe.src
    // 先清空src
    iframe.src = ''
    // 然后重新设置src来触发刷新
    setTimeout(() => {
      iframe.src = currentSrc
    }, 100)
  }
}

const openInNewTab = () => {
  if (currentUrl.value) {
    window.open(currentUrl.value, '_blank')
  }
}

const handleLoad = () => {
  showError.value = false
}

const handleError = () => {
  showError.value = true
}
</script>

<style scoped>
.web-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px); /* 减去头部和padding的高度 */
  padding: 16px;
}

.web-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.url-bar {
  flex: 1;
}

.web-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.iframe-content {
  flex: 1;
  width: 100%;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  background: white;
}

.controls {
  display: flex;
  align-items: center;
}
</style> 