# Shared Layouts

The standard application route chain is `App.vue → MainLayout.vue → page route`. The login route bypasses `MainLayout.vue` but still renders through `App.vue`.

## `frontend/src/App.vue`

Root application outlet; every route renders through this router view.

```vue
<template>
  <router-view />
</template>

<script>
export default {
  name: 'App',
}
</script>

<style>
body {
  margin: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  position: relative;
}
</style>
```

## `frontend/src/layouts/MainLayout.vue`

Authenticated application shell with fixed header, account menu, collapsible sidebar, and nested route content.

```vue
<template>
  <el-container class="layout-container">
    <el-container class="main-container">
      <el-header>
        <div class="header-left">
          <div class="logo" :class="{ 'collapsed': isCollapse }">
            <img v-if="isCollapse" src="@/assets/logo.svg" alt="Logo" />
            <img v-else src="@/assets/logo-full.svg" alt="Logo" />
          </div>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="avatar-container">
              <el-avatar :size="32" :src="userAvatar">
                <span>{{ userInfo.name?.charAt(0)?.toUpperCase() }}</span>
              </el-avatar>
              <span class="username">{{ userInfo.name }}</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><user /></el-icon>个人信息
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><setting /></el-icon>系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><switch-button /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <div class="layout-content">
          <div class="menu-container" :style="{ width: isCollapse ? '64px' : '200px' }">
            <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
              <AppMenu v-model:is-collapse="isCollapse" />
            </el-aside>
          </div>
          <div class="content-container" :style="{ marginLeft: isCollapse ? '64px' : '200px' }">
            <router-view />
          </div>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeFilled,
  List,
  Timer,
  Aim,
  Fold,
  Expand,
  ArrowDown,
  User,
  Setting,
  SwitchButton,
  Memo,
  Collection,
  Share,
  DocumentChecked,
  Calendar,
  ChatDotRound,
  EditPen,
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import AppMenu from '@/components/AppMenu.vue'

const router = useRouter()
const route = useRoute()

const isCollapse = ref(false)
const activeMenu = computed(() => route.path)

// 模拟用户信息
const userInfo = ref({
  name: '测试用户',
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'  // 可以设置默认头像URL
})

const userAvatar = computed(() => userInfo.value.avatar || '')

const handleSelect = (key) => {
  router.push(key)
}

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 处理下拉菜单命令
const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      await handleLogout()
      break
  }
}

// 处理退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    // TODO: 调用退出登录接口
    router.push('/login')
  } catch (error) {
    // 用户取消退出
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  transition: width 0.3s;
  background-color: var(--el-menu-bg-color);
}

.logo {
  height: 40px;
  margin-right: 20px;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.logo img {
  height: 30px;
}

.logo.collapsed {
  padding: 0 16px;
}

.el-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: white;
}

.main-container {
  min-height: 100vh;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 200px;
}

.el-menu-vertical {
  border-right: none;
}

.header-right {
  display: flex;
  align-items: center;
}

.avatar-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 8px;
  height: 40px;
  border-radius: 20px;
  transition: background-color 0.3s;
}

.avatar-container:hover {
  background-color: var(--el-fill-color-light);
}

.username {
  margin: 0 8px;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.el-dropdown-menu__item {
  display: flex;
  align-items: center;
}

.el-dropdown-menu__item .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

.header-left {
  display: flex;
  align-items: center;
}

.aside-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.main-container {
  flex: 1;
  overflow-y: auto;
}

.layout-main {
  padding: 0;
  height: calc(100vh - 60px); /* 减去header高度 */
  overflow: hidden;
}

.layout-content {
  display: flex;
  height: 100%;
}

.menu-container {
  height: 100%;
  position: fixed;
  left: 0;
  z-index: 1000;
  transition: width 0.3s;
}

.aside {
  height: 100%;
  transition: width 0.3s;
  background-color: var(--el-menu-bg-color);
}

.content-container {
  flex: 1;
  transition: margin-left 0.3s;
  overflow-y: auto;
  padding: 20px;
}
</style>
```

## `frontend/src/components/AppMenu.vue`

Shared collapsible sidebar navigation driven by persisted menu configuration.

