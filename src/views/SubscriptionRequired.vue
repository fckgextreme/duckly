<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, ref } from 'vue'

const route = useRoute()
const router = useRouter()
const required = (route.query.required as string) || 'pro'

// Определяем, это админ-панель или нет
const isAdmin = computed(() => required === 'admin')

// Текст описания в зависимости от типа доступа
const descriptionText = computed(() => {
  if (isAdmin.value) {
    return 'Доступно только для администрации сайта'
  }
  return 'У вас нет нужной подписки. Если что-то не так, свяжитесь с администрацией сайта'
})

function goHome() {
  router.push('/main')
}

// Генерируем стили для частиц один раз
const particles = ref(
  Array.from({ length: 20 }, () => {
    const size = Math.random() * 3 + 1.5
    const left = Math.random() * 100
    const top = Math.random() * 100
    const animationDelay = Math.random() * 3
    const animationDuration = Math.random() * 3 + 2
    
    return {
      width: `${size}px`,
      height: `${size}px`,
      left: `${left}%`,
      top: `${top}%`,
      animationDelay: `${animationDelay}s`,
      animationDuration: `${animationDuration}s`
    }
  })
)
</script>

<template>
  <div class="subscription-required-container">
    <!-- Анимированный фон -->
    <div class="error-background">
      <div 
        class="error-particle" 
        v-for="(particle, index) in particles" 
        :key="index" 
        :style="particle"
      ></div>
    </div>

    <!-- Основной контент -->
    <div class="error-content">
      <!-- Эмодзи с красивой анимацией -->
      <div class="emoji-container">
        <div class="emoji-glow"></div>
        <div class="emoji-ripple ripple-1"></div>
        <div class="emoji-ripple ripple-2"></div>
        <div class="emoji-icon">🔐</div>
      </div>

      <!-- Текст ошибки -->
      <div class="error-text">
        <p class="error-description">
          {{ descriptionText }}
        </p>
      </div>

      <!-- Кнопка возврата -->
      <button @click="goHome" class="home-button">
        <span class="button-text">ВЕРНУТЬСЯ НА ГЛАВНУЮ</span>
        <svg class="button-arrow" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 3L14 10L7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Декор -->
    <div class="error-decoration">
      <div class="decoration-circle decoration-1"></div>
      <div class="decoration-circle decoration-2"></div>
    </div>
  </div>
</template>

<style scoped>
.subscription-required-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: radial-gradient(1200px 800px at 90% -10%, rgba(255,159,26,0.12), transparent 60%),
              radial-gradient(900px 700px at -10% 110%, rgba(255,180,77,0.12), transparent 60%),
              var(--bg-900);
  overflow: hidden;
  padding: 20px;
}

.error-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.error-particle {
  position: absolute;
  background: linear-gradient(135deg, rgba(255, 140, 60, 0.5), rgba(255, 107, 53, 0.3));
  border-radius: 50%;
  animation: float-particle infinite ease-in-out;
  box-shadow: 0 0 8px rgba(255, 140, 60, 0.4);
}

@keyframes float-particle {
  0%, 100% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0.2;
  }
  50% {
    transform: translateY(-40px) translateX(25px) scale(1.15);
    opacity: 0.6;
  }
}

.error-content {
  position: relative;
  z-index: 10;
  text-align: center;
  max-width: 800px;
  padding: 60px 40px;
  animation: fadeInUp 0.8s ease-out;
}

.emoji-container {
  margin: 0 0 40px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 200px;
  height: 200px;
  margin-left: auto;
  margin-right: auto;
}

.emoji-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 140, 60, 0.4), rgba(255, 107, 53, 0.2), transparent 70%);
  animation: glowPulse 3s ease-in-out infinite;
  filter: blur(25px);
  z-index: 1;
}

.emoji-ripple {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid rgba(255, 140, 60, 0.6);
  animation: ripple 2s ease-out infinite;
  z-index: 1;
}

.ripple-1 {
  animation-delay: 0s;
}

.ripple-2 {
  animation-delay: 1s;
}

.emoji-icon {
  font-size: 120px;
  line-height: 1;
  position: relative;
  z-index: 10;
  filter: drop-shadow(0 0 20px rgba(255, 140, 60, 0.6));
  animation: emojiAppear 0.8s ease-out forwards, emojiAnimate 4s ease-in-out 0.8s infinite;
  transform-origin: center center;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 0 0 30px rgba(255, 140, 60, 0.8);
  opacity: 0;
}

