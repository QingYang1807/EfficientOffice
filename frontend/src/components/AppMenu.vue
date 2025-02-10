<template>
  <el-menu
    :default-active="activeMenu"
    class="app-menu"
    :collapse="isCollapse"
  >
    <div class="collapse-btn" @click="toggleCollapse">
      <el-icon>
        <component :is="isCollapse ? 'Expand' : 'Fold'" />
      </el-icon>
    </div>
    
    <RenderMenuNodes :menu-nodes="menuNodes" />
  </el-menu>
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

// 菜单折叠状态
const isCollapse = ref(false)

// 获取菜单数据
const menuNodes = computed(() => {
  const menuConfig = localStorage.getItem('menu-config')
  if (menuConfig) {
    return JSON.parse(menuConfig)
  }
  return []
})

// 切换折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 定义事件
const emit = defineEmits(['collapse-change'])

// 监听折叠状态变化
watch(isCollapse, (newValue) => {
  emit('collapse-change', newValue)
})
</script>

<style scoped>
.app-menu {
  height: 100%;
  border-right: none;
  transition: width 0.3s;
  width: 200px;
}

.app-menu.el-menu--collapse {
  width: 64px;
}

.collapse-btn {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-light);
}

.collapse-btn:hover {
  background-color: var(--el-menu-hover-bg-color);
}
</style> 