<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getToken } from '../services/auth'
import axios from 'axios'
import { getQuestionsByTopicId, type Question } from '../data/testQuestions'

const route = useRoute()
const router = useRouter()

const subject = ref(route.query.subject as string || 'history-kz')
const topicId = ref(route.query.topicId as string || '')
const topicTitle = ref(route.query.topicTitle as string || '')
const currentQuestion = ref(0)
const selectedAnswers = ref<(number | number[])[]>([]) // Для поддержки множественных ответов
const isCompleted = ref(false)
const score = ref(0)
const isLoading = ref(false)
const showReview = ref(false) // Показывать ли обзор ответов
const reviewResults = ref<Array<{
  questionId: number
  question: string
  options: string[]
  userAnswer: number | number[]
  correctAnswer: number[]
  isCorrect: boolean
  type: 'single' | 'multiple'
}>>([])

// Загружаем вопросы для конкретной темы
const questions = ref<Question[]>([])
const isLoadingQuestions = ref(true)

onMounted(() => {
  isLoadingQuestions.value = true
  
  if (topicId.value) {
    try {
      questions.value = getQuestionsByTopicId(topicId.value)
      
      if (questions.value.length === 0) {
        // Если вопросов нет, показываем сообщение
        alert('Вопросы для этой темы еще не добавлены')
        router.push('/main/history-kz')
        return
      }
    } catch (error) {
      console.error('Ошибка при загрузке вопросов:', error)
      alert('Ошибка при загрузке вопросов. Попробуйте позже.')
      router.push('/main/history-kz')
      return
    }
  } else {
    alert('Не указана тема для теста')
    router.push('/main/history-kz')
    return
  }
  
  isLoadingQuestions.value = false
})

const progress = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round(((currentQuestion.value + 1) / questions.value.length) * 100)
})

function selectAnswer(answerIndex: number) {
  const question = questions.value[currentQuestion.value]
  
  if (question.type === 'multiple') {
    // Для вопросов с множественным выбором
    let current = selectedAnswers.value[currentQuestion.value]
    if (!Array.isArray(current)) {
      current = []
    }
    
    const index = current.indexOf(answerIndex)
    if (index > -1) {
      // Удаляем, если уже выбрано
      current = current.filter(i => i !== answerIndex)
    } else {
      // Добавляем, если не выбрано
      current = [...current, answerIndex]
    }
    
    selectedAnswers.value[currentQuestion.value] = current
  } else {
    // Для вопросов с одним ответом
    selectedAnswers.value[currentQuestion.value] = answerIndex
  }
}

function nextQuestion() {
  const current = selectedAnswers.value[currentQuestion.value]
  
  // Проверяем, выбран ли хотя бы один ответ
  if (current === undefined || current === null) {
    return
  }
  
  // Для множественного выбора проверяем, что выбран хотя бы один ответ
  if (Array.isArray(current) && current.length === 0) {
    return
  }
  
  if (currentQuestion.value < questions.value.length - 1) {
    currentQuestion.value++
  } else {
    finishTest()
  }
}

function prevQuestion() {
  if (currentQuestion.value > 0) {
    currentQuestion.value--
  }
}

