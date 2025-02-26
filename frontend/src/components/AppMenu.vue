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