<template>
  <div class="init-page">
    <h1>数据库初始化</h1>
    <p>点击下面的按钮来初始化预设房间和用户数据</p>
    <button @click="initDatabase" :disabled="loading" class="init-btn">
      {{ loading ? '初始化中...' : '开始初始化' }}
    </button>
    <div v-if="result" class="result">
      <h3>初始化结果：</h3>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
const loading = ref(false)
const result = ref(null)

const initDatabase = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/init-db', {
      method: 'POST'
    })
    result.value = response
  } catch (error) {
    result.value = { error: error.message }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.init-page {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
}

.init-btn {
  background: #07c160;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  margin: 1rem 0;
}

.init-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result {
  margin-top: 2rem;
  text-align: left;
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
