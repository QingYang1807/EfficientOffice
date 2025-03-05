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
        <!-- <h3>我的导图</h3> -->
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
              <el-button size="small" @click="toggleBold" 
                :class="{active: nodeFontWeight === 'bold'}"
                >B</el-button>
              <el-button size="small" @click="toggleItalic" 
                :class="{active: nodeFontStyle === 'italic'}"
                ><i>I</i></el-button>
              <el-button size="small" @click="toggleUnderline" 
                :class="{active: nodeTextDecoration === 'underline'}"
                ><u>U</u></el-button>
            </div>
          </div>
          <!-- 字体选择 -->
          <div class="font-family">
            <el-select v-model="nodeFontFamily" @change="updateNodeStyle" size="small" placeholder="字体">
              <el-option label="默认" value="" />
              <el-option label="宋体" value="SimSun" />
              <el-option label="黑体" value="SimHei" />
              <el-option label="微软雅黑" value="Microsoft YaHei" />
              <el-option label="Arial" value="Arial" />
              <el-option label="Times New Roman" value="Times New Roman" />
            </el-select>
          </div>
        </div>
        
        <div class="style-section">
          <div class="section-title">节点</div>
          <div class="node-controls">
            <el-color-picker v-model="nodeColor" @change="updateNodeStyle" size="small" 
              :predefine="predefineColors"></el-color-picker>
            <el-select v-model="nodeShape" @change="updateNodeStyle" size="small" placeholder="形状">
              <el-option label="圆角矩形" value="roundRect" />
              <el-option label="矩形" value="rectangle" />
              <el-option label="圆形" value="circle" />
              <el-option label="椭圆" value="ellipse" />
              <el-option label="菱形" value="diamond" />
              <el-option label="平行四边形" value="parallelogram" />
              <el-option label="六边形" value="hexagon" />
            </el-select>
          </div>
          
          <!-- 边框样式 -->
          <div class="border-controls">
            <div class="border-width">
              <span>边框宽度</span>
              <el-slider v-model="nodeBorderWidth" :min="0" :max="5" @change="updateNodeStyle"></el-slider>
            </div>
            <div class="border-color">
              <span>边框颜色</span>
              <el-color-picker v-model="nodeBorderColor" @change="updateNodeStyle" size="small"></el-color-picker>
            </div>
          </div>
          
          <!-- 填充透明度 -->
          <div class="opacity-control">
            <span>透明度</span>
            <el-slider v-model="nodeOpacity" :min="0" :max="100" @change="updateNodeStyle"></el-slider>
          </div>
        </div>
        
        <div class="style-section">
          <div class="section-title">连线</div>
          <div class="line-controls">
            <el-color-picker v-model="lineColor" @change="updateLineStyle" size="small"></el-color-picker>
            <el-select v-model="lineStyle" @change="updateLineStyle" size="small" placeholder="样式">
              <el-option label="直线" value="straight" />
              <el-option label="曲线" value="curve" />
              <el-option label="圆角" value="round" />
            </el-select>
          </div>
          
          <!-- 连线宽度 -->
          <div class="line-width">
            <span>线条宽度</span>
            <el-slider v-model="lineWidth" :min="1" :max="5" @change="updateLineStyle"></el-slider>
          </div>
          
          <!-- 连线风格 - 虚线等 -->
          <div class="line-dash">
            <span>线条风格</span>
            <el-select v-model="lineDash" @change="updateLineStyle" size="small">
              <el-option label="实线" value="solid" />
              <el-option label="虚线" value="dashed" />
              <el-option label="点线" value="dotted" />
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
        
        <!-- 应用到全局按钮 -->
        <div class="style-section">
          <el-button type="primary" size="small" @click="applyStyleToAll">
            将此风格应用到所有同级节点
          </el-button>
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
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'  // 如果需要PDF导出，也需要安装：npm install jspdf

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

// 样式相关数据
const nodeFontWeight = ref('normal')
const nodeFontStyle = ref('normal')
const nodeTextDecoration = ref('none')
const nodeBorderWidth = ref(0)
const nodeBorderColor = ref('#cccccc')
const nodeOpacity = ref(100)
const lineWidth = ref(2)
const lineDash = ref('solid')
const nodeFontFamily = ref('')

