<template>
  <div class="web-nav-container" @contextmenu.prevent="showPageContextMenu($event)">
    <!-- 顶部区域 -->
    <div class="top-section">
      <div class="datetime">
        <div class="time">{{ currentTime }}</div>
        <div class="date">{{ currentDate }}</div>
      </div>
      <!-- 修改搜索框为搜索引擎 -->
      <div class="search-box">
        <el-input
          v-model="searchText"
          :placeholder="'使用' + currentEngine.name + '搜索...'"
          @keyup.enter="handleSearch"
          clearable
          class="search-input"
        >
          <template #prefix>
            <img :src="currentEngine.icon" class="engine-icon" @click="toggleSearchEngine">
          </template>
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
        <!-- 添加搜索历史下拉框 -->
        <div v-show="showHistory && searchHistory.length" class="search-history">
          <div 
            v-for="(item, index) in searchHistory" 
            :key="index"
            class="history-item"
            @click="selectHistory(item)"
          >
            <el-icon><Clock /></el-icon>
            <span>{{ item }}</span>
            <el-icon class="delete-icon" @click.stop="removeHistory(index)"><Close /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 网站导航区域 -->
    <div class="nav-content">
      <div class="toolbar">
        <div class="filter-box">
          <el-input
            v-model="filterText"
            placeholder="筛选图标..."
            prefix-icon="Search"
            clearable
            class="filter-input"
          />
        </div>
      </div>

      <div class="website-grid">
        <Draggable
          v-model="paginatedWebsites"
          :group="{ name: 'websites', pull: true, put: true }"
          :animation="200"
          ghost-class="ghost-card"
          chosen-class="dragging-card"
          drag-class="dragging-card"
          @start="handleDragStart"
          @end="handleDragEnd"
          @add="handleDragAdd"
          class="website-list"
          item-key="id"
          handle=".website-item:not(.add-website)"
        >
          <template #item="{ element }">
            <div 
              class="website-item"
              :class="{ 
                'is-folder': element.type === 'folder',
                'drag-over': isDragOver(element)
              }"
              @contextmenu.prevent="showContextMenu($event, element)"
              @click="handleItemClick(element)"
              :data-id="element.id"
              :data-type="element.type"
              @dragenter.prevent="handleDragEnter($event, element)"
              @dragover.prevent="handleDragOver($event, element)"
              @dragleave.prevent="handleDragLeave($event, element)"
            >
              <div class="website-icon">
                <img 
                  :src="renderIcon(element)" 
                  :alt="element.name"
                  @error="handleIconError($event, element)"
                >
              </div>
              <div class="website-name">{{ element.name }}</div>
            </div>
          </template>

          <template #footer>
            <div class="website-item add-website" @click="showAddDialog = true">
              <div class="website-icon add-icon">
                <el-icon><Plus /></el-icon>
              </div>
              <div class="website-name">添加网站</div>
            </div>
          </template>
        </Draggable>
      </div>
    </div>

    <!-- 全屏切换按钮 -->
    <div class="fullscreen-toggle" @click="toggleFullscreen">
      <el-icon v-if="isFullscreen"><Aim /></el-icon>
      <el-icon v-else><FullScreen /></el-icon>
    </div>

    <!-- 页面右键菜单 -->
    <div 
      v-show="pageContextMenu.show" 
      :style="pageContextMenuStyle" 
      class="context-menu"
      @mouseleave="hidePageContextMenu"
    >
      <div class="menu-item" @click="handleCreateFolder">
        <el-icon><Folder /></el-icon>
        <span>新建文件夹</span>
      </div>
      <div class="menu-item" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        <span>添加网站</span>
      </div>
      <div class="menu-item" @click="changeBackground">
        <el-icon><Picture /></el-icon>
        <span>更换背景</span>
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

    <!-- 添加文件夹编辑对话框 -->
    <el-dialog
      v-model="showFolderNameDialog"
      title="新建文件夹"
      width="300px"
      :close-on-click-modal="false"
      @closed="handleFolderDialogClosed"
    >
      <el-input
        ref="folderNameInput"
        v-model="newFolderName"
        placeholder="请输入文件夹名称"
        @keyup.enter="saveFolderName"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelFolderName">取消</el-button>
          <el-button type="primary" @click="saveFolderName">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 文件夹内容查看对话框 -->
    <el-dialog
      v-model="showFolderContent"
      :title="currentFolder?.name"
      width="80%"
      class="folder-dialog"
    >
      <div class="folder-content">
        <Draggable
          v-model="currentFolder.children"
          :group="{ name: 'websites', pull: true, put: true }"
          :animation="200"
          ghost-class="ghost-card"
          chosen-class="dragging-card"
          drag-class="dragging-card"
          @start="handleFolderDragStart"
          @end="handleFolderDragEnd"
          @add="handleFolderDragAdd"
          class="folder-grid"
        >
          <template #item="{ element }">
            <div 
              class="website-item"
              :class="{ 'is-folder': element.type === 'folder' }"
              @contextmenu.prevent="showContextMenu($event, element)"
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
      </div>
    </el-dialog>

    <!-- 添加拖拽指示器 -->
    <div 
      v-show="dropIndicator.show"
      class="drop-indicator"
      :class="{ 'is-folder': dropIndicator.type === 'folder' }"
      :style="{
        left: dropIndicator.x + 'px',
        top: dropIndicator.y + 'px',
        width: dropIndicator.width + 'px',
        height: dropIndicator.height + 'px'
      }"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import Draggable from 'vuedraggable'
