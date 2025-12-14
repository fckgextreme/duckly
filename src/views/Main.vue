<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { getToken, clearToken } from '../services/auth'
import { useRouter } from 'vue-router'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGlobe, faBars, faTimes, faUser, faSignOutAlt, faCog } from '@fortawesome/free-solid-svg-icons'

library.add(faGlobe, faTelegramPlane, faBars, faTimes, faUser, faSignOutAlt, faCog)

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

function isSubscriptionActive(expiry: any) {
  if (!expiry || expiry === 'infinity') return true
  const now = new Date()
  const expiryDate = new Date(expiry)
  return expiryDate > now
}

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
              <i class="fas fa-graduation-cap"></i>
              <span>Образовательная платформа</span>
            </div>
            <h1 class="docs-title">Duck & Law</h1>
            <p class="docs-subtitle">Изучайте историю, право и китайский язык с лучшими преподавателями</p>
          </div>
          <div class="docs-decoration">
            <div class="decoration-circle circle-1"></div>
            <div class="decoration-circle circle-2"></div>
            <div class="decoration-circle circle-3"></div>
            <div class="decoration-line line-1"></div>
            <div class="decoration-line line-2"></div>
          </div>
        </div>

      <div class="subjects-row">
        <RouterLink
          v-if="hasHistoryKZ"
          to="/main/history-kz"
          class="subject-card history-kz available with-img"
        >
          <img class="bg-img" src="/public/histkzduck.png" alt="History"/>
          <div class="subject-icon">🏜️</div>
          <div class="subject-header">История Казахстана</div>
          <div class="subject-desc">
            Путь Казахстана: ханские династии, становление независимого государства.
          </div>
        </RouterLink>
        <div
          v-else
          class="subject-card history-kz locked with"
          @click="() => showAlert('Доступ к этому предмету доступен по подписке Pro или Root')"
          role="button"
          tabindex="0"
        >
          <div class="subject-icon">🏜️</div>
          <div class="subject-header">История Казахстана</div>
          <div class="subject-desc">
            Казахское ханство, советский период, независимость. Иллюстративный материал и хронология.
          </div>
          <div class="lock-overlay"><span class="lock-icon">🔒</span></div>
        </div>

        <RouterLink
          v-if="hasWorldHistory"
          to="/main/world-history"
          class="subject-card world-history available with-img"
        >
        <img class="bg-img" src="/public/histwrldduck.png" alt="History"/>
          <div class="subject-icon">🌍</div>
          <div class="subject-header">Всемирная История</div>
          <div class="subject-desc">
            Глобальные события, цивилизации и ключевые даты мирового развития.
          </div>
        </RouterLink>
        <div
          v-else
          class="subject-card world-history locked with"
          @click="() => showAlert('Доступ к этому предмету доступен по подписке Pro или Root')"
          role="button"
          tabindex="0"
        >
          <div class="subject-icon">🌍</div>
          <div class="subject-header">Всемирная История</div>
          <div class="subject-desc">
            Глобальные события, цивилизации и ключевые даты мирового развития.
          </div>
          <div class="lock-overlay"><span class="lock-icon">🔒</span></div>
        </div>

        <RouterLink
          v-if="hasLawBasics"
          to="/main/law-basics"
          class="subject-card law-basics available with-img"
        >
          <img class="bg-img" src="/public/lawduck.png" alt="History"/>
          <div class="subject-icon">⚖️</div>
          <div class="subject-header">Основы права</div>
          <div class="subject-desc">
            Базовые понятия права, структуры, права и обязанности граждан.
          </div>
        </RouterLink>
        <div
          v-else
          class="subject-card law-basics locked"
          @click="() => showAlert('Доступ к этому предмету доступен по подписке Pro или Root')"
          role="button"
          tabindex="0"
        >
          <div class="subject-icon">⚖️</div>
          <div class="subject-header">Основы права</div>
          <div class="subject-desc">
            Базовые понятия права, структуры, права и обязанности граждан.
          </div>
          <div class="lock-overlay"><span class="lock-icon">🔒</span></div>
        </div>
<RouterLink
  v-if="hasChinese"
  to="/main/chinese"
  class="subject-card chinese available with-img"
>
  <img class="bg-img" src="/public/chineseduck.png" alt="History"/>
  <div class="subject-icon">🀄</div>
  <div class="subject-header">Китайский язык</div>
  <div class="subject-desc">
    Основы китайского языка: иероглифика, фонетика, базовые выражения.
  </div>
</RouterLink>
<div
  v-else
  class="subject-card chinese locked"
  @click="() => showAlert('Доступ к этому предмету доступен по подписке Enterprise или Root')"
  role="button"
  tabindex="0"
