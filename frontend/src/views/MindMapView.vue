<template>
  <div class="mindmap-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button-group class="toolbar-item">
        <el-button @click="createNewMap">
          <el-icon><Plus /></el-icon>新建
        </el-button>
        <el-button @click="saveCurrentMap">
          <el-icon><Save /></el-icon>保存
        </el-button>
        <el-dropdown trigger="click" @command="handleExport">
          <el-button>
            <el-icon><Download /></el-icon>导出
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="png">PNG</el-dropdown-item>
              <el-dropdown-item command="svg">SVG</el-dropdown-item>
              <el-dropdown-item command="json">JSON</el-dropdown-item>
              <el-dropdown-item command="pdf">PDF</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-button-group>

      <el-button-group class="toolbar-item">
        <el-tooltip content="添加子节点 (Tab)">
          <el-button @click="addChildNode">
            <el-icon><Plus /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="添加同级节点 (Enter)">
          <el-button @click="addSiblingNode">
            <el-icon><RightBracket /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="删除节点 (Delete)">
          <el-button @click="removeNode">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-button-group class="toolbar-item">
        <el-button @click="zoomIn">
          <el-icon><ZoomIn /></el-icon>
        </el-button>
        <el-button @click="zoomOut">
          <el-icon><ZoomOut /></el-icon>
        </el-button>
        <el-button @click="resetZoom">
          <el-icon><FullScreen /></el-icon>
        </el-button>
      </el-button-group>

      <el-button-group class="toolbar-item">
        <el-button @click="undo" :disabled="!canUndo">
          <el-icon><Back /></el-icon>
        </el-button>
        <el-button @click="redo" :disabled="!canRedo">
          <el-icon><Right /></el-icon>
        </el-button>
      </el-button-group>

      <el-select v-model="currentLayout" placeholder="布局" @change="changeLayout" class="toolbar-item compact-select">
        <el-option
          v-for="layout in layouts"
          :key="layout.value"
          :label="layout.label"
          :value="layout.value"
        />
      </el-select>

      <el-select v-model="currentTheme" placeholder="主题" @change="changeTheme" class="toolbar-item compact-select">
        <el-option
          v-for="theme in themes"
          :key="theme.value"
          :label="theme.label"
          :value="theme.value"
        />
      </el-select>

      <!-- 键盘快捷键帮助按钮 -->
      <el-tooltip content="快捷键帮助">
        <el-button class="toolbar-item" @click="showShortcutsDialog = true">
          <el-icon><QuestionFilled /></el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <!-- 左侧导图列表 -->
    <div class="sidebar">
      <div class="map-list-header">
        <h3>我的导图</h3>
        <el-input
          v-model="searchQuery"
          placeholder="搜索导图..."
          prefix-icon="Search"
        />
      </div>
      
      <div class="map-list">
        <div
          v-for="map in filteredMaps"
          :key="map.id"
          class="map-item"
          :class="{ active: currentMap?.id === map.id }"
          @click="loadMap(map)"
        >
          <div class="map-info">
            <h4>{{ map.title }}</h4>
            <p>{{ formatDate(map.updatedAt) }}</p>
          </div>
          <el-dropdown trigger="click" @command="handleMapCommand($event, map)">
            <el-button type="text">
              <el-icon><More /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rename">重命名</el-dropdown-item>
                <el-dropdown-item command="duplicate">复制</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 主要编辑区域 -->
    <div class="main-content">
      <template v-if="maps.length === 0">
        <div class="empty-state">
          <el-empty description="还没有思维导图">
            <el-button type="primary" @click="createNewMap">
              创建第一个思维导图
            </el-button>
          </el-empty>
        </div>
      </template>
      <template v-else>
        <div class="mindmap-wrapper" ref="mindMapContainer"></div>
      </template>
    </div>

    <!-- 右侧样式面板 -->
    <div class="style-panel" v-if="currentMap && selectedNode">
      <div class="panel-header">
        <h3>节点样式</h3>
      </div>
      <div class="panel-content">
        <div class="style-section">
          <div class="section-title">文本</div>
          <el-input v-model="selectedNodeText" @change="updateNodeText" placeholder="节点文本"></el-input>
          <div class="font-controls">
            <el-color-picker v-model="nodeTextColor" @change="updateNodeStyle" size="small"></el-color-picker>
            <el-select v-model="nodeFontSize" @change="updateNodeStyle" size="small" placeholder="字号">
              <el-option v-for="size in fontSizes" :key="size" :label="size" :value="size" />
            </el-select>
            <div class="font-buttons">
              <el-button size="small" @click="toggleBold">B</el-button>
              <el-button size="small" @click="toggleItalic"><i>I</i></el-button>
            </div>
          </div>
        </div>
        
        <div class="style-section">
          <div class="section-title">节点</div>
          <div class="node-controls">
            <el-color-picker v-model="nodeColor" @change="updateNodeStyle" size="small"></el-color-picker>
            <el-select v-model="nodeShape" @change="updateNodeStyle" size="small" placeholder="形状">
              <el-option label="圆角矩形" value="roundRect" />
              <el-option label="矩形" value="rectangle" />
              <el-option label="圆形" value="circle" />
              <el-option label="菱形" value="diamond" />
            </el-select>
          </div>
        </div>
        
        <div class="style-section">
          <div class="section-title">线条</div>
          <div class="line-controls">
            <el-color-picker v-model="lineColor" @change="updateLineStyle" size="small"></el-color-picker>
            <el-select v-model="lineStyle" @change="updateLineStyle" size="small" placeholder="样式">
              <el-option label="直线" value="straight" />
              <el-option label="曲线" value="curve" />
              <el-option label="圆角" value="round" />
            </el-select>
          </div>
        </div>
        
        <div class="style-section">
          <div class="section-title">标记</div>
          <div class="marker-grid">
            <div v-for="(marker, index) in markers" :key="index" 
                 class="marker-item" 
                 :class="{active: selectedMarker === marker.value}"
                 @click="setMarker(marker.value)">
              <i :class="marker.icon"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建导图对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建思维导图"
      width="30%"
    >
      <el-form :model="newMapForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="newMapForm.title" placeholder="输入导图标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="newMapForm.description"
            type="textarea"
            placeholder="输入导图描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateMap">创建</el-button>
      </template>
    </el-dialog>

    <!-- 导出对话框 -->
    <el-dialog
      v-model="showExportDialog"
      title="导出设置"
      width="30%"
    >
      <el-form :model="exportForm" label-width="80px">
        <el-form-item label="文件名">
          <el-input v-model="exportForm.filename" placeholder="输入文件名" />
        </el-form-item>
        <el-form-item v-if="exportForm.type === 'png' || exportForm.type === 'pdf'" label="质量">
          <el-slider v-model="exportForm.quality" :min="1" :max="3" :marks="{1:'低', 2:'中', 3:'高'}" />
        </el-form-item>
        <el-form-item v-if="exportForm.type === 'png' || exportForm.type === 'pdf'" label="背景色">
          <el-color-picker v-model="exportForm.backgroundColor" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmExport">导出</el-button>
      </template>
    </el-dialog>

    <!-- 快捷键帮助对话框 -->
    <el-dialog
      v-model="showShortcutsDialog"
      title="键盘快捷键"
      width="400px"
    >
      <div class="shortcuts-list">
        <div v-for="(shortcut, index) in keyboardShortcuts" :key="index" class="shortcut-item">
          <div class="shortcut-keys">
            <kbd v-for="(key, i) in shortcut.keys" :key="i">{{ key }}</kbd>
          </div>
          <div class="shortcut-desc">{{ shortcut.description }}</div>
        </div>
      </div>
    </el-dialog>

    <!-- 状态信息 -->
    <div class="status-bar">
      <div class="status-item">
        <el-icon><Clock /></el-icon>
        <span>上次保存时间: {{ autoSaveConfig.lastSaved ? formatDate(autoSaveConfig.lastSaved) : '尚未保存' }}</span>
      </div>
      <div class="status-item">
        <el-icon><InfoFilled /></el-icon>
        <span>自动保存状态: {{ autoSaveConfig.enabled ? '启用' : '禁用' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue'
import MindMap from 'simple-mind-map'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Save, Download, ZoomIn, ZoomOut, FullScreen, Back, Right, 
  More, Search, Delete, ArrowDown, RightBracket, QuestionFilled, Clock, InfoFilled
} from '@element-plus/icons-vue'

// 状态
const mindMapContainer = ref(null)
const mindMap = ref(null)
const currentMap = ref(null)
const maps = ref([])
const searchQuery = ref('')
const showCreateDialog = ref(false)
const showExportDialog = ref(false)
const currentTheme = ref('default')
const currentLayout = ref('mindMap')
const canUndo = ref(false)
const canRedo = ref(false)
const selectedNode = ref(null)
const selectedNodeText = ref('')
const nodeTextColor = ref('#333333')
const nodeFontSize = ref(14)
const nodeColor = ref('#ffffff')
const nodeShape = ref('roundRect')
const lineColor = ref('#666666')
const lineStyle = ref('curve')
const selectedMarker = ref('')

// 新建导图表单
const newMapForm = ref({
  title: '',
  description: ''
})

// 导出表单
const exportForm = ref({
  filename: '',
  type: 'png',
  quality: 2,
  backgroundColor: '#ffffff'
})

// 布局列表
const layouts = [
  { label: '思维导图', value: 'mindMap' },
  { label: '逻辑结构图', value: 'logicalStructure' },
  { label: '组织结构图', value: 'organizationStructure' },
  { label: '目录组织图', value: 'catalogOrganization' },
  { label: '鱼骨图', value: 'fishbone' }
]

// 主题列表
const themes = [
  { label: '默认主题', value: 'default' },
  { label: '清新主题', value: 'fresh' },
  { label: '暗色主题', value: 'dark' },
  { label: '商务主题', value: 'business' },
  { label: '活力橙', value: 'orange' },
  { label: '深蓝', value: 'deep-blue' },
  { label: '典雅绿', value: 'elegant-green' }
]

// 字体大小选项
const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32]

