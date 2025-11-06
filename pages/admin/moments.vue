<template>
  <div class="admin-page">
    <div class="admin-container">
      <div class="admin-header">
        <h1>🎭 朋友圈管理后台</h1>
        <button @click="goBack" class="btn-back">← 返回</button>
      </div>

      <!-- Tab导航 -->
      <div class="tab-nav">
        <button 
          @click="handleTabChange('manage')" 
          :class="['tab-btn', { active: activeTab === 'manage' }]"
        >
          📊 管理
        </button>
        <button 
          @click="handleTabChange('comments')" 
          :class="['tab-btn', { active: activeTab === 'comments' }]"
        >
          💬 最近评论
        </button>
      </div>

      <div class="admin-content" v-show="activeTab === 'manage'">
        <!-- 自动化控制 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>🤖 自动化控制</h2>
            <span class="status-badge" :class="autoMode ? 'status-running' : 'status-idle'">
              {{ autoMode ? '运行中' : '已停止' }}
            </span>
          </div>
          <div class="card-body">
            <p class="description">
              启动后，NPC将自动发布朋友圈并智能回复（包括回复玩家评论）
            </p>
            
            <div class="form-group">
              <label>发帖频率（秒）：</label>
              <input 
                v-model.number="postFrequency" 
                type="number" 
                min="10" 
                max="3600"
                class="form-input"
                placeholder="多少秒发一条朋友圈"
              />
              <small class="hint">建议：30-300秒</small>
            </div>
            
            <div class="form-group">
              <label>评论频率（秒）：</label>
              <input 
                v-model.number="commentFrequency" 
                type="number" 
                min="5" 
                max="1800"
                class="form-input"
                placeholder="多少秒检查一次新评论"
              />
              <small class="hint">建议：10-60秒</small>
            </div>
            
            <div class="auto-stats" v-if="autoMode">
              <div class="stat-row">
                <span>运行时长：{{ autoRunTime }}</span>
                <span>已发帖：{{ autoStats.posts }}</span>
                <span>已评论：{{ autoStats.comments }}</span>
              </div>
            </div>
            
            <div class="button-group">
              <button 
                @click="toggleAutoMode" 
                :class="['btn', 'btn-large', autoMode ? 'btn-danger' : 'btn-success']"
                :disabled="!postFrequency || !commentFrequency"
              >
                {{ autoMode ? '⏸️ 停止自动化' : '▶️ 启动自动化' }}
              </button>
            </div>
          </div>
        </div>

        <!-- NPC自动发朋友圈 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>🤖 NPC自动发朋友圈</h2>
            <span class="status-badge" :class="autoPostStatus">
              {{ autoPostStatusText }}
            </span>
          </div>
          <div class="card-body">
            <p class="description">
              选择房间和NPC，让指定NPC发布朋友圈
            </p>
            
            <div class="form-group">
              <label>1️⃣ 选择房间：</label>
              <select v-model="selectedRoomForPost" @change="loadNPCsForPost" class="form-select">
                <option value="">请选择房间</option>
                <option v-for="room in rooms" :key="room.id" :value="room.id">
                  {{ room.name }}
                </option>
              </select>
            </div>
            
            <div v-if="selectedRoomForPost" class="form-group">
              <label>2️⃣ 选择NPC：</label>
              <select v-model="selectedNPCForPost" class="form-select">
                <option value="">请选择NPC</option>
                <option v-for="npc in npcsForPost" :key="npc.id" :value="npc.id">
                  {{ npc.name }} {{ npc.avatar }}
                </option>
              </select>
            </div>
            
            <div class="stats">
              <div class="stat-item">
                <span class="stat-label">上次执行：</span>
                <span class="stat-value">{{ lastPostTime || '未执行' }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">成功数量：</span>
                <span class="stat-value">{{ lastPostCount }}</span>
              </div>
            </div>
            
            <button 
              @click="triggerNPCPost" 
              class="btn btn-primary btn-large"
              :disabled="!selectedNPCForPost || isPosting"
            >
              {{ isPosting ? '生成中...' : '🚀 立即触发NPC发朋友圈' }}
            </button>
          </div>
        </div>

        <!-- NPC自动评论 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>💬 NPC自动评论</h2>
            <span class="status-badge" :class="autoCommentStatus">
              {{ autoCommentStatusText }}
            </span>
          </div>
          <div class="card-body">
            <p class="description">
              选择房间、NPC和朋友圈，让指定NPC评论
            </p>
            
            <div class="form-group">
              <label>1️⃣ 选择房间：</label>
              <select v-model="selectedRoomForComment" @change="loadNPCsForComment" class="form-select">
                <option value="">请选择房间</option>
                <option v-for="room in rooms" :key="room.id" :value="room.id">
                  {{ room.name }}
                </option>
              </select>
            </div>
            
            <div v-if="selectedRoomForComment" class="form-group">
              <label>2️⃣ 选择NPC：</label>
              <select v-model="selectedNPCForComment" @change="loadRoomMoments" class="form-select">
                <option value="">请选择NPC</option>
                <option v-for="npc in npcsForComment" :key="npc.id" :value="npc.id">
                  {{ npc.name }} {{ npc.avatar }}
                </option>
              </select>
            </div>
            
            <div v-if="selectedNPCForComment" class="form-group">
              <label>3️⃣ 选择朋友圈（当前房间）：</label>
              <select v-model="selectedMomentId" class="form-select">
                <option value="">选择要评论的朋友圈</option>
                <option v-for="moment in recentMoments" :key="moment.id" :value="moment.id">
                  {{ moment.author }}: {{ moment.content.substring(0, 30) }}...
                </option>
              </select>
            </div>
            
            <button 
              @click="triggerNPCComment" 
              class="btn btn-primary btn-large"
              :disabled="!selectedMomentId || !selectedNPCForComment || isCommenting"
            >
              {{ isCommenting ? '评论中...' : '💬 立即触发NPC评论' }}
            </button>
          </div>
        </div>

        <!-- 朋友圈统计 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>📊 朋友圈统计</h2>
          </div>
          <div class="card-body">
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-number">{{ stats.totalMoments }}</div>
                <div class="stat-label">朋友圈总数</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">{{ stats.npcMoments }}</div>
                <div class="stat-label">NPC发布</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">{{ stats.userMoments }}</div>
                <div class="stat-label">玩家发布</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">{{ stats.totalComments }}</div>
                <div class="stat-label">评论总数</div>
              </div>
            </div>
            <button @click="refreshStats" class="btn btn-secondary">
              🔄 刷新统计
            </button>
          </div>
        </div>

        <!-- 最近的朋友圈 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>📝 最近的朋友圈</h2>
          </div>
          <div class="card-body">
            <div v-if="recentMoments.length === 0" class="empty-state">
              还没有朋友圈
            </div>
            <div v-else class="moments-list">
              <div v-for="moment in recentMoments" :key="moment.id" class="moment-item">
                <div class="moment-header-admin">
                  <div class="moment-avatar-small">
                    <img 
                      v-if="isImageAvatar(moment.user_avatar || moment.npc_avatar)"
                      :src="moment.user_avatar || moment.npc_avatar" 
                      alt="avatar"
                      class="avatar-img-small"
                    />
                    <span v-else>{{ moment.user_avatar || moment.npc_avatar || '👤' }}</span>
                  </div>
                  <div class="moment-info">
                    <span class="moment-author">{{ moment.author }}</span>
                    <span class="moment-time">{{ formatTime(moment.created_at) }}</span>
                  </div>
                </div>
                <div class="moment-content">{{ moment.content }}</div>
                <div class="moment-stats">
                  ❤️ {{ moment.like_count }} 💬 {{ moment.comment_count }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近评论 Tab -->
      <div class="admin-content" v-show="activeTab === 'comments'">
        <div class="admin-card">
          <div class="card-header">
            <h2>💬 最近评论</h2>
            <button @click="loadRecentComments" class="btn-refresh">🔄 刷新</button>
          </div>
          <div class="card-body">
            <div class="filter-group">
              <label>筛选类型：</label>
              <select v-model="commentFilter" class="form-select-small">
                <option value="all">全部</option>
                <option value="player">玩家评论</option>
                <option value="npc">NPC评论</option>
                <option value="reply">回复评论</option>
              </select>
            </div>

            <div v-if="loadingComments" class="loading-state">
              <div class="spinner"></div>
              <p>加载中...</p>
            </div>

            <div v-else-if="recentComments.length === 0" class="empty-state">
              <p>📭 暂无评论记录</p>
            </div>

            <div v-else class="comments-list">
              <div 
                v-for="comment in filteredComments" 
                :key="comment.id" 
                class="comment-item"
              >
                <div class="comment-header">
                  <span class="comment-author">
                    {{ comment.author_type === 'user' ? '👤' : '🤖' }}
                    {{ comment.author_name }}
                  </span>
                  <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
                </div>

                <!-- 朋友圈内容 -->
                <div class="moment-preview">
                  <div class="preview-label">朋友圈：</div>
                  <div class="preview-content">{{ comment.moment_content }}</div>
                  <div class="preview-author">
                    作者：{{ comment.moment_author }}
                  </div>
                </div>

                <!-- 如果是回复评论 -->
                <div v-if="comment.reply_to_content" class="reply-to-preview">
                  <div class="preview-label">回复：</div>
                  <div class="preview-content">
                    {{ comment.reply_to_author }}：{{ comment.reply_to_content }}
                  </div>
                </div>

                <!-- 评论内容 -->
                <div class="comment-content">
                  <div class="content-label">评论：</div>
                  <div class="content-text">{{ comment.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatRelativeTime } from '~/utils/time'

const router = useRouter()

// Tab切换
const activeTab = ref('manage')

// 最近评论相关
const recentComments = ref<any[]>([])
const loadingComments = ref(false)
const commentFilter = ref('all')

// 状态
const isPosting = ref(false)
const isCommenting = ref(false)
const lastPostTime = ref('')
const lastPostCount = ref(0)
const selectedMomentId = ref('')
const recentMoments = ref([])
const stats = ref({
  totalMoments: 0,
  npcMoments: 0,
  userMoments: 0,
  totalComments: 0
})

// 房间和NPC
const rooms = ref([])
const selectedRoomForPost = ref('')
const npcsForPost = ref([])
const selectedNPCForPost = ref('')
const selectedRoomForComment = ref('')
const npcsForComment = ref([])
const selectedNPCForComment = ref('')

// 自动化控制
const autoMode = ref(false)
const postFrequency = ref(60) // 默认60秒
const commentFrequency = ref(30) // 默认30秒
const autoStats = ref({ posts: 0, comments: 0 })
const autoStartTime = ref(0)
const autoRunTime = ref('00:00')
let postInterval: any = null
let commentInterval: any = null
let timeInterval: any = null

// 计算属性
const autoPostStatus = computed(() => isPosting.value ? 'status-running' : 'status-idle')
const autoPostStatusText = computed(() => isPosting.value ? '运行中' : '就绪')
const autoCommentStatus = computed(() => isCommenting.value ? 'status-running' : 'status-idle')
const autoCommentStatusText = computed(() => isCommenting.value ? '运行中' : '就绪')

// 加载房间列表
const fetchRooms = async () => {
  try {
    const response = await $fetch('/api/rooms/preset-rooms')
    if (response.success) {
      rooms.value = response.rooms
    }
  } catch (error) {
    console.error('获取房间列表失败:', error)
  }
}

// 加载房间的NPC（发布用）
const loadNPCsForPost = async () => {
  if (!selectedRoomForPost.value) {
    npcsForPost.value = []
    selectedNPCForPost.value = ''
    return
  }
  
  try {
    const response = await $fetch('/api/rooms/get-npcs', {
      method: 'POST',
      body: { room_id: selectedRoomForPost.value }
    })
    if (response.success) {
      npcsForPost.value = response.npcs
      console.log('加载NPC成功:', response.npcs)
    }
  } catch (error) {
    console.error('获取NPC列表失败:', error)
  }
}

// 加载房间的NPC（评论用）
const loadNPCsForComment = async () => {
  if (!selectedRoomForComment.value) {
    npcsForComment.value = []
    selectedNPCForComment.value = ''
    selectedMomentId.value = ''
    return
  }
  
  try {
    const response = await $fetch('/api/rooms/get-npcs', {
      method: 'POST',
      body: { room_id: selectedRoomForComment.value }
    })
    if (response.success) {
      npcsForComment.value = response.npcs
      console.log('加载NPC成功:', response.npcs)
    }
  } catch (error) {
    console.error('获取NPC列表失败:', error)
  }
}

// 当选择NPC后，加载该房间的朋友圈
const loadRoomMoments = async () => {
  if (!selectedNPCForComment.value || !selectedRoomForComment.value) {
    return
  }
  
  try {
    const response = await $fetch(`/api/moments/room/${selectedRoomForComment.value}`)
    if (response.success) {
      recentMoments.value = response.moments
      console.log('加载房间朋友圈成功:', response.moments.length, '条')
    }
  } catch (error) {
    console.error('获取房间朋友圈失败:', error)
  }
}

// 触发NPC发朋友圈
const triggerNPCPost = async () => {
  if (isPosting.value || !selectedNPCForPost.value) return
  
  isPosting.value = true
  try {
    const response = await $fetch('/api/moments/ai-generate', {
      method: 'POST',
      body: {
        npc_id: selectedNPCForPost.value
      }
    })
    
    if (response.success) {
      lastPostTime.value = new Date().toLocaleString('zh-CN')
      lastPostCount.value = 1
      alert('成功！NPC已发布朋友圈')
      await fetchRecentMoments()
      await refreshStats()
    } else {
      alert('触发失败：' + response.error)
    }
  } catch (error) {
    console.error('触发NPC发朋友圈失败:', error)
    alert('触发失败')
  } finally {
    isPosting.value = false
  }
}

// 触发NPC评论
const triggerNPCComment = async () => {
  if (isCommenting.value || !selectedMomentId.value || !selectedNPCForComment.value) return
  
  isCommenting.value = true
  try {
    const response = await $fetch('/api/moments/ai-comment', {
      method: 'POST',
      body: {
        moment_id: selectedMomentId.value,
        npc_id: selectedNPCForComment.value
      }
    })
    
    if (response.success) {
      alert('成功触发NPC评论！')
      selectedMomentId.value = ''
      setTimeout(() => {
        fetchRecentMoments()
        refreshStats()
      }, 2000)
    } else {
      alert('触发失败：' + response.error)
    }
  } catch (error) {
    console.error('触发NPC评论失败:', error)
    alert('触发失败')
  } finally {
    isCommenting.value = false
  }
}

// 获取最近的朋友圈
const fetchRecentMoments = async () => {
  try {
    const response = await $fetch('/api/moments/recent')
    if (response.success) {
      recentMoments.value = response.moments.map(m => ({
        ...m,
        author: m.user_nickname || m.npc_name || '未知'
      }))
    }
  } catch (error) {
    console.error('获取朋友圈失败:', error)
  }
}

// 刷新统计
const refreshStats = async () => {
  try {
    const response = await $fetch('/api/moments/stats')
    if (response.success) {
      stats.value = response.stats
    }
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 判断是否为图片头像
const isImageAvatar = (avatar) => {
  if (!avatar) return false
  return avatar.startsWith('data:image') || 
         avatar.startsWith('http://') || 
         avatar.startsWith('https://')
}

// 格式化时间（使用北京时间）
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return formatRelativeTime(timeStr)
}

// 返回
const goBack = () => {
  router.push('/')
}

// 加载最近评论
const loadRecentComments = async () => {
  loadingComments.value = true
  try {
    const response = await $fetch('/api/moments/recent-comments', {
      params: { limit: 50 }
    }) as any
    if (response.success) {
      recentComments.value = response.comments || []
    }
  } catch (error) {
    console.error('加载评论失败:', error)
    alert('加载评论失败')
  } finally {
    loadingComments.value = false
  }
}

// 筛选评论
const filteredComments = computed(() => {
  if (commentFilter.value === 'all') {
    return recentComments.value
  } else if (commentFilter.value === 'player') {
    return recentComments.value.filter(c => c.author_type === 'user')
  } else if (commentFilter.value === 'npc') {
    return recentComments.value.filter(c => c.author_type === 'npc')
  } else if (commentFilter.value === 'reply') {
    return recentComments.value.filter(c => c.reply_to_content)
  }
  return recentComments.value
})

// 切换tab时加载数据
const handleTabChange = (tab: string) => {
  activeTab.value = tab
  if (tab === 'comments' && recentComments.value.length === 0) {
    loadRecentComments()
  }
}

// 自动化控制
const toggleAutoMode = () => {
  if (autoMode.value) {
    stopAutoMode()
  } else {
    startAutoMode()
  }
}

const startAutoMode = () => {
  autoMode.value = true
  autoStartTime.value = Date.now()
  autoStats.value = { posts: 0, comments: 0 }
  
  // 启动发帖定时器
  postInterval = setInterval(async () => {
    try {
      const response = await $fetch('/api/moments/auto/post', {
        method: 'POST'
      })
      if (response.success) {
        autoStats.value.posts += response.count || 1
        await fetchRecentMoments()
        await refreshStats()
      }
    } catch (error) {
      console.error('自动发帖失败:', error)
    }
  }, postFrequency.value * 1000)
  
  // 启动评论定时器
  commentInterval = setInterval(async () => {
    try {
      const response = await $fetch('/api/moments/auto/comment', {
        method: 'POST'
      })
      if (response.success) {
        autoStats.value.comments += response.count || 0
        await fetchRecentMoments()
      }
    } catch (error) {
      console.error('自动评论失败:', error)
    }
  }, commentFrequency.value * 1000)
  
  // 启动运行时间计时器
  timeInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - autoStartTime.value) / 1000)
    const hours = Math.floor(elapsed / 3600)
    const minutes = Math.floor((elapsed % 3600) / 60)
    const seconds = elapsed % 60
    autoRunTime.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }, 1000)
  
  console.log('✅ 自动化已启动')
}

