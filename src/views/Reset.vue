<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const newPassword = ref('')
const error = ref('')
const message = ref('')
const loading = ref(false)
let token = ''

onMounted(() => {
  token = String(route.query.token || '')
})

async function onSubmit() {
  error.value = ''
  message.value = ''
  loading.value = true
  try {
    await axios.post('/api/reset-password', { token, newPassword: newPassword.value })
    message.value = 'Пароль обновлен. Теперь можно войти.'
    setTimeout(() => router.replace('/login'), 1200)
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Не удалось обновить пароль'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="center-s">
    <div class="card-s fade-in-s" style="width: 100%; max-width: 420px; text-align:center;">
      <div class="stack-s">
        <div class="row-s fade-in-s delay-1" style="justify-content:center;">
          <img src="/ethlogo192.png" alt="logo" style="height:54px; border-radius:12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);" />
        </div>
        <div class="heading-s fade-in-s delay-2">Новый пароль</div>
        <div class="field-s fade-in-s delay-3">
          <label class="muted-s" style="text-align:left;">Пароль<span class="req-wrap-s"><span class="req-s">*</span><span class="req-tip-s">Обязательное поле</span></span></label>
          <input class="input-s" type="password" v-model="newPassword" placeholder="••••••••" />
        </div>
        <div v-if="message" class="muted-s fade-in-s delay-4">{{ message }}</div>
        <div v-if="error" class="error-s fade-in-s delay-4">{{ error }}</div>
        <button class="btn-s fade-in-s delay-4" :disabled="loading" @click="onSubmit">{{ loading ? 'Сохраняем…' : 'Сохранить' }}</button>
        <div class="row-s fade-in-s delay-4" style="justify-content: flex-end;">
          <RouterLink to="/login" class="muted-s nav-link-s">Назад ко входу</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-s {
  background: linear-gradient(180deg, rgba(255,159,26,0.05), rgba(255,120,30,0.02));
  border: 1px solid rgba(255,140,0,0.06);
}
.btn-s { background: linear-gradient(135deg, var(--violet-500), var(--violet-400)); color:#fff; }
.input-s:focus { box-shadow: 0 0 0 4px rgba(255,159,26,0.06); border-color: rgba(255,159,26,0.9); }
</style>


