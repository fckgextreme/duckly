import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from './services/auth'
import axios from 'axios'

const Login = () => import('./views/Login.vue')
const Register = () => import('./views/Register.vue')
const Forgot = () => import('./views/Forgot.vue')
const Reset = () => import('./views/Reset.vue')
const Main = () => import('./views/Main.vue')
const Profile = () => import('./views/Profile.vue')
const Subs = () => import('./views/Subs.vue')
const HistoryKZ = () => import('./views/subjects/HistoryKZ.vue')
const WorldHistory = () => import('./views/subjects/WorldHistory.vue')
const LawBasics = () => import('./views/subjects/LawBasics.vue')
const Chinese = () => import('./views/subjects/Chinese.vue')
const SubscriptionRequired = () => import('./views/SubscriptionRequired.vue')
const Docs = () => import('./views/Docs.vue')
const AdminPanel = () => import('./views/AdminPanel.vue')
const NotFound = () => import('./views/NotFound.vue')
const Test = () => import('./views/Test.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login, meta: { guestOnly: true } },
    { path: '/register', component: Register, meta: { guestOnly: true } },
    { path: '/forgot', component: Forgot, meta: { guestOnly: true } },
    { path: '/reset-password', component: Reset, meta: { guestOnly: true } },
    { path: '/main', component: Main, meta: { requiresAuth: true } },
    { path: '/profile', component: Profile, meta: { requiresAuth: true } },
    { path: '/subs', component: Subs, meta: { requiresAuth: true } },
    { path: '/main/history-kz', component: HistoryKZ, meta: { requiresAuth: true } },
    { path: '/main/world-history', component: WorldHistory, meta: { requiresAuth: true } },
    { path: '/main/law-basics', component: LawBasics, meta: { requiresAuth: true } },
    { path: '/main/chinese', component: Chinese, meta: { requiresAuth: true } },
    { path: '/test', component: Test, meta: { requiresAuth: true } },
    { path: '/subscription-required', component: SubscriptionRequired },
    { path: '/docs', component: Docs },
    { path: '/admin', component: AdminPanel, meta: { requiresAuth: true, requiredPlan: 'admin' } },
    { path: '/404', component: NotFound },
    { path: '/:pathMatch(.*)*', component: NotFound },
  ],
})

function planLevel(p?: string | null) {
  const map: Record<string, number> = { free: 0, pro: 1, enterprise: 2, admin: 3 }
  return map[(p || 'free')] ?? 0
}

router.beforeEach(async (to) => {
  const token = getToken()
  if (to.meta.requiresAuth && !token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && token) {
    return { path: '/main' }
  }

  const requiredPlan = to.meta.requiredPlan as string | undefined
  if (requiredPlan) {
    if (!token) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    try {
      const { data } = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      const userPlan = data?.user?.plan || 'free'
      if (planLevel(userPlan) < planLevel(requiredPlan)) {
        return { path: '/subscription-required', query: { required: requiredPlan } }
      }
    } catch (err) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }
})

export default router


