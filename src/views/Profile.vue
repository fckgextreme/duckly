<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { getToken, clearToken } from '../services/auth'
import { useRouter } from 'vue-router'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGlobe, faBars, faTimes, faUser, faSignOutAlt, faBookOpen, faGlobeAmericas, faGavel, faLanguage, faCrown, faGem , faCog} from '@fortawesome/free-solid-svg-icons'

library.add(faGlobe, faTelegramPlane, faBars, faTimes, faUser, faSignOutAlt, faBookOpen, faGlobeAmericas, faGavel, faLanguage, faCrown, faGem, faCog)

const mobileMenu = ref(false)
const router = useRouter()
const me = ref<any>(null)
const error = ref('')
const showProfileMenu = ref(false)
const userSubscriptions = ref<any[]>([])
const loadingSubscriptions = ref(false)
const showCancelModal = ref(false)
const subscriptionToCancel = ref<any>(null)
const activeTheme = ref('dark')
const telegramConnected = ref(false)
const telegramUsername = ref('')
const telegramLoading = ref(false)

async function loadMe() {
  try {
    const token = getToken()
    const { data } = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } })
    me.value = data.user
  } catch (e: any) {
    error.value = 'Сессия невалидна'
  }
}

async function loadSubscriptions() {
  if (loadingSubscriptions.value) return
  loadingSubscriptions.value = true
  try {
    const token = getToken()
    const { data } = await axios.get('/api/subscriptions', { headers: { Authorization: `Bearer ${token}` } })
    userSubscriptions.value = data.subscriptions
  } catch (e: any) {
    console.error('Failed to load subscriptions:', e)
    userSubscriptions.value = []
  } finally {
    loadingSubscriptions.value = false
  }
}

function logout() {
  clearToken()
  router.replace('/login')
}

function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value
}

function closeProfileMenu() {
  showProfileMenu.value = false
}

function toggleMobileMenu() {
  mobileMenu.value = !mobileMenu.value
}

function closeMobileMenu() {
  mobileMenu.value = false
}

const goToProfile = () => {
  closeProfileMenu()
}

const goToAdminPanel = () => {
  closeProfileMenu()
  router.push('/admin')
}

function showAlert(message: string) {
  alert(message)
}

function goToTelegram() {
  window.open('https://t.me/JustKingMe', '_blank')
}

function getExpiryClass(daysRemaining: any) {
  if (daysRemaining === 'infinity') return 'expiry-infinite'
  if (daysRemaining <= 0) return 'expiry-expired'
  return 'expiry-normal'
}

function getStatusClass(daysRemaining: any, status?: string) {
  if (status === 'cancelled') return 'status-cancelled'
  if (status === 'expired') return 'status-expired'
  if (daysRemaining === 'infinity') return 'status-active'
  if (daysRemaining <= 0) return 'status-expired'
  return 'status-active'
}

function getStatusText(daysRemaining: any, status?: string) {
  if (status === 'cancelled') return 'Отменена'
  if (status === 'expired') return 'Просрочена'
  if (daysRemaining === 'infinity') return 'Активна'
  if (daysRemaining <= 0) return 'Истекла'
  return 'Активна'
}

function showCancelConfirmation(subscription: any) {
  console.log('Subscription data:', subscription)
  subscriptionToCancel.value = subscription
  showCancelModal.value = true
}

async function confirmCancelSubscription() {
  if (!subscriptionToCancel.value) return
  
  try {
    const token = getToken()
    if (!token) {
      showToast('Ошибка авторизации. Пожалуйста, войдите в систему заново.', 'error')
      return
    }
    
    console.log('Cancelling subscription:', subscriptionToCancel.value)
    
    const response = await axios.post('/api/cancel-subscription', { 
      subscriptionId: subscriptionToCancel.value.id || subscriptionToCancel.value.subject
    }, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
    
    console.log('Cancel response:', response.data)
    
    showToast('Подписка отменена и удалена.', 'success')
    await loadSubscriptions() // Перезагружаем список подписок
    showCancelModal.value = false
    subscriptionToCancel.value = null
  } catch (e: any) {
    console.error('Cancel subscription error:', e)
    console.error('Error response:', e?.response?.data)
    
    let errorMessage = 'Ошибка при отмене подписки'
    
    if (e?.response?.status === 401) {
      errorMessage = 'Ошибка авторизации. Пожалуйста, войдите в систему заново.'
    } else if (e?.response?.status === 404) {
      errorMessage = 'Подписка не найдена.'
    } else if (e?.response?.status === 400) {
      errorMessage = e?.response?.data?.error || 'Некорректные данные запроса.'
    } else if (e?.response?.data?.error) {
      errorMessage = e.response.data.error
    } else if (e?.message) {
      errorMessage = e.message
    }
    
    showToast(errorMessage, 'error')
  }
}

function cancelModalAction() {
  showCancelModal.value = false
  subscriptionToCancel.value = null
}

async function connectTelegram() {
  try {
    telegramLoading.value = true
    
    const response = await fetch('/api/telegram-connect', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate connection code')
    }
    
    const data = await response.json()
    
    window.open(data.botUrl, '_blank')
    
    showToast('Код подключения отправлен в Telegram бот', 'success')
    
    setTimeout(() => {
      checkTelegramStatus()
    }, 3000)
    
  } catch (error) {
    console.error('Telegram connection error:', error)
    showToast('Ошибка при подключении к Telegram', 'error')
  } finally {
    telegramLoading.value = false
  }
}

async function disconnectTelegram() {
  try {
    const response = await fetch('/api/disconnect-telegram', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to disconnect Telegram')
    }
    
    telegramConnected.value = false
    telegramUsername.value = ''
    showToast('Telegram аккаунт отключен', 'success')
    
  } catch (error) {
    console.error('Telegram disconnect error:', error)
    showToast('Ошибка при отключении Telegram', 'error')
  }
}

async function checkTelegramStatus() {
  try {
    const response = await fetch('/api/telegram-status', {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to check Telegram status')
    }
    
    const data = await response.json()
    telegramConnected.value = data.connected
    telegramUsername.value = data.username || ''
  } catch (error) {
    console.error('Telegram status check error:', error)
  }
}

const plan = computed(() => me.value?.plan || 'free')
const activeSection = ref('profile')

// Результаты тестов
const testResults = ref<any[]>([])
const testResultsLoading = ref(false)
const testResultsPage = ref(1)
const testResultsTotalPages = ref(1)
const expandedReviewId = ref<number | null>(null) // ID результата, для которого открыт обзор

async function loadTestResults(page: number = 1) {
  if (testResultsLoading.value) return
  testResultsLoading.value = true
  try {
    const token = getToken()
    const { data } = await axios.get(`/api/test/results?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    testResults.value = data.results
    testResultsPage.value = data.pagination.page
    testResultsTotalPages.value = data.pagination.totalPages
  } catch (e: any) {
    console.error('Failed to load test results:', e)
    testResults.value = []
  } finally {
    testResultsLoading.value = false
  }
}

function changeTestResultsPage(page: number) {
  if (page >= 1 && page <= testResultsTotalPages.value) {
    loadTestResults(page)
  }
}

// Загружаем результаты тестов при переходе на вкладку
const previousSection = ref('')
watch(activeSection, (newSection) => {
  if (newSection === 'test-results' && previousSection.value !== 'test-results') {
    loadTestResults(1)
  }
  previousSection.value = newSection
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}.${month}.${year} в ${hours}:${minutes}`
}

function getTestSubjectName(subject: string): string {
  const subjectNames: Record<string, string> = {
    'history-kz': 'История Казахстана',
    'world-history': 'Всемирная история',
    'law-basics': 'Основы права',
    'chinese': 'Китайский язык'
  }
  return subjectNames[subject] || subject
}

function toggleReview(resultId: number) {
  if (expandedReviewId.value === resultId) {
    expandedReviewId.value = null
  } else {
    expandedReviewId.value = resultId
  }
}

// Вспомогательная функция для преобразования ответа в массив (для обзора в профиле)
function getUserAnswerArrayProfile(answer: any): number[] {
  if (Array.isArray(answer)) {
    return answer
  }
  if (answer !== undefined && answer !== null && answer !== -1) {
    return [answer]
  }
  return []
}

// Функция для определения класса оценки по проценту
function getScoreClass(score: number): string {
  if (score >= 85) return 'excellent'
  if (score >= 65) return 'success'
  if (score >= 40) return 'warning'
  return 'error'
}

onMounted(async () => {
  await loadMe()
  await loadSubscriptions()
  await checkTelegramStatus()
  if (activeSection.value === 'test-results') {
    await loadTestResults(1)
  }
})
const isEditing = ref({
  displayName: false,
  password: false,
  email: false
})
const newPassword = ref('')
const confirmPassword = ref('')
const currentPassword = ref('')
const newEmail = ref('')
const emailVerificationCode = ref('')
const isEmailVerificationSent = ref(false)
const editingDisplayName = ref('')
const notifications = ref({
  email: true,
  telegram: false,
  push: true
})
  const twoFactorEnabled = ref(false)
  const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)

const toastNotifications = ref<Array<{
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  duration?: number
}>>([])

let notificationId = 0

const userSubscriptionsForBanners = computed(() => {
  if (!userSubscriptions.value || userSubscriptions.value.length === 0) return []
  
  return userSubscriptions.value.map(sub => ({
    category: sub.subject,
    plan: sub.plan,
    status: sub.daysRemaining === 'infinity' || sub.daysRemaining > 0 ? 'active' : 'expired',
    title: getSubscriptionTitle(sub.subject, sub.plan)
  }))
})

function getSubscriptionTitle(subject: string, plan: string) {
  const titles = {
    historyKZ: { basic: 'Egg', premium: 'Golden Egg' },
    worldHistory: { basic: 'Student Duck', premium: 'Professor Duck' },
    lawBasics: { basic: 'Lawyer Duck', premium: 'Senior Lawyer Duck' },
    chinese: { basic: 'Student Panda', premium: 'Master Panda' }
  }
  return titles[subject as keyof typeof titles]?.[plan as keyof typeof titles[keyof typeof titles]] || `${subject} ${plan}`
}

function getSubjectName(category: string): string {
  const names = {
    historyKZ: 'История Казахстана',
    worldHistory: 'Всемирная История', 
    lawBasics: 'Основы права',
    chinese: 'Китайский язык'
  }
  return names[category as keyof typeof names] || category
}

function getSubjectColor(category: string) {
  const colors = {
    historyKZ: 'rgba(255, 193, 7, 0.2)',
    worldHistory: 'rgba(33, 150, 243, 0.2)',
    lawBasics: 'rgba(76, 175, 80, 0.2)',
    chinese: 'rgba(255, 87, 34, 0.2)'
  }
  return colors[category as keyof typeof colors] || 'rgba(255, 140, 60, 0.2)'
}

function getSubjectBorderColor(category: string) {
  const colors = {
    historyKZ: 'rgba(255, 193, 7, 0.4)',
    worldHistory: 'rgba(33, 150, 243, 0.4)',
    lawBasics: 'rgba(76, 175, 80, 0.4)',
    chinese: 'rgba(255, 87, 34, 0.4)'
  }
  return colors[category as keyof typeof colors] || 'rgba(255, 140, 60, 0.4)'
}

function getSubscriptionBanner(subscription: any) {
  const banners = {
    historyKZ: {
      basic: {
        background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.3))',
        border: 'rgba(255, 193, 7, 0.5)',
        icon: '🥚',
        title: 'Egg',
        subtitle: 'История Казахстана • Базовый'
      },
      premium: {
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 193, 7, 0.3))',
        border: 'rgba(255, 215, 0, 0.5)',
        icon: '🥇',
        title: 'Golden Egg',
        subtitle: 'История Казахстана • Премиум'
      }
    },
    worldHistory: {
      basic: {
        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.3), rgba(30, 136, 229, 0.3))',
        border: 'rgba(33, 150, 243, 0.5)',
        icon: '🦆',
        title: 'Student Duck',
        subtitle: 'Всемирная История • Базовый'
      },
      premium: {
        background: 'linear-gradient(135deg, rgba(21, 101, 192, 0.3), rgba(33, 150, 243, 0.3))',
        border: 'rgba(21, 101, 192, 0.5)',
        icon: '🎓',
        title: 'Professor Duck',
        subtitle: 'Всемирная История • Премиум'
      }
    },
    lawBasics: {
      basic: {
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(69, 160, 73, 0.3))',
        border: 'rgba(76, 175, 80, 0.5)',
        icon: '⚖️',
        title: 'Lawyer Duck',
        subtitle: 'Основы права • Базовый'
      },
      premium: {
        background: 'linear-gradient(135deg, rgba(56, 142, 60, 0.3), rgba(76, 175, 80, 0.3))',
        border: 'rgba(56, 142, 60, 0.5)',
        icon: '👨‍⚖️',
        title: 'Senior Lawyer Duck',
        subtitle: 'Основы права • Премиум'
      }
    },
    chinese: {
      basic: {
        background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.3), rgba(255, 61, 0, 0.3))',
        border: 'rgba(255, 87, 34, 0.5)',
        icon: '🐼',
        title: 'Student Panda',
        subtitle: 'Китайский язык • Базовый'
      },
      premium: {
        background: 'linear-gradient(135deg, rgba(255, 61, 0, 0.3), rgba(255, 87, 34, 0.3))',
        border: 'rgba(255, 61, 0, 0.5)',
        icon: '🐉',
        title: 'Master Panda',
        subtitle: 'Китайский язык • Премиум'
      }
    }
  }
  
  return banners[subscription.category as keyof typeof banners]?.[subscription.plan as keyof typeof banners[keyof typeof banners]] || {
    background: 'linear-gradient(135deg, rgba(255, 140, 60, 0.3), rgba(255, 107, 53, 0.3))',
    border: 'rgba(255, 140, 60, 0.5)',
    icon: '⭐',
    title: subscription.title,
    subtitle: `${getSubjectName(subscription.category) || subscription.category} • ${subscription.plan === 'premium' ? 'Премиум' : 'Базовый'}`
  }
}