async function finishTest() {
  let correct = 0
  const review: typeof reviewResults.value = []
  
  questions.value.forEach((q, index) => {
    const userAnswer = selectedAnswers.value[index]
    let isCorrect = false
    
    if (q.type === 'multiple') {
      // Для множественного выбора: сравниваем массивы
      if (Array.isArray(userAnswer)) {
        const userSorted = [...userAnswer].sort((a, b) => a - b)
        const correctSorted = [...q.correctAnswers].sort((a, b) => a - b)
        
        // Проверяем, что массивы одинаковые
        if (userSorted.length === correctSorted.length &&
            userSorted.every((val, i) => val === correctSorted[i])) {
          correct++
          isCorrect = true
        }
      }
    } else {
      // Для одного ответа
      if (userAnswer === q.correctAnswers[0]) {
        correct++
        isCorrect = true
      }
    }
    
    // Сохраняем результат для обзора
    review.push({
      questionId: q.id,
      question: q.question,
      options: q.options,
      userAnswer: userAnswer !== undefined && userAnswer !== null ? userAnswer : (q.type === 'multiple' ? [] : -1),
      correctAnswer: q.correctAnswers,
      isCorrect,
      type: q.type
    })
  })
  
  reviewResults.value = review
  score.value = Math.round((correct / questions.value.length) * 100)
  isCompleted.value = true
  
  try {
    const token = getToken()
    if (!token) {
      router.push('/login')
      return
    }
    
    await axios.post('/api/test/submit', {
      subject: subject.value,
      topicId: topicId.value,
      topicTitle: topicTitle.value,
      totalQuestions: questions.value.length,
      correctAnswers: correct,
      reviewData: reviewResults.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
  } catch (error) {
    console.error('Failed to save test result:', error)
  }
}

function goToProfile() {
  router.push('/profile')
}

function restartTest() {
  currentQuestion.value = 0
  selectedAnswers.value = []
  isCompleted.value = false
  score.value = 0
  showReview.value = false
  reviewResults.value = []
}

// Функция для определения класса оценки по проценту
function getScoreClass(scoreValue: number): string {
  if (scoreValue >= 85) return 'excellent'
  if (scoreValue >= 65) return 'success'
  if (scoreValue >= 40) return 'warning'
  return 'error'
}

// Вспомогательные функции для проверки выбранных ответов
function isAnswerSelected(index: number): boolean {
  const current = selectedAnswers.value[currentQuestion.value]
  
  if (current === undefined || current === null) {
    return false
  }
  
  if (Array.isArray(current)) {
    return current.includes(index)
  }
  
  return current === index
}

function isAnswered(): boolean {
  const current = selectedAnswers.value[currentQuestion.value]
  
  if (current === undefined || current === null) {
    return false
  }
  
  if (Array.isArray(current)) {
    return current.length > 0
  }
  
  return true
}

// Вспомогательная функция для преобразования ответа в массив
function getUserAnswerArray(answer: number | number[]): number[] {
  if (Array.isArray(answer)) {
    return answer
  }
  if (answer !== undefined && answer !== null && answer !== -1) {
    return [answer]
  }
  return []
}
</script>

<template>
  <div class="test-container">
    <div class="test-header">
      <div class="test-header-content">
        <button class="back-button" @click="router.push('/main/history-kz')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Назад к конспекту
        </button>
        <div class="test-title-section">
          <h1 class="test-title">Тест по теме</h1>
          <p class="test-subtitle">{{ topicTitle || 'История Казахстана' }}</p>
        </div>
      </div>
      
      <div v-if="!isCompleted && !isLoadingQuestions && questions.length > 0" class="progress-bar-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <span class="progress-text">{{ currentQuestion + 1 }} / {{ questions.length }}</span>
      </div>
    </div>

    <div class="test-content">
      <div v-if="isLoadingQuestions" class="loading-container">
        <div class="loading-spinner-large"></div>
        <p class="loading-text">Загрузка вопросов...</p>
      </div>
      
      <div v-else-if="questions.length === 0" class="error-container">
        <div class="error-icon">⚠️</div>
        <h2 class="error-title">Вопросы не найдены</h2>
        <p class="error-text">Вопросы для этой темы еще не добавлены</p>
        <button class="back-to-notes-button" @click="router.push('/main/history-kz')">
          Вернуться к конспектам
        </button>
      </div>
      
      <div v-else-if="!isCompleted && questions.length > 0 && questions[currentQuestion]" class="question-container">
        <div class="question-card">
          <div class="question-number">Вопрос {{ currentQuestion + 1 }}</div>
          <h2 class="question-text">{{ questions[currentQuestion]?.question || '' }}</h2>
          
          <div class="options-list">
            <button
              v-for="(option, index) in (questions[currentQuestion]?.options || [])"
              :key="index"
              class="option-button"
              :class="{ 
                selected: isAnswerSelected(index),
                answered: isAnswered()
              }"
              @click="selectAnswer(index)"
            >
              <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
              <span class="option-text">{{ option }}</span>
              <div v-if="isAnswerSelected(index)" class="option-check">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </button>
          </div>
          
          <div v-if="questions[currentQuestion]?.type === 'multiple'" class="multiple-hint">
            <span class="hint-icon">ℹ️</span>
            <span>Можно выбрать несколько правильных ответов</span>
          </div>
        </div>
        
        <div class="test-navigation">
          <button 
            class="nav-button prev-button"
            :disabled="currentQuestion === 0"
            @click="prevQuestion"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Назад
          </button>
          
          <button 
            class="nav-button next-button"
            :disabled="!isAnswered()"
            @click="nextQuestion"
          >
            {{ currentQuestion === questions.length - 1 ? 'Завершить тест' : 'Далее' }}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div v-else class="results-container">
        <div class="results-card">
          <div class="results-header">
            <div class="results-icon" :class="getScoreClass(score)">
              {{ score >= 85 ? '🎉' : score >= 65 ? '✅' : score >= 40 ? '📊' : '📝' }}
            </div>
            <h2 class="results-title">Тест завершен!</h2>
            <div class="score-circle" :class="getScoreClass(score)">
              <div class="score-value">{{ score }}%</div>
              <div class="score-label">Правильных ответов</div>
            </div>
          </div>
          
          <div class="results-details">
            <div class="result-item">
              <span class="result-label">Всего вопросов:</span>
              <span class="result-value">{{ questions.length }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">Правильных ответов:</span>
              <span class="result-value success-text">{{ score * questions.length / 100 }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">Неправильных ответов:</span>
              <span class="result-value error-text">{{ questions.length - (score * questions.length / 100) }}</span>
            </div>
          </div>
          
          <div class="results-actions">
            <button class="action-button primary-button" @click="showReview = !showReview">
              {{ showReview ? 'Скрыть детали' : 'Посмотреть ошибки' }}
            </button>
            <button class="action-button secondary-button" @click="goToProfile">
              Все результаты
            </button>
            <button class="action-button secondary-button" @click="restartTest">
              Пройти заново
            </button>
          </div>
        </div>
      </div>
      
      <!-- Обзор результатов -->
      <Transition name="fade">
        <div v-if="showReview && reviewResults.length > 0" class="review-container">
          <div class="review-header">
            <h3 class="review-title">Детальный обзор ответов</h3>
            <div class="review-stats">
              <span class="stat-item correct-stat">
                ✓ Правильно: {{ reviewResults.filter(r => r.isCorrect).length }} / {{ reviewResults.length }}
              </span>
              <span class="stat-item incorrect-stat">
                ✗ Неправильно: {{ reviewResults.filter(r => !r.isCorrect).length }} / {{ reviewResults.length }}
              </span>
            </div>
          </div>
          
          <div class="review-questions">
            <div 
              v-for="(result, index) in reviewResults" 
              :key="result.questionId"
              class="review-question-card"
              :class="{ correct: result.isCorrect, incorrect: !result.isCorrect }"
            >
              <div class="review-question-header">
                <span class="review-question-number">Вопрос {{ index + 1 }}</span>
                <span class="review-question-status" :class="result.isCorrect ? 'correct-badge' : 'incorrect-badge'">
                  {{ result.isCorrect ? '✓ Правильно' : '✗ Неправильно' }}
                </span>
              </div>
              
              <h4 class="review-question-text">{{ result.question }}</h4>
              
              <div class="review-options">
                <div 
                  v-for="(option, optIndex) in result.options"
                  :key="optIndex"
                  class="review-option"
                  :class="{
                    'correct-answer': result.correctAnswer.includes(optIndex),
                    'user-answer': getUserAnswerArray(result.userAnswer).includes(optIndex),
                    'wrong-user-answer': !result.isCorrect && getUserAnswerArray(result.userAnswer).includes(optIndex) && !result.correctAnswer.includes(optIndex)
                  }"
                >
                  <span class="review-option-letter">{{ String.fromCharCode(65 + optIndex) }}</span>
                  <span class="review-option-text">{{ option }}</span>
                  <div class="review-option-markers">
                    <span v-if="result.correctAnswer.includes(optIndex)" class="marker correct-marker">✓ Правильный ответ</span>
                    <span v-if="!result.isCorrect && getUserAnswerArray(result.userAnswer).includes(optIndex) && !result.correctAnswer.includes(optIndex)" class="marker wrong-marker">✗ Ваш ответ (неправильно)</span>
                    <span v-if="!result.isCorrect && getUserAnswerArray(result.userAnswer).includes(optIndex) && result.correctAnswer.includes(optIndex)" class="marker partial-marker">✓ Ваш ответ (правильно)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.test-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0b0b0c 0%, #121214 100%);
  padding: 32px 24px;
}

.test-header {
  max-width: 900px;
  margin: 0 auto 32px;
}

.test-header-content {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 140, 60, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 140, 60, 0.1);
  border-color: rgba(255, 140, 60, 0.4);
  color: #ffb347;
}

