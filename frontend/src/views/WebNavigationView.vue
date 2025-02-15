<template>
  <div 
    class="web-navigation" 
    :style="{ 
      backgroundImage: currentBackground ? `url(${currentBackground})` : '',
      backgroundColor: !currentBackground ? 'var(--el-bg-color)' : 'transparent'
    }"
  >
    <!-- 顶部区域 -->
    <div class="top-section">
      <div class="datetime">
        <div class="time">{{ currentTime }}</div>
        <div class="date">{{ currentDate }}</div>
      </div>
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索..."
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 网站导航区域 -->
    <div class="navigation-content">
      <draggable 
        v-model="navigationItems"
        :animation="200"
        item-key="id"
        class="el-row"
        :class="{ 'is-dragging': isDragging }"
        @start="isDragging = true"
        @end="handleDragEnd"
      >
        <template #item="{ element }">
          <el-col :span="4" class="mb-4">
            <div 
              class="grid-item"
              @contextmenu.prevent="handleContextMenu($event, element)"
            >
              <component
                :is="element.type === 'folder' ? FolderCard : WebsiteCard"
                v-bind="element"
                @click="handleItemClick(element)"
              />
            </div>
          </el-col>
        </template>
      </draggable>
    </div>

    <!-- 使用 el-dropdown 替代 v-contextmenu -->
    <el-dropdown
      v-if="showContextMenu"
      :visible="showContextMenu"
      @visible-change="handleContextMenuVisibleChange"
      :teleported="true"
      :style="contextMenuStyle"
    >
      <span class="context-menu-trigger"></span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="handleEdit">
            <el-icon><Edit /></el-icon> 编辑
          </el-dropdown-item>
          <el-dropdown-item @click="handleChangeIcon">
            <el-icon><Picture /></el-icon> 更改图标
          </el-dropdown-item>
          <el-dropdown-item @click="handleDelete" style="color: var(--el-color-danger)">
            <el-icon><Delete /></el-icon> 删除
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 添加按钮 -->
    <div class="background-settings">
      <el-dropdown @command="handleBackgroundChange">
        <el-button>
          <el-icon><Picture /></el-icon>
          背景设置
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="upload">
              <el-upload
                class="upload-demo"
                action="/api/upload"
                :show-file-list="false"
                :on-success="handleBackgroundUpload"
              >
                <el-icon><Upload /></el-icon> 上传图片
              </el-upload>
            </el-dropdown-item>
            <el-dropdown-item command="url" @click="showBackgroundUrlDialog = true">
              <el-icon><Link /></el-icon> 图片地址
            </el-dropdown-item>
            <el-dropdown-item command="random">
              <el-icon><Refresh /></el-icon> 随机生成
            </el-dropdown-item>
            <el-dropdown-item command="daily">
              <el-icon><Calendar /></el-icon> 每日一图
            </el-dropdown-item>
            <el-dropdown-item command="clear" divided>
              <el-icon><Delete /></el-icon> 清除背景
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 添加背景URL输入对话框 -->
    <el-dialog
      v-model="showBackgroundUrlDialog"
      title="设置背景图片地址"
      width="500px"
    >
      <el-input v-model="backgroundUrl" placeholder="请输入图片URL" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showBackgroundUrlDialog = false">取消</el-button>
          <el-button type="primary" @click="setBackgroundUrl">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加按钮 -->
    <div class="add-button">
      <el-dropdown @command="handleAdd">
        <el-button type="primary" circle>
          <el-icon><Plus /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="site">添加网站</el-dropdown-item>
            <el-dropdown-item command="folder">添加文件夹</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 编辑对话框 -->
    <EditDialog
      v-model="showEditDialog"
      :current-item="currentEditItem"
      @confirm="handleEditConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, Plus, Picture, Edit, Delete, Upload, Link, Refresh, Calendar } from '@element-plus/icons-vue'
import EditDialog from '../components/EditDialog.vue'
import WebsiteCard from '../components/WebsiteCard.vue'
import FolderCard from '../components/FolderCard.vue'
import { ElMessage } from 'element-plus'
import { VueDraggableNext } from 'vuedraggable'

// 先注释掉 WeatherWidget 相关代码
// import WeatherWidget from '../components/WeatherWidget.vue'

// 时间日期
const currentTime = ref('')
const currentDate = ref('')

const updateDateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  currentDate.value = now.toLocaleDateString('zh-CN', { 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  })
}

// 背景相关
const currentBackground = ref('')
const showBackgroundUrlDialog = ref(false)
const backgroundUrl = ref('')

// 从localStorage加载背景设置
onMounted(() => {
  const savedBackground = localStorage.getItem('web-nav-background')
  if (savedBackground) {
    currentBackground.value = savedBackground
  }
  updateDateTime()
  let timer = setInterval(updateDateTime, 1000)
})

