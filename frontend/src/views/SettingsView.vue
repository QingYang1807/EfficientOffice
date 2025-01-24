<template>
  <div class="settings-container">
    <div class="settings-header">
      <h2>系统设置</h2>
      <p class="header-desc">自定义您的系统偏好设置</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="settings-menu">
          <el-menu
            :default-active="activeMenu"
            @select="handleMenuSelect"
          >
            <el-menu-item index="appearance">
              <el-icon><brush /></el-icon>
              <span>外观设置</span>
            </el-menu-item>
            <el-menu-item index="notification">
              <el-icon><bell /></el-icon>
              <span>通知设置</span>
            </el-menu-item>
            <el-menu-item index="pomodoro">
              <el-icon><timer /></el-icon>
              <span>番茄钟设置</span>
            </el-menu-item>
            <el-menu-item index="shortcut">
              <el-icon><operation /></el-icon>
              <span>快捷键设置</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>

      <el-col :span="18">
        <el-card v-if="activeMenu === 'appearance'" class="settings-card">
          <template #header>
            <h3>外观设置</h3>
          </template>
          
          <el-form label-width="120px">
            <el-form-item label="主题模式">
              <el-radio-group v-model="settingsForm.theme" class="theme-radio-group">
                <el-radio-button label="light">
                  <el-icon><sunny /></el-icon>
                  浅色模式
                </el-radio-button>
                <el-radio-button label="dark">
                  <el-icon><moon /></el-icon>
                  深色模式
                </el-radio-button>
                <el-radio-button label="system">
                  <el-icon><monitor /></el-icon>
                  跟随系统
                </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="主题色">
              <div class="color-picker-wrapper">
                <el-color-picker
                  v-model="settingsForm.primaryColor"
                  show-alpha
                  :predefine="predefineColors"
                />
                <span class="color-value">{{ settingsForm.primaryColor }}</span>
              </div>
            </el-form-item>

            <el-form-item label="紧凑模式">
              <el-switch v-model="settingsForm.compact" />
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-if="activeMenu === 'notification'" class="settings-card">
          <template #header>
            <h3>通知设置</h3>
          </template>
          
          <el-form label-width="120px">
            <el-form-item label="消息通知">
              <el-switch v-model="settingsForm.notifications" />
            </el-form-item>

            <el-form-item label="声音提醒">
              <el-switch v-model="settingsForm.sound" />
            </el-form-item>

            <el-form-item label="通知位置">
              <el-select v-model="settingsForm.notificationPosition">
                <el-option label="右上角" value="top-right" />
                <el-option label="右下角" value="bottom-right" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-if="activeMenu === 'pomodoro'" class="settings-card">
          <template #header>
            <h3>番茄钟设置</h3>
          </template>
          
          <el-form label-width="120px">
            <el-form-item label="专注时长">
              <div class="time-input">
                <el-input-number
                  v-model="settingsForm.pomodoroLength"
                  :min="1"
                  :max="60"
                  :step="5"
                />
                <span class="unit">分钟</span>
              </div>
            </el-form-item>

            <el-form-item label="休息时长">
              <div class="time-input">
                <el-input-number
                  v-model="settingsForm.breakLength"
                  :min="1"
                  :max="30"
                  :step="5"
                />
                <span class="unit">分钟</span>
              </div>
            </el-form-item>

            <el-form-item label="自动开始休息">
              <el-switch v-model="settingsForm.autoStartBreak" />
            </el-form-item>

            <el-form-item label="自动开始下一轮">
              <el-switch v-model="settingsForm.autoStartNextRound" />
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-if="activeMenu === 'shortcut'" class="settings-card">
          <template #header>
            <h3>快捷键设置</h3>
          </template>
          
          <el-form label-width="100px" class="shortcut-form">
            <el-row :gutter="40">
              <!-- 左侧列 -->
              <el-col :span="12">
                <div class="shortcut-section">
                  <h4 class="section-title">通用</h4>
                  <el-form-item label="保存">
                    <el-tag class="shortcut-tag">
                      <kbd>Ctrl</kbd> + <kbd>S</kbd>
                    </el-tag>
                  </el-form-item>
                  
                  <el-form-item label="撤销">
                    <el-tag class="shortcut-tag">
                      <kbd>Ctrl</kbd> + <kbd>Z</kbd>
                    </el-tag>
                  </el-form-item>
                  
                  <el-form-item label="重做">
                    <el-tag class="shortcut-tag">
                      <kbd>Ctrl</kbd> + <kbd>Y</kbd>
                    </el-tag>
                  </el-form-item>
                </div>

                <div class="shortcut-section">
                  <h4 class="section-title">待办事项</h4>
                  <el-form-item label="新建待办">
                    <el-tag class="shortcut-tag">
                      <kbd>Ctrl</kbd> + <kbd>N</kbd>
                    </el-tag>
                  </el-form-item>
                  
                  <el-form-item label="完成待办">
                    <el-tag class="shortcut-tag">
                      <kbd>Space</kbd>
                    </el-tag>
                  </el-form-item>
                  
                  <el-form-item label="删除待办">
                    <el-tag class="shortcut-tag">
                      <kbd>Delete</kbd>
                    </el-tag>
                  </el-form-item>
                </div>

                <div class="shortcut-section">
                  <h4 class="section-title">番茄钟</h4>
                  <el-form-item label="开始/暂停">
                    <el-tag class="shortcut-tag">
                      <kbd>Ctrl</kbd> + <kbd>Space</kbd>
                    </el-tag>
                  </el-form-item>
                  
                  <el-form-item label="重置">
                    <el-tag class="shortcut-tag">
                      <kbd>Ctrl</kbd> + <kbd>R</kbd>
                    </el-tag>
                  </el-form-item>
                </div>
              </el-col>

              <!-- 右侧列 -->
              <el-col :span="12">
                <div class="shortcut-section">
                  <h4 class="section-title">目标管理</h4>
                  <el-form-item label="新建目标">
                    <el-tag class="shortcut-tag">
                      <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd>
                    </el-tag>
                  </el-form-item>
                  
                  <el-form-item label="编辑目标">
                    <el-tag class="shortcut-tag">
                      <kbd>Ctrl</kbd> + <kbd>E</kbd>
                    </el-tag>
                  </el-form-item>
                  
                  <el-form-item label="归档目标">
                    <el-tag class="shortcut-tag">
                      <kbd>Ctrl</kbd> + <kbd>D</kbd>
                    </el-tag>
                  </el-form-item>
                </div>

                <div class="shortcut-section">
                  <h4 class="section-title">导航</h4>
                  <el-form-item label="切换菜单">
                    <el-tag class="shortcut-tag">
                      <kbd>Ctrl</kbd> + <kbd>B</kbd>
                    </el-tag>
                  </el-form-item>
                  
                  <el-form-item label="搜索">
                    <el-tag class="shortcut-tag">
                      <kbd>Ctrl</kbd> + <kbd>K</kbd>
                    </el-tag>
                  </el-form-item>
                  
                  <el-form-item label="帮助">
                    <el-tag class="shortcut-tag">
                      <kbd>F1</kbd>
                    </el-tag>
                  </el-form-item>
                </div>
              </el-col>
            </el-row>

            <div class="shortcut-tips">
              <el-alert
                title="提示"
                type="info"
                :closable="false"
                show-icon
              >
                <template #default>
                  <p>1. 部分快捷键可能与系统或浏览器快捷键冲突</p>
                  <p>2. Mac 用户请将 Ctrl 替换为 Command ⌘</p>
                  <p>3. 快捷键设置将在下次启动后生效</p>
                </template>
              </el-alert>
            </div>
          </el-form>
        </el-card>

        <div class="settings-actions">
          <el-button type="primary" @click="handleSave">保存设置</el-button>
          <el-button @click="handleReset">恢复默认</el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Brush,
  Bell,
  Timer,
  Operation,
  Sunny,
  Moon,
  Monitor
} from '@element-plus/icons-vue'

