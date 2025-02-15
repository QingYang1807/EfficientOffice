<template>
  <div class="web-nav-container">
    <!-- 顶部时间日期和搜索区域 -->
    <div class="top-section">
      <div class="datetime">
        <div class="time">{{ currentTime }}</div>
        <div class="date">{{ currentDate }}</div>
      </div>
      <div class="search-box">
        <el-input
          v-model="searchText"
          placeholder="搜索网站..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
      </div>
    </div>

    <!-- 网站导航区域 -->
    <div class="nav-content">
      <div class="website-grid">
        <Draggable
          v-model="websites"
          group="websites"
          item-key="id"
          class="website-list"
          @start="drag = true"
          @end="drag = false"
        >
          <template #item="{ element }">
            <div 
              class="website-item"
              @contextmenu.prevent="showContextMenu($event, element)"
              @click="openWebsite(element)"
            >
              <div class="website-icon">
                <img 
                  :src="element.icon || getFaviconUrl(element.url)" 
                  :alt="element.name"
                  @error="handleIconError($event, element)"
                >
              </div>
              <div class="website-name">{{ element.name }}</div>
            </div>
          </template>
        </Draggable>

        <!-- 添加网站按钮作为网格的一部分 -->
        <div class="website-item add-website" @click="showAddDialog = true">
          <div class="website-icon add-icon">
            <el-icon><Plus /></el-icon>
          </div>
          <div class="website-name">添加网站</div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div v-show="contextMenu.show" :style="contextMenuStyle" class="context-menu">
      <div class="menu-item" @click="editWebsite">
        <el-icon><Edit /></el-icon>
        <span>编辑</span>
      </div>
      <div class="menu-item" @click="uploadIcon">
        <el-icon><Upload /></el-icon>
        <span>上传图标</span>
      </div>
      <div class="menu-item" @click="generateIcon">
        <el-icon><Refresh /></el-icon>
        <span>随机生成图标</span>
      </div>
      <div class="menu-item delete" @click="deleteWebsite">
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </div>
    </div>

    <!-- 添加/编辑网站对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingWebsite ? '编辑网站' : '添加网站'"
      width="500px"
    >
      <el-form :model="websiteForm" label-width="80px">
        <el-form-item label="网站地址">
          <el-input 
            v-model="websiteForm.url" 
            placeholder="请输入网站地址"
            @blur="autoFetchWebsiteInfo"
            clearable
          >
            <template #append>
              <el-button @click="autoFetchWebsiteInfo">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="网站名称">
          <el-input 
            v-model="websiteForm.name" 
            placeholder="请输入网站名称"
            :loading="fetchingInfo"
          />
        </el-form-item>
        <el-form-item label="网站图标">
          <div class="icon-preview">
            <img 
              v-if="websiteForm.icon || websiteForm.url" 
              :src="websiteForm.icon || getFaviconUrl(websiteForm.url)"
              @error="handlePreviewIconError"
              class="preview-img"
            >
          </div>
          <el-input 
            v-model="websiteForm.icon" 
            placeholder="请输入图标地址（可选）"
          >
            <template #append>
              <el-button @click="uploadIcon">上传</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="saveWebsite" :loading="fetchingInfo">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import Draggable from 'vuedraggable'
import { Plus, Edit, Upload, Refresh, Delete, Search } from '@element-plus/icons-vue'

// 添加 loading 变量
const loading = ref(null)

// 状态
const websites = ref([])
const searchText = ref('')
const showAddDialog = ref(false)
const editingWebsite = ref(null)
const drag = ref(false)
const currentTime = ref('')
const currentDate = ref('')
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  website: null
})

// 表单数据
const websiteForm = ref({
  name: '',
  url: '',
  icon: ''
})

// 添加新的状态
const fetchingInfo = ref(false)

// 计算属性
const contextMenuStyle = computed(() => ({
  left: `${contextMenu.value.x}px`,
  top: `${contextMenu.value.y}px`
}))