// 标记图标
const markers = [
  { value: 'priority1', icon: 'el-icon-star-on', label: '优先级1' },
  { value: 'priority2', icon: 'el-icon-star-off', label: '优先级2' },
  { value: 'flag', icon: 'el-icon-flag', label: '旗帜' },
  { value: 'task-todo', icon: 'el-icon-circle', label: '待办' },
  { value: 'task-done', icon: 'el-icon-check', label: '完成' },
  { value: 'smile', icon: 'el-icon-smile', label: '笑脸' },
  { value: 'sad', icon: 'el-icon-frown', label: '悲伤' },
  { value: 'clear', icon: 'el-icon-close', label: '清除' }
]

// 过滤后的导图列表
const filteredMaps = computed(() => {
  if (!searchQuery.value) return maps.value
  return maps.value.filter(map => 
    map.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 防抖保存的定时器
let saveTimeout = null

// 加载导图
const loadMap = (map) => {
  console.log('加载思维导图:', map.title)
  currentMap.value = map
  
  if (mindMap.value && map.content) {
    try {
      console.log('设置思维导图数据:', map.content)
      
      // 确保思维导图实例可用
      if (!mindMapContainer.value.childNodes.length) {
        console.log('重新初始化思维导图实例')
        initMindMapInstance(map.content)
        setupEventListeners()
      } else if (mindMap.value.setData) {
        // 使用现有实例并设置数据
        mindMap.value.setData(map.content)
        mindMap.value.render()
      }
    } catch (e) {
      console.error('加载思维导图数据失败:', e)
      ElMessage.error('加载思维导图失败，请重试')
    }
  } else {
    console.warn('思维导图实例或数据不可用')
  }
}

// 初始化思维导图实例
const initMindMapInstance = (data = null) => {
  const initialData = data || {
    data: {
      text: '中心主题',
      expand: true,
      uid: Date.now().toString(),
      children: []
    }
  }

  try {
    console.log('初始化思维导图实例', initialData, '布局:', currentLayout.value, '主题:', currentTheme.value)
    
    // 使用更简单的配置初始化
    const options = {
      el: mindMapContainer.value,
      data: initialData,
      width: mindMapContainer.value.clientWidth,
      height: mindMapContainer.value.clientHeight,
      layout: currentLayout.value,
      theme: currentTheme.value
    }
    
    // 只添加基本必要的配置
    mindMap.value = new MindMap(options)
    
    console.log('创建的思维导图实例:', mindMap.value)
    
    // 检查API和方法
    if (mindMap.value) {
      console.log('可用方法:',
        'setLayout:', typeof mindMap.value.setLayout === 'function',
        'setTheme:', typeof mindMap.value.setTheme === 'function',
        'addChild:', typeof mindMap.value.addChild === 'function',
        'insertSibling:', typeof mindMap.value.insertSibling === 'function',
        'removeNode:', typeof mindMap.value.removeNode === 'function'
      )
    }
  } catch (e) {
    console.error('思维导图实例化失败:', e)
    ElMessage.error('思维导图初始化失败')
  }
}

// 设置事件监听
const setupEventListeners = () => {
  if (!mindMap.value) return
  
  console.log('设置思维导图事件监听')
  
  // 监听数据变化
  try {
    if (mindMap.value.on) {
      // 定义自动保存的防抖函数
      let autoSaveTimeout = null
      const autoSave = () => {
        if (autoSaveTimeout) clearTimeout(autoSaveTimeout)
        autoSaveTimeout = setTimeout(() => {
          console.log('数据变化，自动保存')
          saveCurrentMap()
        }, 2000) // 延迟2秒保存，避免频繁操作
      }
      
      // 监听各种可能的数据变化事件
      mindMap.value.on('data_change', autoSave)
      mindMap.value.on('node_click', () => {
        // 更新当前选中节点
        if (mindMap.value.renderer && mindMap.value.renderer.activeNode) {
          selectedNode.value = mindMap.value.renderer.activeNode
        }
      })
      
      console.log('成功设置数据变化监听')
    } else {
      console.warn('思维导图实例不支持事件监听')
    }
  } catch (e) {
    console.error('设置事件监听失败:', e)
  }
  
  // 更新撤销/重做状态
  updateUndoRedoState()
}

// 更新撤销/重做状态
const updateUndoRedoState = () => {
  if (!mindMap.value) return
  
  // 通过命令管理器获取撤销/重做状态
  try {
    const commandManager = mindMap.value.command || mindMap.value.commandManager
    if (commandManager) {
      canUndo.value = commandManager.hasUndoCommands()
      canRedo.value = commandManager.hasRedoCommands()
    } else {
      // 备选方案：尝试从历史记录长度判断
      const history = mindMap.value.history || []
      const currentHistoryIndex = mindMap.value.currentHistoryIndex || -1
      canUndo.value = currentHistoryIndex > 0
      canRedo.value = currentHistoryIndex < history.length - 1
    }
  } catch (e) {
    console.error('获取撤销/重做状态失败:', e)
    // 默认都禁用
    canUndo.value = false
    canRedo.value = false
  }
}

// 创建新导图
const createNewMap = () => {
  newMapForm.value = {
    title: '',
    description: ''
  }
  showCreateDialog.value = true
}

// 处理创建导图
const handleCreateMap = () => {
  // 验证输入
  if (!newMapForm.value.title.trim()) {
    ElMessage.warning('请输入导图标题')
    return
  }

  // 创建新导图
  const newMap = {
    id: Date.now().toString(),
    title: newMapForm.value.title,
    description: newMapForm.value.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: {
      data: {
        text: newMapForm.value.title,
        expand: true,
        children: []
      }
    }
  }

  // 添加到导图列表
  maps.value.unshift(newMap)
  
  // 保存到存储
  saveMapsToStorage()
  
  // 加载新导图
  currentMap.value = newMap
  nextTick(() => {
    resetMindMap()
    initMindMapInstance(newMap.content)
    setupEventListeners()
  })

  // 关闭对话框
  showCreateDialog.value = false
  ElMessage.success('思维导图创建成功')
}

// 修复自动保存配置的使用方式 - 在setup中不需要使用.value
const autoSaveConfig = ref({
  enabled: true,
  interval: 5000, // 5秒
  lastSaved: null,
  timer: null
})

// 修复日期格式化函数，确保能处理null值
const formatDate = (date) => {
  if (!date) return '尚未保存';
  try {
    return new Date(date).toLocaleString()
  } catch (e) {
    console.error('日期格式化错误:', e)
    return '格式错误'
  }
}

// 设置自动保存
const setupAutoSave = () => {
  if (autoSaveConfig.value.timer) {
    clearInterval(autoSaveConfig.value.timer)
  }
  
  if (autoSaveConfig.value.enabled) {
    autoSaveConfig.value.timer = setInterval(() => {
      if (currentMap.value && mindMap.value) {
        saveCurrentMap(true) // true表示是自动保存
      }
    }, autoSaveConfig.value.interval)
    
    console.log('自动保存已启用，间隔:', autoSaveConfig.value.interval, 'ms')
  }
}

// 完善的数据持久化函数
const loadMapsFromStorage = () => {
  try {
    const storedMaps = localStorage.getItem('mindMaps')
    if (storedMaps) {
      maps.value = JSON.parse(storedMaps)
      console.log('成功从本地存储加载了', maps.value.length, '个思维导图')
    } else {
      maps.value = []
      console.log('本地存储中没有思维导图数据')
    }
  } catch (e) {
    console.error('加载思维导图数据失败:', e)
    maps.value = []
    ElMessage.error('加载思维导图数据失败')
  }
}

const saveMapsToStorage = () => {
  try {
    // 深度克隆避免循环引用问题
    const mapsToBeSaved = maps.value.map(map => ({
      ...map,
      // 确保content是可以序列化的JSON对象
      content: map.content ? JSON.parse(JSON.stringify(map.content)) : null
    }))
    localStorage.setItem('mindMaps', JSON.stringify(mapsToBeSaved))
    console.log('成功保存了', maps.value.length, '个思维导图到本地存储')
    return true
  } catch (e) {
    console.error('保存思维导图数据失败:', e)
    ElMessage.error('保存思维导图数据失败')
    return false
  }
}

// 修改保存函数，确保更新lastSaved
const saveCurrentMap = (isAutoSave = false) => {
  if (!currentMap.value || !mindMap.value) {
    console.log('没有当前思维导图或实例，无法保存')
    return
  }
  
  try {
    // 如果是手动保存，显示加载提示
    let loadingInstance = null
    if (!isAutoSave) {
      loadingInstance = ElMessage({
        message: '正在保存...',
        type: 'info',
        duration: 0
      })
    }
    
    console.log(isAutoSave ? '自动保存中...' : '手动保存中...')
    
    // 获取数据（原有代码）
    let mapData = null
    
    // 尝试不同方法获取数据
    if (typeof mindMap.value.getData === 'function') {
      try {
        mapData = mindMap.value.getData()
        console.log('使用getData()方法成功获取数据')
      } catch (err) {
        console.warn('getData()方法失败:', err)
      }
    }
    
    // 添加其他获取数据的方法（与之前的代码相同）
    
    if (!mapData) {
      ElMessage.warning('无法获取思维导图数据，请尝试重新加载页面')
      console.error('所有获取数据的方法都失败了')
      return
    }
    
    // 更新maps数组中的项
    const index = maps.value.findIndex(m => m.id === currentMap.value.id)
    if (index > -1) {
      const now = new Date().toISOString()
      maps.value[index] = {
        ...maps.value[index],
        content: mapData,
        updatedAt: now
      }
      
      // 确保currentMap同步更新
      currentMap.value = maps.value[index]
      
      // 保存到存储中
      const saveResult = saveMapsToStorage()
      
      if (saveResult) {
        // 记录最后保存时间
        autoSaveConfig.value.lastSaved = new Date()
        
        // 只在手动保存时显示成功消息
        if (!isAutoSave) {
          if (loadingInstance) loadingInstance.close()
          ElMessage.success('思维导图已保存')
        } else {
          console.log('自动保存完成:', new Date().toLocaleTimeString())
        }
      } else if (!isAutoSave) {
        if (loadingInstance) loadingInstance.close()
        ElMessage.error('保存失败，请重试')
      }
    } else {
      console.error('找不到要更新的思维导图:', currentMap.value.id)
    }
  } catch (e) {
    console.error('保存思维导图失败:', e)
    if (!isAutoSave) {
      ElMessage.error('保存失败，请重试')
    }
  }
}

// 导出导图相关功能
const handleExport = (type) => {
  exportForm.value.type = type
  exportForm.value.filename = currentMap.value?.title || '思维导图'
  showExportDialog.value = true
}

const confirmExport = () => {
  if (!mindMap.value) return
  
  const filename = exportForm.value.filename || '思维导图'
  
  switch (exportForm.value.type) {
    case 'png':
      mindMap.value.exportPng({
        fileName: filename,
        backgroundColor: exportForm.value.backgroundColor,
        scale: exportForm.value.quality
      })
      break
    case 'svg':
      mindMap.value.exportSvg({
        fileName: filename
      })
      break
    case 'json': {
      const jsonData = JSON.stringify(mindMap.value.getData())
      const blob = new Blob([jsonData], {type: 'application/json'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.json`
      a.click()
      URL.revokeObjectURL(url)
      break
    }
    case 'pdf':
      mindMap.value.exportPdf({
        fileName: filename,
        backgroundColor: exportForm.value.backgroundColor,
        scale: exportForm.value.quality
      })
      break
  }
  
  showExportDialog.value = false
  ElMessage.success('导出成功')
}

// 节点操作函数
const addChildNode = () => {
  if (!mindMap.value) return
  try {
    console.log('尝试添加子节点')
    
    // 直接尝试API调用
    if (typeof mindMap.value.addChild === 'function') {
      mindMap.value.addChild()
      ElMessage.success('添加子节点成功')
      return
    }
    
    // 通过命令方式尝试
    if (mindMap.value.execCommand) {
      mindMap.value.execCommand('ADD_CHILD')
      ElMessage.success('添加子节点成功')
      return
    }
    
    ElMessage.warning('添加子节点功能在当前版本不可用')
  } catch (e) {
    console.error('添加子节点失败:', e)
    ElMessage.error('添加子节点失败')
  }
}

const addSiblingNode = () => {
  if (!mindMap.value) return
  try {
    console.log('尝试添加同级节点')
    
    // 直接尝试API调用
    if (typeof mindMap.value.insertSibling === 'function') {
      mindMap.value.insertSibling()
      return
    }
    
    // 通过命令方式尝试
    if (mindMap.value.execCommand) {
      mindMap.value.execCommand('ADD_NODE')
      return
    }
    
    ElMessage.warning('添加同级节点功能在当前版本不可用')
  } catch (e) {
    console.error('添加同级节点失败:', e)
    ElMessage.error('添加同级节点失败')
  }
}

const removeNode = () => {
  if (!mindMap.value) return
  try {
    console.log('尝试删除节点')
    
    // 直接尝试API调用
    if (typeof mindMap.value.removeNode === 'function') {
      mindMap.value.removeNode()
      return
    }
    
    // 通过命令方式尝试
    if (mindMap.value.execCommand) {
      mindMap.value.execCommand('REMOVE_NODE')
      return
    }
    
    ElMessage.warning('删除节点功能在当前版本不可用')
  } catch (e) {
    console.error('删除节点失败:', e)
    ElMessage.error('删除节点失败')
  }
}

// 样式更新函数
const updateNodeText = () => {
  if (!mindMap.value || !selectedNode.value) return
  mindMap.value.updateNode({
    text: selectedNodeText.value
  }, [selectedNode.value])
}

const updateNodeStyle = () => {
  if (!mindMap.value || !selectedNode.value) return
  mindMap.value.updateNode({
    textColor: nodeTextColor.value,
    fontSize: nodeFontSize.value,
    backgroundColor: nodeColor.value,
    shape: nodeShape.value
  }, [selectedNode.value])
}

const updateLineStyle = () => {
  if (!mindMap.value || !selectedNode.value) return
  mindMap.value.updateNode({
    lineColor: lineColor.value,
    lineStyle: lineStyle.value
  }, [selectedNode.value])
}

const toggleBold = () => {
  if (!mindMap.value || !selectedNode.value) return
  const isBold = selectedNode.value.data.fontWeight === 'bold'
  mindMap.value.updateNode({
    fontWeight: isBold ? 'normal' : 'bold'
  }, [selectedNode.value])
}

const toggleItalic = () => {
  if (!mindMap.value || !selectedNode.value) return
  const isItalic = selectedNode.value.data.fontStyle === 'italic'
  mindMap.value.updateNode({
    fontStyle: isItalic ? 'normal' : 'italic'
  }, [selectedNode.value])
}

const setMarker = (marker) => {
  if (!mindMap.value || !selectedNode.value) return
  selectedMarker.value = marker
  mindMap.value.updateNode({
    marker: marker === 'clear' ? '' : marker
  }, [selectedNode.value])
}

// 布局和主题切换
const changeLayout = (layout) => {
  if (!mindMap.value) return
  try {
    console.log('尝试切换布局为:', layout)
    
    // 简化调用，优先使用库的直接API
    if (mindMap.value.setLayout) {
      mindMap.value.setLayout(layout)
      currentLayout.value = layout
      mindMap.value.render && mindMap.value.render()
      ElMessage.success(`布局已更改为: ${layout}`)
      return
    }
    
    // 兼容处理
    if (mindMap.value.setOptions) {
      mindMap.value.setOptions({ layout })
      currentLayout.value = layout
      mindMap.value.render && mindMap.value.render()
      ElMessage.success(`布局已更改为: ${layout}`)
      return
    }
    
    ElMessage.warning('切换布局功能在当前版本不可用')
  } catch (e) {
    console.error('切换布局失败:', e)
    ElMessage.error('切换布局失败')
  }
}

const changeTheme = (theme) => {
  if (!mindMap.value) return
  try {
    console.log('尝试切换主题为:', theme)
    
    // 简化调用，优先使用库的直接API
    if (mindMap.value.setTheme) {
      mindMap.value.setTheme(theme)
      currentTheme.value = theme
      ElMessage.success(`主题已更改为: ${theme}`)
      return
    }
    
    // 兼容处理
    if (mindMap.value.setOptions) {
      mindMap.value.setOptions({ theme })
      currentTheme.value = theme
      mindMap.value.render && mindMap.value.render()
      ElMessage.success(`主题已更改为: ${theme}`)
      return
    }
    
    ElMessage.warning('切换主题功能在当前版本不可用')
  } catch (e) {
    console.error('切换主题失败:', e)
    ElMessage.error('切换主题失败')
  }
}

// 缩放控制
const zoomIn = () => {
  if (!mindMap.value) return
  try {
    console.log('尝试放大')
    
    // 直接尝试API调用
    if (mindMap.value.zoomIn) {
      mindMap.value.zoomIn()
      return
    }
    
    // 尝试视图缩放
    if (mindMap.value.view && mindMap.value.view.zoomIn) {
      mindMap.value.view.zoomIn()
      return
    }
    
    ElMessage.warning('放大功能在当前版本不可用')
  } catch (e) {
    console.error('放大失败:', e)
    ElMessage.error('放大操作失败')
  }
}

const zoomOut = () => {
  if (!mindMap.value) return
  try {
    console.log('尝试缩小')
    
    // 直接尝试API调用
    if (mindMap.value.zoomOut) {
      mindMap.value.zoomOut()
      return
    }
    
    // 尝试视图缩放
    if (mindMap.value.view && mindMap.value.view.zoomOut) {
      mindMap.value.view.zoomOut()
      return
    }
    
    ElMessage.warning('缩小功能在当前版本不可用')
  } catch (e) {
    console.error('缩小失败:', e)
    ElMessage.error('缩小操作失败')
  }
}

const resetZoom = () => {
  if (!mindMap.value) return
  try {
    console.log('尝试重置缩放')
    
    // 直接尝试API调用
    if (mindMap.value.resetZoom) {
      mindMap.value.resetZoom()
      return
    }
    
    // 尝试视图重置
    if (mindMap.value.view && mindMap.value.view.reset) {
      mindMap.value.view.reset()
      return
    }
    
    ElMessage.warning('重置缩放功能在当前版本不可用')
  } catch (e) {
    console.error('重置缩放失败:', e)
    ElMessage.error('重置缩放失败')
  }
}

// 撤销/重做
const undo = () => {
  if (!mindMap.value) return
  try {
    if (mindMap.value.command) {
      mindMap.value.command.undo()
    } else if (mindMap.value.commandManager) {
      mindMap.value.commandManager.undo()
    } else if (typeof mindMap.value.undo === 'function') {
      mindMap.value.undo()
    }
    updateUndoRedoState()
  } catch (e) {
    console.error('撤销操作失败:', e)
  }
}

const redo = () => {
  if (!mindMap.value) return
  try {
    if (mindMap.value.command) {
      mindMap.value.command.redo()
    } else if (mindMap.value.commandManager) {
      mindMap.value.commandManager.redo()
    } else if (typeof mindMap.value.redo === 'function') {
      mindMap.value.redo()
    }
    updateUndoRedoState()
  } catch (e) {
    console.error('重做操作失败:', e)
  }
}

// 处理导图操作
const handleMapCommand = async (command, map) => {
  let index;
  let duplicatedMap;

  switch (command) {
    case 'rename':
      try {
        const { value: newTitle } = await ElMessageBox.prompt(
          '请输入新的标题',
          '重命名',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputValue: map.title,
            inputValidator: (value) => {
              if (!value) {
                return '标题不能为空'
              }
              return true
            }
          }
        )
        index = maps.value.findIndex(m => m.id === map.id)
        if (index > -1) {
          maps.value[index] = {
            ...map,
            title: newTitle,
            updatedAt: new Date().toISOString()
          }
          saveMapsToStorage()
          ElMessage.success('重命名成功')
        }
      } catch (err) {
        // 用户取消操作
      }
      break
    case 'duplicate':
      duplicatedMap = {
        ...map,
        id: Date.now(),
        title: `${map.title} - 副本`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      maps.value.unshift(duplicatedMap)
      saveMapsToStorage()
      ElMessage.success('复制成功')
      break
    case 'delete':
      try {
        await ElMessageBox.confirm('确定要删除该导图吗？', '提示', {
          type: 'warning'
        })
        index = maps.value.findIndex(m => m.id === map.id)
        if (index > -1) {
          maps.value.splice(index, 1)
          saveMapsToStorage()
          if (currentMap.value?.id === map.id) {
            currentMap.value = null
            mindMap.value?.setData({
              data: {
                text: '中心主题',
                expand: true,
                uid: Date.now().toString(),
                children: []
              }
            })
            mindMap.value?.setLayout('mindMap')
            mindMap.value?.render()
          }
          ElMessage.success('删除成功')
        }
      } catch (err) {
        // 用户取消删除操作
      }
      break
  }
}

// 生命周期钩子
onMounted(() => {
  // 首先加载存储的思维导图数据
  loadMapsFromStorage()
  
  console.log('思维导图组件已挂载，找到的导图数量:', maps.value.length)
  
  // 如果有导图，初始化第一个
  if (maps.value.length > 0) {
    nextTick(() => {
      console.log('初始化第一个思维导图')
      initMindMapInstance()
      setupEventListeners()
      loadMap(maps.value[0])
    })
  }
  
  // 设置自动保存
  setupAutoSave()
  
  // 监听键盘快捷键
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  mindMap.value?.destroy()
  document.removeEventListener('keydown', handleKeyDown)
  
  // 清理自动保存定时器
  if (autoSaveConfig.value.timer) {
    clearInterval(autoSaveConfig.value.timer)
  }
})

// 增强键盘快捷键处理
const handleKeyDown = (e) => {
  if (!mindMap.value) return
  
  // 如果正在输入框中编辑，则不处理快捷键
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  
  // 获取组合键状态
  const hasCtrlOrCmd = e.ctrlKey || e.metaKey
  const hasShift = e.shiftKey
  const hasAlt = e.altKey
  
  // 记录是否已处理快捷键
  let handled = true
  
  // 根据按键执行操作
  switch (e.key) {
    case 'Tab':
      e.preventDefault()
      addChildNode()
      break
      
    case 'Enter':
      if (!hasShift) {
        e.preventDefault()
        addSiblingNode()
      }
      break
      
    case 'Delete':
    case 'Backspace':
      if (hasCtrlOrCmd && e.key === 'Backspace') {
        e.preventDefault()
        removeNode()
      } else if (e.key === 'Delete') {
        e.preventDefault()
        removeNode()
      }
      break
      
    case 's':
      if (hasCtrlOrCmd) {
        e.preventDefault()
        saveCurrentMap()
      }
      break
      
    case 'z':
      if (hasCtrlOrCmd) {
        e.preventDefault()
        if (hasShift) {
          redo()
        } else {
          undo()
        }
      }
      break
      
    case 'y':
      if (hasCtrlOrCmd) {
        e.preventDefault()
        redo()
      }
      break
      
    case 'n':
      if (hasCtrlOrCmd) {
        e.preventDefault()
        createNewMap()
      }
      break
      
    case '+':
    case '=':
      if (hasCtrlOrCmd) {
        e.preventDefault()
        zoomIn()
      }
      break
      
    case '-':
      if (hasCtrlOrCmd) {
        e.preventDefault()
        zoomOut()
      }
      break
      
    case '0':
      if (hasCtrlOrCmd) {
        e.preventDefault()
        resetZoom()
      }
      break
      
    case 'e':
      if (hasCtrlOrCmd) {
        e.preventDefault()
        handleExport('png') // 默认导出为PNG
      }
      break
      
    case 'f':
      if (hasCtrlOrCmd) {
        e.preventDefault()
        // 添加查找功能
        ElMessage.info('查找功能开发中...')
      }
      break
      
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
      // 方向键导航节点
      e.preventDefault()
      navigateWithArrowKeys(e.key)
      break
      
    default:
      handled = false
  }
  
  // 如果处理了快捷键，记录到日志
  if (handled) {
    console.log('执行快捷键:', 
      (hasCtrlOrCmd ? 'Ctrl+' : '') + 
      (hasShift ? 'Shift+' : '') + 
      (hasAlt ? 'Alt+' : '') + 
      e.key
    )
  }
}

// 方向键导航
const navigateWithArrowKeys = (key) => {
  try {
    // 这里根据思维导图库的API实现节点导航
    // 例如选择上下左右的节点
    ElMessage.info('键盘导航: ' + key)
  } catch (e) {
    console.error('键盘导航失败:', e)
  }
}

// 重置思维导图
const resetMindMap = () => {
  mindMap.value?.setData({
    data: {
      text: '中心主题',
      expand: true,
      uid: Date.now().toString(),
      children: []
    }
  })
  mindMap.value?.setLayout('mindMap')
  mindMap.value?.render()
}

// 快捷键对话框
const showShortcutsDialog = ref(false)

// 快捷键列表
const keyboardShortcuts = [
  { keys: ['Tab'], description: '添加子节点' },
  { keys: ['Enter'], description: '添加同级节点' },
  { keys: ['Delete'], description: '删除所选节点' },
  { keys: ['Ctrl', 'S'], description: '保存思维导图' },
  { keys: ['Ctrl', 'Z'], description: '撤销' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: '重做' },
  { keys: ['Ctrl', 'Y'], description: '重做' },
  { keys: ['Ctrl', 'N'], description: '新建思维导图' },
  { keys: ['Ctrl', '+'], description: '放大' },
  { keys: ['Ctrl', '-'], description: '缩小' },
  { keys: ['Ctrl', '0'], description: '重置缩放' },
  { keys: ['Ctrl', 'E'], description: '导出思维导图' },
  { keys: ['↑'], description: '向上导航' },
  { keys: ['↓'], description: '向下导航' },
  { keys: ['←'], description: '向左导航' },
  { keys: ['→'], description: '向右导航' },
]
</script>

<style scoped>
.mindmap-container {
  height: 100%;
  display: grid;
  /* 当没有选中节点时，右侧样式面板不应显示，思维导图可以占据更多空间 */
  grid-template-columns: 250px 1fr auto;
  grid-template-rows: auto 1fr;
  gap: 1px;
  background: var(--el-border-color-light);
}

.toolbar {
  grid-column: 1 / -1;
  padding: 4px 12px;
  background: white;
  display: flex;
  gap: 8px;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
  overflow-x: auto; /* 允许在小屏幕上滚动 */
  white-space: nowrap; /* 防止换行 */
  height: 48px; /* 固定高度 */
}

.toolbar-item {
  margin-right: 4px;
  flex-shrink: 0; /* 防止缩小 */
}

.compact-select {
  width: 120px !important;
  min-width: auto !important;
}

/* 减小按钮大小 */
.toolbar .el-button {
  padding: 6px 10px;
}

/* 减小图标大小 */
.toolbar .el-icon {
  font-size: 14px;
}

.sidebar {
  background: white;
  display: flex;
  flex-direction: column;
}

.style-panel {
  background: white;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--el-border-color-light);
  width: 250px; /* 固定宽度 */
  grid-column: 3;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.style-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
}

.font-controls, .node-controls, .line-controls {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}

.font-buttons {
  display: flex;
  gap: 4px;
}

.marker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.marker-item {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  cursor: pointer;
}

.marker-item:hover {
  background-color: var(--el-fill-color-light);
}

.marker-item.active {
  background-color: var(--el-color-primary-light-8);
  border-color: var(--el-color-primary);
}

/* 保留原来的其他CSS */
.map-list-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.map-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.map-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.map-item:hover {
  background: var(--el-fill-color-light);
}

.map-item.active {
  background: var(--el-color-primary-light-9);
}

.map-info h4 {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.map-info p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.main-content {
  background: white;
  position: relative;
  grid-column: 2 / span 1;
}

.empty-state {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
}

.empty-state :deep(.el-empty) {
  padding: 40px;
}

.empty-state :deep(.el-button) {
  margin-top: 16px;
}

.mindmap-wrapper {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.el-button-group {
  display: flex;
  gap: 1px;
}

.el-button-group .el-button {
  border-radius: 0;
}

.el-button-group .el-button:first-child {
  border-radius: 4px 0 0 4px;
}

.el-button-group .el-button:last-child {
  border-radius: 0 4px 4px 0;
}

/* 右键菜单样式 */
:deep(.mind-map-contextmenu) {
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background: white;
  padding: 6px 0;
}

:deep(.mind-map-contextmenu-item) {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
}

:deep(.mind-map-contextmenu-item:hover) {
  background-color: var(--el-fill-color-light);
}

:deep(.mind-map-contextmenu-item-icon) {
  margin-right: 8px;
}

:deep(.mind-map-contextmenu-item-shortcut) {
  margin-left: 12px;
  color: var(--el-text-color-secondary);
}

:deep(.mind-map-node) {
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.mind-map-node:hover) {
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.1);
}

/* 当没有选中节点时，主内容应该扩展 */
.mindmap-container:has(:not(.style-panel)) .main-content {
  grid-column: 2 / -1;
}

/* 快捷键帮助样式 */
.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.shortcut-keys {
  display: flex;
  gap: 4px;
}

.shortcut-keys kbd {
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 3px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.2);
  color: var(--el-text-color-primary);
  display: inline-block;
  font-size: 12px;
  line-height: 1;
  padding: 4px 6px;
}

.shortcut-desc {
  color: var(--el-text-color-primary);
  font-size: 14px;
}

/* 状态信息 */
.status-bar {
  grid-column: 1 / -1;
  padding: 4px 12px;
  background: var(--el-fill-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border-top: 1px solid var(--el-border-color-light);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style> 