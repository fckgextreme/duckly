<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import axios from 'axios'
import { setToken } from '../services/auth'
import VerificationModal from '../components/VerificationModal.vue'

const router = useRouter()
const email = ref('')
const username = ref('')
const displayName = ref('')
const avatarFile = ref<File | null>(null)
const avatarPreview = ref('')
const password = ref('')
const password2 = ref('')
const sent = ref(false)
const code = ref('')
const remember = ref(true)
const agree = ref(false)
const error = ref('')
const loading = ref(false)
const showVerificationModal = ref(false)

function filterEmail(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  const filtered = value.replace(/[^a-zA-Z0-9@\-_.]/g, '')
  if (filtered !== value) {
    input.value = filtered
    email.value = filtered
  }
}

function isValidEmail(email: string) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

function filterUsername(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  const filtered = value.replace(/[^a-zA-Z0-9_-]/g, '')
  if (filtered !== value) {
    input.value = filtered
    username.value = filtered
  }
}

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, level: 'unreliable', width: 0 }
  
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++
  if (!/[а-яё]/i.test(password)) score++
  
  return {
    score,
    level: score === 0 ? 'unreliable' : score < 2 ? 'weak' : score < 4 ? 'fair' : score < 5 ? 'good' : 'strong',
    width: (score / 5) * 100
  }
}

const passwordStrength = computed(() => getPasswordStrength(password.value))

const passwordMatch = computed(() => {
  if (!password2.value) return { valid: true, message: '' }
  if (password.value === password2.value) {
    return { valid: true, message: '' }
  }
  return { valid: false, message: 'Пароли не совпадают' }
})

const showPassword = ref(false)
const showPassword2 = ref(false)

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

watch(() => passwordMatch.value.valid, (newValid, oldValid) => {
  if (oldValid === false && newValid === true) {
    showToast('Пароли совпадают!', 'success')
  } else if (newValid === false && password2.value) {
    showToast('Пароли не совпадают', 'error')
  }
})

async function sendCode() {
  loading.value = true
  try {
    if (!isValidEmail(email.value.trim())) {
      throw new Error('Введите корректный email адрес')
    }
    if (!displayName.value.trim()) {
      throw new Error('Введите отображаемое имя')
    }
    if (!username.value.trim()) {
      throw new Error('Введите имя пользователя')
    }
    if (username.value.trim().length < 5) {
      throw new Error('Имя пользователя должно содержать минимум 5 символов')
    }
    if (username.value.trim().length > 16) {
      throw new Error('Имя пользователя должно содержать максимум 16 символов')
    }
    if (!password.value) {
      throw new Error('Введите пароль')
    }
    if (password.value.length < 8) {
      throw new Error('Пароль должен содержать минимум 8 символов')
    }
    if (password.value.length > 32) {
      throw new Error('Пароль должен содержать максимум 32 символа')
    }
    if (password.value !== password2.value) {
      throw new Error('Пароли не совпадают')
    }
    if (!agree.value) {
      throw new Error('Необходимо согласиться с условиями')
    }
    
    await axios.post('/api/send-code', { email: email.value.trim() })
    showToast('Код подтверждения отправлен на вашу почту!', 'success')
    showVerificationModal.value = true
  } catch (e: any) {
    showToast(e?.response?.data?.error || e.message || 'Ошибка', 'error')
  } finally {
    loading.value = false
  }
}

async function verifyAndRegister(verificationCode?: string) {
  loading.value = true
  try {
    if (!agree.value) throw new Error('Необходимо согласиться с условиями')
    if (password.value !== password2.value) throw new Error('Пароли не совпадают')
    const { data } = await axios.post('/api/verify-and-register', { 
      email: email.value.trim(), 
      code: verificationCode || code.value.trim(), 
      password: password.value, 
      remember: remember.value, 
      username: username.value.trim() || null, 
      displayName: displayName.value.trim() || username.value.trim() || null,
      avatarUrl: avatarPreview.value || null 
    })
    setToken(data.token)
    showVerificationModal.value = false
    showToast('Регистрация успешно завершена!', 'success')
    router.replace('/main')
  } catch (e: any) {
    showToast(e?.response?.data?.error || 'Ошибка регистрации', 'error')
  } finally {
    loading.value = false
  }
}

function onVerificationCode(code: string) {
  verifyAndRegister(code)
}

