<template>
  <form @submit.prevent="handleSubmit" class="create-room-form">
    <div class="form-section">
      <h3>基本信息</h3>
      
      <div class="form-group">
        <label>群聊名称 *</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="例如：王宝强事件群聊"
          required
          class="input"
        />
      </div>
      
      <div class="form-group">
        <label>群聊描述</label>
        <textarea
          v-model="form.description"
          placeholder="简单描述一下这个群聊..."
          rows="2"
          class="textarea"
        ></textarea>
      </div>
      
      <div class="form-group">
        <label>事件背景 *</label>
        <textarea
          v-model="form.eventBackground"
          placeholder="描述这个故事的背景和事件..."
          rows="4"
          required
          class="textarea"
        ></textarea>
      </div>
    </div>

    <div class="form-section">
      <h3>NPC角色设置</h3>
      <p class="hint">添加AI控制的角色</p>
      
      <div
        v-for="(npc, index) in form.npcs"
        :key="index"
        class="npc-item"
      >
        <div class="npc-header">
          <h4>NPC {{ index + 1 }}</h4>
          <button
            type="button"
            @click="removeNPC(index)"
            class="btn-remove"
            v-if="form.npcs.length > 1"
          >
            ✕
          </button>
        </div>
        
        <div class="npc-avatar-upload">
          <img
            :src="npc.avatar || '/avatars/placeholder.svg'"
            alt="NPC头像"
            class="npc-avatar-preview"
          />
          <label class="btn-upload-avatar">
            上传头像
            <input
              type="file"
              accept="image/*"
              @change="(e) => uploadNPCAvatar(e, index)"
              hidden
            />
          </label>
        </div>
        
        <div class="form-group">
          <label>角色名称 *</label>
          <input
            v-model="npc.name"
            type="text"
            placeholder="例如：王宝强"
            required
            class="input"
          />
        </div>
        
        <div class="form-group">
          <label>角色人设 *</label>
          <textarea
            v-model="npc.profile"
            placeholder="描述角色的性格、目标等..."
            rows="3"
            required
            class="textarea"
          ></textarea>
        </div>
      </div>
      
      <button
        type="button"
        @click="addNPC"
        class="btn-add-npc"
        v-if="form.npcs.length < 10"
      >
        ➕ 添加NPC
      </button>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>

    <div class="form-actions">
      <button type="button" @click="$emit('cancel')" class="btn-cancel">
        取消
      </button>
      <button type="submit" class="btn-submit" :disabled="loading">
        {{ loading ? '创建中...' : '创建群聊' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['created', 'cancel'])

const form = ref({
  name: '',
  description: '',
  eventBackground: '',
  npcs: [
    { name: '', profile: '', avatar: '' }
  ]
})

const loading = ref(false)
const error = ref('')

const addNPC = () => {
  form.value.npcs.push({ name: '', profile: '', avatar: '' })
}

const removeNPC = (index) => {
  form.value.npcs.splice(index, 1)
}

const uploadNPCAvatar = (event, index) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      form.value.npcs[index].avatar = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const handleSubmit = async () => {
  error.value = ''
  
  // 验证NPC
  const validNPCs = form.value.npcs.filter(npc => npc.name && npc.profile)
  if (validNPCs.length === 0) {
    error.value = '至少需要一个完整的NPC'
    return
  }
  
  loading.value = true
  
  try {
    const response = await $fetch('/api/rooms/create', {
      method: 'POST',
      body: {
        name: form.value.name,
        description: form.value.description,
        eventBackground: form.value.eventBackground,
        npcs: validNPCs
      }
    })
    
    if (response.success) {
      emit('created', response.roomId)
    } else {
      error.value = response.error || '创建失败'
    }
  } catch (err) {
    error.value = '网络错误，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-room-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.hint {
  color: #999;
  font-size: 0.9rem;
  margin: -0.5rem 0 0 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #333;
}

.input,
.textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: #667eea;
}

.textarea {
  resize: vertical;
}

.npc-item {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.npc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.npc-header h4 {
  margin: 0;
  color: #667eea;
}

.btn-remove {
  background: #ff6b6b;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.npc-avatar-upload {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.npc-avatar-preview {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ddd;
}

.btn-upload-avatar {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-add-npc {
  padding: 1rem;
  background: white;
  border: 2px dashed #667eea;
  border-radius: 10px;
  color: #667eea;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-add-npc:hover {
  background: #f0f2ff;
}

.error-msg {
  padding: 0.75rem;
  background: #fee;
  border: 2px solid #fcc;
  border-radius: 10px;
  color: #c33;
  text-align: center;
}

.form-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel,
.btn-submit {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

