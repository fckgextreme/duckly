<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

interface Props {
  visible: boolean
  email: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  verify: [code: string]
}>()

const codeInputs = ref<HTMLInputElement[]>([])
const code = ref(['', '', '', '', ''])
const currentIndex = ref(0)

const focusInput = (index: number) => {
  nextTick(() => {
    if (codeInputs.value[index]) {
      codeInputs.value[index].focus()
    }
  })
}

const handleInput = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  let value = target.value
  
  value = value.replace(/\D/g, '')
  
  if (value.length > 1) {
    value = value.slice(0, 1)
  }
  
  target.value = value
  code.value[index] = value
  
  if (value && index < 4) {
    focusInput(index + 1)
  }
}

const handleKeydown = (event: KeyboardEvent, index: number) => {
  if (!/^[0-9]$/.test(event.key) && 
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(event.key)) {
    event.preventDefault()
    return
  }
  
  if (event.key === 'Backspace') {
    if (!code.value[index] && index > 0) {
      focusInput(index - 1)
    }
  } else if (event.key === 'ArrowLeft' && index > 0) {
    focusInput(index - 1)
  } else if (event.key === 'ArrowRight' && index < 4) {
    focusInput(index + 1)
  } else if (event.key === 'Enter') {
    verifyCode()
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text') || ''
  const digits = pastedData.replace(/\D/g, '').slice(0, 5)
  
  for (let i = 0; i < digits.length && i < 5; i++) {
    code.value[i] = digits[i]
  }
  
  const lastFilledIndex = Math.min(digits.length - 1, 4)
  focusInput(lastFilledIndex)
}

const verifyCode = () => {
  const fullCode = code.value.join('')
  if (fullCode.length === 5) {
    emit('verify', fullCode)
  }
}

const closeModal = () => {
  emit('close')
}

onMounted(() => {
  if (props.visible) {
    focusInput(0)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="closeModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">Код подтверждения</h2>
            <p class="modal-subtitle">Введите код подтверждения, отправленный на вашу электронную почту.</p>
          </div>
          
           <div class="code-inputs">
             <input
               v-for="(digit, index) in code"
               :key="index"
               :ref="(el) => { if (el) codeInputs[index] = el as HTMLInputElement }"
               v-model="code[index]"
               type="tel"
               inputmode="numeric"
               pattern="[0-9]"
               maxlength="1"
               class="code-input"
               @input="handleInput($event, index)"
               @keydown="handleKeydown($event, index)"
               @paste="handlePaste"
               @keypress="(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault() }"
             />
           </div>
          
          <div class="modal-actions">
            <button class="btn secondary" @click="closeModal">Отмена</button>
            <button 
              class="btn" 
              :disabled="code.join('').length !== 5"
              @click="verifyCode"
            >
              Подтвердить
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: #1a1a1e;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  animation: modalAppear 0.3s ease-out;
}

.modal-header {
  text-align: center;
  margin-bottom: 32px;
}

.modal-title {
  color: #f0f0f0;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.modal-subtitle {
  color: #888888;
  font-size: 14px;
  margin: 0;
  line-height: 1.4;
}

.code-inputs {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 32px;
}

.code-input {
  width: 48px;
  height: 48px;
  background: #0f0f0f;
  border: 1px solid #1a1a1a;
  border-radius: 8px;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #f0f0f0;
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
}

.code-input:focus {
  outline: none;
  border-color: var(--violet-400);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2), inset 0 1px 3px rgba(0, 0, 0, 0.5);
  transform: scale(1.05);
  background: #111111;
}

.code-input:not(:placeholder-shown) {
  background: rgba(124, 58, 237, 0.15);
  border-color: var(--violet-400);
  box-shadow: 0 0 8px rgba(124, 58, 237, 0.2), inset 0 1px 3px rgba(0, 0, 0, 0.5);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
}

.btn:not(.secondary) {
  background: linear-gradient(135deg, var(--violet-500), var(--violet-400));
  color: white;
}

.btn:not(.secondary):hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.3);
}

.btn:not(.secondary):disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn.secondary {
  background: #0f0f0f;
  color: #888888;
  border: 1px solid #1a1a1a;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
}

.btn.secondary:hover {
  background: #1a1a1a;
  color: #f0f0f0;
  border-color: #2a2a2a;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}
</style>
