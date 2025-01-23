<template>
  <el-container class="h-screen">
    <!-- 顶部导航 -->
    <el-header height="60px" class="flex-none bg-white border-b border-gray-200">
      <div class="flex justify-between items-center h-full px-6">
        <div class="flex items-center gap-4">
          <el-button type="text" @click="toggleSidebar">
            <el-icon><Fold v-if="isCollapse" /><Expand v-else /></el-icon>
          </el-button>
          <h2 class="text-xl font-semibold text-blue-600">EFFICENTOFFICE</h2>
        </div>
        <div class="flex items-center">
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
      </div>
    </el-header>

    <el-container class="flex-1 overflow-hidden">
      <!-- 侧边栏 -->
      <el-aside 
        :width="isCollapse ? '64px' : '200px'" 
        class="bg-white border-r border-gray-200 transition-all duration-300 flex-none"
      >
        <el-menu
          :collapse="isCollapse"
          :collapse-transition="false"
          :router="true"
          class="h-full border-none"
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
      <el-main class="flex-1 p-0 overflow-hidden bg-gray-50">
        <div class="h-full overflow-auto">
          <router-view></router-view>
        </div>
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
:deep(.el-menu) {
  @apply w-full;
}

:deep(.el-menu-item.is-active) {
  @apply bg-blue-50;
}

:deep(.el-menu-item:hover) {
  @apply bg-gray-50 !important;
}

/* 自定义滚动条 */
.overflow-auto::-webkit-scrollbar {
  @apply w-1.5;
}

.overflow-auto::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-200 rounded-full;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-300;
}
</style> 