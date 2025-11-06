<template>
  <div class="moments-page">
    <!-- 头部 -->
    <header class="moments-header">
      <button @click="goBack" class="btn-back">
        🏠 返回
      </button>
      <h1>朋友圈</h1>
      <button @click="showCreateModal = true" class="btn-create">
        ➕ 发布
      </button>
    </header>

    <!-- 朋友圈列表 -->
    <div class="moments-list" ref="momentsContainer">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">🔄</div>
        <p>加载中...</p>
      </div>

      <div v-else-if="moments.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <p>还没有人发朋友圈</p>
        <p class="empty-hint">快来发第一条吧！</p>
      </div>

      <div v-else>
        <div
          v-for="moment in moments"
          :key="moment.id"
          class="moment-card"
        >
          <!-- 用户头像和信息 -->
          <div class="moment-header">
            <div class="moment-avatar">
              {{ moment.user_avatar || moment.npc_avatar || '👤' }}
            </div>
            <div class="moment-user-info">
              <div class="moment-user-name">
                {{ moment.user_nickname || moment.user_name || moment.npc_name }}
              </div>
              <div class="moment-time">
                {{ formatTime(moment.created_at) }}
              </div>
            </div>
          </div>

          <!-- 内容 -->
          <div class="moment-content">
            {{ moment.content }}
          </div>

          <!-- 图片（如果有） -->
          <div v-if="moment.images && moment.images.length > 0" class="moment-images">
            <img
              v-for="(img, index) in moment.images"
              :key="index"
              :src="img"
              class="moment-image"
              @click="previewImage(img)"
            />
          </div>

          <!-- 互动区域 -->
          <div class="moment-actions">
            <button
              @click="toggleLike(moment)"
              class="action-btn"
              :class="{ liked: isLiked(moment) }"
            >
              {{ isLiked(moment) ? '❤️' : '🤍' }}
              {{ moment.like_count || 0 }}
            </button>
            <button @click="showCommentInput(moment)" class="action-btn">
              💬 {{ moment.comment_count || 0 }}
            </button>
          </div>

          <!-- 点赞列表 -->
          <div v-if="moment.likes && moment.likes.length > 0" class="likes-section">
            <span class="likes-icon">❤️</span>
            <span class="likes-names">
              {{ getLikesNames(moment.likes) }}
            </span>
          </div>

          <!-- 评论列表 -->
          <div v-if="moment.comments && moment.comments.length > 0" class="comments-section">
            <div
              v-for="comment in moment.comments"
              :key="comment.id"
              class="comment-item"
            >
              <span class="comment-author">
                {{ comment.user_nickname || comment.user_name || comment.npc_name }}:
              </span>
              <span v-if="comment.reply_to_user_name || comment.reply_to_npc_name" class="comment-reply">
                回复
                <span class="reply-to-name">
                  @{{ comment.reply_to_user_nickname || comment.reply_to_user_name || comment.reply_to_npc_name }}
                </span>
              </span>
              <span class="comment-content">
                {{ comment.content }}
              </span>
            </div>
          </div>

          <!-- 评论输入框（展开时显示） -->
          <div v-if="currentCommentMoment?.id === moment.id" class="comment-input-section">
            <input
              v-model="commentText"
              type="text"
              placeholder="说点什么..."
              class="comment-input"
              @keyup.enter="submitComment(moment)"
            />
            <button @click="submitComment(moment)" class="btn-submit-comment">
              发送
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 发布朋友圈模态框 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal-content create-moment-modal">
        <div class="modal-header">
          <h2>发布朋友圈</h2>
          <button @click="closeCreateModal" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <textarea
            v-model="newMomentText"
            placeholder="这一刻的想法..."
            class="create-textarea"
            rows="6"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="closeCreateModal" class="btn btn-secondary">
            取消
          </button>
          <button @click="publishMoment" class="btn btn-primary" :disabled="!newMomentText.trim()">
            发布
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const roomId = computed(() => route.params.roomId)

// 状态
const moments = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const newMomentText = ref('')
const currentCommentMoment = ref(null)
const commentText = ref('')
const momentsContainer = ref(null)

// 当前用户（从session获取）
const currentUser = ref(null)

