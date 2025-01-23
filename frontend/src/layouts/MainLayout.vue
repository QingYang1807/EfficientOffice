<template>
  <el-container class="layout-container">
    <!-- 顶部导航 -->
    <el-header height="60px" class="main-header">
      <div class="header-left">
        <el-button type="text" @click="toggleSidebar">
          <el-icon><Fold v-if="isCollapse" /><Expand v-else /></el-icon>
        </el-button>
        <h2 class="logo">EFFICENTOFFICE</h2>
      </div>
      <div class="header-right">
        <el-dropdown>
          <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人信息</el-dropdown-item>
              <el-dropdown-item>设置</el-dropdown-item>
              <el-dropdown-item divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container>
      <!-- 侧边栏 -->
      <el-aside :width="isCollapse ? '64px' : '200px'" class="main-aside">
        <el-menu
          :collapse="isCollapse"
          :collapse-transition="false"
          :router="true"
          class="main-menu"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Grid /></el-icon>
            <template #title>首页概览</template>
          </el-menu-item>
          <el-menu-item index="/todo">
            <el-icon><List /></el-icon>
            <template #title>待办事项</template>
          </el-menu-item>
          <el-menu-item index="/pomodoro-timer">
            <el-icon><Timer /></el-icon>
            <template #title>番茄钟</template>
          </el-menu-item>
          <el-menu-item index="/report-summary">
            <el-icon><Document /></el-icon>
            <template #title>工作汇报</template>
          </el-menu-item>
          <el-menu-item index="/password-generator">
            <el-icon><Key /></el-icon>
            <template #title>密码生成器</template>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'MainLayout',
  setup() {
    const isCollapse = ref(false)
    
    const toggleSidebar = () => {
      isCollapse.value = !isCollapse.value
    }

    return {
      isCollapse,
      toggleSidebar
    }
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.main-header {
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo {
  margin: 0;
  font-size: 1.5rem;
  color: #409EFF;
}

.main-aside {
  background-color: #fff;
  border-right: 1px solid #dcdfe6;
  transition: width 0.3s;
}

.main-menu {
  border-right: none;
}

.main-content {
  background-color: #f5f7fa;
  padding: 20px;
}
</style> 