function getAdminBanner() {
  return {
    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.3), rgba(185, 28, 28, 0.3))',
    border: 'rgba(220, 38, 38, 0.5)',
    icon: '👑',
    title: 'Администратор',
    subtitle: 'Полный доступ ко всем функциям'
  }
}

function startEdit(field: 'displayName' | 'email') {
  // Если это поле уже активно - отменяем редактирование (toggle)
  if (isEditing.value[field]) {
    cancelEdit(field)
    return
  }
  
  // Если другое поле уже активно - показываем сообщение
  if (isEditing.value.displayName && field !== 'displayName') {
    showToast('Сначала завершите редактирование имени', 'error')
    return
  }
  if (isEditing.value.email && field !== 'email') {
    showToast('Сначала завершите редактирование email', 'error')
    return
  }
  
  // Активируем поле
  isEditing.value[field] = true
  
  if (field === 'displayName') {
    // Копируем текущее значение для редактирования
    editingDisplayName.value = me.value?.displayName || me.value?.username || ''
  } else if (field === 'email') {
    newEmail.value = me.value?.email || ''
    isEmailVerificationSent.value = false
    emailVerificationCode.value = ''
  }
}

function validateDisplayNameInput(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  // Удаляем все недопустимые символы (оставляем только a-z, A-Z, 0-9, _, .)
  const filtered = value.replace(/[^a-zA-Z0-9._]/g, '')
  if (filtered !== value) {
    editingDisplayName.value = filtered
  }
}

function validateDisplayName(name: string): { valid: boolean; message?: string } {
  if (name.length > 24) {
    return { valid: false, message: 'Имя не должно превышать 24 символов' }
  }
  if (!/^[a-zA-Z0-9._]+$/.test(name)) {
    return { valid: false, message: 'Имя может содержать только латинские буквы, цифры, точки и подчеркивания' }
  }
  return { valid: true }
}

function validateUsername(username: string): { valid: boolean; message?: string } {
  if (username.length > 16) {
    return { valid: false, message: 'Username не должен превышать 16 символов' }
  }
  return { valid: true }
}

async function saveField(field: 'displayName' | 'password' | 'email') {
  try {
    const token = getToken()
    const updateData: any = {}
    if (field === 'displayName') {
      const validation = validateDisplayName(editingDisplayName.value || '')
      if (!validation.valid) {
        showToast(validation.message!, 'error')
        return
      }
      updateData.displayName = editingDisplayName.value || null
      const { data } = await axios.put('/api/profile', updateData, { headers: { Authorization: `Bearer ${token}` } })
      me.value = data.user
      showToast('Имя успешно сохранено!', 'success')
    } else if (field === 'email') {
      if (!isEmailVerificationSent.value) {
        await axios.post('/api/send-email-verification', { email: newEmail.value }, { headers: { Authorization: `Bearer ${token}` } })
        isEmailVerificationSent.value = true
        showToast('Код подтверждения отправлен на новый email!', 'success')
        return
      } else {
        const { data } = await axios.put('/api/update-email', { 
          newEmail: newEmail.value, 
          verificationCode: emailVerificationCode.value 
        }, { headers: { Authorization: `Bearer ${token}` } })
        me.value = data.user
        showToast('Email успешно обновлен!', 'success')
      }
    }
    isEditing.value[field] = false
  } catch (e: any) {
    const msg = e?.response?.data?.error || 'Ошибка при сохранении'
    showToast(msg, 'error')
    isEditing.value[field] = false
    if (field === 'email') {
      isEmailVerificationSent.value = false
      emailVerificationCode.value = ''
      newEmail.value = ''
    }
  }
}

function cancelEdit(field: 'displayName' | 'password' | 'email') {
  isEditing.value[field] = false
  if (field === 'email') {
    isEmailVerificationSent.value = false
    emailVerificationCode.value = ''
    newEmail.value = ''
  }
}

function filterVerificationCode(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  const filtered = value.replace(/[^0-9]/g, '').slice(0, 6)
  if (filtered !== value) {
    input.value = filtered
    emailVerificationCode.value = filtered
  }
}

async function resendEmailCode() {
  try {
    const token = getToken()
    await axios.post('/api/send-email-verification', { email: newEmail.value }, { headers: { Authorization: `Bearer ${token}` } })
    showToast('Код подтверждения отправлен повторно!', 'success')
  } catch (e: any) {
    const msg = e?.response?.data?.error || 'Ошибка при отправке кода'
    showToast(msg, 'error')
  }
}

function changePassword() {
  if (!currentPassword.value) {
    showToast('Введите текущий пароль!', 'error')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    showToast('Пароли не совпадают!', 'error')
    return
  }
  if (newPassword.value.length < 6) {
    showToast('Пароль должен содержать минимум 6 символов!', 'error')
    return
  }
  showToast('Пароль успешно изменен!', 'success')
  newPassword.value = ''
  confirmPassword.value = ''
  currentPassword.value = ''
  isEditing.value.password = false
}

async function handleAvatarUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    if (file.size > 5 * 1024 * 1024) { // 5MB
      showToast('Размер файла не должен превышать 5MB', 'error')
      return
    }
    const imageBitmap = await createImageBitmap(file)
    if (imageBitmap.width < 512 || imageBitmap.height < 512) {
      showToast('Минимальный размер аватара 512x512 пикселей', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
      avatarFile.value = file
      const token = getToken()
      axios.put('/api/avatar', { avatarUrl: avatarPreview.value }, { headers: { Authorization: `Bearer ${token}` }})
        .then(({ data }) => {
          me.value = data.user
          showToast('Аватар успешно обновлен!', 'success')
        })
        .catch(() => showToast('Ошибка при сохранении аватара', 'error'))
    }
    reader.readAsDataURL(file)
  }
}

function toggleTwoFactor() {
  twoFactorEnabled.value = !twoFactorEnabled.value
  showAlert(twoFactorEnabled.value ? 'Двухфакторная авторизация включена' : 'Двухфакторная авторизация отключена')
  }

function updateNotifications(type: string) {
  notifications.value[type as keyof typeof notifications.value] = !notifications.value[type as keyof typeof notifications.value]
}

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 5000) {
  const id = `toast-${++notificationId}`
  const notification = {
    id,
    type,
    message,
    duration
  }
  
  toastNotifications.value.push(notification)
  
  setTimeout(() => {
    removeToast(id)
  }, duration)
  
  if (type === 'success') {
    setTimeout(() => {
    }, 100)
  }
}

function removeToast(id: string) {
  const index = toastNotifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    toastNotifications.value.splice(index, 1)
  }
}
</script>

