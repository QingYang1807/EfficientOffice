<template>
  <div class="menu-manager">
    <div class="menu-header">
      <h3>菜单管理</h3>
      <div class="header-actions">
        <el-button type="primary" @click="handleAddRootMenu">
          <el-icon><plus /></el-icon>添加根菜单
        </el-button>
      </div>
    </div>

    <div class="menu-content">
      <!-- 左侧树形菜单 -->
      <div class="menu-tree">
        <el-tree
          ref="treeRef"
          :data="menuList"
          node-key="id"
          :props="{ label: 'title' }"
          draggable
          :allow-drop="handleAllowDrop"
          @node-drop="handleDrop"
          default-expand-all
        >
          <template #default="{ node, data }">
            <div class="tree-node">
              <div class="node-content">
                <el-icon v-if="!data.editing"><component :is="data.icon" /></el-icon>
                <template v-if="data.editing">
                  <el-input
                    v-model="data.title"
                    size="small"
                    class="edit-input"
                    @blur="handleSave(data)"
                    @keyup.enter="handleSave(data)"
                  />
                </template>
                <span v-else class="label">{{ node.label }}</span>
              </div>
              <div class="node-actions">
                <el-button-group>
                  <el-button
                    type="primary"
                    size="small"
                    text
                    @click.stop="handleAddChild(data)"
                  >
                    <el-icon><plus /></el-icon>
                  </el-button>
                  <el-button
                    type="primary"
                    size="small"
                    text
                    @click.stop="handleEdit(data)"
                  >
                    <el-icon><edit /></el-icon>
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    text
                    @click.stop="handleDelete(node, data)"
                  >
                    <el-icon><delete /></el-icon>
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </template>
        </el-tree>
      </div>

      <!-- 右侧编辑表单 -->
      <div class="menu-form" v-if="currentMenu">
        <el-form :model="currentMenu" label-width="80px">
          <el-form-item label="菜单名称">
            <el-input v-model="currentMenu.title" />
          </el-form-item>
          
          <el-form-item label="路径">
            <el-input 
              v-model="currentMenu.path"
              placeholder="输入系统路由或外部URL"
            />
          </el-form-item>
          
          <el-form-item label="图标">
            <el-select v-model="currentMenu.icon" class="icon-select">
              <el-option
                v-for="icon in iconList"
                :key="icon"
                :label="icon"
                :value="icon"
              >
                <el-icon><component :is="icon" /></el-icon>
                <span style="margin-left: 8px">{{ icon }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="显示">
            <el-switch v-model="currentMenu.visible" />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSaveForm">保存</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Edit,
  Delete,
  HomeFilled,
  List,
  Timer,
  Aim,
  Share,
  Memo,
  Collection,
  Calendar,
  ChatDotRound,
  EditPen,
} from '@element-plus/icons-vue'

const treeRef = ref(null)
const menuList = ref([])
const currentMenu = ref(null)

// 预定义图标列表
const iconList = [
  'HomeFilled',
  'List',
  'Timer',
  'Aim',
  'Share',
  'Memo',
  'Collection',
  'Calendar',
  'ChatDotRound',
  'EditPen',
]

// 初始化默认菜单数据
const defaultMenus = [
  {
    id: 1,
    title: '仪表盘',
    path: '/dashboard',
    icon: 'HomeFilled',
    visible: true,
    children: []
  },
  {
    id: 2,
    title: '任务管理',
    path: '/tasks',
    icon: 'List',
    visible: true,
    children: [
      {
        id: 21,
        title: '待办事项',
        path: '/todos',
        icon: 'List',
        visible: true,
        children: []
      },
      {
        id: 22,
        title: '目标管理',
        path: '/goals',
        icon: 'Aim',
        visible: true,
        children: []
      }
    ]
  }
]

onMounted(() => {
  loadMenus()
})

// 加载菜单数据
const loadMenus = () => {
  const savedMenus = localStorage.getItem('menu-config')
  if (savedMenus) {
    menuList.value = JSON.parse(savedMenus)
  } else {
    menuList.value = defaultMenus
    saveMenus()
  }
}

// 添加根菜单
const handleAddRootMenu = () => {
  const newMenu = {
    id: Date.now(),
    title: '新菜单项',
    path: '',
    icon: 'Menu',
    visible: true,
    children: [],
    editing: true
  }
  menuList.value.push(newMenu)
  currentMenu.value = newMenu
}

// 添加子菜单
const handleAddChild = (data) => {
  const newChild = {
    id: Date.now(),
    title: '新子菜单',
    path: '',
    icon: 'Menu',
    visible: true,
    children: [],
    editing: true
  }
  if (!data.children) {
    data.children = []
  }
  data.children.push(newChild)
  currentMenu.value = newChild
  saveMenus()
}

// 编辑菜单
const handleEdit = (data) => {
  currentMenu.value = data
}

// 删除菜单
const handleDelete = (node, data) => {
  ElMessageBox.confirm(
    '确定要删除这个菜单项吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const parent = node.parent
    const children = parent.data.children || parent.data
    const index = children.findIndex(d => d.id === data.id)
    children.splice(index, 1)
    saveMenus()
    ElMessage.success('删除成功')
    if (currentMenu.value?.id === data.id) {
      currentMenu.value = null
    }
  })
}

// 保存编辑中的菜单项
const handleSave = (data) => {
  data.editing = false
  saveMenus()
}

// 保存表单
const handleSaveForm = () => {
  saveMenus()
  ElMessage.success('保存成功')
}

// 允许拖拽的条件
const handleAllowDrop = (draggingNode, dropNode, type) => {
  // 防止拖拽到自身或其子节点
  if (draggingNode.data.id === dropNode.data.id) {
    return false
  }
  return true
}

// 处理拖拽完成
const handleDrop = (draggingNode, dropNode, type) => {
  saveMenus()
}

// 保存菜单配置
const saveMenus = () => {
  localStorage.setItem('menu-config', JSON.stringify(menuList.value))
}
</script>

<style scoped>
.menu-manager {
  padding: 20px;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.menu-content {
  display: flex;
  gap: 20px;
  min-height: 500px;
}

.menu-tree {
  flex: 0 0 300px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 10px;
}

.menu-form {
  flex: 1;
  padding: 20px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 0;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-input {
  width: 150px;
}

.label {
  font-size: 14px;
}

.node-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.icon-select {
  width: 100%;
}

:deep(.el-tree-node__content) {
  height: 32px;
}

:deep(.el-tree-node.is-drop-inner > .el-tree-node__content) {
  background-color: var(--el-color-primary-light-9);
}
</style> 