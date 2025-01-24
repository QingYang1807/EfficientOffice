<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-left">
        <div class="login-banner">
          <img src="@/assets/logo-full.svg" alt="Logo" class="banner-logo">
          <h1>高效办公系统</h1>
          <p class="banner-desc">提升工作效率，助力职业发展</p>
        </div>
      </div>
      
      <div class="login-right">
        <div class="login-box">
          <h2>欢迎登录</h2>
          <p class="login-desc">请使用您的账号密码登录系统</p>
          
          <el-form
            ref="loginForm"
            :model="loginForm"
            :rules="loginRules"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                :prefix-icon="User"
                size="large"
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                :prefix-icon="Lock"
                show-password
                size="large"
              />
            </el-form-item>
            
            <div class="remember-forgot">
              <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              <el-link type="primary">忘记密码？</el-link>
            </div>
            
            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="login-button"
                size="large"
                @click="handleLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const rememberMe = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  loading.value = true
  try {
    // TODO: 调用登录接口
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟登录请求
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    ElMessage.error('登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  background: linear-gradient(135deg, var(--el-color-primary-light-7) 0%, var(--el-color-primary-light-9) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-content {
  display: flex;
  width: 1000px;
  height: 600px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: white;
}

.login-banner {
  text-align: center;
}

.banner-logo {
  width: 120px;
  margin-bottom: 24px;
  filter: brightness(0) invert(1);
}

.login-banner h1 {
  font-size: 32px;
  margin-bottom: 16px;
}

.banner-desc {
  font-size: 16px;
  opacity: 0.9;
}

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-box {
  width: 100%;
  max-width: 360px;
}

.login-box h2 {
  font-size: 28px;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.login-desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 40px;
}

.login-form {
  .el-input {
    --el-input-height: 44px;
  }
}

.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
}
</style> 