<template>
  <div class="viewport">
    <div :class="['edit-container', { fullscreen: isFullscreen }]">
      <!-- 顶部导航 -->
      <div class="edit-header">
        <button @click="goBack" class="btn-back">← 返回</button>
        <h1>⚙️ 群聊设置</h1>
        <div class="header-actions">
          <button @click="toggleViewMode" class="btn-view-mode" :title="isFullscreen ? '手机模式' : '全屏模式'">
            {{ isFullscreen ? '📱' : '🖥️' }}
          </button>
          <button @click="saveSettings" class="btn-save" :disabled="saving">
            {{ saving ? '保存中...' : '💾 保存' }}
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 主要内容 -->
      <div v-else-if="roomData" class="edit-content">
        <!-- 基本信息 -->
        <section class="edit-section">
          <h2>📝 基本信息</h2>
          
          <div class="form-group">
            <label>群聊名称</label>
            <input v-model="roomData.name" type="text" class="input" placeholder="输入群聊名称" />
          </div>
          
          <div class="form-group">
            <label>群聊描述</label>
            <textarea v-model="roomData.description" rows="2" class="textarea" placeholder="简单描述这个群聊"></textarea>
          </div>
          
          <div class="form-group">
            <label>事件背景（主导剧情）</label>
            <textarea 
              v-model="roomData.event_background" 
              rows="5" 
              class="textarea"
              placeholder="描述故事背景和主要剧情线，例如：一群人因某个事件产生了矛盾..."
            ></textarea>
          </div>
        </section>

        <!-- 自动对话设置 -->
        <section class="edit-section">
          <h2>🤖 自动对话设置</h2>
          
          <div class="form-group">
            <label>对话密度（控制AI自动对话频率）</label>
            <div class="density-selector">
              <button 
                @click="roomData.dialogue_density = 1"
                :class="['density-btn', { active: roomData.dialogue_density === 1 }]"
              >
                低
              </button>
              <button 
                @click="roomData.dialogue_density = 2"
                :class="['density-btn', { active: roomData.dialogue_density === 2 }]"
              >
                中
              </button>
              <button 
                @click="roomData.dialogue_density = 3"
                :class="['density-btn', { active: roomData.dialogue_density === 3 }]"
              >
                高
              </button>
              <button 
                @click="roomData.dialogue_density = 4"
                :class="['density-btn', { active: roomData.dialogue_density === 4 }]"
              >
                极高
              </button>
            </div>
            <p class="hint">{{ getDensityDescription() }}</p>
          </div>
          
          <div class="form-group">
            <label>剧情推动</label>
            <button @click="triggerPlot" class="btn-trigger" :disabled="triggering">
              {{ triggering ? '生成中...' : '🎬 立即推动剧情' }}
            </button>
            <p class="hint">AI会根据当前情况生成2-4条对话推动剧情发展</p>
          </div>
        </section>

        <!-- NPC管理 -->
        <section class="edit-section">
          <h2>👥 NPC角色管理</h2>
          
          <div v-for="(npc, index) in npcs" :key="npc.id || index" class="npc-card">
            <div class="npc-info">
              <img :src="npc.avatar || '/avatars/placeholder.svg'" class="npc-avatar" />
              <div class="npc-details">
                <h3>{{ npc.name }}</h3>
                <textarea 
                  v-model="npc.persona" 
                  rows="3" 
                  class="textarea"
                  placeholder="描述角色性格、背景、目标..."
                ></textarea>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 错误状态 -->
      <div v-else class="error-state">
        <p>❌ 加载失败</p>
        <button @click="loadRoomData" class="btn-retry">重试</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const roomId = route.params.id

const roomData = ref(null)
const npcs = ref([])
const loading = ref(true)
const saving = ref(false)
const triggering = ref(false)
const isFullscreen = ref(true)

onMounted(async () => {
  console.log('📝 编辑页面加载，roomId:', roomId)
  await loadRoomData()
})