<template>
  <div class="main-container">
    <nav class="navbar">
      <div class="navbar-container">
        <RouterLink to="duckandlaw.com" class="navbar-logo">
          <div class="logo-icon">
            <img src="" alt="Logo" class="logo-image" />
          </div>
        </RouterLink>

         <div class="navbar-links">
           <a href="/main" class="nav-link">Главная</a>
           <a href="/subs" class="nav-link">Платные подписки</a>
           <a href="/docs" class="nav-link">Документация</a>
         </div>

         <div class="social-icons">
          <a href="https://duckandlaw.com/" class="social-icon" aria-label="Site">
            <font-awesome-icon :icon="['fas', 'globe']" />
          </a>
          <a href="https://t.me/duckandlaw" class="social-icon" aria-label="Telegram">
            <font-awesome-icon :icon="['fab', 'telegram-plane']" />
          </a>
         </div>
 
         <div class="navbar-right">
           <div class="profile-section desktop-only" v-if="me">
            <div class="profile-button" @click="toggleProfileMenu" @blur="closeProfileMenu" tabindex="0">
               <div class="profile-avatar">
                 <img v-if="me.avatarUrl" :src="me.avatarUrl" :alt="me.username || me.email" />
                 <div v-else class="avatar-placeholder">
                   {{ (me.username || me.email || 'U').charAt(0).toUpperCase() }}
                 </div>
               </div>
              <span class="profile-name">{{ me.displayName || me.username || me.email }}</span>
               <div class="profile-arrow" :class="{ active: showProfileMenu }">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <polyline points="6,9 12,15 18,9"></polyline>
                 </svg>
               </div>
             </div>
 
             <Transition name="dropdown">
               <div v-if="showProfileMenu" class="profile-dropdown">
                 <div class="dropdown-header">
                   <div class="dropdown-avatar">
                     <img v-if="me.avatarUrl" :src="me.avatarUrl" :alt="me.username || me.email" />
                     <div v-else class="avatar-placeholder">
                       {{ (me.username || me.email || 'U').charAt(0).toUpperCase() }}
                     </div>
                   </div>
                   <div class="dropdown-info">
                    <div class="dropdown-name">{{ me.displayName || me.username || me.email }}</div>
                     <div class="dropdown-email">{{ me.email }}</div>
                   </div>
                 </div>
 
                   <div class="dropdown-divider"></div>
                 <div class="dropdown-actions">
                   <button class="dropdown-action" @click="goToProfile">
                     <font-awesome-icon icon="user" />
                     <span>Профиль</span>
                   </button>
                   <button 
                     v-if="me?.plan === 'admin'" 
                     class="dropdown-action" 
                     @click="goToAdminPanel"
                   >
                     <font-awesome-icon icon="cog" />
                     <span>Панель управления</span>
                   </button>
                   <button class="dropdown-action" @click="logout">
                     <font-awesome-icon icon="sign-out-alt" />
                     <span>Выйти</span>
                   </button>
                 </div>
               </div>
             </Transition>
           </div>
 
           <button class="logout-button-square desktop-only" @click="logout">
             <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
               <path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3H10v2h10v14H10v2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
             </svg>
           </button>
         </div>

         <div class="mobile-elements">
           <div class="mobile-avatar-section" v-if="me">
             <div class="mobile-avatar-button" @click="toggleProfileMenu" @blur="closeProfileMenu" tabindex="0">
               <div class="mobile-avatar">
                 <img v-if="me.avatarUrl" :src="me.avatarUrl" :alt="me.username || me.email" />
                 <div v-else class="mobile-avatar-placeholder">
                   {{ (me.username || me.email || 'U').charAt(0).toUpperCase() }}
                 </div>
               </div>
             </div>
             
             <Transition name="dropdown">
               <div v-if="showProfileMenu" class="mobile-profile-dropdown" @click.stop>
                 <div class="dropdown-header">
                   <div class="dropdown-avatar">
                     <img v-if="me.avatarUrl" :src="me.avatarUrl" alt="Profile" />
                     <div v-else class="avatar-placeholder">{{ (me.username || me.email || 'U').charAt(0).toUpperCase() }}</div>
                   </div>
                   <div class="dropdown-info">
                     <div class="dropdown-name">{{ me.displayName || me.username || me.email }}</div>
                     <div class="dropdown-email">{{ me.email || 'user@example.com' }}</div>
                   </div>
                 </div>
                 <div class="dropdown-divider"></div>
                 <div class="dropdown-actions">
                   <button class="dropdown-action" @click="goToProfile">
                     <font-awesome-icon icon="user" />
                     <span>Профиль</span>
                   </button>
                   <button 
                     v-if="me?.plan === 'admin'" 
                     class="dropdown-action" 
                     @click="goToAdminPanel"
                   >
                     <font-awesome-icon icon="cog" />
                     <span>Панель управления</span>
                   </button>
                   <button class="dropdown-action" @click="logout">
                     <font-awesome-icon icon="sign-out-alt" />
                     <span>Выйти</span>
                   </button>
                 </div>
               </div>
             </Transition>
           </div>

           <button class="hamburger" @click="mobileMenu = !mobileMenu" aria-label="Toggle menu">
             <font-awesome-icon :icon="mobileMenu ? ['fas','times'] : ['fas','bars']" />
           </button>
         </div>
       </div>

      <Transition name="mobile-menu">
        <div v-if="mobileMenu" class="mobile-menu" role="dialog" aria-modal="true">
          <div class="mobile-menu-overlay" @click="closeMobileMenu"></div>
          <div class="mobile-menu-content">
            <div class="mobile-menu-header">
              <div class="mobile-menu-logo">
                <img src="" alt="Logo" class="mobile-logo-image" />
                <span class="mobile-logo-text">SDM Project</span>
              </div>
              <button class="mobile-menu-close" @click="closeMobileMenu" aria-label="Close menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          <nav class="mobile-menu-nav">
            <a href="/main" class="mobile-nav-item" @click="closeMobileMenu">
              <div class="mobile-nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9,22 9,12 15,12 15,22"></polyline>
                </svg>
              </div>
              <div class="mobile-nav-content">
                <span class="mobile-nav-title">Главная</span>
                <span class="mobile-nav-desc">Перейти на главную</span>
              </div>
              <div class="mobile-nav-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </a>

            <a href="/subs" class="mobile-nav-item" @click="closeMobileMenu">
              <div class="mobile-nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>
              <div class="mobile-nav-content">
                <span class="mobile-nav-title">Платные подписки</span>
                <span class="mobile-nav-desc">Премиум доступ</span>
              </div>
              <div class="mobile-nav-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </a>

            <a href="/docs" class="mobile-nav-item" @click="closeMobileMenu">
              <div class="mobile-nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
              </div>
              <div class="mobile-nav-content">
                <span class="mobile-nav-title">Документация</span>
                <span class="mobile-nav-desc">Справочные материалы</span>
              </div>
              <div class="mobile-nav-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </a>
          </nav>
          <div class="mobile-menu-social">
            <a href="https://duckandlaw.com/" class="mobile-social-item" @click="closeMobileMenu">
              <div class="mobile-social-icon">
                <font-awesome-icon :icon="['fas', 'globe']" />
              </div>
              <span class="mobile-social-text">Сайт</span>
            </a>
            <a href="https://t.me/duckandlaw" class="mobile-social-item" @click="closeMobileMenu">
              <div class="mobile-social-icon">
                <font-awesome-icon :icon="['fab', 'telegram-plane']" />
              </div>
              <span class="mobile-social-text">Telegram</span>
            </a>
          </div>
          
          <div class="mobile-logout-section">
            <button class="mobile-logout-btn" @click="logout">
              <div class="mobile-logout-icon">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3H10v2h10v14H10v2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
              <span class="mobile-logout-text">Выйти из аккаунта</span>
            </button>
          </div>
          </div>
        </div>
      </Transition>
    </nav>
 
    <main class="main-content-p">
      <div class="profile-layout">
        <aside class="profile-sidebar">
          <div class="sidebar-header">
            <div class="sidebar-avatar">
              <img v-if="me?.avatarUrl" :src="me.avatarUrl" :alt="me.username || me.email" />
              <div v-else class="sidebar-avatar-placeholder">
                {{ (me?.username || me?.email || 'U').charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="sidebar-user-info">
              <h3 class="sidebar-username">{{ me?.displayName || me?.username || 'エクストリーム' }}</h3>
              <p class="sidebar-user-handle">@{{ me?.username || 'fckgextreme' }}</p>
            </div>
          </div>

          <nav class="sidebar-nav">
            <button 
              class="nav-item" 
              :class="{ active: activeSection === 'profile' }"
              @click="activeSection = 'profile'"
            >
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Мой профиль</span>
            </button>
            
            
            <button 
              class="nav-item" 
              :class="{ active: activeSection === 'integrations' }"
              @click="activeSection = 'integrations'"
            >
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="9" cy="9" r="2"></circle>
                <path d="M21 15.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.5"></path>
              </svg>
              <span>Интеграции</span>
            </button>
            
            <button 
              class="nav-item" 
              :class="{ active: activeSection === 'subscriptions' }"
              @click="activeSection = 'subscriptions'"
            >
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              <span>Мои подписки</span>
            </button>
            
            <button 
              class="nav-item" 
              :class="{ active: activeSection === 'test-results' }"
              @click="activeSection = 'test-results'"
            >
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"></path>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"></path>
              </svg>
              <span>Результаты тестов</span>
            </button>
            
            <button 
              class="nav-item logout-item" 
              @click="logout"
            >
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Выйти из аккаунта</span>
            </button>
          </nav>
        </aside>

            
        <div class="profile-content">
          <div class="rank-banner" v-if="(userSubscriptionsForBanners.length > 0 || me?.plan === 'admin') && activeSection !== 'subscriptions'">
            <div class="banner-header">
              <h3 class="banner-section-title">Ваши подписки</h3>
              <span class="banner-count">{{ me?.plan === 'admin' ? 'Администратор' : userSubscriptionsForBanners.length + ' активных' }}</span>
            </div>
            
            <div v-if="me?.plan === 'admin'" class="admin-banner">
              <div class="banner-content">
                <div class="banner-icon">{{ getAdminBanner().icon }}</div>
                <div class="banner-info">
                  <h3 class="banner-title">{{ getAdminBanner().title }}</h3>
                  <p class="banner-subtitle">{{ getAdminBanner().subtitle }}</p>
                </div>
                </div>
              </div>
              
            <div v-if="userSubscriptionsForBanners.length > 0 && me?.plan !== 'admin'" class="subscriptions-grid">
              <div 
                v-for="subscription in userSubscriptionsForBanners" 
                :key="`${subscription.category}-${subscription.plan}`"
                class="subscription-banner"
                :style="{ 
                  '--banner-bg': getSubscriptionBanner(subscription).background,
                  '--banner-border': getSubscriptionBanner(subscription).border
                }"
              >
                <div class="banner-content">
                  <div class="banner-icon">{{ getSubscriptionBanner(subscription).icon }}</div>
                  <div class="banner-info">
                    <h3 class="banner-title">{{ getSubscriptionBanner(subscription).title }}</h3>
                    <p class="banner-subtitle">{{ getSubscriptionBanner(subscription).subtitle }}</p>
                </div>
              </div>
              </div>
            </div>
          </div>

          <Transition name="tab-content" mode="out-in">
            <div v-if="activeSection === 'profile'" class="content-section">
              <div class="section-header-p">
                <h2 class="section-title-p">Мой профиль</h2>
            </div>
            
              <div class="profile-main-content">
                <div class="avatar-section">
                  <div class="avatar-container">
                    <label class="profile-avatar-large" for="avatar-upload">
                      <img v-if="avatarPreview || me?.avatarUrl" :src="avatarPreview || me.avatarUrl" :alt="me.username || me.email" />
                      <div v-else class="avatar-placeholder-large">
                        {{ (me?.username || me?.email || 'U').charAt(0).toUpperCase() }}
                </div>
                    </label>
                    <input 
                      type="file" 
                      id="avatar-upload" 
                      accept="image/*" 
                      @change="handleAvatarUpload"
                      style="display: none;"
                    />
                    
                </div>
                  <div class="avatar-info">
                    <p class="avatar-size-info-p">Рекомендуемый размер: 512x512px</p>
                    <p class="avatar-format-info-p">Форматы: JPG, PNG, GIF (макс. 5MB)</p>
                  </div>
                </div>

                <div class="profile-fields-p">
                  <div class="field-group-p">
                    <label class="field-label">Display name</label>
                    <div class="field-container" :class="{ 'is-editing': isEditing.displayName, 'is-disabled': isEditing.email }">
                      <div class="field-content">
                      <input 
                        v-if="isEditing.displayName" 
                        v-model="editingDisplayName" 
                        type="text" 
                        class="field-input"
                        placeholder="Введите отображаемое имя"
                          maxlength="15"
                        pattern="[a-zA-Z0-9._]+"
                          title="Только латинские буквы, цифры, точки и подчеркивания (макс. 15 символов)"
                          @input="validateDisplayNameInput"
                        />
                        <div v-else class="field-value">{{ me?.displayName || me?.username || 'エクストリーム' }}</div>
                      </div>
                      
                      <div class="field-controls">
                        <!-- Кнопки действий (видны когда редактируем) - СЛЕВА -->
                        <div v-if="isEditing.displayName" class="action-buttons">
                          <button class="save-button" @click="saveField('displayName')">
                            Сохранить
                          </button>
                        </div>
                        
                        <!-- Кнопка редактирования (всегда видна) - СПРАВА -->
            <button 
                          class="edit-button" 
                          :class="{ 'is-active': isEditing.displayName }"
                          @click="startEdit('displayName')"
                        :disabled="isEditing.email"
                          title="Редактировать"
                      >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                </button>
          </div>
        </div>
          </div>

                  <div class="field-group-p">
                    <label class="field-label">Username</label>
                    <div class="field-container">
                      <div class="field-value field-readonly">@{{ me?.username || 'fckgextreme' }}</div>
                    </div>
            </div>
            
                  <div class="field-group-p">
                    <label class="field-label">Email</label>
                    <div class="field-container" :class="{ 'is-editing': isEditing.email, 'is-disabled': isEditing.displayName }">
                      <div class="field-content">
                      <input 
                        v-if="isEditing.email" 
                        v-model="newEmail" 
                        type="email" 
                        class="field-input"
                        placeholder="Введите новый email"
                        />
                        <div v-else class="field-value">{{ me?.email || 'you@example.com' }}</div>
                      </div>
                      
                      <div class="field-controls">
                        <!-- Кнопки действий (видны когда редактируем) - СЛЕВА -->
                        <div v-if="isEditing.email" class="action-buttons">
                          <button class="save-button" @click="saveField('email')">
                            {{ isEmailVerificationSent ? 'Подтвердить' : 'Отправить код' }}
                          </button>
                        </div>
                        
                        <!-- Кнопка редактирования (всегда видна) - СПРАВА -->
                      <button 
                          class="edit-button" 
                          :class="{ 'is-active': isEditing.email }"
                          @click="startEdit('email')"
                        :disabled="isEditing.displayName"
                          title="Редактировать"
                      >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                      </button>
          </div>
                  </div>
                    
                    <Transition name="verification-slide" appear>
                      <div v-if="isEditing.email && isEmailVerificationSent" class="verification-section">
                        <div class="verification-header">
                          <div class="verification-icon">📧</div>
                          <div class="verification-info">
                            <h4 class="verification-title">Код подтверждения</h4>
                            <p class="verification-subtitle">Введите 6-значный код, отправленный на {{ newEmail }}</p>
                          </div>
                        </div>
                        
                        <div class="verification-input-container">
                          <input 
                            v-model="emailVerificationCode" 
                            type="text" 
                            class="verification-code-input"
                            placeholder="123456"
                            maxlength="6"
                            @input="filterVerificationCode"
                          />
                          <div class="verification-input-bg"></div>
                        </div>
                        
                        <div class="verification-actions">
                          <button class="resend-code-btn" @click="resendEmailCode">
                            <span class="btn-icon">🔄</span>
                            Отправить код повторно
                          </button>
                        </div>
                      </div>
                    </Transition>
              </div>
          </div>
        </div>

        <div class="password-section">
          <div class="section-header-p">
            <h3 class="section-subtitle">Смена пароля</h3>
          </div>
          
          <div class="password-form">
            <div class="field-group">
              <label class="field-label">Текущий пароль</label>
              <input 
                v-model="currentPassword" 
                type="password" 
                class="field-input"
                placeholder="Введите текущий пароль"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Новый пароль</label>
              <input 
                v-model="newPassword" 
                type="password" 
                class="field-input"
                placeholder="Введите новый пароль"
              />
            </div>
            
            <div class="field-group">
              <label class="field-label">Подтвердите новый пароль</label>
              <input 
                v-model="confirmPassword" 
                type="password" 
                class="field-input"
                placeholder="Подтвердите новый пароль"
              />
            </div>
            
            <div class="field-actions">
              <button class="save-btn" @click="changePassword">Изменить пароль</button>
            </div>
          </div>
        </div>
      </div>

            <div v-else-if="activeSection === 'integrations'" class="content-section">
              <div class="section-header-p">
                <h2 class="section-title-p">Интеграции</h2>
              </div>
              
              <div class="integrations-content">
                <div class="integration-card">
                  <div class="integration-header">
                    <div class="integration-icon telegram-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    </div>
                    <div class="integration-info">
                      <h3 class="integration-title">Telegram</h3>
                      <p class="integration-desc">Получайте уведомления и управляйте аккаунтом через Telegram</p>
                    </div>
                    <div class="integration-status">
                      <div v-if="telegramConnected" class="status-connected">
                        <span class="status-dot"></span>
                        <span>Подключен</span>
                      </div>
                      <div v-else class="status-disconnected">
                        <span class="status-dot"></span>
                        <span>Не подключен</span>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="telegramConnected" class="integration-connected">
                    <div class="connected-info">
                      <div class="connected-avatar telegram-avatar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                      </div>
                      <div class="connected-details">
                        <h4>@{{ telegramUsername }}</h4>
                        <p>Telegram аккаунт подключен</p>
                      </div>
                    </div>
                    <button class="disconnect-btn" @click="disconnectTelegram">
                      <font-awesome-icon icon="times" />
                      Отключить
                    </button>
                  </div>
                  
                  <div v-else class="integration-actions">
                    <button 
                      class="connect-btn telegram-btn" 
                      @click="connectTelegram"
                      :disabled="telegramLoading"
                    >
                      <div v-if="telegramLoading" class="loading-spinner-small"></div>
                      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <span>{{ telegramLoading ? 'Подключение...' : 'Подключить' }}</span>
                    </button>
                  </div>
                </div>
                
              </div>
            </div>

            <div v-else-if="activeSection === 'subscriptions'" class="content-section">
              <div class="section-header-p">
                <h2 class="section-title-p">Мои подписки</h2>
              </div>
              
              <div class="subscriptions-content">
                <div v-if="loadingSubscriptions" class="subscriptions-loading">
                  <div class="loading-spinner-p"></div>
                  <p>Загрузка подписок...</p>
                </div>
                
                <div v-else-if="userSubscriptions.length === 0" class="no-subscriptions">
                  <div class="no-subscriptions-icon">📚</div>
                  <h3 class="no-subscriptions-title">Нет активных подписок</h3>
                  <p class="no-subscriptions-desc">Приобретите подписку на один из предметов, чтобы получить доступ к материалам</p>
                  <button class="get-subscription-btn" @click="$router.push('/subs')">
                    Посмотреть подписки
                  </button>
                </div>
                
                <div v-else class="subscriptions-grid">
                  <div 
                    v-for="subscription in userSubscriptions" 
                    :key="subscription.subject"
                    class="subscription-card"
                    :class="[`subscription-${subscription.subject}`, `plan-${subscription.plan}`]"
                  >
                    <div class="subscription-header">
                      <div class="subscription-icon">
                        <font-awesome-icon 
                          v-if="subscription.subject === 'historyKZ'" 
                          icon="book-open" 
                          class="subscription-icon-svg"
                        />
                        <font-awesome-icon 
                          v-else-if="subscription.subject === 'worldHistory'" 
                          icon="globe-americas" 
                          class="subscription-icon-svg"
                        />
                        <font-awesome-icon 
                          v-else-if="subscription.subject === 'lawBasics'" 
                          icon="gavel" 
                          class="subscription-icon-svg"
                        />
                        <font-awesome-icon 
                          v-else-if="subscription.subject === 'chinese'" 
                          icon="language" 
                          class="subscription-icon-svg"
                        />
                      </div>
                      <div class="subscription-info">
                        <h3 class="subscription-name">{{ subscription.name }}</h3>
                        <div class="subscription-plan">
                          <span class="plan-badge" :class="`plan-${subscription.plan}`">
                            <font-awesome-icon 
                              v-if="subscription.plan === 'premium'" 
                              icon="crown" 
                              class="plan-icon"
                            />
                            <font-awesome-icon 
                              v-else 
                              icon="gem" 
                              class="plan-icon"
                            />
                            {{ subscription.plan === 'basic' ? 'Базовый' : 'Премиум' }}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="subscription-details">
                      <div class="subscription-expiry">
                        <div class="expiry-label">До окончания:</div>
                        <div class="expiry-value" :class="getExpiryClass(subscription.daysRemaining)">
                          <span v-if="subscription.daysRemaining === 'infinity'">Бессрочная</span>
                          <span v-else-if="subscription.daysRemaining <= 0">Истекла</span>
                          <span v-else-if="subscription.daysRemaining === 1">1 день</span>
                          <span v-else>{{ subscription.daysRemaining }} дней</span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="subscription-status">
                      <div class="status-indicator" :class="getStatusClass(subscription.daysRemaining, subscription.status)">
                        <span v-if="getStatusClass(subscription.daysRemaining, subscription.status) === 'status-active'">✓</span>
                        <span v-else-if="getStatusClass(subscription.daysRemaining, subscription.status) === 'status-expired'">✕</span>
                        <span v-else-if="getStatusClass(subscription.daysRemaining, subscription.status) === 'status-cancelled'">⊘</span>
                      </div>
                      <span class="status-text">{{ getStatusText(subscription.daysRemaining, subscription.status) }}</span>
                    </div>
                    
                    <div v-if="getStatusClass(subscription.daysRemaining, subscription.status) !== 'status-cancelled'" class="subscription-actions">
                      <button class="cancel-subscription-btn" @click="showCancelConfirmation(subscription)">
                        Отменить подписку
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="activeSection === 'test-results'" class="content-section">
              <div class="section-header-p">
                <h2 class="section-title-p">Результаты тестов</h2>
              </div>
              
              <div class="test-results-content">
                <div v-if="testResultsLoading" class="test-results-loading">
                  <div class="loading-spinner"></div>
                  <p>Загрузка результатов...</p>
                </div>
                
                <div v-else-if="testResults.length === 0" class="no-test-results">
                  <div class="no-test-results-icon">📊</div>
                  <h3 class="no-test-results-title">Нет результатов тестов</h3>
                  <p class="no-test-results-desc">Пройдите тесты по предметам, чтобы увидеть свои результаты здесь</p>
                </div>
                
                <div v-else class="test-results-list">
                  <div 
                    v-for="result in testResults" 
                    :key="result.id" 
                    class="test-result-card"
                    :class="getScoreClass(result.score)"
                  >
                    <div class="test-result-header">
                      <div class="test-result-subject">
                        <span class="subject-badge">{{ getTestSubjectName(result.subject) }}</span>
                        <h3 class="test-result-topic">{{ result.topicTitle }}</h3>
                      </div>
                      <div class="test-result-score" :class="getScoreClass(result.score)">
                        <span class="score-value">{{ result.score }}%</span>
                      </div>
                    </div>
                    
                    <div class="test-result-details">
                      <div class="detail-item">
                        <span class="detail-label">Правильных ответов:</span>
                        <span class="detail-value">{{ result.correctAnswers }} / {{ result.totalQuestions }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Дата прохождения:</span>
                        <span class="detail-value">{{ formatDate(result.completedAt) }}</span>
                      </div>
                    </div>
                    
                    <div class="test-result-progress">
                      <div class="progress-bar-bg">
                        <div 
                          class="progress-bar-fill"
                          :class="getScoreClass(result.score)"
                          :style="{ width: `${result.score}%` }"
                        ></div>
                      </div>
                    </div>
                    
                    <div v-if="result.reviewData && Array.isArray(result.reviewData) && result.reviewData.length > 0" class="test-result-review-section">
                      <button 
                        class="review-toggle-button"
                        @click="toggleReview(result.id)"
                      >
                        <span>{{ expandedReviewId === result.id ? 'Скрыть ошибки' : 'Посмотреть ошибки' }}</span>
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2"
                          :style="{ transform: expandedReviewId === result.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      
                      <Transition name="slide-down">
                        <div v-if="expandedReviewId === result.id" class="result-review-container">
                          <div class="result-review-header">
                            <h4 class="result-review-title">Детальный обзор ответов</h4>
                            <div class="result-review-stats">
                              <span class="result-stat-item correct-stat-small">
                                ✓ Правильно: {{ result.reviewData.filter((r: any) => r.isCorrect).length }} / {{ result.reviewData.length }}
                              </span>
                              <span class="result-stat-item incorrect-stat-small">
                                ✗ Неправильно: {{ result.reviewData.filter((r: any) => !r.isCorrect).length }} / {{ result.reviewData.length }}
                              </span>
                            </div>
                          </div>
                          
                          <div class="result-review-questions">
                            <div 
                              v-for="(reviewItem, index) in result.reviewData" 
                              :key="reviewItem.questionId || index"
                              class="result-review-question-card"
                              :class="{ correct: reviewItem.isCorrect, incorrect: !reviewItem.isCorrect }"
                            >
                              <div class="result-review-question-header">
                                <span class="result-review-question-number">Вопрос {{ index + 1 }}</span>
                                <span class="result-review-question-status" :class="reviewItem.isCorrect ? 'correct-badge-small' : 'incorrect-badge-small'">
                                  {{ reviewItem.isCorrect ? '✓ Правильно' : '✗ Неправильно' }}
                                </span>
                              </div>
                              
                              <h5 class="result-review-question-text">{{ reviewItem.question }}</h5>
                              
                              <div class="result-review-options">
                                <div 
                                  v-for="(option, optIndex) in (reviewItem.options || [])"
                                  :key="optIndex"
                                  class="result-review-option"
                                  :class="{
                                    'correct-answer': reviewItem.correctAnswer && reviewItem.correctAnswer.includes(optIndex),
                                    'user-answer': getUserAnswerArrayProfile(reviewItem.userAnswer).includes(optIndex),
                                    'wrong-user-answer': !reviewItem.isCorrect && getUserAnswerArrayProfile(reviewItem.userAnswer).includes(optIndex) && reviewItem.correctAnswer && !reviewItem.correctAnswer.includes(optIndex)
                                  }"
                                >
                                  <span class="result-review-option-letter">{{ String.fromCharCode(65 + optIndex) }}</span>
                                  <span class="result-review-option-text">{{ option }}</span>
                                  <div class="result-review-option-markers">
                                    <span v-if="reviewItem.correctAnswer && reviewItem.correctAnswer.includes(optIndex)" class="result-marker correct-marker-small">✓ Правильный ответ</span>
                                    <span v-if="!reviewItem.isCorrect && getUserAnswerArrayProfile(reviewItem.userAnswer).includes(optIndex) && reviewItem.correctAnswer && !reviewItem.correctAnswer.includes(optIndex)" class="result-marker wrong-marker-small">✗ Ваш ответ (неправильно)</span>
                                    <span v-if="!reviewItem.isCorrect && getUserAnswerArrayProfile(reviewItem.userAnswer).includes(optIndex) && reviewItem.correctAnswer && reviewItem.correctAnswer.includes(optIndex)" class="result-marker partial-marker-small">✓ Ваш ответ (правильно)</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Transition>
                    </div>
                  </div>
                  
                  <!-- Пагинация -->
                  <div v-if="testResultsTotalPages > 1" class="test-results-pagination">
                    <button 
                      class="pagination-button"
                      :disabled="testResultsPage === 1"
                      @click="changeTestResultsPage(testResultsPage - 1)"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                      Назад
                    </button>
                    
                    <div class="pagination-info">
                      Страница {{ testResultsPage }} из {{ testResultsTotalPages }}
                    </div>
                    
                    <button 
                      class="pagination-button"
                      :disabled="testResultsPage === testResultsTotalPages"
                      @click="changeTestResultsPage(testResultsPage + 1)"
                    >
                      Вперед
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </main>
 
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div">
        <div 
          v-for="toast in toastNotifications" 
          :key="toast.id"
          class="toast"
          :class="[`toast-${toast.type}`]"
        >
          <div class="toast-content">
            <div class="toast-icon">
              <svg v-if="toast.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22,4 12,14.01 9,11.01"></polyline>
              </svg>
              <svg v-else-if="toast.type === 'error'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div class="toast-message">{{ toast.message }}</div>
            <button class="toast-close" @click="removeToast(toast.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
 
    <footer class="main-footer">
      <div class="footer-bottom">
        <div class="footer-copyright">
          © 2025 Duck & Law. All rights reserved. Developed by 
          <span class="footer-highlight">エクストリーム</span>
      </div>
    </div>
    </footer>

    <div v-if="showCancelModal" class="modal-overlay" @click="cancelModalAction">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h3 class="modal-title">Подтверждение отмены</h3>
        </div>
        
        <div class="modal-content">
          <p class="modal-message">
            Вы уверены, что хотите отменить подписку 
            <strong>"{{ subscriptionToCancel?.name }}"</strong>?
          </p>
          <p class="modal-warning">
            Подписка будет удалена сразу после отмены.
          </p>
        </div>
        
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="cancelModalAction">
            Отмена
          </button>
          <button class="modal-btn modal-btn-confirm" @click="confirmCancelSubscription">
            Отменить подписку
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
  --violet-500: #ff8c00;
  --violet-400: #ff9f1a;
  --violet-300: #ffb347;
  --violet-200: #ffd89a;

  --bg-900: #0b0b0c;
  --bg-800: #121214;
  --bg-700: #1a1a1e;
  --text-100: #e6e6f0;
  --text-60: rgba(230,230,240,0.6);
  --danger: #ef4444;
}

