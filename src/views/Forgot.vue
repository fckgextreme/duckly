<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import axios from 'axios'
import CountdownTimer from '../components/CountdownTimer.vue'

const currentStep = ref<'email' | 'code' | 'password'>('email')

const email = ref('')
const resetCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const loading = ref(false)
const showCountdown = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const checkTimerState = () => {
  const savedEndTime = localStorage.getItem('forgot-password-timer')
  if (savedEndTime) {
    const endTime = parseInt(savedEndTime)
    const now = Date.now()
    const remainingTime = Math.ceil((endTime - now) / 1000)
    
    if (remainingTime > 0) {
      showCountdown.value = true
    } else {
      localStorage.removeItem('forgot-password-timer')
    }
  }
}

const toastNotifications = ref<any[]>([])

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const id = Date.now()
  toastNotifications.value.push({ id, message, type })
  
  setTimeout(() => {
    removeToast(id)
  }, 5000)
}

function removeToast(id: number) {
  const index = toastNotifications.value.findIndex(toast => toast.id === id)
  if (index > -1) {
    toastNotifications.value.splice(index, 1)
  }
}

function filterEmail(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  const filtered = value.replace(/[^a-zA-Z0-9@\-_.]/g, '')
  if (filtered !== value) {
    input.value = filtered
    email.value = filtered
  }
}

function filterCode(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  const filtered = value.replace(/[^0-9]/g, '').slice(0, 6)
  if (filtered !== value) {
    input.value = filtered
    resetCode.value = filtered
  }
}

function isValidEmail(email: string) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

function isValidPassword(password: string) {
  return password.length >= 6 && password.length <= 32
}

function passwordsMatch() {
  return newPassword.value === confirmPassword.value
}

async function sendResetCode() {
  loading.value = true
  try {
    if (!email.value.trim()) {
      throw new Error('Введите email адрес')
    }
    if (!isValidEmail(email.value.trim())) {
      throw new Error('Введите корректный email адрес')
    }
    
    await axios.post('/api/request-password-reset', { email: email.value.trim() })
    showToast('Код восстановления отправлен на ваш email', 'success')
    currentStep.value = 'code'
    showCountdown.value = true
  } catch (e: any) {
    showToast(e?.response?.data?.error || e.message || 'Ошибка запроса', 'error')
  } finally {
    loading.value = false
  }
}

async function verifyResetCode() {
  loading.value = true
  try {
    if (!resetCode.value || resetCode.value.length !== 6) {
      throw new Error('Введите 6-значный код')
    }
    
    await axios.post('/api/verify-reset-code', { 
      email: email.value.trim(),
      code: resetCode.value 
    })
    showToast('Код подтвержден успешно', 'success')
    currentStep.value = 'password'
  } catch (e: any) {
    showToast(e?.response?.data?.error || e.message || 'Неверный код', 'error')
  } finally {
    loading.value = false
  }
}

async function resetPassword() {
  loading.value = true
  try {
    if (!isValidPassword(newPassword.value)) {
      throw new Error('Пароль должен содержать от 6 до 32 символов')
    }
    if (!passwordsMatch()) {
      throw new Error('Пароли не совпадают')
    }
    
    await axios.post('/api/reset-password', {
      email: email.value.trim(),
      code: resetCode.value,
      newPassword: newPassword.value
    })
    
    showToast('Пароль успешно изменен', 'success')
    
    setTimeout(() => {
      window.location.href = '/login'
    }, 2000)
    
  } catch (e: any) {
    showToast(e?.response?.data?.error || e.message || 'Ошибка сброса пароля', 'error')
  } finally {
    loading.value = false
  }
}

function onCountdownComplete() {
  showCountdown.value = false
}

function goBackToEmail() {
  currentStep.value = 'email'
  resetCode.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  showCountdown.value = false
  localStorage.removeItem('forgot-password-timer')
}

function goBackToLogin() {
  window.location.href = '/login'
}