>
  <div class="subject-icon">🀄</div>
  <div class="subject-header">Китайский язык</div>
  <div class="subject-desc">
    Основы китайского языка: иероглифика, фонетика, базовые выражения.
  </div>
  <div class="lock-overlay"><span class="lock-icon">🔒</span></div>
        </div>
</div>
      </div>
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
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  color: var(--text-100);
  background-color: var(--bg-900);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: radial-gradient(1200px 800px at 90% -10%, rgba(255,159,26,0.12), transparent 60%),
              radial-gradient(900px 700px at -10% 110%, rgba(255,180,77,0.12), transparent 60%),
              var(--bg-900);
}

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

.subject-card.with-img {
  position: relative;
  background: linear-gradient(135deg, #3a6186, #89253e);
  overflow: hidden;
  border-radius: 20px;
}

.subject-card.with-img img.bg-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin-top: 15px;
  margin-left: 140px;
  object-fit: contain;
  z-index: 5;
  pointer-events: none;
}

.subject-card.with-img > *:not(.bg-img) {
  position: relative;
  z-index: 10;
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

.dropdown-info {
  display: flex;
  flex-direction: column;
}

.dropdown-email {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}

.dropdown-menu {
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 13px;
  color: #fff;
  background: transparent;
  border: none;
  cursor: pointer;
  text-decoration: none;
  border-radius: 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  box-sizing: border-box;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ff9f43;
  transform: translateX(0);
  border-radius: 0;
}

.dropdown-item.logout {
  color: #ff6b6b;
}

.dropdown-item.logout:hover {
  background: rgba(255, 107, 107, 0.25);
  color: #ff4c4c;
  transform: translateX(0);
  border-radius: 0;
}

.dropdown-icon {
  width: 18px;
  font-size: 14px;
  text-align: center;
}

.subjects-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
  max-width: 1200px;
  margin: 24px auto;
  padding: 0 16px;
}

.subject-card {
  flex: 0 0 calc(33.333% - 24px);
  max-width: calc(33.333% - 24px);
  min-height: 200px;
  border-radius: 20px;
  padding: 28px;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(14px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-100);
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  position: relative;
}

.subject-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow:
    0 12px 36px rgba(0, 0, 0, 0.25),
    0 6px 18px rgba(0, 0, 0, 0.12);
  border-color: rgba(255, 159, 67, 0.4);
}

.subject-card:active {
  transform: translateY(-2px) scale(0.98);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.subject-card.available:active {
  transform: translateY(-1px) scale(0.97);
  background: rgba(255, 255, 255, 0.08);
}

.subject-icon {
  font-size: 28px;
  line-height: 1;
  margin-bottom: 4px;
}

.subject-header {
  font-size: 18px;
  font-weight: 700;
  color: var(--violet-300);
}

.subject-card.available {
  cursor: pointer;
  filter: none;
}

.subject-desc {
  font-size: 14px;               
  line-height: 1.5;
  color: var(--text-60);         
  padding: 6px 10px;             
  border-radius: 8px;            
  text-align: left;              
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  max-width: 60%;
  margin-right: 80px;
  margin-left: -15px;
}

.subject-card.history-kz {
  background: linear-gradient(135deg, rgba(255, 180, 120, 0.12), rgba(180, 90, 40, 0.08));
  border: 1px solid rgba(200, 120, 60, 0.15);
}

.subject-card.world-history {
  background: linear-gradient(135deg, rgba(90, 150, 240, 0.12), rgba(30, 60, 120, 0.08));
  border: 1px solid rgba(80, 120, 200, 0.15);
}

.subject-card.law-basics {
  background: linear-gradient(135deg, rgba(178, 140, 255, 0.15), rgba(120, 80, 200, 0.1));
  border: 1px solid rgba(178, 140, 255, 0.25);
}

.subject-card.chinese {
  background: linear-gradient(135deg, rgba(220, 70, 70, 0.12), rgba(120, 30, 30, 0.08));
  border: 1px solid rgba(180, 60, 60, 0.15);
}
.subject-card.history-kz .subject-header {
  color: #e6a35c;
}

.subject-card.world-history .subject-header {
  color: #6fb6ff;
}

.subject-card.law-basics .subject-header {
  color: #b28cff;
}

.subject-card.chinese .subject-header {
  color: #ff6b6b;
}

.subject-card.locked .subject-header,
.subject-card.locked .subject-desc {
  filter: brightness(0.65);
}

.subject-card.locked {
  pointer-events: none;
  position: relative;
}

.subject-card.locked::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(1px);
  border-radius: 20px;
  z-index: 6;
}

.lock-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0,0,0,0.7);
  border-radius: 8px;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.lock-icon {
  font-size: 16px;
  color: #fff;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
}

