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
  if (node.path.startsWith('http')) {
    window.open(node.path, '_blank')
  } else {
    router.push(node.path)
  }
}
</script> 