import { Plus, Edit, Upload, Refresh, Delete, Search, Aim, FullScreen, Folder, Picture, Clock, Close } from '@element-plus/icons-vue'
import { useFullscreen } from '@vueuse/core'

// 添加 loading 变量
const loading = ref(null)

// 添加 emit 定义
const emit = defineEmits(['search'])

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

// 全屏控制
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()

// 搜索引擎配置
const searchEngines = [
  {
    name: '必应',
    icon: 'https://www.bing.com/favicon.ico',
    url: 'https://www.bing.com/search?q='
  },
  {
    name: '谷歌',
    icon: 'https://www.google.com/favicon.ico',
    url: 'https://www.google.com/search?q='
  },
  {
    name: '百度',
    icon: 'https://www.baidu.com/favicon.ico',
    url: 'https://www.baidu.com/s?wd='
  }
]

const currentEngineIndex = ref(0)
const currentEngine = computed(() => searchEngines[currentEngineIndex.value])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(24)
const filterText = ref('')

// 筛选后的网站列表
const filteredWebsites = computed(() => {
  return websites.value.filter(site => 
    site.name.toLowerCase().includes(filterText.value.toLowerCase())
  )
})

// 分页后的网站列表
const paginatedWebsites = computed({
  get: () => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredWebsites.value.slice(start, end)
  },
  set: (value) => {
    // 更新原始数据
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    const newWebsites = [...websites.value]
    newWebsites.splice(start, end - start, ...value)
    websites.value = newWebsites
    saveWebsitesToStorage() // 保存更新
  }
})

// 搜索引擎切换
const toggleSearchEngine = () => {
  currentEngineIndex.value = (currentEngineIndex.value + 1) % searchEngines.length
}

// 搜索历史相关
const searchHistory = ref([])
const showHistory = ref(false)

// 处理搜索
const handleSearch = () => {
  if (!searchText.value) return
  
  // 保存到历史记录
  if (!searchHistory.value.includes(searchText.value)) {
    searchHistory.value.unshift(searchText.value)
    if (searchHistory.value.length > 10) {
      searchHistory.value.pop()
    }
    localStorage.setItem('search-history', JSON.stringify(searchHistory.value))
  }

  // 发送到父组件处理搜索
  emit('search', {
    engine: currentEngine.value,
    query: searchText.value
  })
  
  searchText.value = ''
  showHistory.value = false
}