.test-title-section {
  flex: 1;
}

.test-title {
  font-size: 24px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 4px 0;
}

.test-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff8c42, #ffb347);
  border-radius: 4px;
  transition: width 0.3s ease;
  box-shadow: 0 0 12px rgba(255, 140, 60, 0.5);
}

.progress-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  min-width: 50px;
  text-align: right;
}

.test-content {
  max-width: 900px;
  margin: 0 auto;
}

.question-container {
  animation: fadeIn 0.3s ease;
}

.question-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 140, 60, 0.2);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.question-number {
  font-size: 12px;
  font-weight: 600;
  color: #ffb347;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
}

.question-text {
  font-size: 20px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-button {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 140, 60, 0.2);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  text-align: left;
}

.option-button:hover {
  background: rgba(255, 140, 60, 0.1);
  border-color: rgba(255, 140, 60, 0.4);
  transform: translateX(4px);
}

.multiple-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(255, 140, 60, 0.1);
  border: 1px solid rgba(255, 140, 60, 0.3);
  border-radius: 8px;
  color: #ffb347;
  font-size: 14px;
  font-weight: 500;
}

.hint-icon {
  font-size: 16px;
}

.option-button.selected {
  background: rgba(255, 140, 60, 0.15);
  border-color: #ff8c42;
  box-shadow: 0 4px 16px rgba(255, 140, 60, 0.3);
}