@keyframes emojiAppear {
  0% {
    opacity: 0;
    transform: scale(0) rotateZ(-180deg);
    filter: drop-shadow(0 0 0px rgba(255, 140, 60, 0));
  }
  60% {
    transform: scale(1.2) rotateZ(10deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotateZ(0deg);
    filter: drop-shadow(0 0 20px rgba(255, 140, 60, 0.6));
  }
}

@keyframes glowPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes emojiAnimate {
  0% {
    transform: translateY(0) rotateZ(0deg) rotateY(0deg) scale(1);
    filter: drop-shadow(0 0 20px rgba(255, 140, 60, 0.6));
  }
  25% {
    transform: translateY(-10px) rotateZ(-3deg) rotateY(5deg) scale(1.05);
    filter: drop-shadow(0 0 30px rgba(255, 140, 60, 0.8));
  }
  50% {
    transform: translateY(-15px) rotateZ(0deg) rotateY(0deg) scale(1.1);
    filter: drop-shadow(0 0 40px rgba(255, 140, 60, 1));
  }
  75% {
    transform: translateY(-10px) rotateZ(3deg) rotateY(-5deg) scale(1.05);
    filter: drop-shadow(0 0 30px rgba(255, 140, 60, 0.8));
  }
  100% {
    transform: translateY(0) rotateZ(0deg) rotateY(0deg) scale(1);
    filter: drop-shadow(0 0 20px rgba(255, 140, 60, 0.6));
  }
}

.error-text {
  margin: 40px 0;
  animation: fadeInUp 1s ease-out 0.3s both;
}

.error-description {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.home-button {
  padding: 16px 36px;
  background: rgba(255, 255, 255, 0.0);
  backdrop-filter: blur(10px);
  border: 2px solid #ff8c42;
  border-radius: 8px;
  color: #ff8c42;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 
    0 4px 16px rgba(255, 140, 60, 0.2),
    0 0 0 0 rgba(255, 140, 60, 0);
  animation: fadeInUp 1s ease-out 0.8s both;
}

.home-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 140, 60, 0.2), transparent);
  transition: left 0.6s ease;
}

.home-button:hover::before {
  left: 100%;
}

.home-button:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 8px 24px rgba(255, 140, 60, 0.4),
    0 0 0 4px rgba(255, 140, 60, 0.2);
  background: rgba(255, 140, 60, 0.1);
  border-color: #ff9f43;
  color: #ff9f43;
}

.home-button:active {
  transform: translateY(-1px) scale(1);
}

.button-text {
  position: relative;
  z-index: 2;
}

.button-arrow {
  width: 18px;
  height: 18px;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  color: currentColor;
}

.button-arrow path {
  stroke: currentColor;
}

.home-button:hover .button-arrow {
  transform: translateX(4px);
  color: #ff9f43;
}

.error-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 140, 60, 0.12), transparent);
  animation: decorationFloat 10s ease-in-out infinite;
}

.decoration-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.decoration-2 {
  width: 250px;
  height: 250px;
  bottom: -80px;
  left: -80px;
  animation-delay: 3s;
}

@keyframes decorationFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.2;
  }
  50% {
    transform: translate(40px, -40px) scale(1.15);
    opacity: 0.4;
  }
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

/* Адаптивность */
@media (max-width: 768px) {
  .error-content {
    padding: 40px 20px;
  }

  .emoji-container {
    width: 160px;
    height: 160px;
  }

  .emoji-icon {
    font-size: 100px;
  }

  .error-description {
    font-size: 16px;
  }

  .home-button {
    padding: 14px 28px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .error-content {
    padding: 40px 20px;
  }

  .emoji-container {
    width: 140px;
    height: 140px;
  }

  .emoji-icon {
    font-size: 80px;
  }

  .error-description {
    font-size: 15px;
    line-height: 1.6;
  }

  .home-button {
    padding: 12px 24px;
    font-size: 12px;
    gap: 8px;
  }

  .button-arrow {
    width: 16px;
    height: 16px;
  }

  .emoji-container {
    margin-bottom: 30px;
    width: 120px;
    height: 120px;
  }

  .emoji-icon {
    font-size: 70px;
  }

  .error-text {
    margin: 30px 0;
  }
}
</style>