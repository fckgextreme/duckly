<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { getToken, clearToken } from '../services/auth'
import { useRouter } from 'vue-router'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGlobe, faBars, faTimes, faUser, faSignOutAlt, faCog, faCheckCircle, faTimesCircle, faInfinity, faCalendarDays, faShield, faBook, faGavel, faLanguage, faCreditCard, faKey, faUserEdit } from '@fortawesome/free-solid-svg-icons'

library.add(faGlobe, faTelegramPlane, faBars, faTimes, faUser, faSignOutAlt, faCog, faCheckCircle, faTimesCircle, faInfinity, faCalendarDays, faShield, faBook, faGavel, faLanguage, faCreditCard, faKey, faUserEdit)

const mobileMenu = ref(false)
const router = useRouter()
const me = ref<any>(null)
const error = ref('')
const showProfileMenu = ref(false)

async function loadMe() {
  try {
    const token = getToken()
    const { data } = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } })
    me.value = data.user
  } catch (e: any) {
    error.value = 'Сессия невалидна'
  }
}

function logout() {
  clearToken()
  router.replace('/login')
}

function goToProfile() {
  router.push('/profile')
}

function goToAdminPanel() {
  router.push('/admin')
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

function showAlert(message: string) {
  alert(message)
}

onMounted(loadMe)

const plan = computed(() => me.value?.plan || 'free')

// Проверка доступа админа
const hasAccess = computed(() => me.value?.plan === 'admin')

// Данные для админ панели
const allUsers = ref<any[]>([])
const loadingUsers = ref(false)
const searchQuery = ref('')
const selectedUser = ref<any>(null)
const showUserModal = ref(false)
const activeTab = ref<'subscriptions' | 'userData' | 'password'>('subscriptions')

// Данные для управления подписками
const subscriptionSubject = ref('historyKZ')
const subscriptionPlan = ref('basic')
const subscriptionDays = ref(30)
const subscriptionInfinite = ref(false)

// Данные для редактирования пользователя
const editingDisplayName = ref('')
const editingUsername = ref('')
const editingEmail = ref('')

// Данные для изменения пароля
const newPassword = ref('')
const confirmPassword = ref('')

// Уведомления
const toastNotifications = ref<Array<{
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  duration?: number
}>>([])

let notificationId = 0

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 5000) {
  const id = `toast-${++notificationId}`
  const notification = {
    id,
    type,
    message,
    duration
  }
  toastNotifications.value.push(notification)
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }
}

function removeToast(id: string) {
  const index = toastNotifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    toastNotifications.value.splice(index, 1)
  }
}

// Загрузка списка пользователей
async function loadUsers() {
  if (!hasAccess.value) return
  loadingUsers.value = true
  try {
    const token = getToken()
    const { data } = await axios.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
    allUsers.value = data.users || []
  } catch (e: any) {
    if (e.response?.status === 403) {
      showToast('Доступ запрещен. Требуются права администратора', 'error')
      setTimeout(() => {
        router.push('/profile')
      }, 2000)
    } else {
      showToast('Ошибка загрузки пользователей', 'error')
    }
  } finally {
    loadingUsers.value = false
  }
}

// Фильтрация пользователей
const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return allUsers.value
  const query = searchQuery.value.toLowerCase()
  return allUsers.value.filter(user => 
    user.email?.toLowerCase().includes(query) ||
    user.username?.toLowerCase().includes(query) ||
    user.displayName?.toLowerCase().includes(query) ||
    user.id?.toString().includes(query)
  )
})

// Пагинация
const currentPage = ref(1)
const itemsPerPage = 20

// Пагинированные пользователи
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredUsers.value.slice(start, end)
})

// Общее количество страниц
const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / itemsPerPage)
})

// Нужна ли пагинация (если пользователей больше itemsPerPage)
const needsPagination = computed(() => {
  return filteredUsers.value.length > itemsPerPage
})

// Сброс на первую страницу при поиске
watch(searchQuery, () => {
  currentPage.value = 1
})

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    // Прокрутка вверх при смене страницы
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Открыть модальное окно пользователя
function openUserModal(user: any) {
  selectedUser.value = user
  editingDisplayName.value = user.displayName || ''
  editingUsername.value = user.username || ''
  editingEmail.value = user.email || ''
  newPassword.value = ''
  confirmPassword.value = ''
  showUserModal.value = true
  activeTab.value = 'subscriptions'
}

// Закрыть модальное окно
function closeUserModal() {
  showUserModal.value = false
  selectedUser.value = null
}