function closeVerificationModal() {
  showVerificationModal.value = false
}

function onPickAvatar(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0] || null
  avatarFile.value = file
  if (file) {
    const reader = new FileReader()
    reader.onload = () => { avatarPreview.value = String(reader.result || '') }
    reader.readAsDataURL(file)
  } else {
    avatarPreview.value = ''
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="logo-container">
          <img src="/ethlogo192.png" alt="logo" class="logo" />
        </div>
        <h1 class="auth-title">Регистрация</h1>
        <p class="auth-subtitle">Создайте новый аккаунт</p>
      </div>

      <form @submit.prevent="sendCode" class="auth-form">
        <div class="form-group">
          <label class="form-label">Аватар</label>
          <div class="avatar-upload">
            <div class="avatar-circle">
              <img v-if="avatarPreview" :src="avatarPreview" alt="avatar" />
              <div v-else class="avatar-placeholder">
                <svg class="avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
            </div>
            <div class="avatar-info">
              <label for="avatar-input" class="avatar-upload-btn">Загрузить</label>
              <div class="avatar-requirements">JPG, PNG до 2MB</div>
            </div>
            <input id="avatar-input" type="file" accept="image/*" @change="onPickAvatar" style="display:none;" />
          </div>
        </div>
        
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

        <div class="form-group">
          <label class="form-label">Display name<span class="required">*</span></label>
          <div class="input-container">
            <input 
              class="form-input" 
              v-model="displayName" 
              placeholder="Zhamal Mukashevna"
              maxlength="24"
              pattern="[a-zA-Z0-9._-]*"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Имя пользователя<span class="required">*</span></label>
          <div class="input-container">
            <input 
              class="form-input" 
              v-model="username" 
              @input="filterUsername" 
              placeholder="@nickname"
              minlength="5"
              maxlength="16"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Пароль<span class="required">*</span></label>
          <div class="input-container">
            <input 
              class="form-input password-input" 
              :type="showPassword ? 'text' : 'password'" 
              v-model="password" 
              placeholder="••••••••" 
              maxlength="32"
              required
            />
            <button 
              type="button" 
              class="password-toggle" 
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <svg v-if="showPassword" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
              </svg>
              <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
          </button>
          </div>
          <div class="password-strength-compact">
            <div class="strength-bar-small">
              <div 
                class="strength-fill-small" 
                :class="`strength-${passwordStrength.level}`" 
                :style="{ width: `${passwordStrength.width}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Повторите пароль<span class="required">*</span></label>
          <div class="input-container">
            <input 
              class="form-input password-input" 
              :type="showPassword2 ? 'text' : 'password'" 
              v-model="password2" 
              placeholder="••••••••" 
              maxlength="32"
              required
            />
            <button 
              type="button" 
              class="password-toggle" 
              @click="showPassword2 = !showPassword2"
              tabindex="-1"
            >
              <svg v-if="showPassword2" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
              </svg>
              <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
          </button>
          </div>
        </div>

        <div class="form-options">
          <label class="checkbox-container">
            <input type="checkbox" v-model="remember" />
            <span class="checkbox-mark"></span>
            <span class="checkbox-label">Запомнить меня</span>
          </label>
          
          <label class="checkbox-container">
            <input type="checkbox" v-model="agree" />
            <span class="checkbox-mark"></span>
            <span class="checkbox-label">Согласен с условиями</span>
          </label>
        </div>


        <button type="submit" class="auth-button" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>Отправить код</span>
        </button>
      </form>

      <div class="auth-footer">
        <RouterLink to="/login" class="auth-link">У меня уже есть аккаунт</RouterLink>
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
    
    <VerificationModal
      :visible="showVerificationModal"
      :email="email"
      @close="closeVerificationModal"
      @verify="onVerificationCode"
    />
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%);
  position: relative;
  overflow: hidden;
}

.auth-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(255, 140, 60, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.03) 0%, transparent 50%);
  pointer-events: none;
}

