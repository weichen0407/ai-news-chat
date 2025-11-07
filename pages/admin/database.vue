<template>
  <div class="admin-database">
    <!-- 顶部导航栏 -->
    <div class="admin-navbar">
      <div class="nav-left">
        <h1>🗄️ 数据库管理</h1>
        <div class="breadcrumb">
          <span @click="$router.push('/admin')">管理后台</span>
          <span class="separator">›</span>
          <span class="current">数据库</span>
        </div>
      </div>
      <div class="nav-right">
        <button @click="refreshData" class="btn btn-refresh" :disabled="loading">
          <span v-if="loading">🔄 加载中...</span>
          <span v-else>🔄 刷新数据</span>
        </button>
        <button @click="exportData" class="btn btn-export">
          📥 导出数据
        </button>
        <button @click="$router.push('/admin')" class="btn btn-back">
          ← 返回
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载数据...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="refreshData" class="btn btn-primary">重试</button>
    </div>

    <!-- 主内容 -->
    <div v-else class="admin-container">
      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="stat-card" v-for="stat in stats" :key="stat.key">
          <div class="stat-icon">{{ stat.icon }}</div>
          <div class="stat-info">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-trend" v-if="stat.trend">{{ stat.trend }}</div>
          </div>
        </div>
      </div>

      <!-- 标签页导航 -->
      <div class="tabs-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-btn', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
          <span class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- 标签页内容 -->
      <div class="tab-content">
        <!-- 搜索和过滤栏 -->
        <div class="filters-bar">
          <div class="search-box">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="`搜索${tabs.find(t => t.key === activeTab)?.label}...`"
              @input="handleSearch"
            />
            <span class="search-icon">🔍</span>
          </div>
          <div class="filter-actions">
            <select v-model="sortBy" @change="handleSort" class="filter-select">
              <option value="created_at_desc">最新创建</option>
              <option value="created_at_asc">最早创建</option>
              <option value="id_desc">ID降序</option>
              <option value="id_asc">ID升序</option>
            </select>
            <button @click="clearFilters" class="btn btn-secondary">
              清除筛选
            </button>
          </div>
        </div>

        <!-- 用户数据表 -->
        <div v-if="activeTab === 'users'" class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>用户名</th>
                <th>昵称</th>
                <th>头像</th>
                <th>注册时间</th>
                <th>房间数</th>
                <th>消息数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>{{ user.id }}</td>
                <td><code>{{ user.username }}</code></td>
                <td>{{ user.nickname }}</td>
                <td>
                  <img v-if="user.avatar" :src="user.avatar" class="avatar-thumb" />
                  <span v-else>-</span>
                </td>
                <td>{{ formatDate(user.created_at) }}</td>
                <td>{{ user.room_count || 0 }}</td>
                <td>{{ user.message_count || 0 }}</td>
                <td>
                  <button @click="viewDetails('user', user)" class="btn-action">查看</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredUsers.length === 0" class="empty-state">
            <p>📭 暂无数据</p>
          </div>
        </div>

        <!-- 房间数据表 -->
        <div v-if="activeTab === 'rooms'" class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>房间ID</th>
                <th>房间名称</th>
                <th>描述</th>
                <th>群主</th>
                <th>成员数</th>
                <th>NPC数</th>
                <th>消息数</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="room in filteredRooms" :key="room.id">
                <td><code>{{ room.id }}</code></td>
                <td>
                  <div class="room-name">
                    <span class="room-avatar">{{ room.avatar || '💬' }}</span>
                    {{ room.name }}
                  </div>
                </td>
                <td>
                  <span class="truncate">{{ truncate(room.description, 30) }}</span>
                </td>
                <td>{{ room.creator_nickname || room.creator_name }}</td>
                <td>{{ room.member_count || 0 }}</td>
                <td>{{ room.npc_count || 0 }}</td>
                <td>{{ room.message_count || 0 }}</td>
                <td>{{ formatDate(room.created_at) }}</td>
                <td>
                  <button @click="viewDetails('room', room)" class="btn-action">查看</button>
                  <button @click="$router.push(`/room/${room.id}`)" class="btn-action">进入</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredRooms.length === 0" class="empty-state">
            <p>📭 暂无数据</p>
          </div>
        </div>

        <!-- NPC数据表 -->
        <div v-if="activeTab === 'npcs'" class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>名称</th>
                <th>头像</th>
                <th>所属房间</th>
                <th>人设简介</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="npc in filteredNpcs" :key="npc.id">
                <td>{{ npc.id }}</td>
                <td>{{ npc.name }}</td>
                <td><span class="npc-avatar">{{ npc.avatar || '🤖' }}</span></td>
                <td>
                  <code>{{ npc.room_id }}</code><br>
                  <small>{{ npc.room_name }}</small>
                </td>
                <td>
                  <span class="truncate">{{ truncate(npc.profile, 40) }}</span>
                </td>
                <td>{{ formatDate(npc.created_at) }}</td>
                <td>
                  <button @click="viewDetails('npc', npc)" class="btn-action">查看</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredNpcs.length === 0" class="empty-state">
            <p>📭 暂无数据</p>
          </div>
        </div>

        <!-- 消息数据表 -->
        <div v-if="activeTab === 'messages'" class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>房间</th>
                <th>发送者</th>
                <th>类型</th>
                <th>内容</th>
                <th>发送时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="msg in filteredMessages" :key="msg.id">
                <td>{{ msg.id }}</td>
                <td>
                  <code>{{ msg.room_id }}</code><br>
                  <small>{{ msg.room_name }}</small>
                </td>
                <td>{{ msg.sender_name }}</td>
                <td>
                  <span :class="['type-badge', msg.sender_type]">
                    {{ msg.sender_type === 'user' ? '👤 玩家' : '🤖 NPC' }}
                  </span>
                </td>
                <td>
                  <div class="message-content">{{ truncate(msg.content, 50) }}</div>
                </td>
                <td>{{ formatDate(msg.created_at) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredMessages.length === 0" class="empty-state">
            <p>📭 暂无数据</p>
          </div>
        </div>

        <!-- 朋友圈数据表 -->
        <div v-if="activeTab === 'moments'" class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>发布者</th>
                <th>类型</th>
                <th>房间</th>
                <th>内容</th>
                <th>点赞数</th>
                <th>评论数</th>
                <th>发布时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="moment in filteredMoments" :key="moment.id">
                <td>{{ moment.id }}</td>
                <td>{{ moment.author_name || '未知' }}</td>
                <td>
                  <span :class="['type-badge', moment.user_id ? 'user' : 'npc']">
                    {{ moment.user_id ? '👤 玩家' : '🤖 NPC' }}
                  </span>
                </td>
                <td><code>{{ moment.room_id || '全局' }}</code></td>
                <td>
                  <div class="moment-content">{{ truncate(moment.content, 60) }}</div>
                </td>
                <td>{{ moment.like_count || 0 }}</td>
                <td>{{ moment.comment_count || 0 }}</td>
                <td>{{ formatDate(moment.created_at) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredMoments.length === 0" class="empty-state">
            <p>📭 暂无数据</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetails">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ detailsTitle }}</h3>
          <button @click="closeDetails" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <pre>{{ JSON.stringify(selectedItem, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 状态
const loading = ref(true)
const error = ref(null)
const data = ref(null)
const activeTab = ref('users')
const searchQuery = ref('')
const sortBy = ref('created_at_desc')
const showDetailsModal = ref(false)
const selectedItem = ref(null)
const detailsTitle = ref('')

// 标签页配置
const tabs = computed(() => [
  { key: 'users', label: '用户', icon: '👤', count: data.value?.users?.length || 0 },
  { key: 'rooms', label: '房间', icon: '💬', count: data.value?.rooms?.length || 0 },
  { key: 'npcs', label: 'NPC', icon: '🤖', count: data.value?.npcs?.length || 0 },
  { key: 'messages', label: '消息', icon: '💭', count: data.value?.messages?.length || 0 },
  { key: 'moments', label: '朋友圈', icon: '📸', count: data.value?.moments?.length || 0 },
])

// 统计数据
const stats = computed(() => [
  {
    key: 'users',
    icon: '👥',
    label: '总用户数',
    value: data.value?.stats?.totalUsers || 0,
  },
  {
    key: 'rooms',
    icon: '🏠',
    label: '总房间数',
    value: data.value?.stats?.totalRooms || 0,
  },
  {
    key: 'messages',
    icon: '💬',
    label: '总消息数',
    value: data.value?.stats?.totalMessages || 0,
  },
  {
    key: 'moments',
    icon: '📷',
    label: '朋友圈数',
    value: data.value?.stats?.totalMoments || 0,
  },
])

// 过滤后的数据
const filteredUsers = computed(() => {
  if (!data.value?.users) return []
  return filterAndSort(data.value.users, ['username', 'nickname'])
})

const filteredRooms = computed(() => {
  if (!data.value?.rooms) return []
  return filterAndSort(data.value.rooms, ['id', 'name', 'description'])
})

const filteredNpcs = computed(() => {
  if (!data.value?.npcs) return []
  return filterAndSort(data.value.npcs, ['name', 'profile', 'room_id'])
})

const filteredMessages = computed(() => {
  if (!data.value?.messages) return []
  return filterAndSort(data.value.messages, ['sender_name', 'content', 'room_id'])
})

const filteredMoments = computed(() => {
  if (!data.value?.moments) return []
  return filterAndSort(data.value.moments, ['content'])
})

// 加载数据
const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await $fetch('/api/admin/database/all')
    if (response.success) {
      data.value = response.data
    } else {
      error.value = response.error || '加载失败'
    }
  } catch (err) {
    console.error('加载数据失败:', err)
    error.value = '加载失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}

// 过滤和排序
const filterAndSort = (items, searchFields) => {
  let filtered = items

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      searchFields.some(field => {
        const value = item[field]
        return value && String(value).toLowerCase().includes(query)
      })
    )
  }

  // 排序
  const [field, order] = sortBy.value.split('_')
  filtered = [...filtered].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]
    if (order === 'desc') {
      return bVal > aVal ? 1 : -1
    } else {
      return aVal > bVal ? 1 : -1
    }
  })

  return filtered
}

// 工具函数
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const truncate = (text, length) => {
  if (!text) return '-'
  return text.length > length ? text.substring(0, length) + '...' : text
}

const refreshData = () => {
  loadData()
}

const clearFilters = () => {
  searchQuery.value = ''
  sortBy.value = 'created_at_desc'
}

const handleSearch = () => {
  // 搜索逻辑由 computed 自动处理
}

const handleSort = () => {
  // 排序逻辑由 computed 自动处理
}

const viewDetails = (type, item) => {
  selectedItem.value = item
  detailsTitle.value = `${type.toUpperCase()} 详情`
  showDetailsModal.value = true
}

const closeDetails = () => {
  showDetailsModal.value = false
  selectedItem.value = null
}

const exportData = () => {
  if (!data.value) return
  const dataStr = JSON.stringify(data.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `database-export-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-database {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 2rem;
}

/* 顶部导航栏 */
.admin-navbar {
  background: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.nav-left h1 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  color: #333;
}

.breadcrumb {
  font-size: 0.875rem;
  color: #666;
}

.breadcrumb span {
  cursor: pointer;
}

.breadcrumb .separator {
  margin: 0 0.5rem;
  cursor: default;
}

.breadcrumb .current {
  color: #667eea;
  font-weight: 500;
}

.nav-right {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-refresh {
  background: #07c160;
  color: white;
}

.btn-refresh:hover:not(:disabled) {
  background: #06ad56;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-export {
  background: #1890ff;
  color: white;
}

.btn-export:hover {
  background: #0b7dda;
}

.btn-back {
  background: #666;
  color: white;
}

.btn-back:hover {
  background: #555;
}

/* 加载状态 */
.loading-container, .error-container {
  text-align: center;
  padding: 4rem 2rem;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container {
  background: white;
  margin: 2rem;
  padding: 3rem;
  border-radius: 8px;
  color: #333;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* 主容器 */
.admin-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* 统计概览 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}

/* 标签页 */
.tabs-nav {
  background: white;
  border-radius: 12px;
  padding: 0.5rem;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow-x: auto;
}

.tab-btn {
  flex: 1;
  min-width: 150px;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.tab-btn:hover {
  background: #f5f5f5;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tab-icon {
  font-size: 1.25rem;
}

.tab-count {
  background: rgba(0,0,0,0.1);
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tab-btn.active .tab-count {
  background: rgba(255,255,255,0.2);
}

/* 标签内容 */
.tab-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 过滤栏 */
.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 200px;
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.875rem;
}

.search-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e5e5e5;
}

/* 数据表格 */
.data-table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table thead {
  background: #f8f9fa;
}

.data-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e9ecef;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.data-table tbody tr:hover {
  background: #f8f9fa;
}

.data-table code {
  background: #f1f3f5;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #495057;
}

.avatar-thumb {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.room-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.room-avatar, .npc-avatar {
  font-size: 1.5rem;
}

.type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.type-badge.user {
  background: #e3f2fd;
  color: #1976d2;
}

.type-badge.npc {
  background: #f3e5f5;
  color: #7b1fa2;
}

.message-content, .moment-content {
  max-width: 400px;
  word-break: break-word;
}

.truncate {
  display: block;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-action {
  padding: 0.375rem 0.75rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  margin-right: 0.25rem;
  transition: all 0.2s;
}

.btn-action:hover {
  background: #f8f9fa;
  border-color: #667eea;
  color: #667eea;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.empty-state p {
  font-size: 1.25rem;
}

/* 详情弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-close:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-body pre {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.6;
}

/* 响应式 */
@media (max-width: 768px) {
  .admin-navbar {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-right {
    width: 100%;
    justify-content: space-between;
  }

  .stats-overview {
    grid-template-columns: 1fr;
  }

  .tabs-nav {
    overflow-x: auto;
  }

  .tab-btn {
    min-width: 120px;
  }

  .filters-bar {
    flex-direction: column;
  }

  .data-table {
    font-size: 0.75rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem;
  }
}
</style>
