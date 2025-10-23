<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="logo">💬 AI聊天模拟器</h1>
      <p class="subtitle">多人在线角色扮演平台</p>
      
      <div class="tabs">
        <button
          :class="['tab', { active: mode === 'login' }]"
          @click="mode = 'login'"
        >
          登录
        </button>
        <button
          :class="['tab', { active: mode === 'register' }]"
          @click="mode = 'register'"
        >
          注册
        </button>
      </div>

      <!-- 登录表单 -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="loginForm.username"
            type="text"
            placeholder="请输入用户名"
            required
          />
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            required
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <!-- 注册表单 -->
      <form v-if="mode === 'register'" @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="registerForm.username"
            type="text"
            placeholder="至少3个字符"
            required
          />
        </div>
        
        <div class="form-group">
          <label>昵称</label>
          <input
            v-model="registerForm.nickname"
            type="text"
            placeholder="请输入昵称"
            required
          />
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input
            v-model="registerForm.password"
            type="password"
            placeholder="至少6个字符"
            required
          />
        </div>
        
        <div class="form-group">
          <label>确认密码</label>
          <input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="再次输入密码"
            required
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const mode = ref('login')
const loading = ref(false)
const error = ref('')

const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  
  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: loginForm.value
    })
    
    if (response.success) {
      navigateTo('/')
    } else {
      error.value = response.error || '登录失败'
    }
  } catch (err) {
    error.value = '网络错误，请重试'
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  error.value = ''
  
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }
  
  loading.value = true
  
  try {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        username: registerForm.value.username,
        nickname: registerForm.value.nickname,
        password: registerForm.value.password
      }
    })
    
    if (response.success) {
      navigateTo('/')
    } else {
      error.value = response.error || '注册失败'
    }
  } catch (err) {
    error.value = '网络错误，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2C2C2C;
  padding: 2rem;
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .auth-container {
    padding: 0;
  }
  
  .auth-card {
    border-radius: 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

.logo {
  text-align: center;
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
  color: #000;
}

.subtitle {
  text-align: center;
  color: #888;
  margin: 0 0 2rem 0;
  font-size: 0.9rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.tab {
  flex: 1;
  padding: 0.7rem;
  background: #F0F0F0;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #000;
  cursor: pointer;
  transition: all 0.2s;
}

.tab.active {
  background: #07C160;
  color: white;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #000;
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.7rem;
  border: 1px solid #D9D9D9;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #07C160;
}

.error-message {
  padding: 0.7rem;
  background: #FFEDED;
  border: 1px solid #FA5151;
  border-radius: 4px;
  color: #FA5151;
  text-align: center;
  font-size: 0.9rem;
}

.btn-submit {
  padding: 0.8rem;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s;
}

.btn-submit:active:not(:disabled) {
  background: #06AD56;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