* { box-sizing: border-box; }

a { color: var(--violet-300); }
a:hover { color: var(--violet-200); }

button, input, select, textarea { font-family: inherit; font-size: 14px; transition: all .25s ease; }

.main-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #141414;
}

.navbar {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  margin: 20px auto;
  max-width: 1200px;
  position: sticky;
  z-index: 100;
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  height: 72px;
  display: flex;
  align-items: center;
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  gap: 32px;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.logo-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 32px;
  flex: 1;
  justify-content: center;
}

.nav-link {
  color: var(--text-100);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 159, 67, 0.15), transparent); 
  transition: left 0.5s ease;
}

.nav-link:hover::before {
  left: 100%;
}

.nav-link:hover {
  background: rgba(255, 159, 67, 0.1);
  color: #ff9f43;
  transform: translateY(-1px);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.social-icons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.social-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-60);
  text-decoration: none;
  transition: all 0.3s ease;
}

.social-icon:hover {
  background: rgba(255, 159, 67, 0.1);
  border-color: rgba(255, 159, 67, 0.3);
  color: #ff9f43;
  transform: translateY(-2px);
}

.logout-button-square {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  margin-left: -5px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  color: #ff6b6b;
}

.logout-button-square:hover {
  background: rgba(255, 107, 107, 0.25);
  color: #ff4c4c;
  transform: translateY(-1px);
}