onMounted(() => {
  checkTimerState()
})
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div v-if="currentStep === 'email'" class="step-content">
        <div class="auth-header">
          <div class="logo-container">
            <img src="/ethlogo192.png" alt="logo" class="logo" />
          </div>
          <h1 class="auth-title">Восстановление пароля</h1>
          <p class="auth-subtitle">Введите ваш email для получения кода восстановления</p>
        </div>

        <form @submit.prevent="sendResetCode" class="auth-form">
          <div class="form-group">
            <label class="form-label">Email<span class="required">*</span></label>
            <div class="input-container">
              <input 
                class="form-input" 
                v-model="email" 
                @input="filterEmail" 
                placeholder="you@example.com" 
                type="email"
                maxlength="100"
                required
              />
            </div>
          </div>

          <CountdownTimer 
            v-if="showCountdown" 
            :duration="180" 
            :storage-key="'forgot-password-timer'"
            @complete="onCountdownComplete"
            class="countdown-timer"
          />

          <button type="submit" class="auth-button" :disabled="loading || showCountdown">
            <span v-if="loading" class="loading-spinner"></span>
            <span v-else>{{ showCountdown ? 'Повторная отправка заблокирована' : 'Отправить код' }}</span>
          </button>
        </form>
      </div>

      <div v-if="currentStep === 'code'" class="step-content">
        <div class="auth-header">
          <div class="logo-container">
            <img src="/ethlogo192.png" alt="logo" class="logo" />
          </div>
          <h1 class="auth-title">Введите код</h1>
          <p class="auth-subtitle">Код отправлен на {{ email }}</p>
        </div>

        <form @submit.prevent="verifyResetCode" class="auth-form">
          <div class="form-group">
            <label class="form-label">Код восстановления<span class="required">*</span></label>
            <div class="input-container">
              <input 
                class="form-input code-input" 
                v-model="resetCode" 
                @input="filterCode" 
                placeholder="123456" 
                type="text"
                maxlength="6"
                required
              />
            </div>
          </div>

        <CountdownTimer 
          v-if="showCountdown" 
          :duration="180" 
            :storage-key="'forgot-password-timer'"
          @complete="onCountdownComplete"
            class="countdown-timer"
          />

          <button type="submit" class="auth-button" :disabled="loading || resetCode.length !== 6">
            <span v-if="loading" class="loading-spinner"></span>
            <span v-else>Подтвердить код</span>
          </button>
        </form>

        <div class="auth-footer">
          <button @click="goBackToEmail" class="secondary-button">Изменить email</button>
        </div>
      </div>

      <div v-if="currentStep === 'password'" class="step-content">
        <div class="auth-header">
          <div class="logo-container">
            <img src="/ethlogo192.png" alt="logo" class="logo" />
          </div>
          <h1 class="auth-title">Новый пароль</h1>
          <p class="auth-subtitle">Придумайте новый пароль для вашего аккаунта</p>
        </div>

        <form @submit.prevent="resetPassword" class="auth-form">
          <div class="form-group">
            <label class="form-label">Новый пароль<span class="required">*</span></label>
            <div class="input-container">
              <input 
                class="form-input password-input" 
                v-model="newPassword" 
                :type="showPassword ? 'text' : 'password'"
                placeholder="Введите новый пароль"
                maxlength="32"
                required
              />
              <button 
                type="button" 
                class="password-toggle" 
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Подтвердите пароль<span class="required">*</span></label>
            <div class="input-container">
              <input 
                class="form-input password-input" 
                v-model="confirmPassword" 
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Подтвердите новый пароль"
                maxlength="32"
                required
              />
              <button 
                type="button" 
                class="password-toggle" 
                @click="showConfirmPassword = !showConfirmPassword"
              >
                {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="auth-button" 
            :disabled="loading || !isValidPassword(newPassword) || !passwordsMatch()"
          >
            <span v-if="loading" class="loading-spinner"></span>
            <span v-else>Изменить пароль</span>
        </button>
        </form>

        <div class="auth-footer">
          <button @click="goBackToLogin" class="secondary-button">Назад к авторизации</button>
        </div>
      </div>

      <div v-if="currentStep === 'email'" class="auth-footer">
        <RouterLink to="/login" class="auth-link">Назад ко входу</RouterLink>
      </div>
    </div>
    
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div
        v-for="toast in toastNotifications"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.type}`"
      >
        <div class="toast-content">
          <span class="toast-message">{{ toast.message }}</span>
          <button @click="removeToast(toast.id)" class="toast-close">×</button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
@import '../assets/main.css';
</style>


