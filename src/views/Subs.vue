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

function goToTelegram() {
  window.open('https://t.me/JustKingMe', '_blank')
}

onMounted(loadMe)

const plan = computed(() => me.value?.plan || 'free')

const activeTab = ref('histKZ')

const subscriptionTabs = [
  { id: 'histKZ', title: 'Стартовая', icon: 'fas fa-rocket', color: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)' },
  { id: 'histWRLD', title: 'Историческая', icon: 'fas fa-landmark', color: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' },
  { id: 'law', title: 'Юридическая', icon: 'fas fa-gavel', color: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' },
]

const subscriptions = {
  histKZ: [
    {
      id: 'basic',
      title: 'Egg',
      price: '9,990₸',
      period: '/месяц',
      features: [
        'Видео-лекции',
        'Авторские конспекты на нашем сайте',
        'Круглосуточная техническая поддержка',
        'Карты и материалы, составленные нашим преподавателем',
        'Тесты по каждой теме',
        '1 пробное ЕНТ каждый месяц',
        'Доступ к авторским презентациям'
      ],
      buttonText: '📱 Выбрать план',
      popular: false
    },
    {
      id: 'premium',
      title: 'Golden Egg',
      price: '19,990₸',
      period: '/месяц',
      features: [
        'Видео-лекции',
        'Авторские конспекты на нашем сайте',
        'Круглосуточная техническая поддержка',
        'Полный комплект авторских карт и материалов',
        'Авторские тесты по каждой теме',
        'Практические онлайн-эфиры',
        'Личная консультация с преподавателем',
        '2 пробных ЕНТ каждый месяц',
        'Подготовка к государственному экзамену (по вашим билетам)',
        'Авторские презентации',
        'Еженедельная проверка знаний куратором по пройденным темам'
      ],
      buttonText: '📱 Выбрать план',
      popular: true
    }
  ],
  histWRLD: [
    {
      id: 'basic',
      title: 'Student Duck',
      price: '14,990₸',
      period: '/месяц',
      features: [
        'Видео-лекции',
        'Авторские конспекты на нашем сайте',
        'Круглосуточная техническая поддержка',
        'Карты и материалы, составленные преподавателем',
        'Тесты по каждой теме',
        '1 пробное ЕНТ каждый месяц',
        'Доступ к авторским презентациями'
      ],
      buttonText: '📱 Выбрать план',
      popular: false
    },
    {
      id: 'premium',
      title: 'Professor Duck',
      price: '29,990₸',
      period: '/месяц',
      features: [
        'Видео-лекции',
        'Авторские конспекты на нашем сайте',
        'Круглосуточная техническая поддержка',
        'Полный комплект авторских карт и материалов',
        'Авторские тесты по каждой теме',
        'Практические онлайн-эфиры',
        'Личная консультация с преподавателем',
        '2 пробных ЕНТ каждый месяц',
        'Подготовка к государственному экзамену (по вашим билетам)',
        'Авторские презентации',
        'Еженедельная проверка знаний куратором по пройденным темам'
      ],
      buttonText: '📱 Выбрать план',
      popular: true
    }
  ],
  law: [
    {
      id: 'basic',
      title: 'Lawyer Duck',
      price: '29,990₸',
      period: '/месяц',
      features: [
        'Видео-лекции',
        'Авторские конспекты на нашем сайте',
        'Круглосуточная техническая поддержка',
        'Карты и материалы, составленные преподавателем',
        'Тесты по каждой теме',
        '1 пробное ЕНТ каждый месяц',
        'Доступ к авторским презентациям',
      ],
      buttonText: '📱 Выбрать план',
      popular: false
    },
    {
      id: 'premium',
      title: 'Senior Lawyer Duck',
      price: '59,990₸',
      period: '/месяц',
      features: [
        'Видео-лекции',
        'Авторские конспекты на нашем сайте',
        'Круглосуточная техническая поддержка',
        'Полный комплект авторских карт и материалов',
        'Авторские тесты по каждой теме',
        'Практические онлайн-эфиры',
        'Личная консультация с преподавателем',
        '2 пробных ЕНТ каждый месяц',
        'Подготовка к государственному экзамену (по вашим билетам)',
        'Авторские презентации',
        'Еженедельная проверка знаний куратором по пройденным темам'
      ],
      buttonText: '📱 Выбрать план',
      popular: true
    }
  ]
}

const currentSubscriptions = computed(() => subscriptions[activeTab.value as keyof typeof subscriptions])

const userSubscriptions = computed(() => {
  if (!me.value?.plan) return []
  
  const planString = me.value.plan
  const subscriptions = []
  
  if (planString === 'root') {
    return [
      { category: 'histKZ', plan: 'basic', status: 'active' },
      { category: 'histKZ', plan: 'premium', status: 'active' },
      { category: 'histWRLD', plan: 'basic', status: 'active' },
      { category: 'histWRLD', plan: 'premium', status: 'active' },
      { category: 'law', plan: 'basic', status: 'active' },
      { category: 'law', plan: 'premium', status: 'active' }
    ]
  }
  
  const planParts = planString.split(',').map((part: string) => part.trim())
  
  for (const part of planParts) {
    const [category, planType] = part.split('_')
    if (category && planType) {
      subscriptions.push({
        category,
        plan: planType,
        status: 'active'
      })
    }
  }
  
  return subscriptions
})

function hasActiveSubscription(category: string, plan: string) {
  if (plan === 'basic') {
    return userSubscriptions.value.some(sub => 
      sub.category === category && 
      (sub.plan === 'basic' || sub.plan === 'premium') && 
      sub.status === 'active'
    )
  }
  
  return userSubscriptions.value.some(sub => 
    sub.category === category && 
    sub.plan === plan && 
    sub.status === 'active'
  )
}

function getSubjectDescription(subjectId: string) {
  const descriptions = {
    histKZ: 'Один предмет по выбору',
    histWRLD: 'Полный курс всей истории',
    law: 'Полный набор для юристов'
  }
  return descriptions[subjectId as keyof typeof descriptions] || ''
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
              <i class="fas fa-crown"></i>
              <span>Премиум подписки</span>
            </div>
            <h1 class="docs-title">Выберите подписку</h1>
            <p class="docs-subtitle">Получите доступ к эксклюзивному контенту и функциям</p>
            <div class="docs-stats">
            </div>
          </div>
          <div class="docs-decoration">
            <div class="decoration-circle circle-1"></div>
            <div class="decoration-circle circle-2"></div>
            <div class="decoration-circle circle-3"></div>
            <div class="decoration-line line-1"></div>
            <div class="decoration-line line-2"></div>
          </div>
        </div>

      <div class="subscriptions-container">

        <div class="subject-navigation">
          <div class="subject-nav-container">
            <button 
              v-for="(tab, index) in subscriptionTabs" 
              :key="tab.id"
              :class="['subject-nav-button', `subject-nav-${tab.id}`, { active: activeTab === tab.id }]"
              @click="activeTab = tab.id"
            >
              <div class="subject-nav-icon" :style="{ background: tab.color }">
                <i :class="tab.icon"></i>
                <div class="subject-glow"></div>
              </div>
              <div class="subject-nav-content">
                <span class="subject-nav-title">{{ tab.title }}</span>
                <span class="subject-nav-desc">{{ getSubjectDescription(tab.id) }}</span>
        </div>
              <div class="subject-nav-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
          </div>
            </button>
          </div>
        </div>

         <Transition name="cards" mode="out-in">
           <div class="subscription-cards" :key="activeTab">
             <div 
               v-for="subscription in currentSubscriptions" 
               :key="subscription.id"
               :class="['subscription-card', { 
                 popular: subscription.popular,
                 active: hasActiveSubscription(activeTab, subscription.id)
               }]"
             >
               <div v-if="hasActiveSubscription(activeTab, subscription.id)" class="active-badge">
                 <span class="badge-text-desktop">Текущий тариф</span>
                 <span class="badge-text-mobile">✓</span>
               </div>
               
               <div class="card-content">
                 <div class="card-header">
                   <h3 class="card-title">{{ subscription.title }}</h3>
                   <div class="card-price">
                     <span class="price-amount">{{ subscription.price }}</span>
                     <span class="price-period">{{ subscription.period }}</span>
                   </div>
                 </div>

                 <div class="card-features">
                   <div 
                     v-for="feature in subscription.features" 
                     :key="feature"
                     class="feature-item"
                   >
                     <span class="feature-icon">
                      <i class="fas fa-check"></i>
                    </span>
                     <span class="feature-text">{{ feature }}</span>
                   </div>
                 </div>
               </div>

               <div class="card-footer">
                 <button 
                   class="card-button" 
                   :class="{ 
                     popular: subscription.popular,
                     active: hasActiveSubscription(activeTab, subscription.id)
                   }"
                   @click="goToTelegram()"
                 >
                   <i v-if="!hasActiveSubscription(activeTab, subscription.id)" class="fas fa-external-link-alt button-icon"></i>
                   <i v-else class="fas fa-check-circle button-icon"></i>
                   {{ hasActiveSubscription(activeTab, subscription.id) ? 'Активно' : subscription.buttonText }}
                 </button>
               </div>
  </div>
  </div>
         </Transition>
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
  z-index: 0;
  pointer-events: none;
}