// 方法
const updateDateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  currentDate.value = now.toLocaleDateString('zh-CN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const showContextMenu = (event, website) => {
  event.preventDefault()
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    website
  }
}

const hideContextMenu = () => {
  contextMenu.value.show = false
}

const editWebsite = () => {
  editingWebsite.value = contextMenu.value.website
  websiteForm.value = { ...editingWebsite.value }
  showAddDialog.value = true
  hideContextMenu()
}

const uploadIcon = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        // 将文件转换为 base64
        const reader = new FileReader()
        reader.onload = (e) => {
          if (editingWebsite.value) {
            editingWebsite.value.icon = e.target.result
          } else {
            websiteForm.value.icon = e.target.result
          }
        }
        reader.readAsDataURL(file)
      } catch (error) {
        ElMessage.error('上传图标失败')
      }
    }
  }
  input.click()
  hideContextMenu()
}

const generateIcon = (website) => {
  // 使用网站首字母生成随机颜色的图标
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5']
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  
  // 绘制圆形背景
  ctx.fillStyle = randomColor
  ctx.beginPath()
  ctx.arc(32, 32, 32, 0, Math.PI * 2)
  ctx.fill()
  
  // 绘制文字
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 32px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(website.name.charAt(0).toUpperCase(), 32, 32)
  
  website.icon = canvas.toDataURL()
  saveWebsitesToStorage()
  hideContextMenu()
}

const deleteWebsite = () => {
  const index = websites.value.findIndex(w => w.id === contextMenu.value.website.id)
  if (index !== -1) {
    websites.value.splice(index, 1)
    saveWebsitesToStorage()
    ElMessage.success('删除成功')
  }
  hideContextMenu()
}

const saveWebsite = () => {
  if (!websiteForm.value.name || !websiteForm.value.url) {
    ElMessage.warning('请填写完整信息')
    return
  }

  if (editingWebsite.value) {
    // 更新现有网站
    Object.assign(editingWebsite.value, websiteForm.value)
  } else {
    // 添加新网站
    websites.value.push({
      id: Date.now(),
      ...websiteForm.value
    })
  }

  saveWebsitesToStorage()
  showAddDialog.value = false
  editingWebsite.value = null
  websiteForm.value = { name: '', url: '', icon: '' }
  ElMessage.success(editingWebsite.value ? '更新成功' : '添加成功')
}

const getFaviconUrl = (url) => {
  try {
    const urlObj = new URL(url)
    // 尝试多个可能的图标地址
    const possibleIcons = [
      `${urlObj.origin}/favicon.ico`,
      `${urlObj.origin}/favicon.png`,
      `${urlObj.origin}/apple-touch-icon.png`,
      `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
    ]
    return possibleIcons[0] // 默认使用第一个
  } catch {
    return ''
  }
}

const handleIconError = (event, website) => {
  // 尝试使用 Google Favicon 服务作为备选
  try {
    const urlObj = new URL(website.url)
    event.target.src = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
  } catch {
    // 如果还是失败，生成一个随机颜色的字母图标
    generateIcon(website)
  }
}

const openWebsite = (website) => {
  if (!website.url) return
  window.open(website.url, '_blank')
}

const saveWebsitesToStorage = () => {
  localStorage.setItem('websites', JSON.stringify(websites.value))
}

const loadWebsitesFromStorage = () => {
  const stored = localStorage.getItem('websites')
  if (stored) {
    websites.value = JSON.parse(stored)
  }
}

// 添加自动获取网站信息的方法
const autoFetchWebsiteInfo = async () => {
  const url = websiteForm.value.url
  if (!url) return
  
  try {
    // 标准化 URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    const urlObj = new URL(normalizedUrl)
    
    fetchingInfo.value = true
    loading.value = ElLoading.service({
      target: '.el-dialog',
      text: '获取网站信息...'
    })

    try {
      // 尝试获取网站标题
      const response = await fetch(normalizedUrl)
      const html = await response.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const title = doc.title || urlObj.hostname.replace('www.', '')
      
      // 更新表单
      websiteForm.value.name = title
      websiteForm.value.url = normalizedUrl
      
      // 尝试获取网站图标
      const favicon = await getFaviconWithFallback(urlObj)
      if (favicon) {
        websiteForm.value.icon = favicon
      }
      
      ElMessage.success('获取网站信息成功')
    } catch (error) {
      console.error('获取网站信息失败:', error)
      // 至少设置一个基本的网站名称
      websiteForm.value.name = urlObj.hostname.replace('www.', '')
      ElMessage.warning('无法获取完整网站信息，已设置基本信息')
    }
  } catch (error) {
    ElMessage.error('请输入有效的网址')
  } finally {
    fetchingInfo.value = false
    loading.value.close()
  }
}

// 添加获取网站图标的增强方法
const getFaviconWithFallback = async (urlObj) => {
  const iconUrls = [
    `${urlObj.origin}/favicon.ico`,
    `${urlObj.origin}/favicon.png`,
    `${urlObj.origin}/apple-touch-icon.png`,
    `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
  ]

  for (const url of iconUrls) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return url
      }
    } catch (error) {
      continue
    }
  }
  
  return null
}

