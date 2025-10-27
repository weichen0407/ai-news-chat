<template>
  <div class="admin-page">
    <div class="admin-header">
      <h1>🔧 数据库管理后台</h1>
      <div class="admin-actions">
        <button @click="refreshData" class="btn-refresh">🔄 刷新</button>
        <button @click="goBack" class="btn-back">← 返回</button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="data" class="admin-content">
      <!-- 统计卡片 - 紧凑版 -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">用户</span>
          <span class="stat-value">{{ data.stats.totalUsers }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">房间</span>
          <span class="stat-value">{{ data.stats.totalRooms }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">消息</span>
          <span class="stat-value">{{ data.stats.totalMessages }}</span>
        </div>
      </div>

      <!-- 房间表格 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 40px"></th>
              <th style="width: 80px">ID</th>
              <th>房间名</th>
              <th>群主</th>
              <th>成员</th>
              <th>NPC</th>
              <th>消息</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="room in data.rooms" :key="room.id">
              <!-- 主行 -->
              <tr class="room-row" @click="toggleRoom(room.id)">
                <td class="expand-cell">
                  <span class="expand-icon">{{ expandedRooms[room.id] ? '▼' : '▶' }}</span>
                </td>
                <td class="room-id">{{ room.id }}</td>
                <td><strong>{{ room.name }}</strong></td>
                <td>{{ room.creator_nickname || room.creator_name }}</td>
                <td>{{ room.members?.length || 0 }}</td>
                <td>{{ room.npcs?.length || 0 }}</td>
                <td>
                  <span class="msg-badge">{{ room.message_count }}</span>
                  <span class="msg-detail">(👤{{ room.player_message_count }} 🤖{{ room.ai_message_count }})</span>
                </td>
                <td class="time-cell">{{ formatShortDate(room.created_at) }}</td>
              </tr>
              
              <!-- 展开详情 -->
              <tr v-if="expandedRooms[room.id]" class="detail-row">
                <td colspan="8" class="detail-cell">
                  <div class="detail-content">
                    <!-- 剧情背景 -->
                    <div class="detail-section">
                      <div class="detail-label">📖 剧情背景</div>
                      <div class="detail-value">{{ room.event_background }}</div>
                    </div>

                    <!-- 三栏布局 -->
                    <div class="detail-grid">
                      <!-- 真人玩家 -->
                      <div class="detail-section">
                        <div class="detail-label">👥 真人玩家 ({{ room.members?.length || 0 }})</div>
                        <div class="mini-table">
                          <div v-for="member in room.members" :key="member.user_id" class="mini-row">
                            <div class="mini-col">
                              <strong>{{ member.nickname }}</strong>
                              <span class="username">({{ member.username }})</span>
                            </div>
                            <div class="mini-col-right">
                              <div v-if="member.role_name" class="tag">{{ member.role_name }}</div>
                              <div class="mini-time">{{ formatShortDate(member.joined_at) }}</div>
                            </div>
                          </div>
                          <div v-if="!room.members || room.members.length === 0" class="empty-hint">无</div>
                        </div>
                      </div>

                      <!-- AI角色 -->
                      <div class="detail-section">
                        <div class="detail-label">🤖 AI角色 ({{ room.npcs?.length || 0 }})</div>
                        <div class="mini-table">
                          <div v-for="npc in room.npcs" :key="npc.id" class="mini-row">
                            <div class="mini-col">
                              <strong>{{ npc.name }}</strong>
                              <div class="npc-profile">{{ truncate(npc.profile, 50) }}</div>
                            </div>
                          </div>
                          <div v-if="!room.npcs || room.npcs.length === 0" class="empty-hint">无</div>
                        </div>
                      </div>

                      <!-- 最新消息 -->
                      <div class="detail-section">
                        <div class="detail-label">💬 最新消息 ({{ room.latest_messages?.length || 0 }})</div>
                        <div class="mini-table">
                          <div v-for="msg in room.latest_messages" :key="msg.id" class="mini-row msg-row">
                            <div class="msg-header">
                              <strong>{{ msg.sender_name }}</strong>
                              <span class="mini-time">{{ formatShortDate(msg.created_at) }}</span>
                            </div>
                            <div class="msg-content">{{ truncate(msg.content, 80) }}</div>
                          </div>
                          <div v-if="!room.latest_messages || room.latest_messages.length === 0" class="empty-hint">无</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const data = ref(null)
const loading = ref(true)
const error = ref(null)
const expandedRooms = reactive({})

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await $fetch('/api/admin/database')
    if (response.success) {
      data.value = response.data
    } else {
      error.value = response.error || '加载失败'
    }
  } catch (err) {
    error.value = '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

const toggleRoom = (roomId) => {
  expandedRooms[roomId] = !expandedRooms[roomId]
}

const refreshData = () => { loadData() }
const goBack = () => { navigateTo('/') }

const formatShortDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

const truncate = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

onMounted(() => { loadData() })
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 1rem;
}

.admin-header {
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.admin-header h1 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.admin-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-refresh, .btn-back {
  padding: 0.4rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 500;
}

.btn-refresh {
  background: #07c160;
  color: white;
}

.btn-back {
  background: #576b95;
  color: white;
}

.btn-refresh:hover { background: #06ad56; }
.btn-back:hover { background: #465a7f; }

/* 统计条 - 紧凑 */
.stats-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-item {
  flex: 1;
  background: white;
  padding: 0.8rem;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #07c160;
}

/* 表格样式 */
.table-container {
  background: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table thead {
  background: #f8f8f8;
  border-bottom: 2px solid #e5e5e5;
}

.data-table th {
  padding: 0.6rem 0.8rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  font-size: 0.8rem;
  white-space: nowrap;
}

.data-table td {
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
}

.room-row {
  cursor: pointer;
  transition: background 0.15s;
}

.room-row:hover {
  background: #fafafa;
}

.expand-cell {
  text-align: center;
  color: #999;
}

.expand-icon {
  font-size: 0.7rem;
  display: inline-block;
  width: 20px;
}

.room-id {
  font-family: 'Courier New', monospace;
  color: #999;
  font-size: 0.75rem;
}

.msg-badge {
  font-weight: 600;
  color: #07c160;
}

.msg-detail {
  font-size: 0.75rem;
  color: #999;
  margin-left: 0.3rem;
}

.time-cell {
  color: #999;
  font-size: 0.75rem;
}

/* 展开详情行 */
.detail-row {
  background: #fafafa;
}

.detail-cell {
  padding: 0 !important;
}

.detail-content {
  padding: 1rem;
}

.detail-section {
  margin-bottom: 1rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid #e5e5e5;
}

.detail-value {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.5;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.mini-table {
  background: white;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.8rem;
}

.mini-row {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.mini-row:last-child {
  border-bottom: none;
}

.mini-col {
  flex: 1;
}

.mini-col strong {
  color: #333;
  font-size: 0.85rem;
}

.username {
  color: #999;
  font-size: 0.75rem;
  margin-left: 0.3rem;
}

.mini-col-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.tag {
  background: #07c160;
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
}

.mini-time {
  font-size: 0.7rem;
  color: #999;
}

.npc-profile {
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.2rem;
  line-height: 1.4;
}

.msg-row {
  flex-direction: column;
  align-items: stretch;
}

.msg-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.3rem;
}

.msg-header strong {
  color: #333;
  font-size: 0.8rem;
}

.msg-content {
  color: #666;
  font-size: 0.75rem;
  line-height: 1.4;
}

.empty-hint {
  text-align: center;
  color: #999;
  padding: 1rem;
  font-size: 0.75rem;
}

.loading, .error {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 4px;
}

.error {
  color: #fa5151;
}

@media (max-width: 1200px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
