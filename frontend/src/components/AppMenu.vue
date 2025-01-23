<template>
  <el-menu
    :default-active="activeMenu"
    class="app-menu"
    :collapse="isCollapse"
  >
    <el-menu-item 
      v-for="route in routes" 
      :key="route.path"
      :index="route.path"
      @click="navigateTo(route)"
    >
      <el-icon>
        <component :is="route.meta.icon" />
      </el-icon>
      <span>{{ route.meta.title }}</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeFilled,
  List,
  Timer,
  Aim,  // 添加目标图标
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 获取路由配置
const routes = router.options.routes

// 当前激活的菜单项
const activeMenu = computed(() => route.path)

// 菜单是否折叠
const isCollapse = ref(false)

// 导航方法
const navigateTo = (route) => {
  router.push(route.path)
}
</script>

<style scoped>
.app-menu {
  height: 100%;
  border-right: none;
}

.el-menu-item {
  display: flex;
  align-items: center;
}

.el-icon {
  font-size: 1.2em;
  margin-right: 8px;
}
</style> 