// 右键菜单相关的状态和方法
const pageContextMenu = ref({
  show: false,
  x: 0,
  y: 0
})

const pageContextMenuStyle = computed(() => ({
  position: 'fixed',
  left: `${pageContextMenu.value.x}px`,
  top: `${pageContextMenu.value.y}px`,
  zIndex: 1000
}))

const showPageContextMenu = (event) => {
  event.preventDefault()
  pageContextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY
  }
}

const hidePageContextMenu = () => {
  pageContextMenu.value.show = false
}

// 文件夹相关的状态
const showFolderNameDialog = ref(false)
const newFolderName = ref('')
const folderNameInput = ref(null)
const currentFolder = ref(null)
const showFolderContent = ref(false)

// 修改拖拽状态管理
const dragState = ref({
  isDragging: false,
  draggedItem: null,
  draggedElement: null,
  dropTarget: null,
  dropType: null // 'before', 'after', 'inside'
})

// 判断是否正在拖拽到此元素上
const isDragOver = (element) => {
  return dragState.value.dropTarget?.id === element.id && 
         dragState.value.dropType === 'inside'
}

// 添加拖拽位置指示器
const dropIndicator = ref({
  show: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  type: 'line' // 'line' 或 'folder'
})

// 处理拖拽开始
const handleDragStart = (evt) => {
  const element = websites.value.find(w => w.id.toString() === evt.item.dataset.id)
  if (!element) return
  
  dragState.value = {
    isDragging: true,
    draggedItem: evt.item,
    draggedElement: element,
    dropTarget: null,
    dropType: null
  }
}

// 处理拖拽进入
const handleDragEnter = (evt, element) => {
  if (!dragState.value.isDragging) return
  if (element.id === dragState.value.draggedElement?.id) return
  
  const rect = evt.currentTarget.getBoundingClientRect()
  const mouseY = evt.clientY - rect.top
  
  // 判断拖拽位置
  if (element.type === 'folder') {
    // 如果目标是文件夹，默认放入文件夹内
    dragState.value.dropTarget = element
    dragState.value.dropType = 'inside'
  } else {
    // 如果目标是普通图标，判断位置
    const threshold = rect.height * 0.3
    if (mouseY < threshold) {
      dragState.value.dropTarget = element
      dragState.value.dropType = 'before'
    } else if (mouseY > rect.height - threshold) {
      dragState.value.dropTarget = element
      dragState.value.dropType = 'after'
    } else {
      dragState.value.dropTarget = element
      dragState.value.dropType = 'inside'
    }
  }
}

// 处理拖拽经过
const handleDragOver = (evt, element) => {
  evt.preventDefault()
}

// 处理拖拽离开
const handleDragLeave = (evt, element) => {
  if (element.id === dragState.value.dropTarget?.id) {
    dragState.value.dropTarget = null
    dragState.value.dropType = null
  }
}

