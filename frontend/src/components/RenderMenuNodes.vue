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