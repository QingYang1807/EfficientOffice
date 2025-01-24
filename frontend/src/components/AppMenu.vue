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
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeFilled,
  List,
  Timer,
  Aim,  // 添加目标图标
  Expand,
  Fold
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 获取路由配置
const routes = router.options.routes

// 当前激活的菜单项
const activeMenu = computed(() => route.path)

// 菜单折叠状态
const isCollapse = ref(false)

// 切换折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 监听折叠状态变化，触发自定义事件
watch(isCollapse, (newValue) => {
  emit('collapse-change', newValue)
})

// 定义事件
const emit = defineEmits(['collapse-change'])

// 导航方法
const navigateTo = (route) => {
  router.push(route.path)
}
</script>

<style scoped>
.app-menu {
  height: 100%;
  border-right: none;
  transition: width 0.3s;
  width: 200px;  /* 修改为固定宽度 */
}

.app-menu.el-menu--collapse {
  width: 64px;  /* 折叠时的固定宽度 */
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

.el-menu-item {
  display: flex;
  align-items: center;
}

.el-icon {
  font-size: 1.2em;
  margin-right: 8px;
}
</style> 