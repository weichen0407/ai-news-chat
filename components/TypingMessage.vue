<template>
  <div class="message" :class="messageClass">
    <img :src="avatar" :alt="senderName" class="avatar" />
    <div class="message-content">
      <div class="sender-name">{{ senderName }}</div>
      <div class="message-bubble">
        <span v-if="isTyping" class="typing-text">{{ displayedText }}</span>
        <span v-else>{{ content }}</span>
        <span v-if="isTyping" class="typing-cursor">|</span>
      </div>
      <div class="message-time">{{ time }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  content: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: '/avatars/placeholder.svg'
  },
  time: {
    type: String,
    required: true
  },
  messageClass: {
    type: String,
    default: 'other'
  },
  delay: {
    type: Number,
    default: 50
  }
})

const displayedText = ref('')
const isTyping = ref(true)

// 计算打字延迟，根据文本长度调整
const getTypingDelay = (text) => {
  const baseDelay = props.delay
  const length = text.length
  
  if (length < 20) return baseDelay
  if (length < 50) return baseDelay * 0.8
  if (length < 100) return baseDelay * 0.6
  if (length < 200) return baseDelay * 0.4
  return baseDelay * 0.3
}

const typeText = async () => {
  const text = props.content
  const delay = getTypingDelay(text)
  
  for (let i = 0; i <= text.length; i++) {
    displayedText.value = text.slice(0, i)
    
    if (i < text.length) {
      // 根据字符类型调整延迟
      const char = text[i]
      let charDelay = delay
      
      if (char === '。' || char === '！' || char === '？' || char === '.' || char === '!' || char === '?') {
        charDelay = delay * 3 // 句号等标点符号延迟更长
      } else if (char === '，' || char === '、' || char === ',' || char === ';') {
        charDelay = delay * 2 // 逗号等延迟稍长
      } else if (char === ' ') {
        charDelay = delay * 0.5 // 空格延迟较短
      }
      
      await new Promise(resolve => setTimeout(resolve, charDelay))
    }
  }
  
  isTyping.value = false
}

onMounted(() => {
  typeText()
})

watch(() => props.content, () => {
  displayedText.value = ''
  isTyping.value = true
  typeText()
})
</script>

<style scoped>
.typing-text {
  color: inherit;
}

.typing-cursor {
  animation: blink 1s infinite;
  color: #999;
  font-weight: normal;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
