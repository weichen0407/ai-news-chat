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
import { ref, onMounted, watch } from "vue";

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: "/avatars/placeholder.svg",
  },
  time: {
    type: String,
    required: true,
  },
  messageClass: {
    type: String,
    default: "other",
  },
  delay: {
    type: Number,
    default: 50,
  },
});

const displayedText = ref("");
const isTyping = ref(true);

// 计算打字延迟，根据文本长度调整
const getTypingDelay = (text) => {
  const baseDelay = props.delay;
  const length = text.length;

  if (length < 20) return baseDelay;
  if (length < 50) return baseDelay * 0.8;
  if (length < 100) return baseDelay * 0.6;
  if (length < 200) return baseDelay * 0.4;
  return baseDelay * 0.3;
};

const typeText = async () => {
  const text = props.content;
  const delay = getTypingDelay(text);

  for (let i = 0; i <= text.length; i++) {
    displayedText.value = text.slice(0, i);

    if (i < text.length) {
      // 根据字符类型调整延迟
      const char = text[i];
      let charDelay = delay;

      if (
        char === "。" ||
        char === "！" ||
        char === "？" ||
        char === "." ||
        char === "!" ||
        char === "?"
      ) {
        charDelay = delay * 3; // 句号等标点符号延迟更长
      } else if (
        char === "，" ||
        char === "、" ||
        char === "," ||
        char === ";"
      ) {
        charDelay = delay * 2; // 逗号等延迟稍长
      } else if (char === " ") {
        charDelay = delay * 0.5; // 空格延迟较短
      }

      await new Promise((resolve) => setTimeout(resolve, charDelay));
    }
  }

  isTyping.value = false;
};

onMounted(() => {
  typeText();
});

watch(
  () => props.content,
  () => {
    displayedText.value = "";
    isTyping.value = true;
    typeText();
  }
);
</script>

<style scoped>
.message {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1rem;
  animation: fadeIn 0.2s;
}

.message.mine {
  flex-direction: row-reverse;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.message-content {
  max-width: 60%;
  display: flex;
  flex-direction: column;
}

.message.mine .message-content {
  align-items: flex-end;
}

.sender-name {
  font-size: 0.8rem;
  color: #999;
  margin-bottom: 0.25rem;
}

.message-bubble {
  background: white;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  line-height: 1.4;
}

.message.mine .message-bubble {
  background: #95ec69;
}

.message-time {
  font-size: 0.7rem;
  color: #b8b8b8;
  margin-top: 0.2rem;
  padding: 0 0.5rem;
}

.typing-text {
  color: inherit;
}

.typing-cursor {
  animation: blink 1s infinite;
  color: #999;
  font-weight: normal;
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

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}
</style>