.profile-section {
  position: relative;
}

.profile-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}

.profile-button:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.profile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffb84d, #ff9f43);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
}

.profile-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-100);
  line-height: 1.2;
}

.profile-arrow {
  color: var(--text-60);
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-arrow.active {
  transform: rotate(180deg);
}

.profile-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  min-width: 200px;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 8px 25px rgba(0,0,0,0.4);
  overflow: hidden;
  z-index: 1000;
  transition: all 0.25s ease;
  padding: 16px;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.dropdown-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 140, 60, 0.3);
}

.dropdown-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dropdown-avatar .avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.dropdown-info {
  flex: 1;
}

.dropdown-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 2px;
}

.dropdown-email {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 12px 0;
}

.dropdown-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dropdown-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dropdown-action:hover {
  background: rgba(255, 140, 60, 0.1);
  border-color: rgba(255, 140, 60, 0.3);
  color: #ffffff;
}

.dropdown-action svg {
  flex-shrink: 0;
  color: #ff8c42;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
}

.main-content-p {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 24px;
  min-height: calc(100vh - 200px);
}

.main-footer {
  background: rgba(26, 26, 26, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  margin: 40px auto 20px;
  max-width: 800px;
  box-shadow:
    0 -6px 24px rgba(0, 0, 0, 0.25),
    0 -2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px 32px;
  text-align: center;
}

.footer-bottom {
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer-copyright {
  font-size: 14px;
  color: var(--text-60);
}

.footer-highlight {
  color: #ff9f43;
  font-weight: 600;
  transition: color 0.3s ease;
}

.footer-highlight:hover {
  color: #ffb84d;
  cursor: pointer;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.profile-avatar-large {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 140, 60, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.profile-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar-large {
    transition: all 0.3s ease;
  }
  
  .profile-avatar-large.uploading {
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
    }
  }

.save-btn {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.0);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 140, 60, 0.5);
  border-radius: 10px;
  color: rgba(255, 140, 60, 0.95);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  height: 44px;
  min-width: 140px;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
}

.save-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 60, 0.15), transparent);
  transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.save-btn:hover:not(:disabled)::before {
  left: 100%;
}

.save-btn:hover:not(:disabled) {
  background: rgba(255, 140, 60, 0.12);
  backdrop-filter: blur(12px);
  border-color: rgba(255, 140, 60, 0.7);
  color: #ff8c3c;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(255, 140, 60, 0.3),
    0 2px 8px rgba(255, 140, 60, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.save-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 
    0 2px 8px rgba(255, 140, 60, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: rgba(255, 140, 60, 0.2);
  color: rgba(255, 140, 60, 0.4);
  transform: none !important;
  box-shadow: none !important;
  background: rgba(255, 255, 255, 0.02);
}

.password-section {
  margin-top: 24px;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-actions {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.profile-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}

.profile-button:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.profile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffb84d, #ff9f43);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
}

.profile-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-100);
  line-height: 1.2;
}

.profile-arrow {
  color: var(--text-60);
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-arrow.active {
  transform: rotate(180deg);
}

/* Новые стили для полей редактирования */
.field-group-p {
  margin-bottom: 24px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.field-container {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0;
  background: transparent;
  border: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 44px;
}

.field-container.is-editing {
  background: transparent;
  min-height: 52px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.field-container.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.field-content {
  flex: 1;
  min-width: 100px;
  max-width: 100%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.field-value {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  padding: 10px 0;
  transition: all 0.3s ease;
}

.field-input {
  width: 100%;
  padding: 11px 15px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: white;
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.field-input:focus {
  outline: none;
  border-color: rgba(255, 140, 60, 0.5);
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 0 3px rgba(255, 140, 60, 0.1);
}

.field-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  justify-content: flex-end;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: auto;
}

.edit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 330px;
}

.edit-button:hover:not(:disabled) {
  background: rgba(255, 140, 60, 0.15);
  border-color: rgba(255, 140, 60, 0.4);
  color: #ff8c3c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 140, 60, 0.2);
}

.edit-button:active:not(:disabled) {
  transform: translateY(0);
}

.edit-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.03);
}

.edit-button.is-active {
  background: rgba(255, 140, 60, 0.2);
  border-color: rgba(255, 140, 60, 0.5);
  color: #ff8c3c;
}

.action-buttons {
  display: flex;
  gap: 8px;
  animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.save-button {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.0);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 140, 60, 0.5);
  border-radius: 10px;
  color: rgba(255, 140, 60, 0.95);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
  margin-right: 50px;
}

.save-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 60, 0.15), transparent);
  transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.save-button:hover::before {
  left: 100%;
}

.save-button:hover {
  background: rgba(255, 140, 60, 0.12);
  backdrop-filter: blur(12px);
  border-color: rgba(255, 140, 60, 0.7);
  color: #ff8c3c;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(255, 140, 60, 0.3),
    0 2px 8px rgba(255, 140, 60, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.save-button:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 8px rgba(255, 140, 60, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.cancel-button {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(239, 68, 68, 0.5);
  border-radius: 10px;
  color: rgba(239, 68, 68, 0.95);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
}

.cancel-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.15), transparent);
  transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.cancel-button:hover::before {
  left: 100%;
}

.cancel-button:hover {
  background: rgba(239, 68, 68, 0.12);
  backdrop-filter: blur(12px);
  border-color: rgba(239, 68, 68, 0.7);
  color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(239, 68, 68, 0.3),
    0 2px 8px rgba(239, 68, 68, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.cancel-button:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 8px rgba(239, 68, 68, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

button:focus {
  outline: 2px solid rgba(255, 140, 60, 0.5);
  outline-offset: 2px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* Стили для кнопок редактирования */
.field-edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  height: 36px;
  width: 36px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.field-edit-btn:hover:not(:disabled) {
  background: rgba(255, 140, 60, 0.2);
  border-color: rgba(255, 140, 60, 0.4);
  color: #ff8c3c;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 140, 60, 0.2);
}

.field-edit-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(255, 140, 60, 0.3);
}

.field-edit-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
}

.field-edit-btn svg {
  transition: all 0.3s ease;
  width: 14px;
  height: 14px;
}

.field-edit-btn:hover:not(:disabled) svg {
  transform: rotate(3deg) scale(1.05);
}

.field-edit-btn.hidden {
  opacity: 0;
  transform: scale(0.8);
  pointer-events: none;
  animation: fadeOutScale 0.2s ease-out;
}

@keyframes fadeOutScale {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}

/* Стили для кнопки отмены */
.cancel-btn {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(239, 68, 68, 0.5);
  border-radius: 10px;
  color: rgba(239, 68, 68, 0.95);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  height: 44px;
  min-width: 140px;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
}

.cancel-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.15), transparent);
  transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.cancel-btn:hover:not(:disabled)::before {
  left: 100%;
}

.cancel-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.12);
  backdrop-filter: blur(12px);
  border-color: rgba(239, 68, 68, 0.7);
  color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(239, 68, 68, 0.3),
    0 2px 8px rgba(239, 68, 68, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.cancel-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 
    0 2px 8px rgba(239, 68, 68, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.cancel-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: rgba(239, 68, 68, 0.2);
  color: rgba(239, 68, 68, 0.4);
  background: rgba(255, 255, 255, 0.02);
  transform: none !important;
  box-shadow: none !important;
}

.no-subscriptions {
  text-align: center;
  padding: 40px 20px;
}

.no-subscriptions-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.no-subscriptions-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px 0;
}

.no-subscriptions-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 24px 0;
}

.subscription-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.2), rgba(31, 41, 55, 0.1));
  border: 1px solid rgba(55, 65, 81, 0.3);
  border-radius: 6px;
  transition: all 0.3s ease;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.subscription-card:hover .subscription-icon {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.3), rgba(31, 41, 55, 0.2));
  border-color: rgba(55, 65, 81, 0.4);
  box-shadow: 
    0 2px 6px rgba(55, 65, 81, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.subscription-actions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  justify-content: center;
}

.subscription-item {
  padding: 20px;
  background: var(--subject-color);
  border: 1px solid var(--subject-border);
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.subscription-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.subscription-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.subscription-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.subscription-status {
  padding: 4px 8px;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.subscription-subject {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
  font-weight: 500;
}

.subscription-plan {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.desktop-only {
  display: flex;
}

.mobile-elements {
  display: none;
  align-items: center;
  gap: 8px;
}

.mobile-avatar-section {
  display: none;
  position: relative;
}

.mobile-avatar-button {
  background: transparent;
  border: none;
  border-radius: 50%;
  padding: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  z-index: 1100;
}

.mobile-avatar-button:hover {
  background: rgba(255, 140, 60, 0.1);
  transform: scale(1.05);
}

.mobile-avatar-button:active {
  transform: scale(0.95);
}

.mobile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 140, 60, 0.3);
  transition: border-color 0.3s ease;
}

.mobile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mobile-avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.mobile-profile-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  min-width: 200px;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 16px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.dropdown-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 140, 60, 0.3);
}

.dropdown-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dropdown-avatar:not(img) {
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.dropdown-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.dropdown-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-email {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 12px 0;
}

.dropdown-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dropdown-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dropdown-action:hover {
  background: rgba(255, 140, 60, 0.1);
  border-color: rgba(255, 140, 60, 0.3);
  color: #ffffff;
}

.dropdown-action svg {
  flex-shrink: 0;
  color: #ff8c42;
}

.mobile-tab-nav {
  display: none;
  background: linear-gradient(135deg, rgba(255, 140, 60, 0.1), rgba(255, 107, 53, 0.05));
  border: 1px solid rgba(255, 140, 60, 0.2);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 24px;
  justify-content: space-between;
  gap: 8px;
}

.mobile-tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 140, 60, 0.3);
  border-radius: 12px;
  color: rgba(255, 140, 60, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.mobile-tab-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 60, 0.15), transparent);
  transition: left 0.5s ease;
}

.mobile-tab-btn:hover::before {
  left: 100%;
}

.mobile-tab-btn:hover {
  background: rgba(255, 140, 60, 0.12);
  border-color: rgba(255, 140, 60, 0.5);
  color: #ff8c42;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 140, 60, 0.2);
}

.mobile-tab-btn.active {
  background: rgba(255, 140, 60, 0.2);
  border-color: #ff8c42;
  color: #ff8c42;
  box-shadow: 0 6px 16px rgba(255, 140, 60, 0.3);
}

/* Основные стили для sidebar */
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-avatar {
  width: 56px;
  height: 56px;
  min-width: 56px;
  min-height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 2.5px solid rgba(255, 140, 60, 0.3);
  transition: border-color 0.3s ease;
  flex-shrink: 0;
}

.sidebar-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar-avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  color: white;
}

.sidebar-user-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.sidebar-username {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user-handle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-layout {
  display: flex;
  max-width: 1200px;
  width: 100%;
  gap: 32px;
  margin: 0 auto;
}

.profile-sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  height: fit-content;
  position: sticky;
  top: 100px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
  position: relative;
  overflow: hidden;
  border-color: rgb(47, 47, 47);
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  transform: translateX(2px);
}

.nav-item:hover::before {
  left: 100%;
}

.nav-item.active {
  background: rgba(255, 140, 60, 0.15);
  border-color: rgba(255, 140, 60, 0.4);
}

.nav-item.active .nav-icon {
  color: #ff8c42;
}

.nav-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.profile-content {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
  min-height: 600px;
}

.profile-main-content {
  display: flex;
  gap: 40px;
  margin-bottom: 40px;
}

