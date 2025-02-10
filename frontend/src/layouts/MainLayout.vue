<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
      <div class="logo" :class="{ 'collapsed': isCollapse }">
        <img v-if="isCollapse" src="@/assets/logo.svg" alt="Logo" />
        <img v-else src="@/assets/logo-full.svg" alt="Logo" />
      </div>
      <AppMenu @collapse-change="handleCollapseChange" />
    </el-aside>
    
    <el-container class="main-container">
      <el-header>
        <div class="header-left">
          <!-- <el-button @click="toggleCollapse">
            <el-icon>
              <component :is="isCollapse ? 'Expand' : 'Fold'" />
            </el-icon>
          </el-button> -->
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

const handleCollapseChange = (collapsed) => {
  isCollapse.value = collapsed
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
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  transition: all 0.3s;
  overflow: hidden;
  background-color: var(--el-menu-bg-color);
}

.logo img {
  height: 32px;
  transition: all 0.3s;
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
</style> 