// Выдача/снятие подписки
async function manageSubscription(action: 'grant' | 'revoke') {
  if (!selectedUser.value) return
  
  try {
    const token = getToken()
    const subject = subscriptionSubject.value
    const plan = action === 'grant' ? subscriptionPlan.value : null
    const expiryDays = action === 'grant' 
      ? (subscriptionInfinite.value ? -1 : subscriptionDays.value)
      : undefined
    
    await axios.post('/api/admin/subscription', {
      userId: selectedUser.value.id,
      subject,
      plan,
      expiryDays
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    showToast(
      action === 'grant' 
        ? `Подписка успешно выдана` 
        : `Подписка успешно снята`,
      'success'
    )
    
    await loadUsers()
    if (selectedUser.value) {
      const updated = allUsers.value.find(u => u.id === selectedUser.value.id)
      if (updated) {
        selectedUser.value = updated
      }
    }
  } catch (e: any) {
    showToast(e.response?.data?.error || 'Ошибка управления подпиской', 'error')
  }
}

// Сохранение данных пользователя
async function saveUserData() {
  if (!selectedUser.value) return
  
  try {
    const token = getToken()
    await axios.put(`/api/admin/user/${selectedUser.value.id}`, {
      displayName: editingDisplayName.value || null,
      username: editingUsername.value || null,
      email: editingEmail.value || null
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    showToast('Данные пользователя успешно обновлены', 'success')
    await loadUsers()
    const updated = allUsers.value.find(u => u.id === selectedUser.value.id)
    if (updated) {
      selectedUser.value = updated
      editingDisplayName.value = updated.displayName || ''
      editingUsername.value = updated.username || ''
      editingEmail.value = updated.email || ''
    }
  } catch (e: any) {
    showToast(e.response?.data?.error || 'Ошибка обновления данных', 'error')
  }
}

// Изменение пароля
async function changePassword() {
  if (!selectedUser.value) return
  
  if (!newPassword.value || newPassword.value.length < 6) {
    showToast('Пароль должен содержать минимум 6 символов', 'error')
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    showToast('Пароли не совпадают', 'error')
    return
  }
  
  try {
    const token = getToken()
    await axios.put(`/api/admin/user/${selectedUser.value.id}/password`, {
      newPassword: newPassword.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    showToast('Пароль успешно изменен', 'success')
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e: any) {
    showToast(e.response?.data?.error || 'Ошибка изменения пароля', 'error')
  }
}

function isSubscriptionActive(expiry: any) {
  if (!expiry || expiry === 'infinity') return true
  if (expiry === -1) return true
  const now = Date.now()
  return expiry > now
}

function getSubscriptionStatus(user: any, subject: string) {
  const statusFields: Record<string, string> = {
    historyKZ: 'historyKZStatus',
    worldHistory: 'worldHistoryStatus',
    lawBasics: 'lawBasicsStatus',
    chinese: 'chineseStatus'
  }
  
  const planFields: Record<string, string> = {
    historyKZ: 'historyKZPlan',
    worldHistory: 'worldHistoryPlan',
    lawBasics: 'lawBasicsPlan',
    chinese: 'chinesePlan'
  }
  
  const expiryFields: Record<string, string> = {
    historyKZ: 'historyKZExpiry',
    worldHistory: 'worldHistoryExpiry',
    lawBasics: 'lawBasicsExpiry',
    chinese: 'chineseExpiry'
  }
  
  const status = user[statusFields[subject]]
  const plan = user[planFields[subject]]
  const expiry = user[expiryFields[subject]]
  
  if (!plan || status === 'cancelled') {
    return { active: false, plan: null, expiry: null }
  }
  
  return {
    active: isSubscriptionActive(expiry),
    plan,
    expiry
  }
}

onMounted(async () => {
  await loadMe()
  if (hasAccess.value) {
    await loadUsers()
  } else {
    showToast('Доступ запрещен. Требуются права администратора', 'error')
    setTimeout(() => {
      router.push('/profile')
    }, 2000)
  }
})

const hasHistoryKZ = computed(() => {
  if (!me.value) return false
  if (plan.value === 'root' || plan.value === 'admin') return true
  
  const hasNewPlan = me.value.historyKZPlan && me.value.historyKZPlan !== 'null' && me.value.historyKZPlan !== null
  const isNewActive = isSubscriptionActive(me.value.historyKZExpiry)
  
  const hasOldPlan = plan.value && (plan.value.includes('histKZ') || plan.value.includes('histKZ_'))
  
  return (hasNewPlan && isNewActive) || hasOldPlan
})
const hasWorldHistory = computed(() => {
  if (!me.value) return false
  if (plan.value === 'root' || plan.value === 'admin') return true
  
  const hasNewPlan = me.value.worldHistoryPlan && me.value.worldHistoryPlan !== 'null' && me.value.worldHistoryPlan !== null
  const isNewActive = isSubscriptionActive(me.value.worldHistoryExpiry)
  
  const hasOldPlan = plan.value && (plan.value.includes('worldHistory') || plan.value.includes('worldHistory_'))
  
  return (hasNewPlan && isNewActive) || hasOldPlan
})
const hasLawBasics = computed(() => {
  if (!me.value) return false
  if (plan.value === 'root' || plan.value === 'admin') return true
  
  const hasNewPlan = me.value.lawBasicsPlan && me.value.lawBasicsPlan !== 'null' && me.value.lawBasicsPlan !== null
  const isNewActive = isSubscriptionActive(me.value.lawBasicsExpiry)
  
  const hasOldPlan = plan.value && (plan.value.includes('lawBasics') || plan.value.includes('lawBasics_'))
  
  return (hasNewPlan && isNewActive) || hasOldPlan
})
const hasChinese = computed(() => {
  if (!me.value) return false
  if (plan.value === 'root' || plan.value === 'admin') return true
  
  const hasNewPlan = me.value.chinesePlan && me.value.chinesePlan !== 'null' && me.value.chinesePlan !== null
  const isNewActive = isSubscriptionActive(me.value.chineseExpiry)
  
  const hasOldPlan = plan.value && (plan.value.includes('chinese') || plan.value.includes('chinese_'))
  
  const result = (hasNewPlan && isNewActive) || hasOldPlan
  
  return result
})
</script>

<template>
  <div class="main-container">
    <nav class="navbar">
      <div class="navbar-container">
        <RouterLink to="https://duckandlaw.com" class="navbar-logo">
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
               <span class="profile-name">{{ me.displayName || me.email }}</span>
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
                     <div class="dropdown-name">{{ me.displayName || me.email }}</div>
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
    <main class="main-content">
      <div class="docs-container">
        <div class="docs-header">
          <div class="docs-header-content">
            <div class="docs-badge">
              <i class="fas fa-shield-alt"></i>
              <span>Административная панель</span>
            </div>
            <h1 class="docs-title">Панель управления</h1>
            <p class="docs-subtitle">Управление пользователями и подписками позволяет редактировать учетные записи, выдавать и снимать тарифные планы, а также контролировать пароли пользователей.</p>
          </div>
          <div class="docs-decoration">
            <div class="decoration-circle circle-1"></div>
            <div class="decoration-circle circle-2"></div>
            <div class="decoration-circle circle-3"></div>
            <div class="decoration-line line-1"></div>
            <div class="decoration-line line-2"></div>
          </div>
        </div>
      </div>

      <!-- Админ панель -->
      <div v-if="hasAccess && !loadingUsers" class="admin-panel">

        <!-- Поиск пользователей -->
        <div class="admin-search">
          <div class="search-input-wrapper">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Найти пользователя.."
            />
          </div>
        </div>

        <!-- Список пользователей -->
        <div class="users-list">
          <TransitionGroup name="user-list">
            <div
              v-for="user in paginatedUsers"
              :key="user.id"
              class="user-card"
              @click="openUserModal(user)"
            >
              <div class="user-card-avatar">
                <img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.username || user.email" />
                <div v-else class="user-avatar-placeholder">
                  {{ (user.username || user.email || 'U').charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="user-card-info">
                <div class="user-card-name">{{ user.displayName || user.username || user.email }}</div>
                <div class="user-card-email">{{ user.email }}</div>
                <div v-if="user.username" class="user-card-username">@{{ user.username }}</div>
                <div class="user-card-id">ID: {{ user.id }}</div>
              </div>
              <div class="user-card-subscriptions">
                <div
                  v-for="subject in ['historyKZ', 'worldHistory', 'lawBasics', 'chinese']"
                  :key="subject"
                  class="subscription-badge"
                  :class="{
                    active: getSubscriptionStatus(user, subject).active,
                    inactive: !getSubscriptionStatus(user, subject).active
                  }"
                >
                  <font-awesome-icon 
                    :icon="subject === 'historyKZ' ? 'book' : subject === 'worldHistory' ? 'book' : subject === 'lawBasics' ? 'gavel' : 'language'" 
                    class="badge-icon" 
                  />
                  <span>{{ subject === 'historyKZ' ? 'История Казахстана' : subject === 'worldHistory' ? 'Всемирная история' : subject === 'lawBasics' ? 'Основы права' : 'Китайский язык (简体中文)' }}</span>
                </div>
              </div>
              <div class="user-card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <div v-if="filteredUsers.length === 0 && !loadingUsers" class="no-users">
          <p>Пользователи не найдены</p>
        </div>

        <!-- Пагинация -->
        <div v-if="!loadingUsers && filteredUsers.length > 0" class="pagination">
          <div class="pagination-wrapper">
            <button 
              class="pagination-btn" 
              :disabled="currentPage === 1 || totalPages === 0"
              @click="goToPage(currentPage - 1)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15,18 9,12 15,6"></polyline>
              </svg>
              <span class="pagination-btn-text">Назад</span>
            </button>
            <div class="pagination-info">
              <span class="pagination-text">Страница {{ currentPage }} из {{ totalPages > 0 ? totalPages : 1 }}</span>
              <span class="pagination-count-mobile">({{ filteredUsers.length }} {{ filteredUsers.length === 1 ? 'пользователь' : filteredUsers.length < 5 ? 'пользователя' : 'пользователей' }})</span>
            </div>
            <button 
              class="pagination-btn" 
              :disabled="currentPage === totalPages || totalPages === 0"
              @click="goToPage(currentPage + 1)"
            >
              <span class="pagination-btn-text">Вперед</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="loadingUsers" class="admin-loading">
        <p>Загрузка пользователей...</p>
      </div>

      <!-- Модальное окно управления пользователем -->
      <Transition name="modal">
        <div v-if="showUserModal" class="modal-overlay" @click.self="closeUserModal">
          <div class="modal-container-admin" @click.stop>
            <div class="modal-header-admin">
              <h3 class="modal-title-admin">Управление аккаунтом пользователя</h3>
              <button class="modal-close" @click="closeUserModal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div v-if="selectedUser" class="modal-user-info">
              <div class="modal-user-avatar">
                <img v-if="selectedUser.avatarUrl" :src="selectedUser.avatarUrl" :alt="selectedUser.username || selectedUser.email" />
                <div v-else class="modal-avatar-placeholder">
                  {{ (selectedUser.username || selectedUser.email || 'U').charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="modal-user-details">
                <div class="modal-user-name">{{ selectedUser.displayName || selectedUser.username || selectedUser.email }}</div>
                <div class="modal-user-email">{{ selectedUser.email }}</div>
                <div v-if="selectedUser.username" class="modal-user-username">@{{ selectedUser.username }}</div>
              </div>
            </div>

            <!-- Вкладки -->
            <div class="modal-tabs">
              <button
                class="modal-tab"
                :class="{ active: activeTab === 'subscriptions' }"
                @click="activeTab = 'subscriptions'"
              >
                <font-awesome-icon icon="credit-card" class="tab-icon" />
                <span class="tab-text">Подписки</span>
              </button>
              <button
                class="modal-tab"
                :class="{ active: activeTab === 'userData' }"
                @click="activeTab = 'userData'"
              >
                <font-awesome-icon icon="user-edit" class="tab-icon" />
                <span class="tab-text">Данные</span>
              </button>
              <button
                class="modal-tab"
                :class="{ active: activeTab === 'password' }"
                @click="activeTab = 'password'"
              >
                <font-awesome-icon icon="key" class="tab-icon" />
                <span class="tab-text">Пароль</span>
              </button>
            </div>

            <!-- Содержимое вкладок -->
            <div class="modal-content-admin">
              <!-- Вкладка подписок -->
              <Transition name="tab-content">
                <div v-if="activeTab === 'subscriptions'" class="tab-panel">
                  <div class="subscription-management">
                    <div class="form-group">
                      <label class="form-label">
                        <font-awesome-icon icon="book" class="label-icon" />
                        Предмет
                      </label>
                      <div class="radio-group">
                        <label class="radio-option" :class="{ active: subscriptionSubject === 'historyKZ' }">
                          <input type="radio" v-model="subscriptionSubject" value="historyKZ" />
                          <div class="radio-content">
                            <font-awesome-icon icon="book" class="radio-icon" />
                            <span>История Казахстана</span>
                          </div>
                        </label>
                        <label class="radio-option" :class="{ active: subscriptionSubject === 'worldHistory' }">
                          <input type="radio" v-model="subscriptionSubject" value="worldHistory" />
                          <div class="radio-content">
                            <font-awesome-icon icon="book" class="radio-icon" />
                            <span>Всемирная История</span>
                          </div>
                        </label>
                        <label class="radio-option" :class="{ active: subscriptionSubject === 'lawBasics' }">
                          <input type="radio" v-model="subscriptionSubject" value="lawBasics" />
                          <div class="radio-content">
                            <font-awesome-icon icon="gavel" class="radio-icon" />
                            <span>Основы права</span>
                          </div>
                        </label>
                        <label class="radio-option" :class="{ active: subscriptionSubject === 'chinese' }">
                          <input type="radio" v-model="subscriptionSubject" value="chinese" />
                          <div class="radio-content">
                            <font-awesome-icon icon="language" class="radio-icon" />
                            <span>Китайский язык (简体中文)</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div class="subscription-status-card" v-if="selectedUser">
                      <div class="status-card-header">
                        <font-awesome-icon :icon="getSubscriptionStatus(selectedUser, subscriptionSubject).active ? 'check-circle' : 'times-circle'" 
                          class="status-card-icon" 
                          :class="{
                            active: getSubscriptionStatus(selectedUser, subscriptionSubject).active,
                            inactive: !getSubscriptionStatus(selectedUser, subscriptionSubject).active
                          }" />
                        <div class="status-card-body">
                          <div class="status-card-label">Статус подписки</div>
                          <div class="status-card-value" :class="{
                            active: getSubscriptionStatus(selectedUser, subscriptionSubject).active,
                            inactive: !getSubscriptionStatus(selectedUser, subscriptionSubject).active
                          }">
                            {{ getSubscriptionStatus(selectedUser, subscriptionSubject).active ? 'Активна' : 'Неактивна' }}
                          </div>
                        </div>
                      </div>
                      <div v-if="getSubscriptionStatus(selectedUser, subscriptionSubject).plan" class="status-card-plan-wrapper">
                        <font-awesome-icon icon="shield" class="plan-icon" />
                        <span class="status-card-plan">
                          План: <strong>{{ getSubscriptionStatus(selectedUser, subscriptionSubject).plan }}</strong>
                        </span>
                      </div>
                    </div>

                    <div v-if="!getSubscriptionStatus(selectedUser, subscriptionSubject).active || !selectedUser" class="grant-subscription">
                      <div class="form-group">
                        <label class="form-label">
                          <font-awesome-icon icon="shield" class="label-icon" />
                          План подписки
                        </label>
                        <div class="radio-group">
                          <label class="radio-option" :class="{ active: subscriptionPlan === 'basic' }">
                            <input type="radio" v-model="subscriptionPlan" value="basic" />
                            <div class="radio-content">
                              <font-awesome-icon icon="shield" class="radio-icon" />
                              <span>Базовый</span>
                            </div>
                          </label>
                          <label class="radio-option" :class="{ active: subscriptionPlan === 'premium' }">
                            <input type="radio" v-model="subscriptionPlan" value="premium" />
                            <div class="radio-content">
                              <font-awesome-icon icon="shield" class="radio-icon" />
                              <span>Премиальный</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div class="form-group">
                        <label class="form-label">
                          <font-awesome-icon icon="calendar-days" class="label-icon" />
                          Срок действия
                        </label>
                        <div class="duration-row">
                          <label class="checkbox-inline">
                            <input type="checkbox" v-model="subscriptionInfinite" />
                            <font-awesome-icon icon="infinity" class="checkbox-icon" />
                            <span>Бессрочная</span>
                          </label>
                          <input
                            v-model.number="subscriptionDays"
                            type="number"
                            min="1"
                            class="form-input inline-input"
                            :class="{ disabled: subscriptionInfinite }"
                            :disabled="subscriptionInfinite"
                            placeholder="Количество дней"
                          />
                        </div>
                      </div>

                      <button class="btn-primary" @click="manageSubscription('grant')">
                        <font-awesome-icon icon="check-circle" />
                        Выдать подписку
                      </button>
                    </div>

                    <div v-if="getSubscriptionStatus(selectedUser, subscriptionSubject).active && selectedUser" class="revoke-subscription">
                      <button class="btn-danger" @click="manageSubscription('revoke')">
                        <font-awesome-icon icon="times-circle" />
                        Снять подписку
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>

              <!-- Вкладка данных пользователя -->
              <Transition name="tab-content">
                <div v-if="activeTab === 'userData'" class="tab-panel">
                  <div class="user-data-form">
                    <div class="form-group">
                      <label class="form-label">Отображаемое имя</label>
                      <input
                        v-model="editingDisplayName"
                        type="text"
                        class="form-input"
                        placeholder="Введите отображаемое имя..."
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Никнейм</label>
                      <input
                        v-model="editingUsername"
                        type="text"
                        class="form-input"
                        placeholder="Введите никнейм..."
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Электронная почта</label>
                      <input
                        v-model="editingEmail"
                        type="email"
                        class="form-input"
                        placeholder="Введите электронную почту..."
                      />
                    </div>

                    <button class="btn-primary" @click="saveUserData">
                      <font-awesome-icon icon="check-circle" />
                      Сохранить изменения
                    </button>
                  </div>
                </div>
              </Transition>

              <!-- Вкладка пароля -->
              <Transition name="tab-content">
                <div v-if="activeTab === 'password'" class="tab-panel">
                  <div class="password-form">
                    <div class="form-group">
                      <label class="form-label">Новый пароль</label>
                      <input
                        v-model="newPassword"
                        type="password"
                        class="form-input"
                        placeholder="Введите новый пароль (минимум 6 символов)"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Подтверждение пароля</label>
                      <input
                        v-model="confirmPassword"
                        type="password"
                        class="form-input"
                        placeholder="Подтвердите новый пароль"
                      />
                    </div>

                    <button class="btn-primary" @click="changePassword">
                      <font-awesome-icon icon="key" />
                      Изменить пароль
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Уведомления -->
      <TransitionGroup name="toast" tag="div" class="toast-container-admin">
        <div
          v-for="notification in toastNotifications"
          :key="notification.id"
          class="toast-admin"
          :class="notification.type"
        >
          <div class="toast-content-admin">
            <span class="toast-message-admin">{{ notification.message }}</span>
            <button class="toast-close" @click="removeToast(notification.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </TransitionGroup>
    </main>
 
    <footer class="main-footer">
      <div class="footer-bottom">
        <div class="footer-copyright">
          © 2025 Duck & Law. All rights reserved. Developed by 
          <span class="footer-highlight">エクストリーム</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import '../assets/main.css';

/* Navbar */
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
  width: 100%;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  text-decoration: none;
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

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
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

.desktop-only {
  display: flex;
}

/* Админ панель */
.admin-panel {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}


/* Поиск */
.admin-search {
  margin-bottom: 24px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 16px;
  color: rgba(255, 255, 255, 0.5);
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.5s ease-out 0.2s both;
}

.search-input:focus {
  outline: none;
  border-color: rgba(255, 140, 60, 0.5);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(255, 140, 60, 0.1);
  transform: translateY(-1px);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

/* Список пользователей */
.users-list {
  display: grid;
  gap: 16px;
  animation: fadeInUp 0.5s ease-out 0.3s both;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 60, 0.1), transparent);
  transition: left 0.5s ease;
}

.user-card:hover::before {
  left: 100%;
}

.user-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 140, 60, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 140, 60, 0.1);
}

.user-card-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid rgba(255, 140, 60, 0.3);
}

.user-card-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 600;
}

.user-card-info {
  flex: 1;
  min-width: 0;
}

.user-card-name {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 4px;
}

.user-card-email {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2px;
}

.user-card-username {
  font-size: 13px;
  color: rgba(255, 140, 60, 0.8);
  margin-bottom: 2px;
}

.user-card-id {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.user-card-subscriptions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 300px;
}

.subscription-badge {
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.badge-icon {
  font-size: 12px;
  transition: all 0.3s ease;
}

.subscription-badge.active {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #10b981;
}

.subscription-badge.active .badge-icon {
  color: #10b981;
}

.subscription-badge.inactive {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
}

.subscription-badge.inactive .badge-icon {
  color: rgba(255, 255, 255, 0.3);
}

.user-card-arrow {
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.user-card:hover .user-card-arrow {
  color: rgba(255, 140, 60, 0.8);
  transform: translateX(4px);
}

.no-users, .admin-loading {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.6);
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container-admin {
  background: rgba(26, 26, 26, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-header-admin {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title-admin {
  font-size: 24px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
}

.modal-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  cursor: pointer;
  color: rgba(239, 68, 68, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.modal-close::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(239, 68, 68, 0.1);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modal-close:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: #ef4444;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.modal-close:hover::before {
  opacity: 1;
}

.modal-close:active {
  transform: scale(0.95);
}

.close-icon {
  font-size: 18px;
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.modal-close:hover .close-icon {
  transform: rotate(90deg);
}

.modal-user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 140, 60, 0.3);
  flex-shrink: 0;
}

.modal-user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  font-weight: 600;
}

.modal-user-details {
  flex: 1;
  min-width: 0;
}

.modal-user-name {
  font-size: 20px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 4px;
}

.modal-user-email {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2px;
}

.modal-user-username {
  font-size: 13px;
  color: rgba(255, 140, 60, 0.8);
}

/* Вкладки */
.modal-tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0;
  width: 100%;
}

.modal-tab {
  flex: 1;
  padding: 18px 24px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modal-tab::before {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 60, 0.3), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modal-tab:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.02);
}

.modal-tab:hover::before {
  opacity: 1;
}

.modal-tab.active {
  color: #ff8c42;
  border-bottom-color: #ff8c42;
  background: rgba(255, 140, 60, 0.05);
}

.modal-tab.active::before {
  opacity: 0;
}

.tab-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.modal-tab:hover .tab-icon {
  transform: scale(1.1);
}

.modal-tab.active .tab-icon {
  color: #ff8c42;
  transform: scale(1.15);
}

.modal-content-admin {
  padding: 24px;
  position: relative;
  min-height: 300px;
  transition: min-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-panel {
  animation: fadeIn 0.5s ease;
}

/* Формы */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.label-icon {
  font-size: 14px;
  color: rgba(255, 140, 60, 0.8);
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: rgba(255, 140, 60, 0.5);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(255, 140, 60, 0.1);
}

.radio-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.radio-option {
  display: block;
  cursor: pointer;
  position: relative;
}

.radio-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.radio-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.radio-option:hover .radio-content {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 140, 60, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.radio-option.active .radio-content {
  background: linear-gradient(135deg, rgba(255, 140, 60, 0.15), rgba(255, 140, 60, 0.08));
  border-color: rgba(255, 140, 60, 0.5);
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 2px rgba(255, 140, 60, 0.2), 0 4px 16px rgba(255, 140, 60, 0.2);
  transform: translateY(-2px);
}

.radio-icon {
  font-size: 16px;
  color: rgba(255, 140, 60, 0.7);
  transition: all 0.3s ease;
}

.radio-option.active .radio-icon {
  color: #ff8c42;
  transform: scale(1.1);
}

.radio-content span {
  flex: 1;
}

.duration-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.checkbox-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.checkbox-inline:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 140, 60, 0.3);
}

.checkbox-inline input[type="checkbox"] {
  appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  margin: 0;
}

.checkbox-inline input[type="checkbox"]:hover {
  border-color: rgba(255, 140, 60, 0.5);
  background: rgba(255, 140, 60, 0.1);
}

.checkbox-inline input[type="checkbox"]:checked {
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  border-color: #ff8c42;
  box-shadow: 0 0 0 2px rgba(255, 140, 60, 0.2), 0 2px 8px rgba(255, 140, 60, 0.3);
}

.checkbox-inline input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 4px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  animation: checkmark 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.checkbox-icon {
  font-size: 14px;
  color: rgba(255, 140, 60, 0.8);
  transition: all 0.3s ease;
}

.checkbox-inline input[type="checkbox"]:checked ~ .checkbox-icon {
  color: #ff8c42;
}

.checkbox-inline span {
  font-size: 13px;
  font-weight: 500;
  transition: color 0.3s ease;
}

.checkbox-inline input[type="checkbox"]:checked ~ span {
  color: rgba(255, 255, 255, 0.95);
}

.inline-input {
  flex: 1;
  margin: 0;
}

.inline-input.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.02);
}

/* Скрытие стрелок у number input */
.inline-input::-webkit-outer-spin-button,
.inline-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
  display: none;
}

