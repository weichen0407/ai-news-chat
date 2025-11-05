<template>
  <div class="test-page">
    <div class="container">
      <h1>🧪 Chat API 测试工具</h1>
      <p class="subtitle">快速创建剧情和NPC，测试chat-api功能</p>
      
      <div class="test-section">
        <h2>📝 选择剧情主题</h2>
        <div class="theme-buttons">
          <button 
            v-for="theme in themes" 
            :key="theme.id"
            @click="createRoom(theme.id)"
            :disabled="loading"
            class="theme-btn"
          >
            <span class="emoji">{{ theme.emoji }}</span>
            <span class="name">{{ theme.name }}</span>
            <span class="desc">{{ theme.desc }}</span>
          </button>
        </div>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>正在创建剧情...</p>
      </div>
      
      <div v-if="result" class="result" :class="result.success ? 'success' : 'error'">
        <h3>{{ result.success ? '✅ 创建成功！' : '❌ 创建失败' }}</h3>
        <div v-if="result.success" class="result-details">
          <p><strong>房间名称:</strong> {{ result.roomName }}</p>
          <p><strong>房间ID:</strong> <code>{{ result.roomId }}</code></p>
          <p><strong>创建的NPC数:</strong> {{ result.npcsCreated }}</p>
          <div class="actions">
            <button @click="goToRoom(result.roomId)" class="btn-primary">
              进入房间 →
            </button>
            <button @click="goToAdmin" class="btn-secondary">
              查看后台 🔍
            </button>
          </div>
        </div>
        <p v-else class="error-msg">{{ result.error }}</p>
      </div>
      
      <div class="info-section">
        <h2>💡 其他测试方法</h2>
        <div class="info-cards">
          <div class="info-card">
            <h3>🗄️ 查看数据库</h3>
            <p>访问管理后台查看所有剧情和NPC</p>
            <button @click="goToAdmin" class="btn-link">打开后台 →</button>
          </div>
          
          <div class="info-card">
            <h3>🔧 运行测试脚本</h3>
            <p>在终端运行以下命令：</p>
            <code class="code-block">node test-chat-api-simple.js</code>
          </div>
          
          <div class="info-card">
            <h3>📖 查看文档</h3>
            <p>完整的API文档位于：</p>
            <code class="code-block">chat-api/README.md</code>
          </div>
        </div>
      </div>
      
      <div class="stats" v-if="stats">
        <h3>📊 当前数据库统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats.rooms }}</div>
            <div class="stat-label">总房间数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.npcs }}</div>
            <div class="stat-label">总NPC数</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const themes = [
  {
    id: '办公室',
    emoji: '💼',
    name: '办公室风云',
    desc: '产品、设计、程序员的日常争论'
  },
  {
    id: '家庭',
    emoji: '🏠',
    name: '家庭聚会',
    desc: '三代人的春节团圆饭'
  },
  {
    id: '校园',
    emoji: '🎓',
    name: '同学群聊',
    desc: '毕业十年后的老同学'
  },
  {
    id: '测试',
    emoji: '🧪',
    name: '快速测试',
    desc: '简单的测试剧情'
  }
];

const loading = ref(false);
const result = ref(null);
const stats = ref(null);

const createRoom = async (theme) => {
  loading.value = true;
  result.value = null;
  
  try {
    const response = await $fetch('/api/test/quick-create', {
      method: 'POST',
      body: { theme }
    });
    
    result.value = response;
    
    // 刷新统计
    await loadStats();
  } catch (error) {
    result.value = {
      success: false,
      error: error.message || '创建失败'
    };
  } finally {
    loading.value = false;
  }
};

const goToRoom = (roomId) => {
  window.location.href = `/room/${roomId}`;
};

const goToAdmin = () => {
  window.location.href = '/admin/database';
};

const loadStats = async () => {
  try {
    const db = await $fetch('/api/admin/database');
    if (db.success) {
      stats.value = {
        rooms: db.data.stats.totalRooms,
        npcs: db.data.rooms.reduce((sum, room) => sum + (room.npcs?.length || 0), 0)
      };
    }
  } catch (error) {
    console.error('加载统计失败:', error);
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.test-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

h1 {
  color: white;
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.subtitle {
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  font-size: 1.1rem;
  margin-bottom: 3rem;
}

.test-section {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.test-section h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.theme-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.theme-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 15px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.theme-btn:hover:not(:disabled) {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.theme-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.theme-btn .emoji {
  font-size: 3rem;
}

.theme-btn .name {
  font-size: 1.1rem;
  font-weight: 600;
}

.theme-btn .desc {
  font-size: 0.9rem;
  opacity: 0.9;
}

.loading {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  margin-bottom: 2rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.result.success {
  border-left: 5px solid #07c160;
}

.result.error {
  border-left: 5px solid #fa5151;
}

.result h3 {
  margin: 0 0 1rem 0;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-details code {
  background: #f5f5f5;
  padding: 0.3rem 0.6rem;
  border-radius: 5px;
  font-family: monospace;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-primary {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  flex: 1;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 1rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: #f0f2ff;
}

.error-msg {
  color: #fa5151;
  margin: 0;
}

.info-section {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.info-section h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-card {
  background: #f7f8fa;
  border-radius: 15px;
  padding: 1.5rem;
}

.info-card h3 {
  margin: 0 0 0.5rem 0;
  color: #667eea;
  font-size: 1.1rem;
}

.info-card p {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.9rem;
}

.code-block {
  display: block;
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 0.8rem;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.85rem;
  overflow-x: auto;
}

.btn-link {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.btn-link:hover {
  background: #5568d3;
}

.stats {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
}

.stats h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.stat-item {
  padding: 1rem;
}

.stat-value {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  color: #999;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
</style>