@media (min-width: 769px) {
  .field-container {
    position: relative;
  }
  
  .field-controls {
    margin-left: auto;
  }
  
  .field-content {
    max-width: 400px;
  }
  
  .field-container.is-editing {
    flex-wrap: nowrap;
    align-items: center;
  }
  
  .field-container.is-editing .field-content {
    flex: 1;
    min-width: 200px;
  }
  
  .field-container.is-editing .field-controls {
    flex-shrink: 0;
  }
  
  .field-container.is-editing .action-buttons {
    flex-shrink: 0;
  }
  
  .edit-button.is-active {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 0;
    z-index: 10;
  }
  
  .edit-button.is-active:hover:not(:disabled) {
    transform: translateY(calc(-50% - 2px));
  }
  
  .edit-button.is-active:active:not(:disabled) {
    transform: translateY(-50%);
  }
  
  .profile-fields-p .field-group-p,
  .field-group-p {
    margin-bottom: 16px !important;
  }
  
  .password-section .password-form,
  .password-form {
    gap: 14px !important;
  }
  
  /* Отступ для аватарки и текста под ней */
  .avatar-section {
    margin-top: 36px;
  }
  
  /* Разграничители между навигационными кнопками */
  .sidebar-nav {
    gap: 10px;
  }
  
  .nav-item:not(.logout-item) {
    border-bottom: none;
    margin-bottom: 0;
    padding: 14px 16px;
    position: relative;
  }
  
  .nav-item:not(.logout-item):not(:last-of-type) {
    position: relative;
  }
  
  .nav-item:not(.logout-item):not(:last-of-type)::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 16px;
    right: 16px;
    height: 1px;
    background: rgba(255, 255, 255, 0.12);
    pointer-events: none;
    transition: all 0.3s ease;
  }
  
  .nav-item:not(.logout-item):not(:last-of-type):hover::after {
    background: rgba(255, 140, 60, 0.4);
    height: 1.5px;
    box-shadow: 0 0 4px rgba(255, 140, 60, 0.3);
  }
  
  .nav-item:not(.logout-item):last-of-type {
    margin-bottom: 0;
  }
  
  /* Стилизация кнопки выхода */
  .nav-item.logout-item {
    margin-top: 35px !important;
    padding: 14px 16px;
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid rgba(220, 38, 38, 0.3);
    border-radius: 10px;
    color: #ef4444;
    position: relative;
    overflow: hidden;
  }
  
  .nav-item.logout-item::before {
    background: linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.15), transparent);
  }
  
  .nav-item.logout-item:hover {
    background: rgba(220, 38, 38, 0.15);
    border-color: rgba(220, 38, 38, 0.5);
    color: #dc2626;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
  }
  
  .nav-item.logout-item .nav-icon {
    color: #ef4444;
  }
  
  .nav-item.logout-item:hover .nav-icon {
    color: #dc2626;
  }
  
  .nav-item.logout-item.active {
    background: rgba(220, 38, 38, 0.2);
    border-color: rgba(220, 38, 38, 0.6);
  }
}

@media (max-width: 768px) {
  .navbar {
    margin: 10px;
    border-radius: 12px;
    height: auto;
    min-height: 64px;
  }
  
  .navbar-container {
    padding: 12px 16px;
    gap: 16px;
  }
  
  .desktop-only {
    display: none !important;
  }
  
  .mobile-elements {
    display: flex !important;
  }
  
  .mobile-avatar-section {
    display: block !important;
  }
  
  .hamburger {
    display: flex !important;
    align-items: center;
    justify-content: center;
  }
  
  .navbar-links, .social-icons {
    display: none !important;
  }
  
  .navbar-right {
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .main-content-p {
    padding: 20px 16px;
  }
  
  .profile-layout {
    flex-direction: column;
    gap: 20px;
  }
  
  .profile-sidebar {
    width: 100%;
    position: static;
    order: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 24px;
  }
  
  .profile-content {
    order: 2;
    padding: 20px;
  }
  
  .sidebar-header {
    flex-direction: column;
    text-align: center;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .sidebar-nav {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: space-between;
  }
  
  .nav-item {
    flex: 1;
    min-width: calc(20% - 3px);
    justify-content: center;
    padding: 10px 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    transition: all 0.3s ease;
  }
  
  .nav-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
  
  .nav-item span {
    display: none;
  }
  
  .nav-icon {
    width: 18px;
    height: 18px;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.3s ease;
  }
  
  .nav-item:hover .nav-icon {
    color: rgba(255, 255, 255, 0.9);
  }
  
  .nav-item.active {
    background: rgba(255, 140, 60, 0.15);
    border-color: rgba(255, 140, 60, 0.4);
  }
  
  .nav-item.active .nav-icon {
    color: #ff8c42;
  }
  
  .nav-item.logout-item {
    background: rgba(220, 38, 38, 0.08);
    border-color: rgba(220, 38, 38, 0.2);
    margin-top: 16px;
    border-top: none;
    padding-top: 10px;
  }
  
  .nav-item.logout-item .nav-icon {
    color: #dc2626;
  }
  
  .nav-item.logout-item:hover {
    background: rgba(220, 38, 38, 0.12);
    border-color: rgba(220, 38, 38, 0.3);
  }
  
  .sidebar-avatar {
    width: 60px;
    height: 60px;
  }
  
  .sidebar-username {
    font-size: 16px;
  }
  
  .sidebar-user-handle {
    font-size: 14px;
  }
  
  .profile-main-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .avatar-section {
    width: 100%;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .avatar-container {
    gap: 12px;
  }
  
  .profile-avatar-large {
    width: 100px;
    height: 100px;
  }
  
  .avatar-placeholder-large {
    font-size: 40px;
  }
  
  .field-container {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    width: 100%;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .field-container.is-editing {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    animation: containerExpand 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes containerExpand {
    from {
      opacity: 0.8;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .field-content {
    width: 100%;
    max-width: 100% !important;
  }
  
  .field-container.is-editing .field-content {
    max-width: 100% !important;
    animation: fieldSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes fieldSlideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .field-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    pointer-events: auto !important;
    margin-left: 0 !important;
    width: auto;
    max-width: 100%;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .field-container.is-editing .field-controls {
    display: grid;
    width: 100%;
    grid-template-columns: 1fr auto;
    gap: 8px;
    margin-left: 0 !important;
    animation: controlsSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both;
  }
  
  @keyframes controlsSlideIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .action-buttons {
    width: 100%;
    pointer-events: auto !important;
  }
  
  .field-container.is-editing .action-buttons {
    grid-column: 1;
    grid-row: 1;
    justify-content: flex-start;
    animation: buttonSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both;
  }
  
  @keyframes buttonSlideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .edit-button {
    flex-shrink: 0;
    pointer-events: auto !important;
    margin-left: 0 !important;
    position: static;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .field-container.is-editing .edit-button {
    grid-column: 2;
    grid-row: 1;
    margin-left: 0 !important;
    animation: buttonMove 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
  }
  
  @keyframes buttonMove {
    from {
      opacity: 0;
      transform: translateX(20px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }
  
  .field-input {
    width: 100%;
    font-size: 16px;
    padding: 12px 16px;
    pointer-events: auto !important;
  }
  
  .field-container.is-editing .field-input {
    animation: inputFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both;
  }
  
  @keyframes inputFadeIn {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(-5px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  .field-value {
    padding: 8px 0;
    font-size: 15px;
  }
  
  .save-button {
    padding: 10px 16px;
    font-size: 14px;
    flex: 1;
    max-width: none;
    pointer-events: auto !important;
    cursor: pointer !important;
  }
  
  .profile-fields-p {
    width: 100%;
  }
  
  .field-group-p {
    width: 100%;
    margin-bottom: 12px;
  }
  
  .field-label {
    font-size: 13px;
    margin-bottom: 6px;
    text-align: left;
  }
  
  button, .mobile-tab-btn, .save-button, .edit-button, .dropdown-action, .nav-item {
    pointer-events: auto !important;
    cursor: pointer !important;
    touch-action: manipulation;
  }
  
  .password-form {
    gap: 16px;
  }
  
  .rank-banner {
    margin-bottom: 20px;
  }
  
  .banner-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .banner-section-title {
    font-size: 18px;
  }
  
  .banner-count {
    font-size: 12px;
  }
  
  .admin-banner,
  .subscription-banner {
    padding: 12px;
    min-height: 60px;
  }
  
  .banner-icon {
    font-size: 20px;
  }
  
  .banner-title {
    font-size: 14px;
  }
  
  .banner-subtitle {
    font-size: 11px;
  }
  
  .subscriptions-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .profile-dropdown {
    min-width: 180px;
    right: -10px;
  }
  
  .toast-container {
    top: 60px;
    left: 16px;
    right: 16px;
    max-width: none;
    bottom: auto;
  }
  
  .toast {
    padding: 12px;
  }
  
  .toast-message {
    font-size: 13px;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(255, 140, 60, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(255, 140, 60, 0.6);
  }
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.4);
  }
  50% {
    box-shadow: 0 4px 16px rgba(40, 167, 69, 0.8);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.toast-container {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
}

.toast-container > div {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast:not(:last-child) {
  margin-bottom: 10px;
}

.toast {
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.toast-success {
  border-left: 4px solid #10b981;
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
  gap: 12px;
}

.toast-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-success .toast-icon {
  color: #10b981;
}

.toast-error .toast-icon {
  color: #ef4444;
}

.toast-info .toast-icon {
  color: #3b82f6;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  line-height: 1.4;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-100%) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-100%) scale(0.9);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* Анимации для переключения вкладок */
.tab-content-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-content-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-content-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.tab-content-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.tab-content-enter-to,
.tab-content-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

@media (max-width: 768px) {
  .toast-container {
    top: 60px;
    left: 16px;
    right: 16px;
    max-width: none;
    bottom: auto;
  }
  
  .toast-container > div {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .toast {
    padding: 12px;
    margin-bottom: 0;
  }
  
  .toast:not(:last-child) {
    margin-bottom: 10px;
  }
  
  .toast-message {
    font-size: 13px;
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes titleGlow {
  0% {
    text-shadow: 0 0 30px rgba(255, 140, 60, 0.3);
  }
  100% {
    text-shadow: 0 0 40px rgba(255, 140, 60, 0.5), 0 0 60px rgba(255, 100, 40, 0.2);
  }
}

@keyframes glassShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes liquidFlow {
  0% {
    transform: translateX(-100%) skewX(-15deg);
  }
  100% {
    transform: translateX(200%) skewX(-15deg);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.cards-enter-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.cards-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.cards-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.cards-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(1.05);
}

.cards-enter-to,
.cards-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.tab-button {
  transition: all 0.3s ease;
}

.feature-item {
  transition: all 0.2s ease;
}

.card-button {
  transition: all 0.3s ease;
}

.content-placeholder {
  text-align: center;
  max-width: 500px;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.6;
}

.placeholder-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-100);
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--violet-400), var(--violet-300));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.placeholder-text {
  font-size: 18px;
  color: var(--text-60);
  line-height: 1.6;
}

.main-footer {
  background: rgba(26, 26, 26, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  margin: 40px auto 20px;
  max-width: 800px;
  box-shadow:
    0 -6px 24px rgba(0, 0, 0, 0.25),
    0 -2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px 32px;
  text-align: center;
  position: relative;
  bottom: 8px;
}

.footer-bottom {
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer-copyright {
  font-size: 14px;
  color: var(--text-60);
}

.footer-highlight {
  color: #ff9f43;
  font-weight: 600;
  transition: color 0.3s ease;
}

.footer-highlight:hover {
  color: #ffb84d;
  cursor: pointer;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.lock-overlay { background: linear-gradient(90deg, rgba(0,0,0,0.7), rgba(0,0,0,0.5)); border-radius: 10px; padding: 8px; }

@media (max-width: 768px) {
  .navbar {
    margin: 10px;
    border-radius: 12px;
  }
  
  .navbar-container {
    padding: 12px 16px;
    gap: 16px;
  }
  
  .navbar-links {
    display: none;
  }
  
  .social-icons {
    display: none;
  }
  
  .profile-button {
    padding: 6px 12px;
    gap: 8px;
  }
  
  .profile-name {
    font-size: 13px;
  }
  
  .profile-dropdown {
    min-width: 240px;
    right: -10px;
  }
  
  .main-footer {
    margin: 20px 10px 20px 10px;
    border-radius: 12px;
    padding: 16px 20px;
  }
  
  .footer-bottom {
    padding: 0;
  }
  
  .footer-copyright {
    font-size: 12px;
  }
}

.hamburger {
  display: none;
  background: none;
  border: none;
  color: var(--text-100);
  font-size: 22px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
  pointer-events: auto;
  z-index: 1100;
}

.mobile-menu {
  position: fixed;
  inset: 0;
  display: none;
  z-index: 1200;
  animation: overlayFade .28s ease forwards;
  pointer-events: auto;
}

.mobile-menu::before {
  display: none;
}

.mobile-menu-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.mobile-menu-content {
  position: absolute;
  top: 20px;
  right: 20px;
  width: calc(100% - 40px);
  max-width: 360px;
  height: calc(100% - 40px);
  background: rgba(26, 26, 26, 0.95);
  border-radius: 16px;
  padding: 0;
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  animation: slideIn .4s cubic-bezier(.2,.8,.2,1) forwards;
  overflow: hidden;
  pointer-events: auto;
  z-index: 2;
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  background: rgba(32, 32, 32, 0.8);
  border-radius: 16px 16px 0 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.mobile-menu-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-logo-image {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.mobile-logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-100);
  letter-spacing: -0.02em;
}

.mobile-menu-close {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  width: 40px;
  height: 40px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.mobile-menu-close::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 60, 0.1), transparent);
  transition: left 0.5s ease;
}

.mobile-menu-close:hover::before {
  left: 100%;
}

.mobile-menu-close:hover {
  background: rgba(255, 140, 60, 0.1);
  border-color: rgba(255, 140, 60, 0.3);
  color: #ff8c42;
  transform: scale(1.05);
}

.mobile-menu-nav {
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  margin: 0 12px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border-left: 3px solid transparent;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  pointer-events: auto;
  cursor: pointer;
}

.mobile-nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 60, 0.08), transparent);
  transition: left 0.5s ease;
}

.mobile-nav-item:hover::before {
  left: 100%;
}

.mobile-nav-item:hover {
  background: rgba(255, 140, 60, 0.08);
  border-left-color: rgba(255, 140, 60, 0.6);
  color: #ff8c42;
  transform: translateX(2px);
}

.mobile-nav-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.3s ease;
}

.mobile-nav-item:hover .mobile-nav-icon {
  color: #ff8c42;
}

.mobile-nav-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobile-nav-title {
  font-size: 16px;
  font-weight: 500;
  color: inherit;
  transition: color 0.3s ease;
}

.mobile-nav-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.3s ease;
}

.mobile-nav-item:hover .mobile-nav-desc {
  color: rgba(255, 140, 60, 0.8);
}

.mobile-nav-arrow {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
}

.mobile-nav-item:hover .mobile-nav-arrow {
  color: #ff8c42;
  transform: translateX(2px);
}

.mobile-menu-social {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(20, 20, 20, 0.8);
  border-radius: 0 0 16px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: auto;
}

.mobile-social-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: all 0.3s ease;
  flex: 1;
  position: relative;
  overflow: hidden;
  pointer-events: auto;
  cursor: pointer;
}

.mobile-social-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 60, 0.1), transparent);
  transition: left 0.5s ease;
}

.mobile-social-item:hover::before {
  left: 100%;
}

.mobile-social-item:hover {
  background: rgba(255, 140, 60, 0.1);
  border-color: rgba(255, 140, 60, 0.3);
  color: #ff8c42;
  transform: translateY(-2px);
}

.mobile-social-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  transition: color 0.3s ease;
}

.mobile-social-text {
  font-size: 12px;
  font-weight: 500;
  color: inherit;
  transition: color 0.3s ease;
}

.mobile-logout-section {
  padding: 20px 24px 24px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

.mobile-logout-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 12px;
  color: #dc2626;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.mobile-logout-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.1), transparent);
  transition: left 0.5s ease;
}

.mobile-logout-btn:hover::before {
  left: 100%;
}

.mobile-logout-btn:hover {
  background: rgba(220, 38, 38, 0.2);
  border-color: rgba(220, 38, 38, 0.5);
  transform: translateY(-1px);
}

.mobile-logout-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mobile-logout-text {
  flex: 1;
  text-align: left;
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.4s cubic-bezier(.2,.8,.2,1);
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  transform: translateX(100%);
}

@keyframes overlayFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to   { transform: translateX(0%); }
}


@media (max-width: 768px) {
  .hamburger { 
    display: block !important; 
    z-index: 1100;
    pointer-events: auto;
  }
  
  .navbar-links, .social-icons { 
    display: none !important; 
  }
  
  .mobile-menu { 
    display: block; 
  }
  
  .desktop-only {
    display: none !important;
  }
  
  .mobile-elements {
    display: flex !important;
  }
  
  .mobile-avatar-section {
    display: block;
  }
  
  .profile-dropdown {
    min-width: 240px;
    right: -10px;
  }
  
  .subscriptions-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .subscription-card {
    padding: 18px;
    border-radius: 6px;
  }
  
  .subscription-header {
    gap: 12px;
    margin-bottom: 14px;
    padding-bottom: 10px;
  }
  
  .subscription-icon {
    width: 36px;
    height: 36px;
    border-radius: 5px;
  }
  
  .subscription-icon-svg {
    font-size: 16px;
  }
  
  .subscription-name {
    font-size: 14px;
    letter-spacing: 0.2px;
  }
  
  .plan-badge {
    padding: 6px 12px;
    font-size: 11px;
    letter-spacing: 0.6px;
  }
  
  .plan-icon {
    font-size: 10px;
  }
  
  .subscription-expiry {
    padding: 12px 14px;
    border-radius: 4px;
  }
  
  .expiry-label {
    font-size: 11px;
    letter-spacing: 0.6px;
  }
  
  .expiry-value {
    font-size: 13px;
  }
  
  .subscription-status {
    padding-top: 12px;
    gap: 8px;
  }
  
  .status-indicator {
    width: 10px;
    height: 10px;
    font-size: 5px;
  }
  
  .status-text {
    font-size: 10px;
    letter-spacing: 0.6px;
    height: 44px;
  }
  
  .subscription-icon-svg {
    font-size: 18px;
  }
  
  .subscription-name {
    font-size: 17px;
  }
  
  .subscription-expiry {
    padding: 14px;
  }
  
  .expiry-label {
    font-size: 12px;
  }
  
  .expiry-value {
    font-size: 14px;
  }
  
  .plan-badge {
    padding: 5px 10px;
    font-size: 10px;
  }
  
  .plan-icon {
    font-size: 9px;
  }
  
  .no-subscriptions {
    padding: 40px 16px;
  }
  
  .no-subscriptions-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .no-subscriptions-title {
    font-size: 20px;
    margin-bottom: 8px;
  }
  
  .no-subscriptions-desc {
    font-size: 14px;
    margin-bottom: 24px;
  }
  
  .get-subscription-btn {
    padding: 12px 24px;
    font-size: 14px;
  }
  
  .content-section,
  .subscription-section,
  .password-section,
  .integration-section,
  .test-results-section {
    padding: 16px;
    border-radius: 16px;
  }
  
  .section-header-p {
    margin-bottom: 16px;
  }
  
  .section-title-p,
  .section-subtitle {
    font-size: 18px;
  }
  
  .integration-card {
    padding: 16px;
    border-radius: 12px;
  }
  
  .integration-title {
    font-size: 16px;
  }
  
  .integration-desc {
    font-size: 13px;
  }
  
  .connect-btn,
  .disconnect-btn,
  .get-subscription-btn,
  .cancel-subscription-btn {
    width: 100%;
    justify-content: center;
  }
  
  .modal-container {
    margin: 10px;
    padding: 20px;
    max-width: calc(100% - 20px);
  }
  
  .modal-title {
    font-size: 18px;
  }
  
  .modal-content {
    font-size: 14px;
  }
  
  .modal-btn {
    width: 100%;
    padding: 14px 20px;
  }
  
  .toast-container {
    top: 60px;
    left: 16px;
    right: 16px;
    max-width: none;
    bottom: auto;
  }
  
  .toast {
    padding: 12px;
  }
  
  .toast-message {
    font-size: 13px;
  }
}

/* Стили для кнопок подписок и тестов */
.get-subscription-btn {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.00);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 140, 60, 0.5);
  border-radius: 10px;
  color: rgba(255, 140, 60, 0.95);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
}

.get-subscription-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 60, 0.15), transparent);
  transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.get-subscription-btn:hover::before {
  left: 100%;
}

.get-subscription-btn:hover {
  background: rgba(255, 140, 60, 0.12);
  backdrop-filter: blur(12px);
  border-color: rgba(255, 140, 60, 0.7);
  color: #ff8c3c;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(255, 140, 60, 0.3),
    0 2px 8px rgba(255, 140, 60, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.get-subscription-btn:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 8px rgba(255, 140, 60, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.cancel-subscription-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(239, 68, 68, 0.5);
  border-radius: 10px;
  color: rgba(239, 68, 68, 0.95);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
}

.cancel-subscription-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.15), transparent);
  transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.cancel-subscription-btn:hover::before {
  left: 100%;
}

.cancel-subscription-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  backdrop-filter: blur(12px);
  border-color: rgba(239, 68, 68, 0.7);
  color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(239, 68, 68, 0.3),
    0 2px 8px rgba(239, 68, 68, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.cancel-subscription-btn:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 8px rgba(239, 68, 68, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.verification-section {
  background: #1F1F1F;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 24px;
  margin-top: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.verification-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 140, 60, 0.6), 
    rgba(255, 140, 60, 0.8), 
    rgba(255, 140, 60, 0.6), 
    transparent
  );
  border-radius: 12px 12px 0 0;
}

.verification-section::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 1px;
  right: 1px;
  bottom: 1px;
  background: linear-gradient(135deg, 
    rgba(255, 140, 60, 0.02) 0%, 
    transparent 50%, 
    rgba(255, 140, 60, 0.01) 100%
  );
  border-radius: 11px;
  pointer-events: none;
}

.verification-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
}

.verification-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 140, 60, 0.6), transparent);
}