.option-letter {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 140, 60, 0.2);
  border-radius: 8px;
  font-weight: 700;
  color: #ffb347;
  flex-shrink: 0;
}

.option-button.selected .option-letter {
  background: #ff8c42;
  color: white;
}

.option-text {
  flex: 1;
}

.option-check {
  color: #ff8c42;
  flex-shrink: 0;
}

.test-navigation {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 140, 60, 0.3);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-button:hover:not(:disabled) {
  background: rgba(255, 140, 60, 0.15);
  border-color: #ff8c42;
  color: #ffb347;
  transform: translateY(-2px);
}

.nav-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.next-button {
  margin-left: auto;
}

.results-container {
  animation: fadeIn 0.5s ease;
}

.results-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 140, 60, 0.2);
  border-radius: 20px;
  padding: 48px;
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
  text-align: center;
}

.results-header {
  margin-bottom: 32px;
}

.results-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: bounce 0.6s ease;
}

.results-icon.excellent {
  filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.5));
}

.results-icon.success {
  filter: drop-shadow(0 0 10px rgba(74, 222, 128, 0.5));
}

.results-icon.warning {
  filter: drop-shadow(0 0 10px rgba(255, 140, 60, 0.5));
}

.results-icon.error {
  filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.5));
}

.results-title {
  font-size: 28px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 32px 0;
}

.score-circle {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 4px solid;
  animation: scaleIn 0.5s ease;
}

.score-circle.excellent {
  border-color: rgba(16, 185, 129, 0.5);
  background: rgba(16, 185, 129, 0.1);
  box-shadow: 0 0 32px rgba(16, 185, 129, 0.4);
}

.score-circle.success {
  border-color: rgba(74, 222, 128, 0.5);
  background: rgba(74, 222, 128, 0.1);
  box-shadow: 0 0 32px rgba(74, 222, 128, 0.3);
}

.score-circle.warning {
  border-color: rgba(255, 140, 60, 0.5);
  background: rgba(255, 140, 60, 0.1);
  box-shadow: 0 0 32px rgba(255, 140, 60, 0.3);
}