.subject-card.with-img > *:not(.bg-img) {
  position: relative;
  z-index: 1;
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
  display: flex;
  flex-direction: column;
}

.dropdown-name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
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

.lock-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0,0,0,0.55);
  border-radius: 10px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 8;
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

.docs-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
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

.stat-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(180deg, 
    transparent, 
    rgba(255, 140, 60, 0.3), 
    transparent);
}

.divider-dot {
  color: rgba(255, 255, 255, 0.4);
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

.subscriptions-container {
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  backdrop-filter: blur(40px) saturate(200%) brightness(1.1);
  border: 1px solid rgba(255, 140, 60, 0.15);
  border-radius: 28px;
  padding: 36px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 8px 24px rgba(255, 140, 60, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(255, 140, 60, 0.05);
  position: relative;
  overflow: hidden;
}

.subscriptions-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgba(255, 140, 60, 0.3) 25%,
    rgba(255, 100, 40, 0.6) 50%,
    rgba(255, 140, 60, 0.3) 75%,
    transparent 100%
  );
  border-radius: 32px 32px 0 0;
  box-shadow: 0 0 20px rgba(255, 140, 60, 0.3);
}

.subscriptions-header {
  text-align: center;
  margin-bottom: 32px;
  position: relative;
}

.subscriptions-title {
  font-size: 2.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, 
    #ff8c42 0%,
    #ff6b35 25%,
    #ffa726 50%,
    #ff8c42 75%,
    #ff6b35 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px 0;
  letter-spacing: -0.03em;
  text-shadow: 0 0 30px rgba(120, 120, 120, 0.4);
  animation: titleGlow 3s ease-in-out infinite alternate;
}