// 修改图标预览错误处理
const handlePreviewIconError = (event) => {
  const url = websiteForm.value.url
  if (url) {
    try {
      const urlObj = new URL(url)
      event.target.src = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
    } catch {
      event.target.style.display = 'none'
    }
  } else {
    event.target.style.display = 'none'
  }
}

// 生命周期钩子
onMounted(() => {
  loadWebsitesFromStorage()
  updateDateTime()
  const timer = setInterval(updateDateTime, 1000)
  document.addEventListener('click', hideContextMenu)
  
  onUnmounted(() => {
    clearInterval(timer)
    document.removeEventListener('click', hideContextMenu)
  })
})
</script>

<style scoped>
.web-nav-container {
  height: 100%;
  padding: 2rem;
  background: #f8f9fa;
  overflow: hidden;
}

.top-section {
  text-align: center;
  margin-bottom: 3rem;
}

.datetime {
  margin-bottom: 2rem;
}

.time {
  font-size: 4rem;
  font-weight: 700;
  color: #2c3e50;
}

.date {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-top: 0.5rem;
}

.search-box {
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  :deep(.el-input__wrapper) {
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  :deep(.el-input__inner) {
    font-size: 1.1rem;
  }
}

.nav-content {
  padding: 1rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.website-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.website-list {
  display: contents; /* 让 draggable 容器不影响网格布局 */
}

.website-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.website-item:hover {
  transform: translateY(-2px);
  background: #f8f9fa;
}

.website-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
}

.website-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
  transition: all 0.3s ease;
  background: #f5f7fa;
  padding: 8px;
}

.website-item:hover .website-icon img {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.website-name {
  margin-top: 8px;
  font-size: 0.9rem;
  color: #606266;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
  min-height: 2.6em;
}

.add-website {
  border: 2px dashed #e0e0e0;
  background: transparent;
  transition: all 0.3s ease;
}

.add-website:hover {
  border-color: #409EFF;
  background: #f0f7ff;
  transform: translateY(-2px);
}

.add-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f5f7fa;
  color: #909399;
  transition: all 0.3s ease;
}

.add-website:hover .add-icon {
  background: #409EFF;
  color: white;
}

.add-website:hover .website-name {
  color: #409EFF;
}

.context-menu {
  position: fixed;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0.5rem 0;
  z-index: 1000;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-item .el-icon {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.menu-item.delete {
  color: #f56c6c;
}

.menu-item.delete:hover {
  background-color: #fef0f0;
}

/* 添加图标预览样式 */
.icon-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: #f5f7fa;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
}

/* 调整对话框样式 */
:deep(.el-dialog__body) {
  padding-top: 20px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

/* 添加加载状态样式 */
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.9);
}

:deep(.el-loading-spinner .el-loading-text) {
  margin: 3px 0;
  font-size: 14px;
  color: var(--el-color-primary);
}
</style> 