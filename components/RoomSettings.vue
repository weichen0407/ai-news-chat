<template>
  <div class="settings-content">
    <div class="info-section">
      <h3>房间信息</h3>
      <div class="info-item">
        <label>房间ID</label>
        <div class="room-id-display">
          <code>{{ roomId }}</code>
          <button @click="copyRoomId" class="btn-copy">复制</button>
        </div>
      </div>
      <p class="hint">分享此ID让其他人加入群聊</p>
    </div>

    <div class="members-section">
      <h3>成员列表（{{ members.length }}人）</h3>
      <div class="members-list">
        <div v-for="member in members" :key="member.id" class="member-item">
          <img :src="member.avatar || '/avatars/placeholder.svg'" class="member-avatar" />
          <div class="member-info">
            <div class="member-name">{{ member.nickname }}</div>
            <div class="member-role">{{ member.role_name || '玩家' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="npcs-section">
      <h3>NPC列表（{{ npcs.length }}个）</h3>
      <div class="npcs-list">
        <div v-for="npc in npcs" :key="npc.id" class="npc-item">
          <img :src="npc.avatar || '/avatars/placeholder.svg'" class="npc-avatar" />
          <div class="npc-info">
            <div class="npc-name">{{ npc.name }}</div>
            <div class="npc-profile">{{ npc.profile }}</div>
          </div>
        </div>
      </div>
    </div>

    <button @click="$emit('close')" class="btn-close">
      关闭
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  roomId: String
})

const emit = defineEmits(['close'])

const members = ref([])
const npcs = ref([])

onMounted(async () => {
  await loadRoomInfo()
})

const loadRoomInfo = async () => {
  try {
    const response = await $fetch(`/api/rooms/${props.roomId}/info`)
    if (response.success) {
      members.value = response.members
      npcs.value = response.npcs
    }
  } catch (error) {
    console.error('加载房间信息失败:', error)
  }
}

const copyRoomId = () => {
  navigator.clipboard.writeText(props.roomId)
  alert('房间ID已复制到剪贴板')
}
</script>

<style scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-section,
.members-section,
.npcs-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.hint {
  font-size: 0.9rem;
  color: #999;
  margin: -0.5rem 0 0 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item label {
  font-weight: 600;
  color: #666;
}

.room-id-display {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.room-id-display code {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  letter-spacing: 2px;
  background: #f0f2ff;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.btn-copy {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}

.members-list,
.npcs-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.member-item,
.npc-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
}

.member-avatar,
.npc-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.member-info,
.npc-info {
  flex: 1;
}

.member-name,
.npc-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.member-role,
.npc-profile {
  font-size: 0.9rem;
  color: #666;
}

.btn-close {
  width: 100%;
  padding: 1rem;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
}
</style>