const stopAutoMode = () => {
  autoMode.value = false
  
  if (postInterval) {
    clearInterval(postInterval)
    postInterval = null
  }
  
  if (commentInterval) {
    clearInterval(commentInterval)
    commentInterval = null
  }
  
  if (timeInterval) {
    clearInterval(timeInterval)
    timeInterval = null
  }
  
  console.log('⏸️ 自动化已停止')
}

// 初始化
onMounted(() => {
  fetchRooms()
  fetchRecentMoments()
  refreshStats()
})

// 组件卸载时清理
onUnmounted(() => {
  stopAutoMode()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 2rem 1rem;
}

.admin-container {
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.admin-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  color: #333;
}

.btn-back {
  padding: 0.6rem 1.2rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f8f9fa;
}

.admin-content {
  display: grid;
  gap: 1.5rem;
}

.admin-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-header h2 {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.status-idle {
  background: rgba(255,255,255,0.3);
}

.status-badge.status-running {
  background: #fbbf24;
  color: #78350f;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.card-body {
  padding: 1.5rem;
}

.description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.stat-value {
  color: #333;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-box {
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-box .stat-label {
  color: rgba(255,255,255,0.9);
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
}

.btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #07c160;
  color: white;
}

.btn-primary:hover {
  background: #06ad56;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-large {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
}

.moments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.moment-item {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.moment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.moment-header-admin {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.moment-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  margin-right: 0.5rem;
  flex-shrink: 0;
  overflow: hidden;
}

.moment-avatar-small .avatar-img-small {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.moment-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.moment-author {
  font-weight: 600;
  color: #333;
}

.moment-time {
  font-size: 0.85rem;
  color: #999;
}

.moment-content {
  color: #555;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.moment-stats {
  font-size: 0.9rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}

/* 自动化控制样式 */
.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.hint {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.25rem;
  display: block;
}

.auto-stats {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.stat-row {
  display: flex;
  justify-content: space-around;
  font-size: 0.9rem;
  color: #666;
}

.stat-row span {
  font-weight: 600;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-success {
  background: #07c160 !important;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #06ad56 !important;
}

.btn-danger {
  background: #ef4444 !important;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626 !important;
}

.status-running {
  background: #dcfce7 !important;
  color: #16a34a !important;
}

/* Tab导航样式 */
.tab-nav {
  display: flex;
  gap: 0.5rem;
  background: white;
  padding: 1rem 1.5rem 0;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 1.5rem;
}

.tab-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  background: none;
  border-bottom: 3px solid transparent;
  font-size: 1rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: #667eea;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

/* 最近评论样式 */
.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #333;
}

.form-select-small {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 600px;
  overflow-y: auto;
}

.comment-item {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.comment-author {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
}

.comment-time {
  font-size: 0.85rem;
  color: #999;
}

.moment-preview, .reply-to-preview {
  background: white;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}

.preview-label, .content-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.preview-content {
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.preview-author {
  font-size: 0.85rem;
  color: #999;
}

.reply-to-preview {
  background: #fff9e6;
  border-left: 3px solid #fbbf24;
}

.comment-content {
  background: white;
  border-radius: 6px;
  padding: 0.75rem;
}

.content-text {
  font-size: 1rem;
  color: #333;
  line-height: 1.6;
  font-weight: 500;
}

.btn-refresh {
  padding: 0.5rem 1rem;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: #06ad56;
}

.loading-state {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

