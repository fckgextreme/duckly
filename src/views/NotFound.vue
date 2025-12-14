<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()

function goHome() {
  router.push('/main')
}

// Генерируем стили для частиц один раз
const particles = ref(
  Array.from({ length: 30 }, () => {
    const size = Math.random() * 4 + 2
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
  <div class="not-found-container">
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
      <!-- Анимированная цифра 404 -->
      <div class="error-code">
        <span class="error-number" :style="{ animationDelay: '0s' }">4</span>
        <span class="error-number" :style="{ animationDelay: '0.1s' }">0</span>
        <span class="error-number" :style="{ animationDelay: '0.2s' }">4</span>
      </div>

      <!-- Иконка ошибки -->
      <div class="error-icon-container">
        <svg class="error-icon" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <circle class="error-circle" cx="60" cy="60" r="50" />
          <line class="error-line error-line-1" x1="40" y1="40" x2="80" y2="80" />
          <line class="error-line error-line-2" x1="80" y1="40" x2="40" y2="80" />
        </svg>
      </div>

      <!-- Текст ошибки -->
      <div class="error-text">
        <h1 class="error-title">СТРАНИЦА НЕ НАЙДЕНА</h1>
        <p class="error-description">
          Похоже, вы попали на несуществующую страницу.
          <br />
          Давайте вернемся на главную!
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
      <div class="decoration-circle decoration-3"></div>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
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
  background: linear-gradient(135deg, rgba(255, 140, 60, 0.6), rgba(255, 107, 53, 0.4));
  border-radius: 50%;
  animation: float-particle infinite ease-in-out;
  box-shadow: 0 0 10px rgba(255, 140, 60, 0.5);
}

@keyframes float-particle {
  0%, 100% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-50px) translateX(30px) scale(1.2);
    opacity: 0.8;
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

.error-code {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
  perspective: 1000px;
}

.error-number {
  font-size: 180px;
  font-weight: 900;
  background: linear-gradient(135deg, #ff8c42, #ff6b35, #ff9f43);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(255, 140, 60, 0.5);
  animation: numberPulse 2s ease-in-out infinite;
  filter: drop-shadow(0 0 30px rgba(255, 140, 60, 0.4));
  display: inline-block;
  transform-style: preserve-3d;
}

@keyframes numberPulse {
  0%, 100% {
    transform: scale(1) rotateY(0deg);
    filter: drop-shadow(0 0 30px rgba(255, 140, 60, 0.4));
  }
  50% {
    transform: scale(1.1) rotateY(10deg);
    filter: drop-shadow(0 0 50px rgba(255, 140, 60, 0.7));
  }
}

.error-icon-container {
  margin: 40px 0;
  display: flex;
  justify-content: center;
  animation: iconRotate 4s ease-in-out infinite;
}

.error-icon {
  width: 120px;
  height: 120px;
  filter: drop-shadow(0 0 20px rgba(255, 60, 60, 0.5));
}

.error-circle {
  fill: none;
  stroke: #ef4444;
  stroke-width: 4;
  stroke-dasharray: 314;
  stroke-dashoffset: 314;
  animation: circleDraw 2s ease-out forwards;
}

@keyframes circleDraw {
  to {
    stroke-dashoffset: 0;
  }
}

.error-line {
  stroke: #ef4444;
  stroke-width: 4;
  stroke-linecap: round;
  opacity: 0;
  animation: lineDraw 0.5s ease-out forwards;
}

.error-line-1 {
  animation-delay: 2s;
}

.error-line-2 {
  animation-delay: 2.3s;
}

@keyframes lineDraw {
  to {
    opacity: 1;
    stroke-dasharray: 57;
    stroke-dashoffset: 0;
  }
  from {
    stroke-dasharray: 57;
    stroke-dashoffset: 57;
  }
}

@keyframes iconRotate {
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(10deg) scale(1.05);
  }
}

.error-text {
  margin: 40px 0;
  animation: fadeInUp 1s ease-out 0.3s both;
}

.error-title {
  font-size: 32px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 20px 0;
  text-transform: uppercase;
  letter-spacing: 3px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  background: linear-gradient(135deg, #ffffff, rgba(255, 255, 255, 0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error-description {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.home-button {
  margin-top: 50px;
  padding: 18px 40px;
  background: rgba(255, 255, 255, 0.0);
  backdrop-filter: blur(10px);
  border: 2px solid #ff8c42;
  border-radius: 8px;
  color: #ff8c42;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 16px rgba(255, 140, 60, 0.2),
    0 0 0 0 rgba(255, 140, 60, 0);
  display: inline-flex;
  align-items: center;
  gap: 12px;
  animation: fadeInUp 1s ease-out 0.6s both;
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
  width: 20px;
  height: 20px;
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
  background: radial-gradient(circle, rgba(255, 140, 60, 0.15), transparent);
  animation: decorationFloat 8s ease-in-out infinite;
}

.decoration-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.decoration-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  left: -50px;
  animation-delay: 2s;
}

.decoration-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 10%;
  animation-delay: 4s;
}

@keyframes decorationFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translate(30px, -30px) scale(1.1);
    opacity: 0.5;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .error-number {
    font-size: 120px;
  }

  .error-title {
    font-size: 24px;
    letter-spacing: 2px;
  }

  .error-description {
    font-size: 16px;
  }

  .home-button {
    padding: 16px 32px;
    font-size: 14px;
  }

  .error-icon {
    width: 100px;
    height: 100px;
  }

  .error-code {
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .error-number {
    font-size: 80px;
  }

  .error-title {
    font-size: 20px;
    letter-spacing: 1px;
  }

  .error-description {
    font-size: 14px;
  }

  .home-button {
    padding: 14px 28px;
    font-size: 13px;
    gap: 8px;
  }

  .button-arrow {
    width: 16px;
    height: 16px;
  }

  .error-icon {
    width: 80px;
    height: 80px;
  }

  .error-content {
    padding: 40px 20px;
  }
}
</style>