const handleBackgroundChange = async (command) => {
  switch (command) {
    case 'random':
      // 使用 Unsplash API 获取随机图片
      try {
        const response = await fetch('https://source.unsplash.com/random/1920x1080')
        currentBackground.value = response.url
        localStorage.setItem('web-nav-background', response.url)
      } catch (error) {
        ElMessage.error('获取随机图片失败')
      }
      break
    case 'daily':
      // 使用必应每日图片
      currentBackground.value = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1'
      localStorage.setItem('web-nav-background', currentBackground.value)
      break
    case 'clear':
      currentBackground.value = ''
      localStorage.removeItem('web-nav-background')
      break
  }
}

const handleBackgroundUpload = (response) => {
  currentBackground.value = response.url
  localStorage.setItem('web-nav-background', response.url)
}

const setBackgroundUrl = () => {
  if (backgroundUrl.value) {
    currentBackground.value = backgroundUrl.value
    localStorage.setItem('web-nav-background', backgroundUrl.value)
  }
  showBackgroundUrlDialog.value = false
}

// 搜索相关
const searchQuery = ref('')
const handleSearch = () => {
  // 实现搜索逻辑
}

// 导航项数据
const navigationItems = ref([
  {
    id: 1,
    type: 'site',
    title: '示例网站',
    url: 'https://example.com',
    icon: 'https://example.com/favicon.ico'
  },
  {
    id: 2,
    type: 'folder',
    title: '常用工具',
    items: []
  }
])

// 右键菜单相关
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const currentEditItem = ref(null)
const showEditDialog = ref(false)

const contextMenuStyle = computed(() => ({
  position: 'fixed',
  left: contextMenuPosition.value.x + 'px',
  top: contextMenuPosition.value.y + 'px',
  zIndex: 2000
}))

const handleContextMenu = (event, item) => {
  event.preventDefault()
  currentEditItem.value = item
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  showContextMenu.value = true
}

const handleContextMenuVisibleChange = (visible) => {
  if (!visible) {
    showContextMenu.value = false
  }
}

const handleEdit = () => {
  showEditDialog.value = true
}

const handleChangeIcon = () => {
  // 实现更改图标逻辑
}

const handleDelete = () => {
  // 实现删除逻辑
}

const handleItemClick = (item) => {
  if (item.type === 'site') {
    window.open(item.url, '_blank')
  } else if (item.type === 'folder') {
    // 处理文件夹点击
  }
}

const handleAdd = (command) => {
  currentEditItem.value = null
  showEditDialog.value = true
  
  if (command === 'site') {
    currentEditItem.value = {
      type: 'site',
      title: '',
      url: '',
      icon: '',
      iconType: 'url'
    }
  } else if (command === 'folder') {
    currentEditItem.value = {
      type: 'folder',
      title: '',
      items: []
    }
  }
}

const handleEditConfirm = (formData) => {
  const newItem = {
    ...formData,
    id: Date.now()
  }
  
  if (currentEditItem.value && currentEditItem.value.id) {
    // 编辑现有项
    const index = navigationItems.value.findIndex(item => item.id === currentEditItem.value.id)
    if (index !== -1) {
      navigationItems.value[index] = { ...navigationItems.value[index], ...formData }
    }
  } else {
    // 添加新项
    navigationItems.value.push(newItem)
  }
  
  // 保存到localStorage
  localStorage.setItem('web-nav-items', JSON.stringify(navigationItems.value))
}

// 初始化时加载数据
onMounted(() => {
  const savedItems = localStorage.getItem('web-nav-items')
  if (savedItems) {
    navigationItems.value = JSON.parse(savedItems)
  }
})

const isDragging = ref(false)

const handleDragEnd = () => {
  isDragging.value = false
  // 保存新的排序
  localStorage.setItem('web-nav-items', JSON.stringify(navigationItems.value))
}
</script>

<style scoped>
.web-navigation {
  min-height: 100vh;
  padding: 20px;
  background-size: cover;
  background-position: center;
  transition: background-image 0.3s;
}

.top-section {
  text-align: center;
  margin-bottom: 40px;
}

.datetime {
  margin-bottom: 20px;
}

.time {
  font-size: 64px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.date {
  font-size: 24px;
  color: var(--el-text-color-regular);
}

.search-bar {
  max-width: 600px;
  margin: 0 auto;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 24px;
  padding: 8px 16px;
}

.navigation-content {
  margin-top: 40px;
}

.add-button {
  position: fixed;
  right: 40px;
  bottom: 40px;
  z-index: 100;
}

.background-settings {
  position: fixed;
  right: 40px;
  top: 40px;
  z-index: 100;
}

.grid-item {
  height: 100%;
  border-radius: 8px;
  transition: all 0.3s;
}

.grid-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.mb-4 {
  margin-bottom: 16px;
}

/* 添加右键菜单样式 */
:deep(.el-dropdown-menu) {
  padding: 5px 0;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: var(--el-dropdown-menuItem-hover-fill);
  color: var(--el-dropdown-menuItem-hover-color);
}

.context-menu-trigger {
  position: fixed;
  width: 1px;
  height: 1px;
  background: transparent;
  pointer-events: none;
}

.is-dragging {
  cursor: move;
}

.is-dragging .grid-item {
  transform: scale(1.05);
  opacity: 0.8;
}
</style> 