.verification-icon {
  font-size: 22px;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 140, 60, 0.1), rgba(255, 140, 60, 0.05));
  border-radius: 8px;
  border: 1px solid rgba(255, 140, 60, 0.2);
  color: rgba(255, 140, 60, 0.9);
  box-shadow: 
    0 2px 8px rgba(255, 140, 60, 0.1),
    inset 0 1px 0 rgba(255, 140, 60, 0.2);
}

.verification-info {
  flex: 1;
}

.verification-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 6px 0;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.verification-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
  line-height: 1.5;
  font-weight: 400;
}

.verification-input-container {
  position: relative;
  margin-bottom: 20px;
}

.verification-code-input {
  width: 100%;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 8px;
  font-family: 'Courier New', monospace;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
  box-shadow: 
    0 2px 10px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.verification-code-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 4px;
}

.verification-code-input:focus {
  outline: none;
  border-color: rgba(255, 140, 60, 0.5);
  background: linear-gradient(135deg, rgba(255, 140, 60, 0.08), rgba(255, 140, 60, 0.04));
  box-shadow: 
    0 0 0 3px rgba(255, 140, 60, 0.15),
    0 4px 20px rgba(255, 140, 60, 0.1),
    inset 0 1px 0 rgba(255, 140, 60, 0.2);
  transform: translateY(-1px);
}

.verification-input-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(255, 140, 60, 0.03) 0%, 
    transparent 50%, 
    rgba(255, 140, 60, 0.02) 100%
  );
  border-radius: 10px;
  z-index: 1;
  opacity: 0.8;
}

.verification-actions {
  display: flex;
  justify-content: center;
}

.resend-code-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 140, 60, 0.5);
  color: rgba(255, 140, 60, 0.95);
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
}

.resend-code-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 60, 0.15), transparent);
  transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.resend-code-btn:hover::before {
  left: 100%;
}

.resend-code-btn:hover {
  background: rgba(255, 140, 60, 0.12);
  backdrop-filter: blur(12px);
  border-color: rgba(255, 140, 60, 0.7);
  color: #ff8c3c;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(255, 140, 60, 0.3),
    0 2px 8px rgba(255, 140, 60, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.resend-code-btn:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 8px rgba(255, 140, 60, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.btn-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
  opacity: 0.9;
}

.resend-code-btn:hover .btn-icon {
  transform: rotate(180deg);
  opacity: 1;
}

.verification-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.verification-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
}

.verification-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.verification-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

@media (max-width: 768px) {
  .verification-section {
    padding: 20px;
    margin-top: 12px;
    border-radius: 10px;
  }
  
  .verification-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding-bottom: 12px;
  }
  
  .verification-icon {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
  
  .verification-title {
    font-size: 15px;
    letter-spacing: 0.6px;
  }
  
  .verification-subtitle {
    font-size: 13px;
  }
  
  .verification-code-input {
    font-size: 20px;
    letter-spacing: 6px;
    padding: 18px 16px;
    border-radius: 8px;
  }
  
  .resend-code-btn {
    padding: 10px 16px;
    font-size: 13px;
    border-radius: 6px;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: modalFadeIn 0.3s ease-out;
}

.modal-container {
  background: linear-gradient(135deg, #1a1a1a, #0f0f0f);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 28px;
  max-width: 440px;
  width: 90%;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.6),
    0 8px 16px rgba(0, 0, 0, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05);
  animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.modal-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff8c3c, #ff6b35, #ff8c3c);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 0 10px rgba(255, 140, 60, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.modal-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.2));
  border: 2px solid rgba(239, 68, 68, 0.4);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  box-shadow: 
    0 4px 12px rgba(239, 68, 68, 0.3),
    0 2px 6px rgba(239, 68, 68, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
}

.modal-icon::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
  border-radius: 18px;
  z-index: -1;
}

.modal-title {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  background: linear-gradient(135deg, #ffffff, #f3f4f6, #e5e7eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  position: relative;
}

.modal-content {
  margin-bottom: 32px;
}

.modal-message {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 18px 0;
  line-height: 1.6;
  font-weight: 400;
}

.modal-message strong {
  color: #ff8c3c;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(255, 140, 60, 0.3);
}

.modal-warning {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  padding: 14px 18px 14px 46px;
  background: linear-gradient(135deg, rgba(255, 140, 60, 0.15), rgba(255, 107, 53, 0.1));
  border: 1px solid rgba(255, 140, 60, 0.3);
  border-radius: 10px;
  line-height: 1.5;
  font-weight: 500;
  box-shadow: 
    0 2px 6px rgba(255, 140, 60, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
}

.modal-warning::before {
  content: '⚠️';
  position: absolute;
  top: 16px;
  left: 20px;
  font-size: 18px;
}

.modal-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  min-width: 120px;
}

.modal-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-btn:hover::before {
  left: 100%;
}

.modal-btn-cancel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(107, 114, 128, 0.5);
  color: rgba(209, 213, 219, 0.95);
}

.modal-btn-cancel:hover {
  background: rgba(107, 114, 128, 0.12);
  backdrop-filter: blur(12px);
  border-color: rgba(107, 114, 128, 0.7);
  color: #f3f4f6;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(107, 114, 128, 0.3),
    0 2px 8px rgba(107, 114, 128, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.modal-btn-cancel:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 8px rgba(107, 114, 128, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.modal-btn-confirm {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(239, 68, 68, 0.5);
  color: rgba(239, 68, 68, 0.95);
}

.modal-btn-confirm:hover {
  background: rgba(239, 68, 68, 0.12);
  backdrop-filter: blur(12px);
  border-color: rgba(239, 68, 68, 0.7);
  color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(239, 68, 68, 0.3),
    0 2px 8px rgba(239, 68, 68, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.modal-btn-confirm:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 8px rgba(239, 68, 68, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.theme-toggle-container {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 4px;
  backdrop-filter: blur(10px);
}

.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  width: 44px;
  height: 44px;
}

.theme-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 60, 0.1), transparent);
  transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-btn:hover::before {
  left: 100%;
}

.theme-btn:hover {
  color: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.08);
}

.theme-btn.active {
  background: linear-gradient(135deg, rgba(255, 140, 60, 0.2), rgba(255, 107, 53, 0.1));
  color: #ff8c3c;
  border: 1px solid rgba(255, 140, 60, 0.3);
  box-shadow: 0 4px 12px rgba(255, 140, 60, 0.2);
}

.theme-btn.active::before {
  display: none;
}

.theme-btn:hover .theme-icon {
  transform: rotate(15deg) scale(1.1);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-btn-dark:hover .theme-icon {
  color: #6366f1;
}

.theme-btn-light:hover .theme-icon {
  color: #f59e0b;
}

@media (max-width: 768px) {
  .theme-toggle-container {
    gap: 6px;
  }
  
  .theme-btn {
    width: 40px;
    height: 40px;
    padding: 10px;
  }
  
  .theme-icon {
    width: 18px;
    height: 18px;
  }
}

.integrations-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.integration-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.integration-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 60, 0.05), transparent);
  transition: left 0.8s ease;
}

.integration-card:hover::before {
  left: 100%;
}

.integration-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 140, 60, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.integration-card.coming-soon {
  opacity: 0.6;
  filter: grayscale(0.3);
}

.integration-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.integration-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  position: relative;
  overflow: hidden;
}

.telegram-icon {
  background: linear-gradient(135deg, #0088cc, #229ED9);
  box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);
}


.integration-info {
  flex: 1;
}

.integration-title {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 4px 0;
}

.integration-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.5;
}