.docs-header {
  text-align: center;
  margin-bottom: 50px;
  padding: 25px 20px;
  background: linear-gradient(135deg, 
    rgba(255, 140, 60, 0.12) 0%, 
    rgba(255, 107, 53, 0.08) 30%, 
    rgba(255, 140, 60, 0.12) 60%, 
    rgba(255, 107, 53, 0.08) 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 140, 60, 0.2);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-width: 1200px;
  margin: 0 auto 50px auto;
}

.docs-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 140, 60, 0.08), 
    rgba(255, 107, 53, 0.08), 
    transparent);
  animation: shimmer 4s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  50% { left: 100%; }
  100% { left: 100%; }
}

.docs-header-content {
  position: relative;
  z-index: 2;
}

.docs-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(255, 140, 60, 0.2);
  border: 1px solid rgba(255, 140, 60, 0.3);
  border-radius: 50px;
  color: #ff8c3c;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 24px;
  animation: fadeInUp 0.6s ease-out;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(255, 140, 60, 0.2);
}

.docs-badge i {
  font-size: 1rem;
}

.docs-title {
  font-size: 3.5rem;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 20px 0;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  animation: fadeInUp 0.8s ease-out 0.1s both;
  letter-spacing: -0.02em;
}

.docs-subtitle {
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 40px 0;
  line-height: 1.6;
  animation: fadeInUp 0.8s ease-out 0.2s both;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.docs-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  animation: fadeInUp 0.8s ease-out 0.3s both;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 4px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.docs-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, 
    rgba(255, 140, 60, 0.1), 
    rgba(139, 92, 246, 0.1));
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 120px;
  height: 120px;
  top: 20px;
  right: 20px;
  animation-delay: 0s;
}

.circle-2 {
  width: 80px;
  height: 80px;
  bottom: 30px;
  left: 30px;
  animation-delay: 2s;
}

.circle-3 {
  width: 60px;
  height: 60px;
  top: 50%;
  left: 10px;
  animation-delay: 4s;
}

.decoration-line {
  position: absolute;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 140, 60, 0.2), 
    transparent);
  animation: float 8s ease-in-out infinite;
}

.line-1 {
  width: 200px;
  height: 2px;
  top: 30%;
  right: 10%;
  animation-delay: 1s;
}

.line-2 {
  width: 150px;
  height: 2px;
  bottom: 20%;
  left: 15%;
  animation-delay: 3s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

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

.desktop-only {
  display: flex;
}

.profile-section {
  position: relative;
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

.docs-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
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

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 12px 0;
}

.dropdown-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 2px;
}

.dropdown-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 32px;
  flex: 1;
  justify-content: center;
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

.mobile-logout-section {
  padding: 20px 24px 28px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

.mobile-logout-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 12px;
  color: #dc2626;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  pointer-events: auto;
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
  
  .navbar-links {
    display: none !important;
  }
  
  .social-icons {
    display: none !important;
  }
  
  .hamburger {
    display: block !important;
    z-index: 1100;
    pointer-events: auto;
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
  
  .main-content {
    padding: 30px 16px;
  }

  .docs-header {
    padding: 20px 16px;
    margin-bottom: 40px;
    margin-left: 16px;
    margin-right: 16px;
  }
  
  .docs-title {
    font-size: 2.5rem;
  }
  
  .docs-subtitle {
    font-size: 1.1rem;
    margin-bottom: 30px;
  }
  
  .docs-stats {
    flex-direction: column;
    gap: 20px;
  }
  
  .stat-divider {
    width: 40px;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(255, 140, 60, 0.3), 
      transparent);
  }
  
  .decoration-circle {
    display: none;
  }
  
  .decoration-line {
    display: none;
  }
  
  .subjects-row {
    flex-direction: column;
    align-items: stretch;
    gap: 28px;
    padding: 0 12px;
  }

  .subject-card {
    flex: 1 1 100% !important;
    max-width: 100% !important;
    margin-bottom: 0;
    padding: 20px;
    min-height: auto;
  }

  .subject-desc {
    margin-right: 0;
    margin-left: 0;
  }

  .subject-card.with-img img.bg-img {
    margin-top: 10px;
    margin-left: 100px;
  }
  
  .main-footer {
    margin: 20px 10px 8px;
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

@media (max-width: 480px) {
  .docs-header {
    padding: 30px 16px;
  }
  
  .docs-title {
    font-size: 2rem;
  }
  
  .docs-subtitle {
    font-size: 1rem;
  }
  
  .docs-badge {
    padding: 10px 20px;
    font-size: 0.8rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .stat-label {
    font-size: 0.8rem;
  }

  .mobile-menu-content {
    width: calc(100% - 20px);
    max-width: calc(100% - 20px);
    right: 10px;
    height: calc(100% - 20px);
  }
}
</style>