const loadRoomData = async () => {
  loading.value = true
  try {
    console.log('📝 正在加载房间数据...')
    const response = await $fetch(`/api/rooms/${roomId}/info`)
    console.log('📝 API响应:', response)
    
    if (response.success) {
      // 检查权限
      if (!response.isCreator) {
        alert('只有群主才能编辑房间设置')
        window.location.href = `/room/${roomId}`
        return
      }
      
      roomData.value = response.room
      npcs.value = response.npcs || []
      
      // 设置默认值
      if (!roomData.value.dialogue_density) {
        roomData.value.dialogue_density = 2
      }
      
      console.log('✅ 数据加载成功')
    } else {
      console.error('❌ 加载失败:', response.error)
      alert('加载失败: ' + response.error)
    }
  } catch (error) {
    console.error('❌ 异常:', error)
    alert('加载房间数据时出错')
  } finally {
    loading.value = false
  }
}

const getDensityDescription = () => {
  const density = roomData.value?.dialogue_density || 2
  const descriptions = {
    1: '低频率：每60秒左右生成对话',
    2: '中频率：每40秒左右生成对话',
    3: '高频率：每25秒左右生成对话',
    4: '极高频率：每15秒左右生成对话'
  }
  return descriptions[density] || descriptions[2]
}

const saveSettings = async () => {
  if (saving.value) return
  
  saving.value = true
  try {
    const response = await $fetch(`/api/rooms/${roomId}/update`, {
      method: 'POST',
      body: {
        name: roomData.value.name,
        description: roomData.value.description,
        event_background: roomData.value.event_background,
        dialogue_density: roomData.value.dialogue_density,
        npcs: npcs.value
      }
    })
    
    if (response.success) {
      alert('✅ 保存成功！')
    } else {
      alert('保存失败: ' + response.error)
    }
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存时出错')
  } finally {
    saving.value = false
  }
}

const triggerPlot = async () => {
  if (triggering.value) return
  
  triggering.value = true
  try {
    const response = await $fetch('/api/messages/auto-generate', {
      method: 'POST',
      body: {
        roomId: roomId,
        rounds: 1
      }
    })
    
    if (response.success) {
      alert(`✅ 已生成 ${response.messageCount} 条对话！`)
    } else {
      alert('生成失败: ' + response.error)
    }
  } catch (error) {
    console.error('生成失败:', error)
    alert('生成剧情时出错')
  } finally {
    triggering.value = false
  }
}

const toggleViewMode = () => {
  isFullscreen.value = !isFullscreen.value
}

const goBack = () => {
  window.location.href = `/room/${roomId}`
}
</script>

<style scoped>
.viewport {
  min-height: 100vh;
  background: #1a1a1a;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.edit-container {
  width: 100%;
  max-width: 420px;
  height: 90vh;
  max-height: 844px;
  background: #F5F5F5;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.edit-container.fullscreen {
  max-width: 100%;
  max-height: 100%;
  height: 100vh;
  border-radius: 0;
  box-shadow: none;
}

.edit-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.edit-header h1 {
  flex: 1;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-back, .btn-view-mode {
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.2);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-back:hover, .btn-view-mode:hover {
  background: rgba(255,255,255,0.3);
}

.btn-save {
  padding: 0.5rem 1.2rem;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state, .error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #E0E0E0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-retry {
  padding: 0.8rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.edit-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.edit-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.edit-section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
}

.input, .textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #DDD;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
}

.input:focus, .textarea:focus {
  outline: none;
  border-color: #667eea;
}

.density-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.density-btn {
  padding: 0.8rem;
  background: #F5F5F5;
  border: 2px solid #DDD;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.density-btn:hover {
  background: #E0E0E0;
}

.density-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.hint {
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  color: #888;
}

.btn-trigger {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-trigger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-trigger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.npc-card {
  background: #F9F9F9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.npc-card:last-child {
  margin-bottom: 0;
}

.npc-info {
  display: flex;
  gap: 1rem;
}

.npc-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.npc-details {
  flex: 1;
}

.npc-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
}

@media (max-width: 768px) {
  .viewport {
    padding: 0;
  }
  
  .edit-container {
    max-width: 100%;
    max-height: 100vh;
    height: 100vh;
    border-radius: 0;
  }
}
</style>
