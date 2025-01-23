<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <div class="logo">
        <img src="@/assets/logo.png" alt="Logo" />
        <span>高效办公</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        :collapse="isCollapse"
        @select="handleSelect"
      >
        <el-menu-item index="/">
          <el-icon><home-filled /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        
        <el-menu-item index="/todos">
          <el-icon><list /></el-icon>
          <span>待办事项</span>
        </el-menu-item>
        
        <el-menu-item index="/pomodoro-timer">
          <el-icon><timer /></el-icon>
          <span>番茄钟</span>
        </el-menu-item>
        
        <el-menu-item index="/goals">
          <el-icon><aim /></el-icon>
          <span>目标管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header>
        <div class="header-left">
          <el-button @click="toggleCollapse">
            <el-icon><fold /></el-icon>
          </el-button>
        </div>
        <div class="header-right">
          <!-- 用户信息等 -->
        </div>
      </el-header>
      
      <el-main>
        <router-view />
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
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const isCollapse = ref(false)
const activeMenu = computed(() => route.path)

const handleSelect = (key) => {
  router.push(key)
}

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: var(--el-menu-active-color);
  font-size: 18px;
  font-weight: bold;
}

.logo img {
  height: 32px;
  margin-right: 12px;
}

.el-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
}

.el-aside {
  border-right: 1px solid var(--el-border-color-light);
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 200px;
}
</style> 