.inline-input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}

.inline-input[type=number]::-webkit-inner-spin-button,
.inline-input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.subscription-status-card {
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 24px;
  animation: fadeIn 0.4s ease;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.subscription-status-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 60, 0.3), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.subscription-status-card:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  border-color: rgba(255, 140, 60, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.subscription-status-card:hover::before {
  opacity: 1;
}

.status-card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.status-card-icon {
  font-size: 32px;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  margin-top: 4px;
}

.status-card-body {
  flex: 1;
}

.status-card-icon.active {
  color: #10b981;
  animation: pulse 2s infinite;
}

.status-card-icon.inactive {
  color: rgba(255, 255, 255, 0.3);
}


.status-card-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: left;
}

.status-card-value {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.2;
  text-align: left;
}

.status-card-value.active {
  color: #10b981;
  text-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.status-card-value.inactive {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.status-card-plan {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.plan-icon {
  font-size: 16px;
  color: rgba(255, 140, 60, 0.8);
}

.status-card-plan strong {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
}

.status-card-plan-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  animation: fadeIn 0.4s ease 0.2s both;
}

.grant-subscription {
  animation: fadeIn 0.4s ease 0.1s both;
}

.revoke-subscription {
  animation: fadeIn 0.4s ease 0.1s both;
}

.status-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.status-value {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.status-value.active {
  color: #10b981;
}

.status-value.inactive {
  color: rgba(255, 255, 255, 0.4);
}

.status-plan {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.btn-primary {
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(255, 140, 60, 0.3), 0 0 0 1px rgba(255, 140, 60, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(255, 140, 60, 0.4), 0 0 0 1px rgba(255, 140, 60, 0.3);
  background: linear-gradient(135deg, #ff953d, #ff743a);
}

.btn-primary:active {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(255, 140, 60, 0.3);
}

.btn-primary svg {
  font-size: 18px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.btn-danger {
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.15));
  border: 2px solid rgba(239, 68, 68, 0.4);
  border-radius: 12px;
  color: #ef4444;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.btn-danger::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1), transparent);
  transition: left 0.5s ease;
}

.btn-danger:hover::before {
  left: 100%;
}

.btn-danger:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.25));
  border-color: rgba(239, 68, 68, 0.6);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
}

.btn-danger:active {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
}

.btn-danger svg {
  font-size: 18px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

/* Уведомления */
.toast-container-admin {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.toast-admin {
  padding: 16px 20px;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-admin.success {
  border-left: 4px solid #10b981;
}

.toast-admin.error {
  border-left: 4px solid #ef4444;
}

.toast-admin.info {
  border-left: 4px solid #3b82f6;
}

.toast-content-admin {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toast-message-admin {
  flex: 1;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.toast-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

/* Анимации */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes checkmark {
  0% {
    transform: rotate(45deg) scale(0);
    opacity: 0;
  }
  50% {
    transform: rotate(45deg) scale(1.2);
  }
  100% {
    transform: rotate(45deg) scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Transition анимации */
.user-list-enter-active,
.user-list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-list-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.user-list-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container-admin,
.modal-leave-to .modal-container-admin {
  transform: scale(0.95) translateY(-10px);
}

.tab-content-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.tab-content-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.tab-content-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
  filter: blur(4px);
}

.tab-content-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.96);
  filter: blur(4px);
}

.tab-panel {
  animation: tabSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

@keyframes tabSlideIn {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.98);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Мобильная версия */
@media (max-width: 768px) {
  .navbar {
    margin: 10px;
    border-radius: 12px;
    height: auto;
    min-height: 72px;
  }

  .navbar-container {
    padding: 12px 16px;
    gap: 16px;
  }

  .admin-panel {
    margin: 24px auto;
    padding: 0 16px;
  }

  .admin-title {
    font-size: 24px;
  }

  .user-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
  }

  .user-card-subscriptions {
    width: 100%;
    max-width: none;
  }

  .modal-container-admin {
    max-width: 100%;
    margin: 10px;
    max-height: calc(100vh - 20px);
  }

  .modal-tabs {
    padding: 0 16px;
    overflow-x: auto;
  }

  .modal-tab {
    padding: 12px 16px;
    font-size: 14px;
    white-space: nowrap;
  }

  .toast-container-admin {
    left: 16px;
    right: 16px;
    max-width: none;
  }

  /* Оптимизация админ панели для мобильных */
  .admin-panel {
    margin: 20px auto;
    padding: 0 12px;
  }

  .admin-search {
    margin-bottom: 16px;
  }

  .search-input {
    padding: 12px 14px 12px 44px;
    font-size: 14px;
  }

  .users-list {
    gap: 12px;
  }

  .user-card {
    padding: 16px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .user-card-avatar {
    width: 48px;
    height: 48px;
  }

  .user-avatar-placeholder {
    font-size: 20px;
  }

  .user-card-info {
    min-width: 0;
    flex: 1 1 auto;
  }

  .user-card-name {
    font-size: 16px;
  }

  .user-card-email {
    font-size: 13px;
  }

  .user-card-username {
    font-size: 12px;
  }

  .user-card-id {
    font-size: 11px;
  }

  .user-card-subscriptions {
    width: 100%;
    max-width: none;
    order: 3;
    margin-top: 8px;
  }

  .subscription-badge {
    padding: 5px 9px;
    font-size: 10px;
    gap: 5px;
  }

  .badge-icon {
    font-size: 11px;
  }

  .user-card-arrow {
    display: none;
  }

  .pagination {
    margin-top: 24px;
  }

  /* Модальное окно на мобильных */
  .modal-container-admin {
    max-width: calc(100vw - 20px);
    margin: 10px;
    max-height: calc(100vh - 20px);
    border-radius: 16px;
  }

  .modal-header-admin {
    padding: 20px;
  }

  .modal-title-admin {
    font-size: 20px;
  }

  .modal-user-info {
    padding: 20px;
    flex-direction: column;
    text-align: center;
  }

  .modal-user-avatar {
    width: 56px;
    height: 56px;
  }

  .modal-avatar-placeholder {
    font-size: 24px;
  }

  .modal-user-name {
    font-size: 18px;
  }

  .modal-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .modal-tabs::-webkit-scrollbar {
    display: none;
  }

  .modal-tab {
    padding: 14px 16px;
    font-size: 13px;
    gap: 6px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .tab-icon {
    font-size: 14px;
  }

  .modal-content-admin {
    padding: 20px;
    min-height: auto;
  }

  /* Формы на мобильных */
  .form-group {
    margin-bottom: 16px;
  }

  .form-label {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .label-icon {
    font-size: 13px;
  }

  .form-input,
  .form-select {
    padding: 10px 14px;
    font-size: 14px;
  }

  .form-select {
    padding-right: 36px;
  }

  .radio-group {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .radio-content {
    padding: 12px 16px;
    font-size: 13px;
    gap: 10px;
  }

  .radio-icon {
    font-size: 14px;
  }

  .duration-row {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .checkbox-inline {
    width: 100%;
    justify-content: center;
  }

  .inline-input {
    width: 100%;
  }

  .subscription-status-card {
    padding: 16px;
    margin-bottom: 20px;
  }

  .status-card-header {
    gap: 12px;
  }

  .status-card-icon {
    font-size: 28px;
  }

  .status-card-label {
    font-size: 11px;
  }

  .status-card-value {
    font-size: 20px;
  }

  .status-card-plan-wrapper {
    margin-top: 10px;
    padding-top: 10px;
    gap: 6px;
  }

  .status-card-plan {
    font-size: 13px;
  }

  .plan-icon {
    font-size: 14px;
  }

  .btn-primary,
  .btn-danger {
    padding: 14px 20px;
    font-size: 14px;
    gap: 8px;
  }

  .btn-primary svg,
  .btn-danger svg {
    font-size: 16px;
  }

  /* Баннер на мобильных */
  .docs-header {
    padding: 24px 16px;
  }

  .docs-title {
    font-size: 24px;
  }

  .docs-subtitle {
    font-size: 14px;
  }

  .docs-badge {
    padding: 8px 16px;
    font-size: 12px;
  }

  /* Показать мобильные элементы */
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
    z-index: 1100 !important;
    pointer-events: auto !important;
    position: relative;
    visibility: visible !important;
    opacity: 1 !important;
  }

  .mobile-menu {
    display: block !important;
  }

  .mobile-menu-content {
    width: calc(100% - 20px);
    max-width: calc(100% - 20px);
    right: 10px;
    height: calc(100% - 20px);
  }

  /* Скрыть десктопные элементы */
  .desktop-only {
    display: none !important;
  }

  .navbar-links,
  .social-icons {
    display: none !important;
  }

  .profile-section {
    display: none !important;
  }

  /* Футер на мобильных */
  .main-footer {
    margin: 20px 10px 8px !important;
    border-radius: 12px !important;
    padding: 16px 20px !important;
    max-width: none !important;
    width: auto !important;
  }

  .footer-bottom {
    padding: 0;
  }

  .footer-copyright {
    font-size: 12px;
    line-height: 1.5;
  }

  /* Пагинация - скрыть текст на мобильных */
  .pagination-btn-text {
    display: none !important;
  }

  .pagination {
    padding: 12px 16px !important;
  }

  .pagination-wrapper {
    gap: 8px !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
  }

  .pagination-btn {
    padding: 6px !important;
    min-width: 28px !important;
    width: 28px !important;
    height: 28px !important;
    justify-content: center !important;
  }

  .pagination-btn svg {
    width: 10px !important;
    height: 10px !important;
  }

  .pagination-info {
    order: 0 !important;
    flex-shrink: 0 !important;
    white-space: nowrap !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    gap: 6px !important;
    width: auto !important;
    margin-top: 0 !important;
  }

  .pagination-text {
    font-size: 12px !important;
    white-space: nowrap !important;
  }

  .pagination-count {
    display: none !important;
  }

  .pagination-count-mobile {
    display: inline !important;
    font-size: 10px !important;
    color: rgba(255, 255, 255, 0.5) !important;
  }

  .pagination-btn:first-child {
    order: 1 !important;
  }

  .pagination-btn:last-child {
    order: 2 !important;
  }

  /* Вкладки - скрыть текст на мобильных */
  .tab-text {
    display: none;
  }

  .modal-tab {
    padding: 12px;
    min-width: 60px;
    justify-content: center;
  }

  .tab-icon {
    margin: 0;
    font-size: 18px;
  }
}

/* Футер */
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
  width: calc(100% - 40px);
}

.footer-bottom {
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer-copyright {
  font-size: 14px;
  color: var(--text-60);
  line-height: 1.6;
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

/* Пагинация */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
  padding: 20px;
  animation: fadeIn 0.4s ease;
}

.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(255, 140, 60, 0.15);
  border-color: rgba(255, 140, 60, 0.4);
  color: #ff8c42;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 140, 60, 0.2);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.pagination-btn svg {
  width: 12px;
  height: 12px;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.pagination-btn:hover:not(:disabled) svg {
  transform: scale(1.1);
}

.pagination-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

@media (min-width: 769px) {
  .pagination-count-mobile {
    display: none !important;
  }
}

.pagination-text {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.pagination-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.pagination-count-mobile {
  display: none;
}

/* Мобильные элементы */
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
  animation: dropdownSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  flex-shrink: 0;
}

.dropdown-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.dropdown-info {
  flex: 1;
  min-width: 0;
}

.dropdown-name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
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
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.dropdown-action:hover {
  background: rgba(255, 140, 60, 0.1);
  border-color: rgba(255, 140, 60, 0.3);
  color: #ff8c42;
  transform: translateX(2px);
}

.dropdown-action svg {
  font-size: 16px;
  width: 16px;
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
  z-index: 1100;
}

.hamburger:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ff9f43;
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
  color: #ff8c43;
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

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>


