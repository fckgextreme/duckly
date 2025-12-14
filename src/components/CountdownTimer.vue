<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

interface Props {
  duration: number
  onComplete?: () => void
  storageKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  duration: 180,
  storageKey: 'countdown-timer'
})

const emit = defineEmits<{
  complete: []
}>()

const timeLeft = ref(props.duration)
const isActive = ref(false)
let intervalId: ReturnType<typeof setInterval> | null = null

const minutes = computed(() => Math.floor(timeLeft.value / 60))
const seconds = computed(() => timeLeft.value % 60)
const formattedTime = computed(() => 
  `${minutes.value.toString().padStart(2, '0')}:${seconds.value.toString().padStart(2, '0')}`
)

const progressPercentage = computed(() => 
  ((props.duration - timeLeft.value) / props.duration) * 100
)

const saveState = () => {
  if (isActive.value) {
    const endTime = Date.now() + (timeLeft.value * 1000)
    localStorage.setItem(props.storageKey, endTime.toString())
  } else {
    localStorage.removeItem(props.storageKey)
  }
}

const restoreState = () => {
  const savedEndTime = localStorage.getItem(props.storageKey)
  if (savedEndTime) {
    const endTime = parseInt(savedEndTime)
    const now = Date.now()
    const remainingTime = Math.ceil((endTime - now) / 1000)
    
    if (remainingTime > 0) {
      timeLeft.value = remainingTime
      isActive.value = true
      startInterval()
      return true
    } else {
      localStorage.removeItem(props.storageKey)
    }
  }
  return false
}

const startInterval = () => {
  intervalId = setInterval(() => {
    timeLeft.value--
    saveState()
    
    if (timeLeft.value <= 0) {
      stop()
      emit('complete')
      props.onComplete?.()
    }
  }, 1000)
}

const start = () => {
  if (isActive.value) return
  isActive.value = true
  timeLeft.value = props.duration
  startInterval()
  saveState()
}

const stop = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  isActive.value = false
  saveState()
}

const reset = () => {
  stop()
  timeLeft.value = props.duration
  localStorage.removeItem(props.storageKey)
}

onMounted(() => {
  const wasRestored = restoreState()
  if (!wasRestored) {
    start()
  }
})

onUnmounted(() => {
  stop()
})

defineExpose({
  start,
  stop,
  reset,
  isActive: computed(() => isActive.value),
  timeLeft: computed(() => timeLeft.value)
})
</script>

<template>
  <div class="countdown-timer" :class="{ active: isActive }">
    <div class="countdown-content">
      <div class="countdown-icon">
        <svg class="timer-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12,6 12,12 16,14"></polyline>
        </svg>
      </div>
      <div class="countdown-text">
        <div class="countdown-label">Повторная отправка через</div>
        <div class="countdown-time">{{ formattedTime }}</div>
      </div>
    </div>
    <div class="countdown-progress">
      <div 
        class="countdown-progress-bar" 
        :style="{ width: `${progressPercentage}%` }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.countdown-timer {
  background: rgba(15, 15, 15, 0.8);
  border: 1px solid rgba(255, 140, 60, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin: 12px 0;
  transition: all 0.3s ease;
  animation: countdownAppear 0.4s ease-out;
  backdrop-filter: blur(10px);
}

.countdown-timer.active {
  box-shadow: 0 4px 20px rgba(255, 140, 60, 0.15);
  border-color: rgba(255, 140, 60, 0.3);
}

.countdown-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.countdown-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 140, 60, 0.8);
  animation: pulse 2s infinite;
}

.timer-icon {
  width: 100%;
  height: 100%;
  stroke-width: 2;
}

.countdown-text {
  flex: 1;
}

.countdown-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.countdown-time {
  font-size: 18px;
  font-weight: 700;
  color: #ff8c42;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

.countdown-progress {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  margin-top: 12px;
  overflow: hidden;
}

.countdown-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff8c42, #ff6b35);
  border-radius: 2px;
  transition: width 1s linear;
  box-shadow: 0 0 8px rgba(255, 140, 60, 0.3);
}

@keyframes countdownAppear {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    color: rgba(255, 140, 60, 0.8);
  }
  50% {
    transform: scale(1.1);
    color: #ff8c42;
  }
}
</style>