// 获取当前用户信息
const fetchCurrentUser = async () => {
  try {
    const response = await $fetch('/api/auth/session')
    currentUser.value = response.user
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 获取朋友圈列表
const fetchMoments = async () => {
  loading.value = true
  try {
    const response = await $fetch(`/api/moments/${roomId.value}/list`)
    if (response.success) {
      moments.value = response.moments
      
      // 标记为已读
      if (currentUser.value) {
        await $fetch(`/api/moments/${roomId.value}/mark-read`, {
          method: 'POST',
          body: { user_id: currentUser.value.id }
        })
      }
    }
  } catch (error) {
    console.error('获取朋友圈失败:', error)
  } finally {
    loading.value = false
  }
}

// 发布朋友圈
const publishMoment = async () => {
  if (!newMomentText.value.trim()) return
  
  try {
    const response = await $fetch('/api/moments/create', {
      method: 'POST',
      body: {
        room_id: roomId.value,
        user_id: currentUser.value?.id,
        content: newMomentText.value.trim()
      }
    })
    
    if (response.success) {
      newMomentText.value = ''
      showCreateModal.value = false
      // 刷新列表
      await fetchMoments()
    }
  } catch (error) {
    console.error('发布失败:', error)
    alert('发布失败，请重试')
  }
}

// 点赞/取消点赞
const toggleLike = async (moment) => {
  try {
    const response = await $fetch('/api/moments/like', {
      method: 'POST',
      body: {
        moment_id: moment.id,
        user_id: currentUser.value?.id
      }
    })
    
    if (response.success) {
      // 刷新列表
      await fetchMoments()
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

// 检查是否已点赞
const isLiked = (moment) => {
  if (!currentUser.value || !moment.likes) return false
  return moment.likes.some(like => like.user_id === currentUser.value.id)
}

// 显示评论输入框
const showCommentInput = (moment) => {
  if (currentCommentMoment.value?.id === moment.id) {
    currentCommentMoment.value = null
  } else {
    currentCommentMoment.value = moment
    commentText.value = ''
  }
}

// 提交评论
const submitComment = async (moment) => {
  if (!commentText.value.trim()) return
  
  try {
    const response = await $fetch('/api/moments/comment', {
      method: 'POST',
      body: {
        moment_id: moment.id,
        user_id: currentUser.value?.id,
        content: commentText.value.trim()
      }
    })
    
    if (response.success) {
      commentText.value = ''
      currentCommentMoment.value = null
      // 刷新列表
      await fetchMoments()
    }
  } catch (error) {
    console.error('评论失败:', error)
    alert('评论失败，请重试')
  }
}

// 获取点赞名单
const getLikesNames = (likes) => {
  return likes
    .slice(0, 10)
    .map(like => like.user_nickname || like.user_name || like.npc_name)
    .join('、')
}

// 导入北京时间工具
import { formatRelativeTime } from '~/utils/time'

// 格式化时间（使用北京时间）
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return formatRelativeTime(timeStr)
}

// 关闭创建模态框
const closeCreateModal = () => {
  showCreateModal.value = false
  newMomentText.value = ''
}

// 返回
const goBack = () => {
  router.push(`/room/${roomId.value}`)
}

// 图片预览
const previewImage = (url) => {
  // TODO: 实现图片预览
  window.open(url, '_blank')
}

// 初始化
onMounted(async () => {
  await fetchCurrentUser()
  await fetchMoments()
  
  // 每30秒刷新一次
  setInterval(fetchMoments, 30000)
})
</script>

<style scoped>
.moments-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.moments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.moments-header h1 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.btn-back, .btn-create {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
}

.btn-create {
  color: #07c160;
  font-weight: 600;
}

.moments-list {
  padding: 0.5rem;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.loading-spinner {
  font-size: 2rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-hint {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.moment-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.moment-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.moment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 0.75rem;
}

.moment-user-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.moment-time {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.2rem;
}

.moment-content {
  line-height: 1.6;
  margin-bottom: 0.75rem;
  word-wrap: break-word;
}

.moment-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.moment-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.moment-actions {
  display: flex;
  gap: 1.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  background: none;
  border: none;
  font-size: 0.9rem;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.action-btn.liked {
  color: #e03c3c;
}

.likes-section {
  background: #f7f7f7;
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.75rem;
  font-size: 0.9rem;
}

.likes-icon {
  margin-right: 0.5rem;
}

.likes-names {
  color: #576b95;
}

.comments-section {
  background: #f7f7f7;
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.75rem;
}

.comment-item {
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.comment-item:last-child {
  margin-bottom: 0;
}

.comment-author {
  color: #576b95;
  font-weight: 500;
}

.comment-reply {
  color: #999;
  font-size: 0.85rem;
}

.reply-to-name {
  color: #576b95;
}

.comment-content {
  color: #333;
}

.comment-input-section {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
}

.comment-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.9rem;
}

.btn-submit-comment {
  padding: 0.5rem 1rem;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.modal-body {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
}

.create-textarea {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 150px;
}

.create-textarea:focus {
  outline: none;
  border-color: #07c160;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-primary {
  background: #07c160;
  color: white;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>

