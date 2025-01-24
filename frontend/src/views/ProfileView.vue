<template>
  <div class="profile-container">
    <div class="profile-header">
      <h2>个人信息</h2>
      <p class="header-desc">管理您的账号信息和偏好设置</p>
    </div>

    <div class="profile-content">
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="sticky-card">
            <el-card class="profile-card info-card">
              <div class="user-info-header">
                <el-upload
                  class="avatar-uploader"
                  action="/api/upload"
                  :show-file-list="false"
                  :before-upload="beforeAvatarUpload"
                  :on-success="handleAvatarSuccess"
                >
                  <div class="avatar-wrapper">
                    <el-avatar
                      v-if="profileForm.avatar"
                      :size="120"
                      :src="profileForm.avatar"
                    />
                    <el-icon v-else class="avatar-uploader-icon"><plus /></el-icon>
                    <div class="avatar-hover">
                      <el-icon><camera /></el-icon>
                      <span>更换头像</span>
                    </div>
                  </div>
                </el-upload>
                <h3>{{ profileForm.nickname || profileForm.username }}</h3>
                <p class="user-role">高级用户</p>
              </div>
              
              <div class="user-stats">
                <div class="stat-item">
                  <span class="stat-value">138</span>
                  <span class="stat-label">待办完成</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">42h</span>
                  <span class="stat-label">专注时长</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">12</span>
                  <span class="stat-label">目标达成</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-col>

        <el-col :span="16">
          <el-card class="profile-card">
            <template #header>
              <div class="card-header">
                <h3>基本信息</h3>
                <el-button 
                  type="primary" 
                  :icon="isEditing ? 'Check' : 'Edit'"
                  @click="isEditing ? handleSave() : handleEdit()"
                >
                  {{ isEditing ? '保存' : '编辑' }}
                </el-button>
              </div>
            </template>
            
            <el-form
              ref="profileForm"
              :model="profileForm"
              :disabled="!isEditing"
              label-width="100px"
            >
              <el-form-item label="用户名">
                <el-input v-model="profileForm.username" />
              </el-form-item>
              
              <el-form-item label="昵称">
                <el-input v-model="profileForm.nickname" />
              </el-form-item>
              
              <el-form-item label="邮箱">
                <el-input v-model="profileForm.email">
                  <template #append>
                    <el-tag v-if="profileForm.emailVerified" type="success" size="small">已验证</el-tag>
                    <el-button v-else type="primary" link>验证邮箱</el-button>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item label="手机号">
                <el-input v-model="profileForm.phone">
                  <template #append>
                    <el-tag v-if="profileForm.phoneVerified" type="success" size="small">已验证</el-tag>
                    <el-button v-else type="primary" link>验证手机</el-button>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="所在地区">
                <el-cascader
                  v-model="profileForm.region"
                  :options="regionOptions"
                  placeholder="请选择所在地区"
                />
              </el-form-item>

              <el-form-item label="个人简介">
                <el-input
                  v-model="profileForm.bio"
                  type="textarea"
                  :rows="3"
                  placeholder="介绍一下自己吧"
                />
              </el-form-item>
            </el-form>
          </el-card>

          <el-card class="profile-card security-card">
            <template #header>
              <div class="card-header">
                <h3>安全设置</h3>
              </div>
            </template>

            <div class="security-items">
              <div class="security-item">
                <div class="security-info">
                  <h4>登录密码</h4>
                  <p>建议定期更换密码，确保账号安全</p>
                </div>
                <el-button link type="primary">修改密码</el-button>
              </div>

              <div class="security-item">
                <div class="security-info">
                  <h4>双因素认证</h4>
                  <p>启用双因素认证，提供额外的安全保护</p>
                </div>
                <el-switch v-model="securitySettings.twoFactor" />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Camera, Check, Edit } from '@element-plus/icons-vue'

const isEditing = ref(false)
const profileForm = reactive({
  avatar: '',
  username: '测试用户',
  nickname: '测试昵称',
  email: 'test@example.com',
  emailVerified: true,
  phone: '13800138000',
  phoneVerified: false,
  region: [],
  bio: '',
})

const securitySettings = reactive({
  twoFactor: false
})

// Mock region options
const regionOptions = [
  {
    value: 'beijing',
    label: '北京',
    children: [
      { value: 'chaoyang', label: '朝阳区' },
      { value: 'haidian', label: '海淀区' }
    ]
  }
  // ... 其他选项
]

const handleEdit = () => {
  isEditing.value = true
}

const handleSave = async () => {
  try {
    // TODO: 调用保存接口
    await new Promise(resolve => setTimeout(resolve, 1000))
    isEditing.value = false
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('上传头像图片只能是图片格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB!')
  }
  return isImage && isLt2M
}

const handleAvatarSuccess = (response) => {
  profileForm.avatar = response.url
}
</script>

<style scoped>
.profile-container {
  padding: 24px;
}

.profile-header {
  padding: 24px 24px 0;
  margin-bottom: 24px;
}

.profile-content {
  flex: 1;
  padding: 0 24px 24px;
  overflow-y: auto;
}

/* 让左侧卡片固定 */
.sticky-card {
  position: sticky;
  top: 24px;
}

.profile-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.info-card {
  text-align: center;
}

.user-info-header {
  padding: 20px 0;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
}

.avatar-hover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-wrapper:hover .avatar-hover {
  opacity: 1;
}

.avatar-hover .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.user-role {
  color: var(--el-text-color-secondary);
  margin: 8px 0;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
}

.security-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.security-item:last-child {
  border-bottom: none;
}

.security-info h4 {
  margin: 0 0 4px;
  font-size: 16px;
}

.security-info p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style> 