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
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ data.stats.totalUsers }}</div>
          <div class="stat-label">总用户数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ data.stats.totalRooms }}</div>
          <div class="stat-label">总房间数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ data.stats.totalMessages }}</div>
          <div class="stat-label">总消息数</div>
        </div>
      </div>

      <div class="rooms-section">
        <h2>房间列表</h2>
        <div v-if="data.rooms.length === 0" class="empty"><p>还没有房间</p></div>
        <div v-else>
          <div v-for="room in data.rooms" :key="room.id" class="room-card">
            <div class="room-header">
              <h3>{{ room.name }}</h3>
              <span class="room-id">ID: {{ room.id }}</span>
            </div>

            <div class="room-info">
              <div class="info-item"><strong>群主：</strong><span>{{ room.creator_nickname || room.creator_name }} ({{ room.creator_name }})</span></div>
              <div class="info-item"><strong>剧情背景：</strong><span class="event-bg">{{ room.event_background }}</span></div>
              <div class="info-item"><strong>消息统计：</strong><span>总 {{ room.message_count }} 条（真人 {{ room.player_message_count }} / AI {{ room.ai_message_count }}）</span></div>
              <div class="info-item"><strong>创建时间：</strong><span>{{ formatDate(room.created_at) }}</span></div>
            </div>

            <div v-if="room.members && room.members.length > 0" class="section">
              <h4>👥 真人玩家（{{ room.members.length }}人）</h4>
              <div class="member-list">
                <div v-for="member in room.members" :key="member.user_id" class="member-item">
                  <div class="member-info">
                    <strong>{{ member.nickname }} ({{ member.username }})</strong>
                    <div v-if="member.role_name" class="member-role">角色：{{ member.role_name }}</div>
                    <div v-if="member.role_profile" class="member-profile">人设：{{ member.role_profile }}</div>
                  </div>
                  <span class="joined-time">{{ formatDate(member.joined_at) }}</span>
                </div>
              </div>
            </div>

            <div v-if="room.npcs && room.npcs.length > 0" class="section">
              <h4>🤖 AI角色（{{ room.npcs.length }}个）</h4>
              <div class="npc-list">
                v-for="npc in room.npcs" :key="npc.id" class="npc-item">
                  <div class="npc-name">{{ npc.name }}</div>
                  <div class="npc-profile">{{ npc.profile }}</div>
                </div>
              </div>
            </div>

            <div v-if="room.latest_messages && room.latest_messages.length > 0" class="section">
              <h4>💬 最新消息（最近{{ room.latest_messages.length }}条）</h4>
              <div class="messages-list">
                <div v-for="msg in room.latest_messages" :key="msg.id" class="message-item">
                  <div class="message-header">
                    <strong>{{ msg.sender_name }}</strong>
                    <span class="message-time">{{ formatDate(msg.created_at) }}</span>
                  </div>
                  <div class="message-content">{{ msg.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const data = ref(null)
const loading = ref(true)
const error = ref(null)

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

const refreshData = () => { loadData() }
const goBack = () => { navigateTo('/') }
const formatDate = (dateStr) => { return !dateStr ? '' : new Date(dateStr).toLocaleString('zh-CN') }

onMounted(() => { loadData() })
</script>

<style scoped>
.admin-page { min-height: 100vh; background: #f5f5f5; padding: 2rem; }
.admin-header { background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.admin-header h1 { margin: 0; font-size: 1.5rem; color: #333; }
.admin-actions { display: flex; gap: 1rem; }
.btn-refresh, .btn-back { padding: 0.6rem 1.2rem; border: none; border-radius: 4px; font-size: 0.95rem; cursor: pointer; font-weight: 500; }
.btn-refresh { background: #07c160; color: white; }
.btn-back { background: #576b95; color: white; }
.btn-refresh:hover { background: #06ad56; }
.btn-back:hover { background: #465a7f; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
.stat-card { background: white; padding: 2rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.stat-value { font-size: 3rem; font-weight: bold; color: #07c160; margin-bottom: 0.5rem; }
.stat-label { font-size: 1rem; color: #666; }
.rooms-section { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.rooms-section h2 { margin: 0 0 1.5rem 0; color: #333; font-size: 1.3rem; }
.room-card { border: 1px solid #e5e5e5; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
.room-card:last-child { margin-bottom: 0; }
.room-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid #f0f0f0; }
.room-header h3 { margin: 0; color: #333; font-size: 1.2rem; }
.room-id { font-family: Courier New, monospace; color: #999; font-size: 0.9rem; }
.room-info { margin-bottom: 1.5rem; padding: 1rem; background: #f8f8f8; border-radius: 6px; }
.info-item { margin-bottom: 0.5rem; font-size: 0.9rem; }
.info-item strong { color: #333; margin-right: 0.5rem; }
.event-bg { color: #666; line-height: 1.6; }
.section { margin-bottom: 1.5rem; }
.section h4 { margin: 0 0 1rem 0; color: #333; font-size: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e5e5; }
.member-list { display: flex; flex-direction: column; gap: 0.8rem; }
.member-item { background: #f8f8f8; padding: 1rem; border-radius: 6px; display: flex; justify-content: space-between; align-items: flex-start; }
.member-info strong { display: block; color: #333; margin-bottom: 0.3rem; }
.member-role, .member-profile { font-size: 0.85rem; color: #666; margin-top: 0.3rem; }
.joined-time { font-size: 0.85rem; color: #999; }
.npc-list { display: flex; flex-direction: column; gap: 0.8rem; }
.npc-item { background: # macromogf8f8f8; padding: 1rem; border-radius:  privileged
}

.npc-name { font-weight: 600; color: #333; margin-bottom: 0.3rem; }
.npc-profile { font-size: 0.85rem; color: #666; }
.messages-list { display: flex; flex-direction: column; gap: 0.8rem; }
.message-item { background: #f8f8f8; padding: 1rem; border-radius: 6px; }
.message-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
.message-header strong { color: #333; }
.message-time { font-size: 0.85rem; color: #999; }
.message-content { color: #666; line-height: 1.5; }
.empty { text-align: center; padding: 3rem; color: #999; }
.loading, .error { text-align: center; padding: 3rem; background: white; border-radius: 8px; }
.error { color: #fa5151; }
</style>