const activeMenu = ref('appearance')

const settingsForm = reactive({
  theme: 'light',
  primaryColor: '#409EFF',
  compact: false,
  notifications: true,
  sound: true,
  notificationPosition: 'top-right',
  pomodoroLength: 25,
  breakLength: 5,
  autoStartBreak: false,
  autoStartNextRound: false
})

const predefineColors = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#909399'
]

const handleMenuSelect = (key) => {
  activeMenu.value = key
}

const handleSave = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('设置保存失败')
  }
}

const handleReset = () => {
  ElMessage.success('已重置为默认设置')
  Object.assign(settingsForm, {
    theme: 'light',
    primaryColor: '#409EFF',
    compact: false,
    notifications: true,
    sound: true,
    notificationPosition: 'top-right',
    pomodoroLength: 25,
    breakLength: 5,
    autoStartBreak: false,
    autoStartNextRound: false
  })
}
</script>

<style scoped>
.settings-container {
  padding: 24px;
}

.settings-header {
  margin-bottom: 24px;
}

.settings-header h2 {
  margin: 0;
  font-size: 24px;
  color: var(--el-text-color-primary);
}

.header-desc {
  margin: 8px 0 0;
  color: var(--el-text-color-secondary);
}

.settings-menu {
  border-radius: 8px;
}

.settings-menu .el-menu {
  border-right: none;
}

.settings-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
}

.settings-menu .el-icon {
  margin-right: 12px;
  font-size: 18px;
}

.settings-card {
  border-radius: 8px;
  margin-bottom: 20px;
}

.theme-radio-group {
  .el-radio-button__inner {
    display: flex;
    align-items: center;
    padding: 12px 20px;
  }

  .el-icon {
    margin-right: 8px;
  }
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-value {
  color: var(--el-text-color-secondary);
  font-family: monospace;
}

.time-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unit {
  color: var(--el-text-color-secondary);
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 添加快捷键相关样式 */
.shortcut-form {
  padding: 0 12px;
}

.shortcut-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 15px;
  color: var(--el-text-color-primary);
  margin: 0 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.shortcut-tag {
  background-color: var(--el-fill-color-light);
  border: none;
  padding: 4px 8px;
}

kbd {
  display: inline-block;
  padding: 2px 4px;
  font-family: var(--el-font-family);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-text-color-primary);
  background-color: var(--el-fill-color);
  border: 1px solid var(--el-border-color);
  border-radius: 3px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}

.shortcut-tips {
  margin-top: 16px;
}

.shortcut-tips p {
  margin: 2px 0;
  line-height: 1.5;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

:deep(.el-form-item__label) {
  font-size: 13px;
}
</style> 