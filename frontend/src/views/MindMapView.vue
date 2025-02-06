<template>
  <div class="mindmap-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button-group>
        <el-button @click="createNewMap">
          <el-icon><Plus /></el-icon>新建导图
        </el-button>
        <el-button @click="saveCurrentMap">
          <el-icon><Save /></el-icon>保存
        </el-button>
        <el-button @click="exportMap">
          <el-icon><Download /></el-icon>导出
        </el-button>
      </el-button-group>

      <el-button-group>
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

      <el-button-group>
        <el-button @click="undo" :disabled="!canUndo">
          <el-icon><Back /></el-icon>
        </el-button>
        <el-button @click="redo" :disabled="!canRedo">
          <el-icon><Right /></el-icon>
        </el-button>
      </el-button-group>

      <el-select v-model="currentTheme" placeholder="选择主题">
        <el-option
          v-for="theme in themes"
          :key="theme.value"
          :label="theme.label"
          :value="theme.value"
        />
      </el-select>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import MindMap from 'simple-mind-map'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Save, Download, ZoomIn, ZoomOut,
  FullScreen, Back, Right, More, Search
} from '@element-plus/icons-vue'

// 状态
const mindMapContainer = ref(null)
const mindMap = ref(null)
const currentMap = ref(null)
const maps = ref([])
const searchQuery = ref('')
const showCreateDialog = ref(false)
const currentTheme = ref('default')
const canUndo = ref(false)
const canRedo = ref(false)

// 新建导图表单
const newMapForm = ref({
  title: '',
  description: ''
})

// 主题列表
const themes = [
  { label: '默认主题', value: 'default' },
  { label: '清新主题', value: 'fresh' },
  { label: '暗色主题', value: 'dark' },
  { label: '商务主题', value: 'business' }
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
  currentMap.value = map
  if (mindMap.value && map.content) {
    // 直接使用保存的数据结构
    const data = map.content
    
    // 重新初始化思维导图
    if (mindMapContainer.value) {
      // 先销毁旧实例
      mindMap.value.destroy()
      
      // 创建新实例
      mindMap.value = new MindMap({
        el: mindMapContainer.value,
        data: data,
        width: mindMapContainer.value.clientWidth,
        height: mindMapContainer.value.clientHeight,
        layout: 'mindMap',
        draggable: true,
        keyboard: true,
        contextMenu: true,
        theme: 'classic',
        themeConfig: {
          nodeMargin: 20,
          lineWidth: 2,
          lineColor: '#666'
        },
        viewportOptions: {
          padding: 50
        }
      })
      
      // 重新绑定数据变化监听
      mindMap.value.on('data_change', () => {
        // 使用防抖处理频繁保存
        if (saveTimeout) clearTimeout(saveTimeout)
        saveTimeout = setTimeout(() => {
          saveCurrentMap()
        }, 1000)
      })
    }
    mindMap.value.render()
  }
}

// 创建新导图
const createNewMap = () => {
  showCreateDialog.value = true
}

// 处理创建导图
const handleCreateMap = () => {
  if (!newMapForm.value.title) {
    ElMessage.warning('请输入标题')
    return
  }

  const newMap = {
    id: Date.now(),
    title: newMapForm.value.title,
    description: newMapForm.value.description,
    content: {
      data: {
        text: newMapForm.value.title,
        expand: true,
        uid: Date.now().toString(),
        children: []
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  maps.value.unshift(newMap)
  saveMapsToStorage()
  showCreateDialog.value = false
  currentMap.value = newMap
  
  // 确保 mindMap 实例存在
  if (!mindMap.value) {
    initMindMap()
  }
  
  // 等待 DOM 更新后加载导图
  nextTick(() => {
    loadMap(newMap)
  })
  
  ElMessage.success('创建成功')
}

// 保存当前导图
const saveCurrentMap = () => {
  if (!currentMap.value) return
  
  debugger
  const data = mindMap.value?.getData() || {}
  
  // 确保数据结构正确
  const savedData = {
    data: {
      ...data.data,
      children: data.data?.children || []
    }
  }

  const index = maps.value.findIndex(m => m.id === currentMap.value.id)
  if (index > -1) {
    maps.value[index] = {
      ...currentMap.value,
      content: savedData,
      updatedAt: new Date().toISOString()
    }
    saveMapsToStorage()
    console.log('保存的数据:', savedData) // 添加日志以便调试
  }
}

// 导出导图
const exportMap = () => {
  // TODO: 实现导出功能
  ElMessage.info('导出功能开发中...')
}

// 缩放控制
const zoomIn = () => {
  if (mindMap.value) {
    const currentZoom = mindMap.value.getZoom()
    mindMap.value.setZoom(currentZoom + 0.1)
  }
}

const zoomOut = () => {
  if (mindMap.value) {
    const currentZoom = mindMap.value.getZoom()
    mindMap.value.setZoom(Math.max(0.1, currentZoom - 0.1))
  }
}

const resetZoom = () => mindMap.value?.setZoom(1)

// 撤销/重做
const undo = () => mindMap.value?.undo()
const redo = () => mindMap.value?.redo()

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

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

// 存储相关
const saveMapsToStorage = () => {
  localStorage.setItem('mindmaps', JSON.stringify(maps.value))
}

const loadMapsFromStorage = () => {
  const stored = localStorage.getItem('mindmaps')
  if (stored) {
    maps.value = JSON.parse(stored)
    // 如果有已保存的导图，加载第一个
    if (maps.value.length > 0) {
      loadMap(maps.value[0])
    } else {
      resetMindMap()
    }
  }
}

// 生命周期钩子
onMounted(() => {
  // 先加载数据
  loadMapsFromStorage()
  // 如果有导图数据，初始化画布
  if (maps.value.length > 0) {
    nextTick(() => {
      initMindMap()
    })
  }
})

onBeforeUnmount(() => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  mindMap.value?.destroy()
})

// 初始化思维导图
const initMindMap = () => {
  if (!mindMapContainer.value) return
  
  // 初始数据结构
  const initialData = {
    data: {
      text: '中心主题',
      expand: true,
      uid: Date.now().toString(),
      children: []
    }
  }

  mindMap.value = new MindMap({
    el: mindMapContainer.value,
    data: initialData,
    width: mindMapContainer.value.clientWidth,
    height: mindMapContainer.value.clientHeight,
    layout: 'mindMap',
    draggable: true,
    keyboard: true,
    contextMenu: true,
    theme: 'classic',
    themeConfig: {
      nodeMargin: 20,
      lineWidth: 2,
      lineColor: '#666'
    },
    viewportOptions: {
      padding: 50
    }
  })

  // 监听数据变化
  mindMap.value.on('data_change', () => {
    saveCurrentMap()
  })

  // 等待 DOM 更新后渲染
  nextTick(() => {
    mindMap.value.render()
  })
}
</script>

<style scoped>
.mindmap-container {
  height: 100%;
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr;
  gap: 1px;
  background: var(--el-border-color-light);
}

.toolbar {
  grid-column: 1 / -1;
  padding: 8px 16px;
  background: white;
  display: flex;
  gap: 16px;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
}

.sidebar {
  background: white;
  display: flex;
  flex-direction: column;
}

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
</style> 