// 处理拖拽结束
const handleDragEnd = (evt) => {
  const { draggedElement, dropTarget, dropType } = dragState.value
  
  if (draggedElement && dropTarget && dropType) {
    if (dropType === 'inside' && dropTarget.type === 'folder') {
      // 放入文件夹
      dropTarget.children = dropTarget.children || []
      dropTarget.children.push(draggedElement)
      // 从原位置移除
      websites.value = websites.value.filter(w => w.id !== draggedElement.id)
    } else if (dropType === 'inside') {
      // 创建新文件夹
      const folder = {
        id: Date.now(),
        type: 'folder',
        name: '',
        icon: generateFolderIcon(),
        children: [dropTarget, draggedElement]
      }
      
      // 删除原始项
      websites.value = websites.value.filter(w => 
        w.id !== draggedElement.id && w.id !== dropTarget.id
      )
      
      // 添加新文件夹
      websites.value.push(folder)
      
      // 显示命名对话框
      showFolderNameDialog.value = true
      nextTick(() => {
        folderNameInput.value?.focus()
      })
    } else {
      // 改变顺序
      const draggedIndex = websites.value.findIndex(w => w.id === draggedElement.id)
      const targetIndex = websites.value.findIndex(w => w.id === dropTarget.id)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [movedItem] = websites.value.splice(draggedIndex, 1)
        const newIndex = dropType === 'before' ? 
          targetIndex : 
          targetIndex + (draggedIndex < targetIndex ? 0 : 1)
        websites.value.splice(newIndex, 0, movedItem)
      }
    }
    
    saveWebsitesToStorage()
  }
  
  // 重置拖拽状态
  dragState.value = {
    isDragging: false,
    draggedItem: null,
    draggedElement: null,
    dropTarget: null,
    dropType: null
  }
}

// 处理图标点击
const handleItemClick = (item) => {
  if (item.type === 'folder') {
    // 显示文件夹内容
    currentFolder.value = item
    showFolderContent.value = true
  } else {
    // 打开网站
    openWebsite(item)
  }
}

// 处理创建文件夹
const handleCreateFolder = () => {
  // 创建新文件夹对象
  const folder = {
    id: Date.now(),
    type: 'folder',
    name: '',
    icon: generateFolderIcon(),
    children: []
  }
  
  // 添加到网站列表
  websites.value.push(folder)
  
  // 显示命名对话框
  showFolderNameDialog.value = true
  hidePageContextMenu()
  
  // 自动聚焦输入框
  nextTick(() => {
    folderNameInput.value?.focus()
  })
}

// 生成文件夹图标
const generateFolderIcon = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  
  // 绘制文件夹背景
  ctx.fillStyle = '#FFB74D'
  ctx.beginPath()
  ctx.moveTo(8, 16)
  ctx.lineTo(24, 16)
  ctx.lineTo(28, 12)
  ctx.lineTo(56, 12)
  ctx.lineTo(56, 52)
  ctx.lineTo(8, 52)
  ctx.closePath()
  ctx.fill()
  
  // 绘制文件夹前面部分
  ctx.fillStyle = '#FFA726'
  ctx.beginPath()
  ctx.moveTo(4, 16)
  ctx.lineTo(60, 16)
  ctx.lineTo(56, 56)
  ctx.lineTo(8, 56)
  ctx.closePath()
  ctx.fill()
  
  return canvas.toDataURL()
}

// 修改网站图标组件的显示逻辑
const renderIcon = (item) => {
  if (item.type === 'folder') {
    return item.icon || generateFolderIcon()
  }
  return item.icon || getFaviconUrl(item.url)
}

// 保存文件夹名称
const saveFolderName = () => {
  if (!newFolderName.value.trim()) {
    ElMessage.warning('请输入文件夹名称')
    return
  }

  // 找到未命名的文件夹
  const folder = websites.value.find(item => item.type === 'folder' && !item.name)
  if (folder) {
    folder.name = newFolderName.value.trim()
    saveWebsitesToStorage() // 保存到本地存储
    ElMessage.success('文件夹创建成功')
  }

  // 重置状态
  newFolderName.value = ''
  showFolderNameDialog.value = false
}

// 取消创建文件夹
const cancelFolderName = () => {
  // 找到并删除未命名的文件夹
  const index = websites.value.findIndex(item => item.type === 'folder' && !item.name)
  if (index !== -1) {
    websites.value.splice(index, 1)
  }
  
  // 重置状态
  newFolderName.value = ''
  showFolderNameDialog.value = false
}

// 处理对话框关闭
const handleFolderDialogClosed = () => {
  if (!newFolderName.value.trim()) {
    cancelFolderName()
  }
}

// 更换背景
const changeBackground = () => {
  // 实现背景更换逻辑
  hidePageContextMenu()
}

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