```vue
<template>
  <div class="app-menu-container">
    <el-menu
      :default-active="activeMenu"
      class="app-menu"
      :collapse="isCollapse"
    >
      <RenderMenuNodes :menu-nodes="menuNodes" />
    </el-menu>

    <div class="collapse-btn-fixed" @click="toggleCollapse">
      <el-icon>
        <component :is="isCollapse ? 'Expand' : 'Fold'" />
      </el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import RenderMenuNodes from './RenderMenuNodes.vue'
import { Expand, Fold } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 当前激活的菜单项
const activeMenu = computed(() => route.path)

// 接收父组件传入的折叠状态
const props = defineProps({
  isCollapse: {
    type: Boolean,
    default: false
  }
})

// 获取菜单数据
const menuNodes = computed(() => {
  const menuConfig = localStorage.getItem('menu-config')
  if (menuConfig) {
    return JSON.parse(menuConfig)
  }
  return []
})

// 定义事件
const emit = defineEmits(['update:isCollapse'])

// 切换折叠状态
const toggleCollapse = () => {
  emit('update:isCollapse', !props.isCollapse)
}
</script>

<style scoped>
.app-menu-container {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 40px; /* 为固定的折叠按钮留出空间 */
}

.app-menu {
  flex: 1;
  border-right: none;
  transition: width 0.3s;
  width: 200px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 100px; /* 确保有最小高度 */
}

.app-menu.el-menu--collapse {
  width: 64px;
}

/* 固定在屏幕底部的折叠按钮 */
.collapse-btn-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 200px; /* 与菜单宽度一致 */
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-top: 1px solid var(--el-border-color-light);
  background-color: var(--el-menu-bg-color);
  z-index: 10;
  transition: width 0.3s;
}

/* 菜单折叠时按钮宽度同步变化 */
:deep(.el-menu--collapse) ~ .collapse-btn-fixed {
  width: 64px;
}

.collapse-btn-fixed:hover {
  background-color: var(--el-menu-hover-bg-color);
}

/* 自定义滚动条样式 */
.app-menu::-webkit-scrollbar {
  width: 3px;
  display: block !important;
}

.app-menu::-webkit-scrollbar-thumb {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 3px;
  min-height: 30px;
}

.app-menu:hover::-webkit-scrollbar-thumb {
  background-color: rgba(144, 147, 153, 0.5);
}

.app-menu::-webkit-scrollbar-horizontal {
  display: none;
}

/* 添加菜单项文本溢出处理 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  padding-right: 20px !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
```

## `frontend/src/components/RenderMenuNodes.vue`

Recursive menu renderer shared by AppMenu for nested internal and external destinations.

```vue
<template>
  <template v-for="node in menuNodes" :key="node.id">
    <!-- 有子菜单时渲染 sub-menu -->
    <el-sub-menu
      v-if="node.children && node.children.length && node.visible"
      :index="node.path"
    >
      <template #title>
        <el-icon><component :is="node.icon" /></el-icon>
        <span>{{ node.title }}</span>
      </template>
      <!-- 递归渲染子菜单 -->
      <RenderMenuNodes :menu-nodes="node.children" />
    </el-sub-menu>

    <!-- 没有子菜单时渲染 menu-item -->
    <el-menu-item
      v-else-if="node.visible"
      :index="node.path"
      @click="navigateTo(node)"
    >
      <el-icon><component :is="node.icon" /></el-icon>
      <span>{{ node.title }}</span>
    </el-menu-item>
  </template>
</template>

<script setup>
import { useRouter } from 'vue-router'
import {
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

const router = useRouter()

defineProps({
  menuNodes: {
    type: Array,
    required: true
  }
})

// 导航方法
const navigateTo = (node) => {
  const path = node.path

  // 处理不同类型的路径
  if (path.startsWith('@')) {
    // @ 开头表示在新窗口打开外部链接
    window.open(path.slice(1), '_blank')
  } else if (path.startsWith('#')) {
    // # 开头表示使用 iframe 嵌入
    router.push({
      path: '/iframe-view',
      query: {
        url: path.slice(1),
        title: node.title
      }
    })
  } else if (path.startsWith('/web-view')) {
    // 已经是 web-view 格式的路径，直接使用
    router.push(path)
  } else if (path.startsWith('http://') || path.startsWith('https://')) {
    // 如果是完整的 URL，但没有特殊前缀，默认使用 web-view
    router.push({
      path: '/web-view',
      query: {
        url: path,
        title: node.title
      }
    })
  } else {
    // 其他情况（内部路由）直接导航
    router.push(path)
  }
}
</script>
```