.subscriptions-subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-weight: 300;
  opacity: 0.9;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.subject-navigation {
  margin-bottom: 40px;
  position: relative;
}

.subject-nav-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  max-width: 800px;
  margin: 0 auto;
}

.subject-nav-button {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: rgba(30, 30, 35, 0.8);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(50, 50, 50, 0.3);
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(255, 140, 60, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}


.subject-nav-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.subject-nav-icon i {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.subject-emoji {
  font-size: 20px;
  z-index: 2;
  position: relative;
  transition: transform 0.3s ease;
}

.subject-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(255, 140, 60, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.4s ease;
  z-index: 1;
}

.subject-nav-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.subject-nav-title {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  transition: color 0.3s ease;
}

.subject-nav-desc {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
  transition: color 0.3s ease;
}

.subject-nav-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.subject-nav-button:hover {
  transform: translateY(-2px);
  background: rgba(40, 40, 45, 0.9);
  border-color: rgba(70, 70, 70, 0.5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.subject-nav-button:hover .subject-glow {
  transform: translate(-50%, -50%) scale(1);
}

.subject-nav-button:hover .subject-nav-icon i {
  transform: scale(1.1);
}

.subject-nav-button:hover .subject-nav-arrow {
  background: rgba(80, 80, 80, 0.3);
  transform: translateX(4px);
}

.subject-nav-button.active {
  transform: translateY(-1px);
  background: rgba(45, 45, 50, 0.95);
  border-color: rgba(80, 80, 80, 0.6);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
}

.subject-nav-button.active .subject-glow {
  transform: translate(-50%, -50%) scale(1);
  animation: pulseGlow 2s ease-in-out infinite;
}

.subject-nav-button.active .subject-nav-arrow {
  background: rgba(100, 100, 100, 0.3);
  transform: rotate(90deg);
}


.tab-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(255, 140, 60, 0.08) 0%,
    rgba(255, 100, 40, 0.05) 50%,
    rgba(255, 140, 60, 0.08) 100%
  );
  opacity: 0;
  transition: all 0.4s ease;
  border-radius: 16px;
}

.tab-button:hover {
  color: #ffffff;
  background: linear-gradient(135deg, 
    rgba(255, 140, 60, 0.12) 0%,
    rgba(255, 100, 40, 0.08) 100%
  );
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 140, 60, 0.15);
}

.tab-button:hover::before {
  opacity: 1;
}

.tab-button.active {
  color: #ffffff;
  background: linear-gradient(135deg, 
    rgba(255, 140, 60, 0.2) 0%,
    rgba(255, 100, 40, 0.15) 100%
  );
  box-shadow: 
    0 8px 24px rgba(255, 140, 60, 0.25),
    0 0 20px rgba(255, 140, 60, 0.1);
  transform: translateY(-1px);
}

.tab-icon {
  font-size: 1.1rem;
  transition: transform 0.3s ease;
}

.tab-button:hover .tab-icon {
  transform: scale(1.1);
}

.tab-title {
  font-weight: 700;
  letter-spacing: 0.3px;
}

.subscription-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.subscription-card {
  position: relative;
  background: linear-gradient(135deg, 
    rgba(30, 30, 35, 0.9) 0%,
    rgba(40, 40, 45, 0.95) 50%,
    rgba(25, 25, 30, 0.9) 100%
  );
  backdrop-filter: blur(30px) saturate(200%) brightness(1.05);
  border: 1px solid rgba(255, 140, 60, 0.2);
  border-radius: 24px;
  padding: 32px;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.4),
    0 4px 16px rgba(255, 140, 60, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.subscription-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgba(255, 140, 60, 0.3) 25%,
    rgba(255, 100, 40, 0.6) 50%,
    rgba(255, 140, 60, 0.3) 75%,
    transparent 100%
  );
  opacity: 0;
  transition: all 0.4s ease;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 0 15px rgba(255, 140, 60, 0.2);
}