// 预定义颜色
const predefineColors = ref([
  '#ff4500', '#ff8c00', '#ffd700', '#90ee90', '#00ced1', 
  '#1e90ff', '#c71585', '#ff69b4', '#8a2be2', '#4169e1'
])

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
  { value: 'default', label: '默认' },
  { value: 'classic', label: '经典' },
  { value: 'dark', label: '暗色' },
  { value: 'primary', label: '主色调' },
  { value: 'green', label: '绿色' },
  { value: 'purple', label: '紫色' },
  { value: 'gray', label: '灰色' },
  { value: 'red', label: '红色' },
  { value: 'blue', label: '蓝色' }
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
  
  // 重要：从map中恢复布局和主题设置
  currentLayout.value = map.layout || 'mindmap' // 默认为mindmap
  currentTheme.value = map.theme || 'default'   // 默认为default
  
  console.log('当前图的布局:', currentLayout.value, '主题:', currentTheme.value)
  
  if (mindMap.value && map.content) {
    try {
      console.log('设置思维导图数据:', map.content)
      
      // 重新初始化思维导图实例，确保使用正确的布局和主题
      if (mindMapContainer.value) {
        // 销毁旧实例
        try {
          mindMap.value.destroy && mindMap.value.destroy()
        } catch (e) {
          console.warn('销毁旧实例失败:', e)
        }
        
        // 创建新实例
        setTimeout(() => {
          initMindMapInstance(map.content)
          setupEventListeners()
        }, 100)
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
    console.log('初始化思维导图实例', 
      '数据:', initialData, 
      '布局:', currentLayout.value, 
      '主题:', currentTheme.value
    )
    
    // 清空容器
    if (mindMapContainer.value) {
      mindMapContainer.value.innerHTML = ''
    }
    
    // 生成当前主题的配置
    const themeConfig = GenerateThemeConfig(currentTheme.value)
    
    // 使用完整配置
    const options = {
      el: mindMapContainer.value,
      data: initialData,
      width: mindMapContainer.value.clientWidth,
      height: mindMapContainer.value.clientHeight,
      layout: currentLayout.value,
      theme: currentTheme.value,
      customTheme: {
        // 添加自定义主题配置
        [currentTheme.value]: themeConfig
      },
      themeConfig: themeConfig,  // 直接提供主题配置
      
      // 增加基本功能支持
      contextMenu: true,
      keyboard: true,
      mousewheelAction: 'zoom',
      
      // 样式相关配置
      style: {
        theme: currentTheme.value,
        // 确保应用主题样式
        ...themeConfig
      },
      
      // 确保启用命令系统
      enableCommand: true,
      
      // 配置命令快捷键
      keyCommand: {
        'undo': 'ctrl+z',
        'redo': 'ctrl+y'
      }
    }
    
    // 创建实例
    mindMap.value = new MindMap(options)
    
    // 设置事件监听
    setupEventListeners()
    
    // 显示应用状态
    console.log('创建的思维导图实例:', mindMap.value)
    console.log('容器尺寸:', mindMapContainer.value.clientWidth, 'x', mindMapContainer.value.clientHeight)
    
    // 打印库的版本信息，帮助调试
    if (mindMap.value.version) {
      console.log('思维导图库版本:', mindMap.value.version)
    }
  } catch (e) {
    console.error('思维导图实例化失败:', e)
    ElMessage.error('思维导图初始化失败')
  }
}

// 设置事件监听
const setupEventListeners = () => {
  if (!mindMap.value) return
  
  try {
    // 监听命令执行，更新撤销/重做状态
    mindMap.value.on('command_executed', () => {
      updateUndoRedoState()
    })
    
    // 监听节点变化
    mindMap.value.on('node_click', (node) => {
      selectedNode.value = node
    })
    
    // 其他事件监听...
    
    // 初始化状态
    updateUndoRedoState()
  } catch (e) {
    console.error('设置事件监听失败:', e)
  }
}

// 更新撤销/重做状态
const updateUndoRedoState = () => {
  if (!mindMap.value) return
  
  try {
    if (mindMap.value.command) {
      // 使用命令系统检查状态
      canUndo.value = mindMap.value.command.hasUndo()
      canRedo.value = mindMap.value.command.hasRedo()
    } else {
      // 备选方案：检查历史记录
      const history = mindMap.value.history
      if (history) {
        const currentIndex = history.currentIndex || 0
        canUndo.value = currentIndex > 0
        canRedo.value = currentIndex < history.list.length - 1
      }
    }
  } catch (e) {
    console.error('更新撤销/重做状态失败:', e)
  }
}

// 创建新导图
const createNewMap = () => {
  // 验证输入
  if (!newMapForm.value.title.trim()) {
    ElMessage.warning('请输入导图标题')
    return
  }

  // 创建新导图时添加布局和主题字段
  const newMap = {
    id: Date.now().toString(),
    title: newMapForm.value.title,
    description: newMapForm.value.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    layout: currentLayout.value, // 保存当前布局
    theme: currentTheme.value,   // 保存当前主题
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
  loadMap(newMap)

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

// 改进导出功能实现
const confirmExport = () => {
  if (!mindMap.value) return
  
  const filename = exportForm.value.filename || '思维导图'
  
  try {
    // 获取导出选项
    const exportOptions = {
      fileName: filename,
      backgroundColor: exportForm.value.backgroundColor,
      scale: exportForm.value.quality
    }
    
    // 根据不同类型处理导出
    switch (exportForm.value.type) {
      case 'png':
        exportToPng(exportOptions)
        break
      case 'svg':
        exportToSvg(exportOptions)
        break
      case 'json':
        exportToJson(exportOptions)
        break
      case 'pdf':
        exportToPdf(exportOptions)
        break
    }
    
    showExportDialog.value = false
    ElMessage.success('导出成功')
  } catch (e) {
    console.error('导出失败:', e)
    ElMessage.error('导出失败: ' + (e.message || '未知错误'))
  }
}

// PNG导出
const exportToPng = async (options) => {
  try {
    // 尝试不同可能的导出方法
    if (typeof mindMap.value.exportPng === 'function') {
      await mindMap.value.exportPng(options)
      return
    }
    
    if (typeof mindMap.value.export?.png === 'function') {
      await mindMap.value.export.png(options)
      return
    }
    
    if (typeof mindMap.value.exportImage === 'function') {
      await mindMap.value.exportImage({...options, type: 'png'})
      return
    }
    
    // 使用 html2canvas 导出
    const container = mindMapContainer.value
    if (!container) {
      throw new Error("找不到思维导图容器")
    }
    
    // 获取当前容器的实际内容区域
    const mindMapContent = container.querySelector('.mind-map-container') || container
    const contentBox = mindMapContent.getBoundingClientRect()
    
    // 创建临时容器以确保捕获完整内容
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.left = '-9999px'
    tempContainer.style.width = `${contentBox.width}px`
    tempContainer.style.height = `${contentBox.height}px`
    document.body.appendChild(tempContainer)
    
    // 克隆思维导图内容到临时容器
    tempContainer.appendChild(mindMapContent.cloneNode(true))
    
    // 使用 html2canvas 进行导出
    const canvas = await html2canvas(tempContainer, {
      backgroundColor: options.backgroundColor || '#ffffff',
      scale: options.scale || 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      foreignObjectRendering: true
    })
    
    // 清理临时容器
    document.body.removeChild(tempContainer)
    
    // 创建下载链接
    const link = document.createElement('a')
    link.download = `${options.fileName}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    
    ElMessage.success('导出PNG成功')
  } catch (e) {
    console.error('导出PNG失败:', e)
    ElMessage.error('导出PNG失败: ' + e.message)
  }
}

// SVG导出辅助函数
const svgExport = (svgElement, options) => {
  // 克隆SVG以避免修改原始元素
  const clonedSvg = svgElement.cloneNode(true)
  
  // 设置背景颜色
  if (options.backgroundColor) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    rect.setAttribute("width", "100%")
    rect.setAttribute("height", "100%")
    rect.setAttribute("fill", options.backgroundColor)
    clonedSvg.insertBefore(rect, clonedSvg.firstChild)
  }
  
  // 序列化SVG为字符串
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clonedSvg)
  
  // 使用Blob创建下载链接
  const blob = new Blob([svgString], {type: 'image/svg+xml'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${options.fileName}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

// SVG导出
const exportToSvg = async (options) => {
  try {
    // 尝试内置的SVG导出方法
    if (typeof mindMap.value.exportSvg === 'function') {
      await mindMap.value.exportSvg(options)
      return
    }
    
    // 查找SVG元素
    const container = mindMapContainer.value
    const svgElement = container.querySelector('svg')
    if (!svgElement) {
      throw new Error("找不到SVG元素")
    }
    
    // 克隆SVG以避免修改原始元素
    const clonedSvg = svgElement.cloneNode(true)
    
    // 设置背景颜色
    if (options.backgroundColor) {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      rect.setAttribute("width", "100%")
      rect.setAttribute("height", "100%")
      rect.setAttribute("fill", options.backgroundColor)
      clonedSvg.insertBefore(rect, clonedSvg.firstChild)
    }
    
    // 序列化SVG
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clonedSvg)
    
    // 创建下载链接
    const blob = new Blob([svgString], {type: 'image/svg+xml'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${options.fileName}.svg`
    a.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('导出SVG成功')
  } catch (e) {
    console.error('导出SVG失败:', e)
    ElMessage.error('导出SVG失败: ' + e.message)
  }
}

// JSON导出
const exportToJson = async (options) => {
  try {
    let jsonData
    
    // 尝试获取思维导图数据
    if (typeof mindMap.value.getData === 'function') {
      jsonData = mindMap.value.getData()
    } else if (typeof mindMap.value.export?.json === 'function') {
      jsonData = await mindMap.value.export.json()
      return // 这种情况下可能已经处理了下载
    } else if (mindMap.value.data) {
      jsonData = mindMap.value.data
    } else {
      throw new Error("无法获取思维导图数据")
    }
    
    // 将数据转换为JSON字符串并下载
    const jsonStr = JSON.stringify(jsonData, null, 2)
    const blob = new Blob([jsonStr], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${options.fileName}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('导出JSON成功')
  } catch (e) {
    console.error('导出JSON失败:', e)
    ElMessage.error('导出JSON失败: ' + e.message)
  }
}

// PDF导出
const exportToPdf = async (options) => {
  try {
    // 尝试内置的PDF导出方法
    if (typeof mindMap.value.exportPdf === 'function') {
      await mindMap.value.exportPdf(options)
      return
    }
    
    // 使用 html2canvas + jsPDF 导出
    const container = mindMapContainer.value
    if (!container) {
      throw new Error("找不到思维导图容器")
    }
    
    const mindMapContent = container.querySelector('.mind-map-container') || container
    const canvas = await html2canvas(mindMapContent, {
      backgroundColor: options.backgroundColor || '#ffffff',
      scale: options.scale || 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      foreignObjectRendering: true
    })
    
    // 获取画布尺寸
    const imgWidth = 210  // A4 宽度 (mm)
    const pageHeight = 297  // A4 高度 (mm)
    const imgHeight = canvas.height * imgWidth / canvas.width
    
    // 创建 PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // 如果内容高度超过一页，需要分页处理
    let heightLeft = imgHeight
    let position = 0
    
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    // 保存 PDF
    pdf.save(`${options.fileName}.pdf`)
    
    ElMessage.success('导出PDF成功')
  } catch (e) {
    console.error('导出PDF失败:', e)
    ElMessage.error('导出PDF失败: ' + e.message)
  }
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
  
  // 收集所有样式属性
  const styleData = {
    textColor: nodeTextColor.value,
    fontSize: nodeFontSize.value,
    backgroundColor: nodeColor.value,
    shape: nodeShape.value,
    fontWeight: nodeFontWeight.value,
    fontStyle: nodeFontStyle.value,
    textDecoration: nodeTextDecoration.value,
    borderWidth: nodeBorderWidth.value,
    borderColor: nodeBorderColor.value,
    opacity: nodeOpacity.value / 100,  // 转为0-1
    fontFamily: nodeFontFamily.value
  }
  
  // 更新节点
  try {
    mindMap.value.updateNode(styleData, [selectedNode.value])
    
    // 尝试触发重新渲染
    mindMap.value.render && mindMap.value.render()
  } catch (e) {
    console.error('更新节点样式失败:', e)
    ElMessage.error('更新样式失败')
  }
}

const updateLineStyle = () => {
  if (!mindMap.value || !selectedNode.value) return
  
  const lineData = {
    lineColor: lineColor.value,
    lineStyle: lineStyle.value,
    lineWidth: lineWidth.value,
    lineDash: lineDash.value
  }
  
  try {
    mindMap.value.updateNode(lineData, [selectedNode.value])
    
    // 尝试触发重新渲染
    mindMap.value.render && mindMap.value.render()
  } catch (e) {
    console.error('更新连线样式失败:', e)
    ElMessage.error('更新连线样式失败')
  }
}

const toggleBold = () => {
  nodeFontWeight.value = nodeFontWeight.value === 'bold' ? 'normal' : 'bold'
  updateNodeStyle()
}

const toggleItalic = () => {
  nodeFontStyle.value = nodeFontStyle.value === 'italic' ? 'normal' : 'italic'
  updateNodeStyle()
}

const toggleUnderline = () => {
  nodeTextDecoration.value = nodeTextDecoration.value === 'underline' ? 'none' : 'underline'
  updateNodeStyle()
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
  if (!mindMap.value || !currentMap.value) return
  try {
    console.log('尝试切换布局为:', layout)
    
    // 更新当前布局
    currentLayout.value = layout
    
    // 重要：更新当前思维导图对象的布局设置
    const index = maps.value.findIndex(m => m.id === currentMap.value.id)
    if (index > -1) {
      maps.value[index].layout = layout
      currentMap.value.layout = layout
      
      // 保存到存储
      saveMapsToStorage()
    }
    
    // 应用布局更改
    if (typeof mindMap.value.setLayout === 'function') {
      mindMap.value.setLayout(layout)
      mindMap.value.render && mindMap.value.render()
      ElMessage.success(`布局已更改为: ${layout}`)
      return
    }
    
    // 如果API调用失败，尝试重新初始化
    // 保存当前数据
    let currentData = null
    try {
      if (typeof mindMap.value.getData === 'function') {
        currentData = mindMap.value.getData()
      } else if (mindMap.value.data) {
        currentData = { data: JSON.parse(JSON.stringify(mindMap.value.data)) }
      }
    } catch (e) {
      console.error('获取当前数据失败:', e)
    }
    
    // 如果获取到了数据，重新初始化
    if (currentData) {
      // 销毁旧实例
      try {
        mindMap.value.destroy && mindMap.value.destroy()
      } catch (e) {
        console.warn('销毁旧实例失败:', e)
      }
      
      // 使用新布局初始化
      setTimeout(() => {
        try {
          initMindMapInstance(currentData)
          setupEventListeners()
          ElMessage.success(`布局已更改为: ${layout}`)
        } catch (e) {
          console.error('重新初始化失败:', e)
          ElMessage.error('布局切换失败')
        }
      }, 100)
      return
    }
    
    ElMessage.warning('布局切换功能在当前版本不可用')
  } catch (e) {
    console.error('切换布局失败:', e)
    ElMessage.error('切换布局失败')
  }
}

// 改进主题切换函数，确保实时生效
const changeTheme = (theme) => {
  if (!mindMap.value || !currentMap.value) return
  try {
    console.log('尝试切换主题为:', theme)
    
    // 更新当前主题
    currentTheme.value = theme
    
    // 更新当前思维导图对象的主题设置
    const index = maps.value.findIndex(m => m.id === currentMap.value.id)
    if (index > -1) {
      maps.value[index].theme = theme
      currentMap.value.theme = theme
      
      // 保存到存储
      saveMapsToStorage()
    }
    
    // 获取当前思维导图数据以便重新渲染
    let currentData = null
    try {
      if (typeof mindMap.value.getData === 'function') {
        currentData = mindMap.value.getData()
      } else if (mindMap.value.data) {
        currentData = { data: JSON.parse(JSON.stringify(mindMap.value.data)) }
      }
    } catch (e) {
      console.error('获取当前数据失败:', e)
    }
    
    // 获取当前视图状态（位置和缩放）
    let viewState = null
    try {
      if (mindMap.value.getViewState) {
        viewState = mindMap.value.getViewState()
      } else if (mindMap.value.view) {
        viewState = {
          scale: mindMap.value.view.scale || 1,
          x: mindMap.value.view.x || 0,
          y: mindMap.value.view.y || 0
        }
      }
    } catch (e) {
      console.error('获取视图状态失败:', e)
    }
    
    // 强制重新初始化渲染，这是确保主题完全应用的最可靠方式
    try {
      // 销毁旧实例
      mindMap.value.destroy && mindMap.value.destroy()
    } catch (e) {
      console.warn('销毁旧实例失败:', e)
    }
    
    // 清空容器并重新创建实例
    if (mindMapContainer.value) {
      mindMapContainer.value.innerHTML = ''
      
      // 重新初始化
      setTimeout(() => {
        // 只有当获取到数据时才初始化
        if (currentData) {
          initMindMapInstance(currentData)
          setupEventListeners()
          
          // 恢复视图状态
          if (viewState && mindMap.value) {
            try {
              if (mindMap.value.setViewState) {
                mindMap.value.setViewState(viewState)
              } else if (mindMap.value.view) {
                mindMap.value.view.scale = viewState.scale
                mindMap.value.view.x = viewState.x
                mindMap.value.view.y = viewState.y
                mindMap.value.render()
              }
            } catch (e) {
              console.warn('恢复视图状态失败:', e)
            }
          }
          
          ElMessage.success(`主题已更改为: ${theme}`)
        } else {
          console.error('重新初始化失败: 无法获取当前数据')
          ElMessage.error('主题切换失败')
        }
      }, 50)
    }
  } catch (e) {
    console.error('切换主题失败:', e)
    ElMessage.error('主题切换失败')
  }
}

// 生成主题配置
const GenerateThemeConfig = (theme) => {
  // 基础配置
  const baseConfig = {
    // 基本背景和颜色
    backgroundColor: '#fff',
    color: '#333',
    
    // 连线样式
    lineColor: '#666',
    lineWidth: 2,
    lineStyle: 'curve', // curve, straight, round
    
    // 连接线风格
    generalizationLineColor: '#999',
    generalizationLineWidth: 1,
    
    // 根节点样式
    rootNodeBorderRadius: 6,
    rootNodeBackgroundColor: '#f66',
    rootNodeColor: '#fff',
    rootNodeFontSize: 18,
    rootNodePadding: [10, 15],
    rootNodeBorderWidth: 0,
    rootNodeBorderColor: 'transparent',
    
    // 二级节点样式
    secondNodeBorderRadius: 5,
    secondNodeBackgroundColor: '#fd9',
    secondNodeColor: '#555',
    secondNodeFontSize: 16,
    secondNodePadding: [6, 12],
    secondNodeBorderWidth: 0,
    secondNodeBorderColor: 'transparent',
    
    // 子节点样式
    childNodeBorderRadius: 5,
    childNodeBackgroundColor: '#eee',
    childNodeColor: '#555',
    childNodeFontSize: 14,
    childNodePaddingX: 10,
    childNodePaddingY: 6,
    childNodeBorderWidth: 0,
    childNodeBorderColor: 'transparent',
    
    // 激活状态
    activeNodeBorderColor: '#409eff',
    activeNodeBorderWidth: 2,
    activeNodeBoxShadow: '0 0 6px rgba(64, 158, 255, 0.5)',
    
    // 连线样式
    lineTextColor: '#666',
    lineTextFontSize: 12,
  }
  
  // 根据主题名称返回不同配置
  switch (theme) {
    case 'default':
      return {
        ...baseConfig,
        backgroundColor: '#f5f5f5',
        rootNodeBackgroundColor: '#ff7043',
        secondNodeBackgroundColor: '#ffab91',
        childNodeBackgroundColor: '#ffe0b2',
        lineStyle: 'curve'
      }
    case 'classic':
      return {
        ...baseConfig,
        rootNodeBorderRadius: 4,
        rootNodeBackgroundColor: '#3573b3',
        rootNodeColor: '#fff',
        secondNodeBackgroundColor: '#4f9ff0',
        secondNodeColor: '#fff',
        childNodeBackgroundColor: '#e6f5ff',
        childNodeColor: '#333',
        lineColor: '#549ae8',
        lineStyle: 'curve'
      }
    case 'dark':
      return {
        ...baseConfig,
        backgroundColor: '#333',
        color: '#eee',
        lineColor: '#aaa',
        rootNodeBackgroundColor: '#3e3e3e',
        rootNodeBorderColor: '#666',
        rootNodeBorderWidth: 1,
        rootNodeColor: '#fff',
        secondNodeBackgroundColor: '#484848',
        secondNodeColor: '#fff',
        childNodeBackgroundColor: '#444',
        childNodeColor: '#ddd',
        childNodeBorderColor: '#555',
        childNodeBorderWidth: 1,
        lineStyle: 'round',
        activeNodeBorderColor: '#4db6ac',
        activeNodeBoxShadow: '0 0 6px rgba(77, 182, 172, 0.5)'
      }
    case 'primary':
      return {
        ...baseConfig,
        rootNodeBorderRadius: 25,
        rootNodeBackgroundColor: '#409eff',
        secondNodeBorderRadius: 15,
        secondNodeBackgroundColor: '#79bbff',
        childNodeBorderRadius: 12,
        childNodeBackgroundColor: '#e6f5ff',
        lineColor: '#409eff',
        lineStyle: 'curve'
      }
    case 'green':
      return {
        ...baseConfig,
        rootNodeBorderRadius: 0,
        rootNodeBackgroundColor: '#67c23a',
        secondNodeBorderRadius: 0,
        secondNodeBackgroundColor: '#95d475',
        childNodeBorderRadius: 0,
        childNodeBackgroundColor: '#f0f9eb',
        lineColor: '#67c23a',
        lineStyle: 'straight'
      }
    case 'purple':
      return {
        ...baseConfig,
        rootNodeBackgroundColor: '#9966cc',
        rootNodeBorderRadius: 8,
        secondNodeBackgroundColor: '#b990f0',
        childNodeBackgroundColor: '#f4f0f9',
        lineColor: '#9966cc',
        lineStyle: 'round'
      }
    case 'gray':
      return {
        ...baseConfig,
        rootNodeBackgroundColor: '#606266',
        secondNodeBackgroundColor: '#909399',
        childNodeBackgroundColor: '#f5f7fa',
        lineColor: '#909399',
        childNodeBorderColor: '#dcdfe6',
        childNodeBorderWidth: 1,
        lineStyle: 'straight'
      }
    case 'red':
      return {
        ...baseConfig,
        rootNodeBackgroundColor: '#f56c6c',
        rootNodeBorderRadius: 0,
        secondNodeBackgroundColor: '#fab6b6',
        secondNodeBorderRadius: 0,
        childNodeBackgroundColor: '#fef0f0',
        childNodeBorderRadius: 0,
        lineColor: '#f56c6c',
        lineStyle: 'straight'
      }
    case 'blue':
      return {
        ...baseConfig,
        rootNodeBackgroundColor: '#1890ff',
        rootNodeBorderRadius: 16,
        secondNodeBackgroundColor: '#69c0ff',
        secondNodeBorderRadius: 16,
        childNodeBackgroundColor: '#e6f7ff',
        childNodeBorderRadius: 16,
        lineColor: '#1890ff',
        lineStyle: 'curve'
      }
    default:
      return baseConfig
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
    // 使用命令系统执行撤销
    if (mindMap.value.command) {
      mindMap.value.command.execute('undo')
    } else if (mindMap.value.execCommand) {
      mindMap.value.execCommand('undo')
    }
    
    // 更新状态
    updateUndoRedoState()
    // 重新渲染
    mindMap.value.render()
  } catch (e) {
    console.error('撤销失败:', e)
    ElMessage.error('撤销失败')
  }
}

const redo = () => {
  if (!mindMap.value) return
  try {
    // 使用命令系统执行重做
    if (mindMap.value.command) {
      mindMap.value.command.execute('redo')
    } else if (mindMap.value.execCommand) {
      mindMap.value.execCommand('redo')
    }
    
    // 更新状态
    updateUndoRedoState()
    // 重新渲染
    mindMap.value.render()
  } catch (e) {
    console.error('重做失败:', e)
    ElMessage.error('重做失败')
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

// 初始化节点样式信息
const initNodeStyleInfo = (node) => {
  if (!node) return
  
  // 读取节点当前的样式
  const data = node.data || {}
  
  selectedNodeText.value = data.text || ''
  nodeTextColor.value = data.textColor || '#333333'
  nodeFontSize.value = data.fontSize || 14
  nodeColor.value = data.backgroundColor || '#ffffff'
  nodeShape.value = data.shape || 'roundRect'
  lineColor.value = data.lineColor || '#666666'
  lineStyle.value = data.lineStyle || 'curve'
  selectedMarker.value = data.marker || ''
  
  // 新增样式属性
  nodeFontWeight.value = data.fontWeight || 'normal'
  nodeFontStyle.value = data.fontStyle || 'normal'
  nodeTextDecoration.value = data.textDecoration || 'none'
  nodeBorderWidth.value = data.borderWidth || 0
  nodeBorderColor.value = data.borderColor || '#cccccc'
  nodeOpacity.value = data.opacity !== undefined ? data.opacity * 100 : 100
  lineWidth.value = data.lineWidth || 2
  lineDash.value = data.lineDash || 'solid'
  nodeFontFamily.value = data.fontFamily || ''
}

// 监听选中节点变化
watch(selectedNode, (newVal) => {
  if (newVal) {
    initNodeStyleInfo(newVal)
  }
})

// 将当前样式应用到所有同级节点
const applyStyleToAll = () => {
  if (!mindMap.value || !selectedNode.value) return
  
  try {
    // 收集当前样式
    const styleData = {
      textColor: nodeTextColor.value,
      fontSize: nodeFontSize.value,
      backgroundColor: nodeColor.value,
      shape: nodeShape.value,
      fontWeight: nodeFontWeight.value,
      fontStyle: nodeFontStyle.value,
      textDecoration: nodeTextDecoration.value,
      borderWidth: nodeBorderWidth.value,
      borderColor: nodeBorderColor.value,
      opacity: nodeOpacity.value / 100,
      fontFamily: nodeFontFamily.value,
      lineColor: lineColor.value,
      lineStyle: lineStyle.value,
      lineWidth: lineWidth.value,
      lineDash: lineDash.value
    }
    
    // 获取同级节点
    let siblings = []
    if (selectedNode.value.parent) {
      // 获取父节点的所有子节点作为同级节点
      siblings = selectedNode.value.parent.children || []
    } else {
      // 如果是根节点，则应用到所有一级节点
      siblings = [selectedNode.value, ...(selectedNode.value.children || [])]
    }
    
    // 应用样式到所有同级节点
    mindMap.value.updateNode(styleData, siblings)
    mindMap.value.render && mindMap.value.render()
    
    ElMessage.success('样式已应用到所有同级节点')
  } catch (e) {
    console.error('应用样式到同级节点失败:', e)
    ElMessage.error('应用样式失败')
  }
}
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

.font-buttons .el-button.active {
  background-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.font-family {
  margin-top: 8px;
}

.border-controls, .opacity-control, .line-width, .line-dash {
  margin-top: 10px;
}

.border-width, .border-color, .opacity-control, .line-width, .line-dash {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.border-width span, .border-color span, .opacity-control span, .line-width span, .line-dash span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  width: 70px;
}

.border-width .el-slider, .opacity-control .el-slider, .line-width .el-slider {
  flex: 1;
  margin-left: 8px;
}

/* 调整样式面板的滚动条 */
.panel-content {
  padding: 12px;
  overflow-y: auto;
  max-height: calc(100vh - 180px);
}

.style-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.style-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
</style>