// 文件夹相关
const handleFolderDragStart = (evt) => {
  const element = currentFolder.value.children.find(
    w => w.id.toString() === evt.item.dataset.id
  )
  if (!element) return
  
  dragState.value = {
    isDragging: true,
    draggedItem: evt.item,
    draggedElement: element,
    dropTarget: null,
    dropType: null
  }
}

const handleFolderDragEnd = (evt) => {
  saveWebsitesToStorage()
}

const handleFolderDragAdd = (evt) => {
  saveWebsitesToStorage()
}

// 处理拖拽添加
const handleDragAdd = (evt) => {
  saveWebsitesToStorage()
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1rem;
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
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  margin-top: 1rem;
}

.toolbar {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
}

.filter-box {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 200px;
}

.pagination {
  margin: 1rem 0;
  display: flex;
  justify-content: center;
}

.engine-icon {
  width: 20px;
  height: 20px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.engine-icon:hover {
  transform: scale(1.1);
}

.website-grid {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.website-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  align-content: start;
}

.website-item {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.website-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.website-item.drag-over::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px dashed #409EFF;
  border-radius: 8px;
  background: rgba(64, 158, 255, 0.1);
  pointer-events: none;
}

.website-item.drag-over::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: #409EFF;
  pointer-events: none;
}

.website-item.drag-over[data-drop-type="before"]::after {
  top: -1px;
}

.website-item.drag-over[data-drop-type="after"]::after {
  bottom: -1px;
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
  max-height: 2.6em; /* 限制最大高度 */
}

.add-website {
  width: 120px;
  height: 120px;
  border: 2px dashed #e0e0e0;
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer !important; /* 确保鼠标样式正确 */
  pointer-events: all !important; /* 确保可以点击 */
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

/* 全屏切换按钮 */
.fullscreen-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
}

.fullscreen-toggle:hover {
  transform: scale(1.1);
  background: white;
}

/* 拖拽相关样式 */
.ghost-card {
  opacity: 0.5;
  background: #409EFF;
  border: 2px dashed #409EFF;
}

.dragging-card {
  transform: scale(1.05);
  z-index: 100;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 文件夹样式 */
.folder-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
  }
}

.folder-content {
  min-height: 400px;
}

.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

/* 搜索历史样式 */
.search-history {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 4px;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  
  &:hover {
    background: #f5f7fa;
  }
  
  .el-icon {
    margin-right: 8px;
    font-size: 14px;
    color: #909399;
  }
  
  .delete-icon {
    margin-left: auto;
    
    &:hover {
      color: #f56c6c;
    }
  }
}

.website-item.is-folder {
  background: rgba(255, 236, 179, 0.7);
  cursor: pointer;
}

.website-item.is-folder.drag-over {
  background: rgba(255, 236, 179, 0.9);
  border: 2px dashed #409EFF;
}

.website-item.is-folder:hover {
  background: rgba(255, 236, 179, 0.9);
  transform: translateY(-5px);
}

.website-item.is-folder .website-icon img {
  padding: 4px;
  background: transparent;
}

/* 右键菜单样式 */
.context-menu {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 4px 0;
}

.menu-item {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-item .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

/* 添加拖拽指示器样式 */
.drop-indicator {
  position: fixed;
  pointer-events: none;
  z-index: 1000;
  transition: all 0.2s ease;
}

.drop-indicator:not(.is-folder) {
  background-color: #409EFF;
  border-radius: 2px;
}

.drop-indicator.is-folder {
  border: 2px dashed #409EFF;
  border-radius: 8px;
  background-color: rgba(64, 158, 255, 0.1);
}

/* 修改拖拽时的样式 */
.dragging-card {
  transform: scale(1.05);
  opacity: 0.8;
  z-index: 100;
}

.ghost-card {
  opacity: 0.3;
  background: #409EFF;
}
</style> 