.subscription-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(120, 120, 120, 0.5);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 8px 24px rgba(120, 120, 120, 0.3),
    0 0 30px rgba(120, 120, 120, 0.2);
}

.subscription-card:hover::before {
  opacity: 1;
}

.subscription-card:hover::after {
  left: 100%;
}

.subscription-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(120, 120, 120, 0.15) 50%,
    rgba(255, 255, 255, 0.05) 75%,
    transparent 100%
  );
  transition: left 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  animation: liquidFlow 4s ease-in-out infinite;
  z-index: 1;
}

.subscription-card.popular {
  border-color: rgba(120, 120, 120, 0.4);
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.25),
    0 2px 8px rgba(120, 120, 120, 0.2);
  background: rgba(120, 120, 120, 0.05);
}

.subscription-card.popular:hover {
  box-shadow: 
    0 12px 32px rgba(0, 0, 0, 0.35),
    0 4px 16px rgba(120, 120, 120, 0.25);
}

.subscription-card.active {
  border-color: rgba(40, 167, 69, 0.6);
  background: rgba(255, 255, 255, 0.05);
}

.subscription-card.active:hover {
  box-shadow: 
    0 20px 50px rgba(40, 167, 69, 0.4),
    0 8px 24px rgba(32, 201, 151, 0.3),
    0 0 40px rgba(40, 167, 69, 0.2),
    inset 0 1px 0 rgba(40, 167, 69, 0.3);
}


.active-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.4);
  letter-spacing: 0.3px;
  animation: glow 2s infinite;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  min-height: 20px;
}

.badge-text-desktop {
  display: block;
}

.badge-text-mobile {
  display: none;
  font-size: 1rem;
  font-weight: 900;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-header {
  margin-bottom: 20px;
  text-align: center;
}

.card-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 8px 0;
  letter-spacing: -0.3px;
}

.card-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.price-amount {
  font-size: 2rem;
  font-weight: 900;
  color: #ffffff;
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(120, 120, 120, 0.4);
  letter-spacing: -0.5px;
}

.price-period {
  font-size: 0.9rem;
  color: #c0c0c0;
  font-weight: 600;
  opacity: 0.8;
}

.card-features {
  flex: 1;
  margin-bottom: 24px;
}

.card-footer {
  margin-top: auto;
  padding-top: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  padding: 6px 0;
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateX(2px);
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 800;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(34, 197, 94, 0.4);
  transition: all 0.3s ease;
}

.feature-icon i {
  font-size: 0.7rem;
  color: white;
}

.feature-item:hover .feature-icon {
  transform: scale(1.1);
  box-shadow: 0 3px 8px rgba(34, 197, 94, 0.5);
}

.feature-text {
  color: #e0e0e0;
  font-size: 0.85rem;
  line-height: 1.4;
  font-weight: 500;
}

.card-button {
  width: 100%;
  padding: 14px 24px;
  background: rgba(30, 30, 30, 0.9);
  border: 1px solid rgba(80, 80, 80, 0.5);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.card-button:not(.active):not(:disabled):hover {
  background: rgba(50, 50, 50, 0.95);
  border-color: rgba(120, 120, 120, 0.7);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  transform: translateY(-1px);
}

.card-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  transition: left 0.4s ease;
}