.integration-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.status-connected {
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-disconnected {
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.status-connected .status-dot {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.status-disconnected .status-dot {
  background: rgba(255, 255, 255, 0.3);
}

.integration-connected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 12px;
  margin-top: 16px;
}

.connected-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0088cc, #229ED9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.telegram-avatar {
  background: linear-gradient(135deg, #0088cc, #229ED9);
  box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.telegram-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 136, 204, 0.4);
}

.connected-details h4 {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 2px 0;
}

.connected-details p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.disconnect-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(239, 68, 68, 0.5);
  border-radius: 10px;
  color: rgba(239, 68, 68, 0.95);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
}

.disconnect-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.15), transparent);
  transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.disconnect-btn:hover::before {
  left: 100%;
}

.disconnect-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  backdrop-filter: blur(12px);
  border-color: rgba(239, 68, 68, 0.7);
  color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(239, 68, 68, 0.3),
    0 2px 8px rgba(239, 68, 68, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.disconnect-btn:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 8px rgba(239, 68, 68, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.integration-actions {
  margin-top: 20px;
}


.connect-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.0);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(82, 191, 255, 0.5);
  border-radius: 10px;
  color: rgba(82, 191, 255, 0.95);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
}

.connect-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(82, 191, 255, 0.15), transparent);
  transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.connect-btn:hover::before {
  left: 100%;
}

.connect-btn:hover {
  background: rgba(82, 191, 255, 0.12);
  backdrop-filter: blur(12px);
  border-color: rgba(82, 191, 255, 0.7);
  color: #52bfff;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(82, 191, 255, 0.3),
    0 2px 8px rgba(82, 191, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.connect-btn:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 8px rgba(82, 191, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.connect-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: rgba(82, 191, 255, 0.2);
  color: rgba(82, 191, 255, 0.4);
  background: rgba(255, 255, 255, 0.02);
  transform: none !important;
  box-shadow: none !important;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.coming-soon-badge {
  background: linear-gradient(135deg, rgba(255, 140, 60, 0.2), rgba(255, 107, 53, 0.1));
  border: 1px solid rgba(255, 140, 60, 0.3);
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #ff8c3c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 8px 0 0 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .integration-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .integration-status {
    align-self: flex-start;
  }
  
  .integration-connected {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .connect-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .modal-container {
    padding: 24px;
    margin: 20px;
    width: calc(100% - 40px);
  }
  
  .modal-title {
    font-size: 20px;
  }
  
  .modal-message {
    font-size: 14px;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .modal-btn {
    width: 100%;
    padding: 14px 20px;
  }
}

/* Стили для результатов тестов */
.test-results-content {
  margin-top: 24px;
}

.test-results-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  color: rgba(255, 255, 255, 0.6);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 140, 60, 0.2);
  border-top-color: #ff8c42;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-test-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.no-test-results-icon {
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.6;
}

.no-test-results-title {
  font-size: 20px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 12px 0;
}

.no-test-results-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  max-width: 400px;
}

.test-results-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.test-results-content {
  max-width: 100%;
  width: 100%;
}

.test-result-card {
  border: 1px solid;
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.test-result-card.success {
  border-color: rgba(74, 222, 128, 0.3);
  box-shadow: 0 4px 16px rgba(74, 222, 128, 0.1);
}

.test-result-card.warning {
  border-color: rgba(251, 191, 36, 0.3);
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.1);
}

.test-result-card.error {
  border-color: rgba(239, 68, 68, 0.3);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.1);
}

.test-result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.test-result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
}

.test-result-subject {
  flex: 1;
}

.subject-badge {
  display: inline-block;
  padding: 6px 12px;
  background: rgba(255, 140, 60, 0.2);
  border: 1px solid rgba(255, 140, 60, 0.3);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #ffb347;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.test-result-topic {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  line-height: 1.4;
}

.test-result-score {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 24px;
}

.test-result-score.excellent {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.test-result-score.success {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
}

.test-result-score.warning {
  background: rgba(255, 140, 60, 0.15);
  color: #ff8c42;
}

.test-result-score.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.test-result-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.detail-value {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.test-result-progress {
  margin-top: 16px;
}

.progress-bar-bg {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
  box-shadow: 0 0 12px rgba(255, 140, 60, 0.5);
}

.progress-bar-fill.excellent {
  background: linear-gradient(90deg, #10b981, #059669);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
}

.progress-bar-fill.success {
  background: linear-gradient(90deg, #4ade80, #22c55e);
  box-shadow: 0 0 12px rgba(74, 222, 128, 0.5);
}

.progress-bar-fill.warning {
  background: linear-gradient(90deg, #ff8c42, #ff6b35);
  box-shadow: 0 0 12px rgba(255, 140, 60, 0.5);
}

.progress-bar-fill.error {
  background: linear-gradient(90deg, #ef4444, #dc2626);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
}

.test-results-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.pagination-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 140, 60, 0.3);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-button:hover:not(:disabled) {
  background: rgba(255, 140, 60, 0.15);
  border-color: #ff8c42;
  color: #ffb347;
  transform: translateY(-2px);
}

.pagination-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

/* Секция обзора в результатах */
.test-result-review-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.review-toggle-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.review-toggle-button:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.95);
}

.result-review-container {
  margin-top: 16px;
  animation: fadeIn 0.3s ease;
}

.result-review-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 140, 60, 0.2);
}

.result-review-title {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 12px 0;
}

.result-review-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.result-stat-item {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.correct-stat-small {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.incorrect-stat-small {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.result-review-questions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-review-question-card {
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid;
  border-radius: 12px;
  padding: 18px;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
}

.result-review-question-card.correct {
  border-color: rgba(74, 222, 128, 0.3);
  background: rgba(74, 222, 128, 0.05);
}

.result-review-question-card.incorrect {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}

.result-review-question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-review-question-number {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.result-review-question-status {
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
}

.correct-badge-small {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.incorrect-badge-small {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.result-review-question-text {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.result-review-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-review-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 2px solid rgba(255, 140, 60, 0.15);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.result-review-option.correct-answer {
  background: rgba(74, 222, 128, 0.12);
  border-color: rgba(74, 222, 128, 0.3);
}

.result-review-option.wrong-user-answer {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
}

.result-review-option.user-answer.correct-answer {
  background: rgba(74, 222, 128, 0.18);
  border-color: rgba(74, 222, 128, 0.4);
}

.result-review-option-letter {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 140, 60, 0.2);
  border-radius: 5px;
  font-weight: 700;
  color: #ffb347;
  font-size: 13px;
  flex-shrink: 0;
}

.result-review-option.correct-answer .result-review-option-letter {
  background: rgba(74, 222, 128, 0.25);
  color: #4ade80;
}

.result-review-option.wrong-user-answer .result-review-option-letter {
  background: rgba(239, 68, 68, 0.25);
  color: #ef4444;
}

.result-review-option-text {
  flex: 1;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 1.5;
}

.result-review-option-markers {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-shrink: 0;
}

.result-marker {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.correct-marker-small {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.wrong-marker-small {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.partial-marker-small {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

@keyframes slide-down {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 2000px;
    transform: translateY(0);
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  /* Общие стили для результатов тестов */
  .test-results-content {
    padding: 0;
  }
  
  .test-result-card {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .test-result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
  }
  
  .test-result-subject {
    width: 100%;
  }
  
  .subject-badge {
    font-size: 11px;
    padding: 4px 10px;
    margin-bottom: 8px;
  }
  
  .test-result-topic {
    font-size: 16px;
    line-height: 1.4;
  }
  
  .test-result-score {
    align-self: flex-start;
    padding: 8px 14px;
  }
  
  .score-value {
    font-size: 20px;
  }
  
  .test-result-details {
    margin-top: 12px;
    gap: 10px;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 10px 0;
  }
  
  .detail-label {
    font-size: 12px;
  }
  
  .detail-value {
    font-size: 15px;
  }
  
  .test-result-progress {
    margin-top: 12px;
  }
  
  .progress-bar-bg {
    height: 6px;
  }
  
  /* Секция обзора на мобильных */
  .test-result-review-section {
    margin-top: 16px;
    padding-top: 16px;
  }
  
  .review-toggle-button {
    padding: 10px 14px;
    font-size: 13px;
  }
  
  .result-review-container {
    margin-top: 12px;
  }
  
  .result-review-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
  }
  
  .result-review-title {
    font-size: 16px;
    margin-bottom: 10px;
  }
  
  .result-review-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .result-stat-item {
    padding: 6px 10px;
    font-size: 12px;
    width: 100%;
  }
  
  .result-review-questions {
    gap: 12px;
  }
  
  .result-review-question-card {
    padding: 14px;
  }
  
  .result-review-question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 10px;
  }
  
  .result-review-question-number {
    font-size: 11px;
  }
  
  .result-review-question-status {
    font-size: 11px;
    padding: 3px 8px;
  }
  
  .result-review-question-text {
    font-size: 14px;
    margin-bottom: 12px;
    line-height: 1.4;
  }
  
  .result-review-options {
    gap: 8px;
  }
  
  .result-review-option {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px 12px;
    gap: 8px;
  }
  
  .result-review-option-letter {
    width: 22px;
    height: 22px;
    font-size: 12px;
  }
  
  .result-review-option-text {
    font-size: 13px;
    width: 100%;
  }
  
  .result-review-option-markers {
    width: 100%;
    margin-top: 6px;
    gap: 4px;
  }
  
  .result-marker {
    font-size: 10px;
    padding: 3px 6px;
    width: 100%;
    white-space: normal;
    word-break: break-word;
  }
  
  /* Пагинация на мобильных */
  .test-results-pagination {
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
    padding: 16px 0;
  }
  
  .pagination-button {
    width: 100%;
    justify-content: center;
    padding: 12px 16px;
  }
  
  .pagination-info {
    text-align: center;
    font-size: 13px;
  }
  
  /* Загрузка и пустые состояния */
  .test-results-loading {
    padding: 60px 20px;
  }
  
  .no-test-results {
    padding: 60px 20px;
  }
  
  .no-test-results-icon {
    font-size: 60px;
    margin-bottom: 20px;
  }
  
  .no-test-results-title {
    font-size: 20px;
    margin-bottom: 12px;
  }
  
  .no-test-results-desc {
    font-size: 14px;
    line-height: 1.5;
  }
}

</style>

