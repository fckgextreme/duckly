<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import axios from 'axios'
import { setToken } from '../services/auth'

const router = useRouter()
const route = useRoute()

const login = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const remember = ref(true)
const showPassword = ref(false)

function filterLogin(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  const filtered = value.replace(/[^a-zA-Z0-9@\-_.]/g, '')
  if (filtered !== value) {
    input.value = filtered
    login.value = filtered
  }
}

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await axios.post('/api/login', { login: login.value.trim(), password: password.value, remember: remember.value })
    setToken(data.token)
    const redirect = (route.query.redirect as string) || '/main'
    router.replace(redirect)
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Ошибка входа'
  } finally {
    loading.value = false
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
        <h1 class="auth-title">Вход</h1>
        <p class="auth-subtitle">Войдите в свой аккаунт</p>
      </div>

      <form @submit.prevent="onSubmit" class="auth-form">
        <div class="form-group">
          <label class="form-label">Email / Имя пользователя<span class="required">*</span></label>
          <div class="input-container">
            <input 
              class="form-input" 
              v-model="login" 
              @input="filterLogin" 
              placeholder="you@example.com / nickname" 
              type="text"
              maxlength="100"
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
        </div>

        <div class="form-options">
          <label class="checkbox-container">
            <input type="checkbox" v-model="remember" />
            <span class="checkbox-mark"></span>
            <span class="checkbox-label">Запомнить меня</span>
          </label>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="auth-button" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>Войти</span>
        </button>
      </form>

      <div class="auth-footer">
        <div class="auth-links">
          <RouterLink to="/register" class="auth-link">Создать аккаунт</RouterLink>
          <RouterLink to="/forgot" class="auth-link">Забыли пароль?</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../assets/main.css';
</style>