.score-circle.error {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.1);
  box-shadow: 0 0 32px rgba(239, 68, 68, 0.3);
}

.score-value {
  font-size: 42px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 4px;
}

.score-circle.excellent .score-value {
  color: #10b981;
}

.score-circle.success .score-value {
  color: #4ade80;
}

.score-circle.warning .score-value {
  color: #ff8c42;
}

.score-circle.error .score-value {
  color: #ef4444;
}

.score-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.results-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.result-item:last-child {
  border-bottom: none;
}

.result-label {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
}

.result-value {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
}

.success-text {
  color: #4ade80;
}

.error-text {
  color: #ef4444;
}

.results-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.action-button {
  padding: 14px 32px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.primary-button {
  background: linear-gradient(135deg, #ff8c42, #ffb347);
  color: white;
  box-shadow: 0 4px 16px rgba(255, 140, 60, 0.3);
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(255, 140, 60, 0.4);
}

.secondary-button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 140, 60, 0.3);
  color: rgba(255, 255, 255, 0.9);
}

.secondary-button:hover {
  background: rgba(255, 140, 60, 0.1);
  border-color: #ff8c42;
  color: #ffb347;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 24px;
  min-height: 400px;
}

.loading-spinner-large {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 140, 60, 0.2);
  border-top-color: #ff8c42;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 24px;
}

.loading-text {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 24px;
  min-height: 400px;
  text-align: center;
}

.error-icon {
  font-size: 80px;
  margin-bottom: 24px;
  animation: bounce 0.6s ease;
}

.error-title {
  font-size: 28px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 16px 0;
}

.error-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 32px 0;
  max-width: 500px;
}

.back-to-notes-button {
  padding: 14px 32px;
  background: linear-gradient(135deg, #ff8c42, #ffb347);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(255, 140, 60, 0.3);
}

.back-to-notes-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(255, 140, 60, 0.4);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .test-container {
    padding: 24px 16px;
  }
  
  .test-header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .question-card {
    padding: 24px;
  }
  
  .results-card {
    padding: 32px 24px;
  }
  
  .results-actions {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
  }
  
  .review-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .review-question-card {
    padding: 18px;
  }
  
  .review-option {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .review-option-markers {
    width: 100%;
    margin-top: 8px;
  }
}

/* Обзор результатов */
.review-container {
  margin-top: 32px;
  animation: fadeIn 0.5s ease;
}

.review-header {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(255, 140, 60, 0.3);
}

.review-title {
  font-size: 24px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 16px 0;
}

.review-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.stat-item {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
}

.correct-stat {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.incorrect-stat {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.review-questions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-question-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid;
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.review-question-card.correct {
  border-color: rgba(74, 222, 128, 0.4);
  background: rgba(74, 222, 128, 0.05);
}

.review-question-card.incorrect {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.05);
}

.review-question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.review-question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.review-question-number {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.review-question-status {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
}

.correct-badge {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.4);
}

.incorrect-badge {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.review-question-text {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.review-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 140, 60, 0.2);
  border-radius: 10px;
  transition: all 0.3s ease;
  position: relative;
}

.review-option.correct-answer {
  background: rgba(74, 222, 128, 0.15);
  border-color: rgba(74, 222, 128, 0.4);
}

.review-option.wrong-user-answer {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}

.review-option.user-answer.correct-answer {
  background: rgba(74, 222, 128, 0.2);
  border-color: rgba(74, 222, 128, 0.5);
}

.review-option-letter {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 140, 60, 0.2);
  border-radius: 6px;
  font-weight: 700;
  color: #ffb347;
  flex-shrink: 0;
}

.review-option.correct-answer .review-option-letter {
  background: rgba(74, 222, 128, 0.3);
  color: #4ade80;
}

.review-option.wrong-user-answer .review-option-letter {
  background: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.review-option-text {
  flex: 1;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  line-height: 1.6;
}

.review-option-markers {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.marker {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.correct-marker {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.wrong-marker {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.partial-marker {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

@media (max-width: 768px) {
  .review-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .review-question-card {
    padding: 18px;
  }
  
  .review-option {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .review-option-markers {
    width: 100%;
    margin-top: 8px;
  }
}
</style>
