<template>
  <div class="creator-page">
    <!-- 直接嵌入chat-api的界面 -->
    <iframe 
      src="/creator/index.html" 
      frameborder="0"
      style="width: 100%; height: 100vh; border: none;"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
// 剧情创作工具页面
definePageMeta({
  middleware: 'auth'
})
</script>

<style scoped>
.creator-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>