.card-button:hover::before {
  left: 100%;
}

.card-button:hover {
  background: linear-gradient(135deg, 
    rgba(80, 80, 80, 0.4) 0%,
    rgba(100, 100, 100, 0.3) 100%
  );
  border-color: rgba(120, 120, 120, 0.6);
  transform: translateY(-3px);
  box-shadow: 
    0 12px 32px rgba(120, 120, 120, 0.4),
    0 0 25px rgba(120, 120, 120, 0.3);
}

.card-button.popular {
  background: rgba(40, 40, 40, 0.95);
  border-color: rgba(100, 100, 100, 0.6);
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.5);
}

.card-button.popular:hover {
  background: rgba(60, 60, 60, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.7);
}

.card-button.active {
  background: rgba(30, 50, 30, 0.9);
  border-color: rgba(80, 120, 80, 0.6);
  color: rgba(120, 200, 120, 0.9);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
  cursor: not-allowed;
}

.card-button.active:hover {
  transform: none;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
}

.card-button:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.button-icon {
  font-size: 14px;
  transition: all 0.3s ease;
}

.card-button:hover .button-icon {
  transform: scale(1.1);
}

.card-button.active .button-icon {
  color: rgba(120, 200, 120, 1);
}

.button-icon {
  margin-right: 8px;
  font-size: 0.9rem;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .subscriptions-container {
    padding: 24px;
    margin: 0 auto;
    border-radius: 20px;
    width: calc(100% - 5px);
    max-width: calc(100% - 5px);
  }
  
  .subscriptions-title {
    font-size: 1.8rem;
  }
  
  .subscriptions-subtitle {
    font-size: 0.95rem;
  }
  
  .subscription-tabs {
    flex-direction: column;
    gap: 4px;
    padding: 4px;
  }
  
  .tab-button {
    justify-content: center;
    padding: 12px 16px;
  }
  
  .subscription-cards {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .subscription-card {
    padding: 20px;
  }
  
  .price-amount {
    font-size: 1.6rem;
  }
  
  .card-title {
    font-size: 1.2rem;
  }
  
  .feature-text {
    font-size: 0.8rem;
  }
  
  .badge-text-desktop {
    display: none;
  }
  
  .badge-text-mobile {
    display: block;
  }
  
  .active-badge {
    padding: 8px;
    border-radius: 50%;
    min-width: 32px;
    min-height: 32px;
  }
  
  .card-button:active {
    transform: translateY(1px) scale(0.98);
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.3),
      inset 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card-button:not(.active):not(:disabled):active {
    background: rgba(40, 40, 40, 0.95);
    border-color: rgba(100, 100, 100, 0.6);
  }
  
  .card-button.popular:active {
    background: rgba(50, 50, 50, 0.95);
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.4),
      inset 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(120, 120, 120, 0.5);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(120, 120, 120, 0.7);
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

@keyframes titleGlow {
  0% {
    text-shadow: 0 0 30px rgba(120, 120, 120, 0.4);
  }
  100% {
    text-shadow: 0 0 40px rgba(120, 120, 120, 0.6), 0 0 60px rgba(100, 100, 100, 0.3);
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

@media (max-width: 768px) {
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
  
  .mobile-menu-content {
    width: calc(100% - 20px);
    max-width: calc(100% - 20px);
    right: 10px;
    height: calc(100% - 20px);
  }
}

.mobile-profile-section {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-profile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.mobile-profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.mobile-profile-avatar img {
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
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.mobile-profile-info {
  flex: 1;
}

.mobile-profile-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
}

.mobile-profile-email {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.mobile-profile-actions {
  display: flex;
  gap: 8px;
}

.mobile-profile-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 140, 60, 0.1);
  border: 1px solid rgba(255, 140, 60, 0.3);
  border-radius: 8px;
  color: #ff8c42;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mobile-profile-action:hover {
  background: rgba(255, 140, 60, 0.2);
  border-color: rgba(255, 140, 60, 0.5);
  color: #ffffff;
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
  .hamburger { display: block; }

  .navbar-links, .social-icons { display: none; }

  .mobile-menu { display: block; }
}

@media (max-width: 768px) {
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
  }

  .subject-card {
    flex: 1 1 100%;
    max-width: 100%;
    margin-bottom: 16px;
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
}
</style>