.auth-card {
  width: 100%;
  max-width: 480px;
  background: rgba(15, 15, 15, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 40px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  animation: slideUp 0.6s ease-out;
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-container {
  margin-bottom: 24px;
}

.logo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(255, 140, 60, 0.2);
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.auth-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.auth-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.auth-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.required {
  color: #ff8c42;
  margin-left: 4px;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.avatar-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.avatar-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.4);
}

.avatar-info {
  flex: 1;
}

.avatar-upload-btn {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(255, 140, 60, 0.1);
  border: 1px solid rgba(255, 140, 60, 0.2);
  border-radius: 8px;
  color: #ff8c42;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 4px;
}

.avatar-upload-btn:hover {
  background: rgba(255, 140, 60, 0.15);
  border-color: rgba(255, 140, 60, 0.3);
}

.avatar-requirements {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.4;
}

.input-container {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 16px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.password-input {
  padding-right: 56px;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-input:focus {
  outline: none;
  border-color: rgba(255, 140, 60, 0.5);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 0 4px rgba(255, 140, 60, 0.1);
}

.password-toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.password-toggle:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.05);
}

.icon {
  width: 20px;
  height: 20px;
}

.password-strength-compact {
  margin-top: 6px;
  margin-bottom: 2px;
}

.strength-bar-small {
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 1px;
  overflow: hidden;
}

.strength-fill-small {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 1px;
}

.strength-unreliable { background: #dc2626; }
.strength-weak { background: #ef4444; }
.strength-fair { background: #f59e0b; }
.strength-good { background: #22c55e; }
.strength-strong { background: #10b981; }

.strength-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: capitalize;
}

.form-options {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-container input[type="checkbox"] {
  display: none;
}

.checkbox-mark {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  margin-right: 12px;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox-container input[type="checkbox"]:checked + .checkbox-mark {
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  border-color: #ff8c42;
}

.checkbox-container input[type="checkbox"]:checked + .checkbox-mark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.auth-button {
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.auth-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 140, 60, 0.3);
}

.auth-button:active:not(:disabled) {
  transform: translateY(0);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.auth-footer {
  text-align: center;
}

.auth-link {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
  position: relative;
}

.auth-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: linear-gradient(90deg, #ff8c42, #ff6b35);
  transition: width 0.3s ease;
}

.auth-link:hover {
  color: #ff8c42;
}

.auth-link:hover::after {
  width: 100%;
}

.toast-container {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.toast {
  background: rgba(15, 15, 15, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  animation: slideInLeft 0.3s ease-out;
}

.toast-success {
  border-left: 4px solid #22c55e;
}

.toast-error {
  border-left: 4px solid #ef4444;
}

.toast-info {
  border-left: 4px solid #3b82f6;
}

.toast-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toast-message {
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
}

.toast-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.toast-close:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

@media (max-width: 480px) {
  .auth-container {
    padding: 16px;
  }
  
  .auth-card {
    padding: 28px 20px;
    margin: 0;
    max-width: none;
    border-radius: 12px;
    max-height: 95vh;
    overflow-y: auto;
  }
  
  .auth-header {
    margin-bottom: 28px;
  }
  
  .logo {
    width: 56px;
    height: 56px;
  }
  
  .auth-title {
    font-size: 22px;
    margin-bottom: 6px;
  }
  
  .auth-subtitle {
    font-size: 14px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-label {
    font-size: 13px;
    margin-bottom: 6px;
  }
  
  .form-input {
    padding: 14px 16px;
    font-size: 16px;
    border-radius: 10px;
  }
  
  .password-toggle {
    right: 12px;
    font-size: 16px;
    padding: 6px;
    min-width: 28px;
    min-height: 28px;
  }
  
  .auth-button {
    padding: 14px 20px;
    font-size: 15px;
    border-radius: 10px;
  }
  
  .auth-links {
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
  }
  
  .auth-link {
    font-size: 13px;
  }
  
  .avatar-upload {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }
  
  .avatar-info {
    margin-top: 8px;
    font-size: 12px;
  }
  
  .password-strength {
    margin-top: 8px;
  }
  
  .strength-bar {
    height: 4px;
  }
  
  .strength-text {
    font-size: 12px;
  }
  
  .toast-container {
    bottom: 16px;
    left: 16px;
    right: 16px;
    max-width: none;
  }
  
  .toast {
    padding: 12px 16px;
  }
  
  .toast-message {
    font-size: 13px;
  }
}

@media (max-width: 360px) {
  .auth-card {
    padding: 24px 16px;
  }
  
  .auth-title {
    font-size: 20px;
  }
  
  .form-input {
    padding: 12px 14px;
  }
  
  .auth-button {
    padding: 12px 16px;
  }
}
</style>


