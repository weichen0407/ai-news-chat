<template>
  <div class="admin-page">
    <div class="admin-container">
      <!-- 头部 -->
      <div class="admin-header">
        <h1>🎛️ 管理后台</h1>
        <div class="header-actions-right">
          <span class="user-info">👤 {{ currentUser }}</span>
          <button @click="logout" class="btn-logout">🚪 退出</button>
          <button @click="goBack" class="btn-back">← 返回</button>
        </div>
      </div>

      <!-- Tab导航 -->
      <div class="admin-tabs">
        <button 
          :class="['tab-btn', { active: currentTab === 'control' }]"
          @click="currentTab = 'control'"
        >
          🎛️ 智能控制
        </button>
        <button 
          :class="['tab-btn', { active: currentTab === 'rooms' }]"
          @click="currentTab = 'rooms'"
        >
          💬 群聊管理
        </button>
        <button 
          :class="['tab-btn', { active: currentTab === 'npcs' }]"
          @click="currentTab = 'npcs'"
        >
          🤖 NPC管理
        </button>
        <button 
          :class="['tab-btn', { active: currentTab === 'moments' }]"
          @click="currentTab = 'moments'"
        >
          🎭 朋友圈管理
        </button>
      </div>

      <!-- 智能控制 -->
      <div v-show="currentTab === 'control'" class="tab-content">
        <!-- 总览卡片 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>📊 实时监控</h2>
            <button @click="fetchControlStats" class="btn-refresh">🔄 刷新</button>
          </div>
          <div class="card-body">
            <div class="stats-overview">
              <div class="stat-box">
                <div class="stat-icon">🔢</div>
                <div class="stat-details">
                  <div class="stat-label">Token 使用</div>
                  <div class="stat-value">{{ controlStats.tokenUsed.toLocaleString() }}</div>
                  <div class="stat-sub">/ {{ controlStats.tokenLimit.toLocaleString() }}</div>
                </div>
              </div>
              
              <div class="stat-box">
                <div class="stat-icon">📈</div>
                <div class="stat-details">
                  <div class="stat-label">使用率</div>
                  <div class="stat-value" :class="getUsageClass(controlStats.tokenUsagePercent)">
                    {{ controlStats.tokenUsagePercent.toFixed(1) }}%
                  </div>
                  <div class="stat-sub">今日剩余: {{ controlStats.tokenRemaining.toLocaleString() }}</div>
                </div>
              </div>
              
              <div class="stat-box">
                <div class="stat-icon">💬</div>
                <div class="stat-details">
                  <div class="stat-label">生成对话</div>
                  <div class="stat-value">{{ controlStats.messagesGenerated }}</div>
                  <div class="stat-sub">条</div>
                </div>
              </div>
              
              <div class="stat-box">
                <div class="stat-icon">🎭</div>
                <div class="stat-details">
                  <div class="stat-label">生成朋友圈</div>
                  <div class="stat-value">{{ controlStats.momentsGenerated }}</div>
                  <div class="stat-sub">条</div>
                </div>
              </div>
            </div>
            
            <!-- Token使用进度条 -->
            <div class="progress-section">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :class="getUsageClass(controlStats.tokenUsagePercent)"
                  :style="{ width: Math.min(100, controlStats.tokenUsagePercent) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 全局控制 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>⚙️ 全局控制</h2>
            <span class="status-badge" :class="controlConfig.globalAutoEnabled ? 'status-running' : 'status-idle'">
              {{ controlConfig.globalAutoEnabled ? '✅ 运行中' : '⏸️ 已停止' }}
            </span>
          </div>
          <div class="card-body">
            <div class="control-grid">
              <!-- 全局开关 -->
              <div class="control-item">
                <div class="control-label">
                  <span class="label-icon">🔘</span>
                  <span class="label-text">全局自动化开关</span>
                </div>
                <label class="switch-label">
                  <input 
                    type="checkbox" 
                    :checked="controlConfig.globalAutoEnabled"
                    @change="toggleGlobalAuto"
                    class="switch-input"
                  />
                  <span class="switch-slider"></span>
                </label>
                <p class="control-hint">关闭后，所有自动生成功能将停止</p>
              </div>

              <!-- 紧急停止按钮 -->
              <div class="control-item emergency-control">
                <button 
                  @click="emergencyStop" 
                  class="btn-emergency"
                  :disabled="!controlConfig.globalAutoEnabled"
                >
                  🚨 紧急停止所有自动化
                </button>
                <p class="control-hint danger">立即停止所有房间的自动对话和朋友圈生成</p>
              </div>

              <!-- Token限制 -->
              <div class="control-item">
                <div class="control-label">
                  <span class="label-icon">💰</span>
                  <span class="label-text">每日Token限制</span>
                </div>
                <input 
                  v-model.number="controlConfig.dailyTokenLimit"
                  type="number"
                  min="1000"
                  max="1000000"
                  step="1000"
                  class="form-input"
                  @blur="saveControlConfig"
                />
                <p class="control-hint">达到限制后，自动生成将停止</p>
              </div>

              <!-- 时间范围 -->
              <div class="control-item">
                <div class="control-label">
                  <span class="label-icon">⏰</span>
                  <span class="label-text">允许运行时间</span>
                </div>
                <div class="time-range">
                  <input 
                    v-model.number="controlConfig.allowedHours.start"
                    type="number"
                    min="0"
                    max="23"
                    class="form-input-small"
                    @blur="saveControlConfig"
                  />
                  <span>:00 至</span>
                  <input 
                    v-model.number="controlConfig.allowedHours.end"
                    type="number"
                    min="0"
                    max="24"
                    class="form-input-small"
                    @blur="saveControlConfig"
                  />
                  <span>:00</span>
                </div>
                <p class="control-hint">只在指定时间段内自动生成</p>
              </div>

              <!-- 在线用户检测 -->
              <div class="control-item">
                <div class="control-label">
                  <span class="label-icon">👥</span>
                  <span class="label-text">需要在线用户</span>
                </div>
                <label class="switch-label">
                  <input 
                    type="checkbox" 
                    :checked="controlConfig.requireOnlineUsers"
                    @change="toggleOnlineCheck"
                    class="switch-input"
                  />
                  <span class="switch-slider"></span>
                </label>
                <p class="control-hint">开启后，只在有用户在线时生成（暂未实现）</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 朋友圈自动化控制 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>🎭 朋友圈自动化</h2>
            <span class="status-badge" :class="momentsAutoRunning ? 'status-running' : 'status-idle'">
              {{ momentsAutoRunning ? '✅ 运行中' : '⏸️ 已停止' }}
            </span>
          </div>
          <div class="card-body">
            <div class="moments-auto-grid">
              <!-- 发帖控制 -->
              <div class="moments-control-section">
                <h3 class="section-title">📝 自动发帖</h3>
                <div class="control-form">
                  <div class="form-row-compact">
                    <label class="form-label">发帖间隔（秒）：</label>
                    <input 
                      v-model.number="momentsPostInterval"
                      type="number"
                      min="10"
                      max="3600"
                      step="10"
                      class="form-input-number"
                      placeholder="如：60"
                    />
                    <span class="input-hint">建议：60-300秒</span>
                  </div>
                  
                  <div class="stats-row">
                    <span class="stat-item">
                      <span class="stat-label">运行时长：</span>
                      <span class="stat-value">{{ momentsRunTime }}</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-label">已发帖：</span>
                      <span class="stat-value">{{ momentsStats.posts }}</span>
                    </span>
                  </div>
                  
                  <button 
                    @click="toggleMomentsPost" 
                    :class="['btn-toggle', momentsPostRunning ? 'btn-danger' : 'btn-success']"
                    :disabled="!momentsPostInterval || momentsPostInterval < 10"
                  >
                    {{ momentsPostRunning ? '⏸️ 停止发帖' : '▶️ 启动发帖' }}
                  </button>
                </div>
              </div>

              <!-- 评论控制 -->
              <div class="moments-control-section">
                <h3 class="section-title">💬 自动评论</h3>
                <div class="control-form">
                  <div class="form-row-compact">
                    <label class="form-label">评论间隔（秒）：</label>
                    <input 
                      v-model.number="momentsCommentInterval"
                      type="number"
                      min="5"
                      max="1800"
                      step="5"
                      class="form-input-number"
                      placeholder="如：30"
                    />
                    <span class="input-hint">建议：20-120秒</span>
                  </div>
                  
                  <div class="stats-row">
                    <span class="stat-item">
                      <span class="stat-label">运行时长：</span>
                      <span class="stat-value">{{ momentsRunTime }}</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-label">已评论：</span>
                      <span class="stat-value">{{ momentsStats.comments }}</span>
                    </span>
                  </div>
                  
                  <button 
                    @click="toggleMomentsComment" 
                    :class="['btn-toggle', momentsCommentRunning ? 'btn-danger' : 'btn-success']"
                    :disabled="!momentsCommentInterval || momentsCommentInterval < 5"
                  >
                    {{ momentsCommentRunning ? '⏸️ 停止评论' : '▶️ 启动评论' }}
                  </button>
                </div>
              </div>

              <!-- 一键控制 -->
              <div class="moments-control-section full-width">
                <h3 class="section-title">⚡ 一键控制</h3>
                <div class="quick-actions">
                  <button 
                    @click="startAllMomentsAuto" 
                    class="btn-quick btn-success-outline"
                    :disabled="momentsAutoRunning || !momentsPostInterval || !momentsCommentInterval"
                  >
                    🚀 启动全部
                  </button>
                  <button 
                    @click="stopAllMomentsAuto" 
                    class="btn-quick btn-danger-outline"
                    :disabled="!momentsAutoRunning"
                  >
                    🛑 停止全部
                  </button>
                  <div class="quick-presets">
                    <span class="preset-label">快速预设：</span>
                    <button @click="applyMomentsPreset('slow')" class="btn-preset">慢速 (120/60s)</button>
                    <button @click="applyMomentsPreset('normal')" class="btn-preset">正常 (60/30s)</button>
                    <button @click="applyMomentsPreset('fast')" class="btn-preset">快速 (30/15s)</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 房间自动化状态 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>🏠 房间自动化状态</h2>
            <div class="header-actions">
              <p class="header-hint">点击开关控制自动对话，点击"测试"按钮立即生成一次</p>
              <button @click="triggerAllAutoRooms" class="btn-trigger-all" :disabled="autoRooms.length === 0">
                🚀 批量触发 ({{ autoRooms.length }}个房间)
              </button>
            </div>
          </div>
          <div class="card-body">
            <div v-if="rooms.length === 0" class="empty-hint">
              暂无房间
            </div>
            <div v-else class="rooms-auto-status">
              <div v-for="room in rooms" :key="room.id" class="room-status-item-expanded">
                <!-- 房间基本信息 -->
                <div class="room-status-header">
                  <div class="room-status-info">
                    <span class="room-status-avatar">{{ room.avatar }}</span>
                    <div class="room-status-details">
                      <span class="room-status-name">{{ room.name }}</span>
                      <span class="room-status-meta">
                        频率: {{ room.dialogue_density || 2 }}级 | 成员: {{ room.member_count || 0 }}人
                      </span>
                    </div>
                  </div>
                  <div class="room-status-control">
                    <label class="switch-label-inline">
                      <input 
                        type="checkbox" 
                        :checked="room.auto_mode === 1"
                        @change="quickToggleRoomAuto(room.id, $event.target.checked)"
                        class="switch-input"
                      />
                      <span class="switch-slider"></span>
                    </label>
                    <span class="status-text" :class="room.auto_mode === 1 ? 'text-active' : 'text-inactive'">
                      {{ room.auto_mode === 1 ? '开启' : '关闭' }}
                    </span>
                    <button 
                      v-if="room.auto_mode === 1"
                      @click="testRoomAutoChat(room.id, room.name)"
                      class="btn-test"
                      title="立即生成一次对话"
                    >
                      测试
                    </button>
                  </div>
                </div>

                <!-- 自动发言控制 -->
                <div v-if="room.auto_mode === 1" class="room-auto-speak-control">
                  <div class="auto-speak-settings">
                    <label class="setting-label">⏱️ 自动发言间隔：</label>
                    <input 
                      v-model.number="autoIntervals[room.id]"
                      type="number"
                      min="10"
                      max="600"
                      step="5"
                      class="form-input-number-small"
                      placeholder="秒"
                      :disabled="autoRoomRunning[room.id]"
                    />
                    <span class="input-unit">秒</span>
                    
                    <button 
                      @click="toggleRoomAutoSpeak(room.id, room.name)"
                      :class="['btn-auto-toggle', autoRoomRunning[room.id] ? 'btn-auto-stop' : 'btn-auto-start']"
                      :disabled="!autoIntervals[room.id] || autoIntervals[room.id] < 10"
                    >
                      {{ autoRoomRunning[room.id] ? '⏸️ 停止' : '▶️ 启动' }}
                    </button>
                  </div>
                  
                  <div v-if="autoRoomRunning[room.id]" class="auto-speak-status">
                    <span class="status-indicator">🟢</span>
                    <span class="status-text-run">正在运行</span>
                    <span class="countdown-text">下次发言倒计时: {{ autoCountdowns[room.id] || 0 }}秒</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 群聊管理 -->
      <div v-show="currentTab === 'rooms'" class="tab-content">
        <div class="admin-card">
          <div class="card-header">
            <h2>📊 群聊列表</h2>
          </div>
          <div class="card-body">
            <p v-if="rooms.length === 0" class="empty-hint">暂无群聊</p>
            <div v-else class="rooms-list">
              <div v-for="room in rooms" :key="room.id" class="room-item">
                <div class="room-info-section">
                  <div class="room-avatar-large">{{ room.avatar }}</div>
                  <div class="room-details">
                    <h3>{{ room.name }}</h3>
                    <p>{{ room.description }}</p>
                    <small>ID: {{ room.id }} | 成员: {{ room.member_count }}人 {{ room.npc_count }}NPC</small>
                  </div>
                </div>
                
                <div class="room-controls">
                  <div class="control-group">
                    <label class="switch-label">
                      <input 
                        type="checkbox" 
                        :checked="room.auto_mode === 1"
                        @change="toggleRoomAutoMode(room.id, $event.target.checked)"
                        class="switch-input"
                      />
                      <span class="switch-slider"></span>
                      <span class="switch-text">自动对话</span>
                    </label>
                    <span v-if="room.auto_mode === 1" class="status-running">运行中</span>
                  </div>
                  
                  <div class="control-group">
                    <label>对话频率（秒）：</label>
                    <input 
                      v-model.number="room.dialogue_density"
                      type="number"
                      min="10"
                      max="300"
                      class="form-input-small"
                      @blur="updateRoomSettings(room.id, room.dialogue_density)"
                    />
                  </div>
                  
                  <div class="control-group">
                    <button 
                      @click="deleteRoom(room.id, room.name)"
                      class="btn-delete-room"
                      title="删除房间"
                    >
                      🗑️ 删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- NPC管理 -->
      <div v-show="currentTab === 'npcs'" class="tab-content">
        <div class="admin-card">
          <div class="card-header">
            <h2>🤖 NPC列表</h2>
            <button @click="fetchNPCs" class="btn-refresh">🔄 刷新</button>
          </div>
          <div class="card-body">
            <p v-if="npcs.length === 0" class="empty-hint">暂无NPC</p>
            <div v-else class="npcs-by-room">
              <!-- 按房间分组显示 -->
              <div 
                v-for="(roomNpcs, roomKey) in npcsByRoom" 
                :key="roomKey"
                class="room-group"
                :class="{ collapsed: collapsedRooms.has(roomKey) }"
              >
                <div 
                  class="room-group-header"
                  @click="toggleRoomCollapse(roomKey)"
                >
                  <span class="collapse-icon">
                    {{ collapsedRooms.has(roomKey) ? '▶' : '▼' }}
                  </span>
                  <h3>
                    {{ roomNpcs.room_name || roomKey }}
                    <span class="npc-count">({{ roomNpcs.npcs.length }} 个NPC)</span>
                  </h3>
                </div>
                <transition name="slide-fade">
                  <div v-show="!collapsedRooms.has(roomKey)" class="npcs-list">
                    <div 
                      v-for="npc in roomNpcs.npcs" 
                      :key="npc.id" 
                      class="npc-item npc-item-clickable"
                      @click="editNPC(npc)"
                    >
                      <div class="npc-avatar-section">
                        <div class="npc-avatar-preview">
                          <img 
                            v-if="isImageAvatar(npc.avatar)"
                            :src="npc.avatar" 
                            alt="avatar"
                          />
                          <span v-else>{{ npc.avatar || '🤖' }}</span>
                        </div>
                      </div>
                      <div class="npc-info-section">
                        <h3>{{ npc.name }}</h3>
                        <p class="npc-profile">{{ npc.profile || npc.persona || '暂无人设' }}</p>
                      </div>
                      <div class="npc-actions">
                        <span class="edit-hint">点击编辑 →</span>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑NPC模态框 -->
      <div v-if="showEditNPCModal" class="modal-overlay" @click.self="showEditNPCModal = false">
        <div class="modal-content modal-large modal-creator-style">
          <div class="modal-header">
            <div class="modal-title-section">
              <h2>✏️ 编辑NPC信息</h2>
              <p class="modal-subtitle">修改角色属性和人设</p>
            </div>
            <button @click="showEditNPCModal = false" class="btn-close-circle">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label>名称</label>
                <input v-model="editingNPC.name" type="text" class="form-input" />
              </div>
              
              <div class="form-group">
                <label>头像</label>
                <div class="avatar-upload-section">
                  <div class="avatar-input-wrapper">
                    <input 
                      v-model="editingNPC.avatar" 
                      type="text" 
                      placeholder="输入emoji或图片URL"
                      class="form-input"
                    />
                    <label class="btn-upload">
                      📁 上传图片
                      <input
                        type="file"
                        accept="image/*"
                        @change="handleNPCAvatarUpload"
                        style="display: none;"
                      />
                    </label>
                  </div>
                  <div class="format-hint">✅ 支持 WebP、PNG、JPEG、GIF 等所有格式</div>
                  <div class="avatar-preview-large">
                    <img 
                      v-if="isImageAvatar(editingNPC.avatar)"
                      :src="editingNPC.avatar" 
                      alt="preview"
                    />
                    <span v-else>{{ editingNPC.avatar || '🤖' }}</span>
                  </div>
                </div>
              </div>

              <div class="form-group full-width">
                <label>人设 / Persona</label>
                <textarea 
                  v-model="editingNPC.persona" 
                  rows="4" 
                  placeholder="描述这个NPC的性格、背景、说话风格等..."
                  class="form-textarea"
                ></textarea>
              </div>

              <div class="form-group full-width">
                <label>Profile / 简介</label>
                <textarea 
                  v-model="editingNPC.profile" 
                  rows="3" 
                  placeholder="简短的自我介绍"
                  class="form-textarea"
                ></textarea>
              </div>

              <div class="form-group">
                <label>性格 (Personality)</label>
                <input v-model="editingNPC.personality" type="text" class="form-input" placeholder="如：开朗、内向..." />
              </div>

              <div class="form-group">
                <label>习惯 (Habits)</label>
                <input v-model="editingNPC.habits" type="text" class="form-input" placeholder="如：喜欢喝咖啡..." />
              </div>

              <div class="form-group">
                <label>技能 (Skills)</label>
                <input v-model="editingNPC.skills" type="text" class="form-input" placeholder="如：编程、设计..." />
              </div>

              <div class="form-group">
                <label>喜欢 (Likes)</label>
                <input v-model="editingNPC.likes" type="text" class="form-input" placeholder="如：音乐、旅行..." />
              </div>

              <div class="form-group">
                <label>不喜欢 (Dislikes)</label>
                <input v-model="editingNPC.dislikes" type="text" class="form-input" placeholder="如：嘈杂、迟到..." />
              </div>

              <div class="form-group">
                <label>年龄 (Age)</label>
                <input v-model="editingNPC.age" type="number" class="form-input" placeholder="如：25" />
              </div>

              <div class="form-group">
                <label>职业 (Occupation)</label>
                <input v-model="editingNPC.occupation" type="text" class="form-input" placeholder="如：程序员..." />
              </div>

              <div class="form-group full-width">
                <label>背景 (Background)</label>
                <textarea 
                  v-model="editingNPC.background" 
                  rows="3" 
                  placeholder="NPC的背景故事..."
                  class="form-textarea"
                ></textarea>
              </div>

              <div class="form-group full-width">
                <label>目标 (Goals)</label>
                <textarea 
                  v-model="editingNPC.goals" 
                  rows="2" 
                  placeholder="NPC的目标和动机..."
                  class="form-textarea"
                ></textarea>
              </div>

              <div class="form-group full-width">
                <label>恐惧 (Fears)</label>
                <input v-model="editingNPC.fears" type="text" class="form-input" placeholder="如：黑暗、失败..." />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showEditNPCModal = false" class="btn btn-secondary">取消</button>
            <button @click="saveNPC" class="btn btn-primary">💾 保存</button>
          </div>
        </div>
      </div>

      <!-- 朋友圈管理 -->
      <div v-show="currentTab === 'moments'" class="tab-content">
        <!-- 手动控制 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>🎯 手动控制</h2>
          </div>
          <div class="card-body">
            <div class="manual-controls">
              <!-- 手动发帖 -->
              <div class="control-section">
                <h3>📝 手动发送朋友圈</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label>选择房间：</label>
                    <select v-model="selectedPostRoom" class="form-input" @change="loadPostNPCs">
                      <option value="">-- 请选择房间 --</option>
                      <option v-for="room in rooms" :key="room.id" :value="room.id">
                        {{ room.name }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>选择NPC：</label>
                    <select v-model="selectedPostNPC" class="form-input" :disabled="!selectedPostRoom" @change="onPostNPCChange">
                      <option value="">-- 请选择NPC --</option>
                      <option v-for="npc in postNPCs" :key="npc.id" :value="npc.id">
                        {{ npc.name }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <button 
                      @click="previewPostPrompt" 
                      class="btn-secondary"
                      :disabled="!selectedPostNPC"
                    >
                      👁️ 预览Prompt
                    </button>
                    <button 
                      @click="triggerManualPost" 
                      class="btn-action"
                      :disabled="!selectedPostNPC"
                    >
                      🚀 立即发送
                    </button>
                  </div>
                </div>
                
                <!-- 自定义Prompt编辑器 -->
                <div v-if="showPostPromptEditor" class="prompt-editor">
                  <div class="editor-header">
                    <h4>✏️ 编辑朋友圈生成Prompt</h4>
                    <button @click="showPostPromptEditor = false" class="btn-close-small">✕</button>
                  </div>
                  <div class="editor-info">
                    <span class="info-item">👤 NPC: {{ currentPostNPCInfo?.name }}</span>
                    <span class="info-item">🎭 类型: {{ customPostMomentType }}</span>
                  </div>
                  <div class="editor-controls">
                    <label>朋友圈类型：</label>
                    <select v-model="customPostMomentType" class="form-input-small">
                      <option value="日常生活">日常生活</option>
                      <option value="情感表达">情感表达</option>
                      <option value="观点态度">观点态度</option>
                      <option value="回忆思考">回忆思考</option>
                      <option value="互动吐槽">互动吐槽</option>
                      <option value="自我展示">自我展示</option>
                      <option value="自定义">自定义</option>
                    </select>
                  </div>
                  <div class="editor-body">
                    <label>Prompt内容：</label>
                    <textarea 
                      v-model="customPostPrompt" 
                      rows="12" 
                      class="form-textarea-large"
                      placeholder="在这里编辑自定义Prompt..."
                    ></textarea>
                  </div>
                  <div class="editor-footer">
                    <button @click="resetPostPrompt" class="btn btn-secondary">🔄 恢复默认</button>
                    <button @click="showPostPromptEditor = false" class="btn btn-secondary">取消</button>
                  </div>
                </div>
                
                <!-- 显示最近生成的Prompt -->
                <div v-if="lastGeneratedPrompt" class="prompt-display">
                  <div class="prompt-header">
                    <h4>📝 最近生成的Prompt</h4>
                    <button @click="lastGeneratedPrompt = null" class="btn-close-small">✕</button>
                  </div>
                  <div class="prompt-meta">
                    <span class="meta-item">👤 NPC: {{ lastGeneratedPrompt.npcName }}</span>
                    <span class="meta-item">🎭 类型: {{ lastGeneratedPrompt.momentType }}</span>
                    <span class="meta-item">⏰ {{ new Date(lastGeneratedPrompt.timestamp).toLocaleString('zh-CN') }}</span>
                  </div>
                  <div class="prompt-content">
                    <pre>{{ lastGeneratedPrompt.prompt }}</pre>
                  </div>
                  <div class="prompt-result">
                    <strong>🎯 生成结果：</strong>
                    <p>{{ lastGeneratedPrompt.content }}</p>
                  </div>
                </div>
              </div>

              <!-- 触发NPC回复玩家评论 -->
              <div class="control-section">
                <h3>🔄 触发NPC回复玩家评论</h3>
                <p class="section-description">
                  当玩家评论朋友圈后，同房间的其他NPC会自动回复。如果没有自动触发，可以在这里手动触发。
                </p>
                <div class="form-row">
                  <div class="form-group">
                    <label>选择玩家评论：</label>
                    <select v-model="selectedPlayerComment" class="form-input">
                      <option value="">-- 请选择玩家评论 --</option>
                      <option v-for="comment in recentPlayerComments" :key="comment.id" :value="comment.id">
                        {{ comment.user_name }}: {{ comment.content.substring(0, 30) }}...
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <button 
                      @click="triggerNPCReplyToPlayer" 
                      class="btn-action"
                      :disabled="!selectedPlayerComment"
                    >
                      🤖 触发NPC回复
                    </button>
                    <button 
                      @click="loadRecentPlayerComments" 
                      class="btn-secondary"
                    >
                      🔄 刷新评论列表
                    </button>
                  </div>
                </div>
                <div v-if="npcReplyResult" class="result-message" :class="npcReplyResult.success ? 'success' : 'error'">
                  {{ npcReplyResult.message }}
                  <div v-if="npcReplyResult.replies && npcReplyResult.replies.length > 0" class="reply-list">
                    <p><strong>已回复的NPC：</strong></p>
                    <ul>
                      <li v-for="reply in npcReplyResult.replies" :key="reply.comment_id">
                        🤖 {{ reply.npc_name }}: {{ reply.content }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- 手动评论 -->
              <div class="control-section">
                <h3>💬 手动发送评论</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label>选择房间：</label>
                    <select v-model="selectedCommentRoom" class="form-input" @change="loadCommentData">
                      <option value="">-- 请选择房间 --</option>
                      <option v-for="room in rooms" :key="room.id" :value="room.id">
                        {{ room.name }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>选择NPC：</label>
                    <select v-model="selectedCommentNPC" class="form-input" :disabled="!selectedCommentRoom" @change="onCommentNPCChange">
                      <option value="">-- 请选择NPC --</option>
                      <option v-for="npc in commentNPCs" :key="npc.id" :value="npc.id">
                        {{ npc.name }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>筛选作者：</label>
                    <select v-model="selectedMomentAuthor" class="form-input" :disabled="!selectedCommentRoom" @change="filterMomentsByAuthor">
                      <option value="">-- 全部朋友圈 --</option>
                      <option v-for="user in roomUsers" :key="'user-' + user.user_id" :value="'user-' + user.user_id">
                        👤 {{ user.nickname || user.username }}
                      </option>
                      <option v-for="npc in commentNPCs" :key="'npc-' + npc.id" :value="'npc-' + npc.id">
                        🤖 {{ npc.name }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>选择朋友圈：</label>
                    <select v-model="selectedMoment" class="form-input" :disabled="!selectedCommentRoom">
                      <option value="">-- 请选择朋友圈 --</option>
                      <option v-for="moment in filteredMoments" :key="moment.id" :value="moment.id">
                        {{ moment.author_name }}: {{ moment.content.substring(0, 20) }}...
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>情感倾向：</label>
                    <select v-model="commentEmotion" class="form-input-small">
                      <option value="neutral">中性</option>
                      <option value="positive">正面/支持</option>
                      <option value="negative">负面/反对</option>
                      <option value="happy">开心/兴奋</option>
                      <option value="sad">悲伤/同情</option>
                      <option value="angry">愤怒/不满</option>
                      <option value="surprised">惊讶/意外</option>
                      <option value="sarcastic">讽刺/调侃</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <button 
                      @click="previewCommentPrompt" 
                      class="btn-secondary"
                      :disabled="!selectedCommentNPC || !selectedMoment"
                    >
                      👁️ 预览Prompt
                    </button>
                    <button 
                      @click="triggerManualComment" 
                      class="btn-action"
                      :disabled="!selectedCommentNPC || !selectedMoment"
                    >
                      💬 立即评论
                    </button>
                  </div>
                </div>
                
                <!-- 自定义评论Prompt编辑器 -->
                <div v-if="showCommentPromptEditor" class="prompt-editor">
                  <div class="editor-header">
                    <h4>✏️ 编辑评论生成Prompt</h4>
                    <button @click="showCommentPromptEditor = false" class="btn-close-small">✕</button>
                  </div>
                  <div class="editor-info">
                    <span class="info-item">👤 NPC: {{ currentCommentNPCInfo?.name }}</span>
                    <span class="info-item">😊 情感: {{ getEmotionLabel(commentEmotion) }}</span>
                  </div>
                  <div class="editor-controls">
                    <label>情感倾向：</label>
                    <select v-model="commentEmotion" class="form-input-small">
                      <option value="neutral">中性</option>
                      <option value="positive">正面/支持</option>
                      <option value="negative">负面/反对</option>
                      <option value="happy">开心/兴奋</option>
                      <option value="sad">悲伤/同情</option>
                      <option value="angry">愤怒/不满</option>
                      <option value="surprised">惊讶/意外</option>
                      <option value="sarcastic">讽刺/调侃</option>
                    </select>
                  </div>
                  <div class="editor-body">
                    <label>Prompt内容：</label>
                    <textarea 
                      v-model="customCommentPrompt" 
                      rows="12" 
                      class="form-textarea-large"
                      placeholder="在这里编辑自定义Prompt..."
                    ></textarea>
                  </div>
                  <div class="editor-footer">
                    <button @click="resetCommentPrompt" class="btn btn-secondary">🔄 恢复默认</button>
                    <button @click="showCommentPromptEditor = false" class="btn btn-secondary">取消</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
              启动后，NPC将自动发布朋友圈并智能回复。
              <strong>新功能：</strong>玩家评论后，同房间的其他NPC会自动回复！
            </p>
            
            <div class="form-row">
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

        <!-- 统计信息 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>📊 统计信息</h2>
            <button @click="fetchStats" class="btn-refresh">🔄 刷新</button>
          </div>
          <div class="card-body">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ stats.totalMoments }}</div>
                <div class="stat-label">总朋友圈</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.totalLikes }}</div>
                <div class="stat-label">总点赞</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.totalComments }}</div>
                <div class="stat-label">总评论</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近朋友圈 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>📱 最近朋友圈</h2>
            <button @click="fetchRecentMoments" class="btn-refresh">🔄 刷新</button>
          </div>
          <div class="card-body">
            <div v-if="recentMoments.length === 0" class="empty-hint">
              暂无朋友圈
            </div>
            <div v-else class="moments-list">
              <div v-for="moment in recentMoments" :key="moment.id" class="moment-item">
                <div class="moment-avatar">
                  <img 
                    v-if="isImageAvatar(moment.user_avatar || moment.npc_avatar)"
                    :src="moment.user_avatar || moment.npc_avatar"
                    alt="avatar"
                    class="avatar-img-small"
                  />
                  <span v-else>{{ moment.user_avatar || moment.npc_avatar || '👤' }}</span>
                </div>
                <div class="moment-content">
                  <div class="moment-header">
                    <span class="moment-author">{{ moment.user_name || moment.npc_name }}</span>
                    <span class="moment-time">{{ formatTime(moment.created_at) }}</span>
                  </div>
                  <div class="moment-text">{{ moment.content }}</div>
                  <div class="moment-stats">
                    <span>👍 {{ moment.like_count }}</span>
                    <span>💬 {{ moment.comment_count }}</span>
                  </div>
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

const router = useRouter()
const currentTab = ref('control')
const currentUser = ref('管理员')

// 智能控制
const controlConfig = ref({
  dailyTokenLimit: 100000,
  tokenUsedToday: 0,
  lastResetDate: '',
  allowedHours: { start: 0, end: 24 },
  requireOnlineUsers: true,
  globalAutoEnabled: true,
})

const controlStats = ref({
  tokenUsed: 0,
  tokenLimit: 100000,
  tokenRemaining: 100000,
  tokenUsagePercent: 0,
  messagesGenerated: 0,
  momentsGenerated: 0,
  globalEnabled: true,
  allowedHours: { start: 0, end: 24 },
  requireOnlineUsers: true,
})

// 房间自动发言控制
const autoIntervals = ref<Record<string, number>>({}) // 每个房间的间隔设置（秒）
const autoTimers = ref<Record<string, any>>({}) // 每个房间的定时器
const autoCountdowns = ref<Record<string, number>>({}) // 每个房间的倒计时（秒）
const autoRoomRunning = ref<Record<string, boolean>>({}) // 每个房间的运行状态
const countdownTimers = ref<Record<string, any>>({}) // 倒计时定时器

// 群聊管理
const rooms = ref([])

// NPC管理
const npcs = ref([])
const showEditNPCModal = ref(false)
const collapsedRooms = ref<Set<string>>(new Set())
const editingNPC = ref({
  id: null,
  name: '',
  avatar: '',
  persona: '',
  profile: '',
  personality: '',
  habits: '',
  skills: '',
  likes: '',
  dislikes: '',
  age: '',
  occupation: '',
  background: '',
  goals: '',
  fears: '',
  room_id: ''
})

// 朋友圈管理 - 手动控制
const selectedPostRoom = ref('')
const selectedPostNPC = ref('')
const postNPCs = ref([])
const lastGeneratedPrompt = ref(null)

// Prompt编辑器状态 - 朋友圈
const showPostPromptEditor = ref(false)
const customPostPrompt = ref('')
const customPostMomentType = ref('日常生活')
const currentPostNPCInfo = ref(null)

const selectedCommentRoom = ref('')
const selectedCommentNPC = ref('')
const selectedMoment = ref('')
const selectedMomentAuthor = ref('') // 筛选作者
const commentNPCs = ref([])
const roomMoments = ref([])
const roomUsers = ref([]) // 房间内的玩家
const filteredMoments = ref([]) // 筛选后的朋友圈

// NPC回复玩家评论
const selectedPlayerComment = ref('')
const recentPlayerComments = ref([])
const npcReplyResult = ref(null)

// Prompt编辑器状态 - 评论
const showCommentPromptEditor = ref(false)
const customCommentPrompt = ref('')
const commentEmotion = ref('neutral')
const currentCommentNPCInfo = ref(null)

// 朋友圈管理 - 自动化（智能控制页面）
const momentsPostInterval = ref(60)
const momentsCommentInterval = ref(30)
const momentsPostRunning = ref(false)
const momentsCommentRunning = ref(false)
const momentsAutoRunning = computed(() => momentsPostRunning.value || momentsCommentRunning.value)
const momentsStats = ref({ posts: 0, comments: 0 })
const momentsStartTime = ref(0)
const momentsRunTime = ref('00:00')
let momentsPostTimer: any = null
let momentsCommentTimer: any = null
let momentsTimeTimer: any = null

// 朋友圈管理 - 自动化（旧版 - 朋友圈管理Tab）
const autoMode = ref(false)
const postFrequency = ref(60)
const commentFrequency = ref(30)
const autoStats = ref({ posts: 0, comments: 0 })
const autoStartTime = ref(0)
const autoRunTime = ref('00:00')
let postInterval: any = null
let commentInterval: any = null
let timeInterval: any = null

const stats = ref({
  totalMoments: 0,
  totalLikes: 0,
  totalComments: 0
})

const recentMoments = ref([])

// 判断是否是图片头像
const isImageAvatar = (avatar: string) => {
  if (!avatar) return false
  return avatar.startsWith('http') || avatar.startsWith('data:image') || avatar.startsWith('/')
}

// 格式化时间
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

// 加载群聊列表
const fetchRooms = async () => {
  try {
    const response = await $fetch('/api/admin/rooms/list')
    if (response.success) {
      rooms.value = response.rooms
      // 初始化房间自动发言设置
      initRoomAutoIntervals()
    }
  } catch (error) {
    console.error('获取群聊列表失败:', error)
  }
}

// 切换群聊自动模式
const toggleRoomAutoMode = async (roomId: string, enabled: boolean) => {
  try {
    const response = await $fetch('/api/admin/rooms/auto-mode', {
      method: 'POST',
      body: {
        roomId,
        enabled
      }
    })
    
    if (response.success) {
      await fetchRooms()
    } else {
      alert(response.error || '操作失败')
    }
  } catch (error) {
    console.error('切换自动模式失败:', error)
    alert('操作失败')
  }
}

// 更新群聊设置
const updateRoomSettings = async (roomId: string, dialogueDensity: number) => {
  try {
    const response = await $fetch('/api/admin/rooms/update-settings', {
      method: 'POST',
      body: {
        roomId,
        dialogueDensity
      }
    })
    
    if (!response.success) {
      alert(response.error || '更新失败')
    }
  } catch (error) {
    console.error('更新设置失败:', error)
  }
}

// 删除群聊
const deleteRoom = async (roomId: string, roomName: string) => {
  const confirmDelete = confirm(
    `确定要删除群聊「${roomName}」吗？\n\n此操作将删除：\n• 群聊基本信息\n• 所有成员记录\n• 所有聊天消息\n• 所有NPC角色\n\n⚠️ 此操作不可恢复！`
  )
  
  if (!confirmDelete) {
    return
  }
  
  try {
    const response = await $fetch('/api/admin/rooms/delete', {
      method: 'POST',
      body: { roomId }
    })
    
    if (response.success) {
      alert('删除成功')
      await fetchRooms()
    } else {
      alert(response.error || '删除失败')
    }
  } catch (error) {
    console.error('删除房间失败:', error)
    alert('删除失败，请重试')
  }
}

// ============ NPC管理 ============

// 获取所有NPC
const fetchNPCs = async () => {
  try {
    const response = await $fetch('/api/admin/npcs/list')
    if (response.success) {
      npcs.value = response.npcs
      console.log('✅ 获取NPC列表成功:', response.npcs.length, '个')
      
      // 调试：打印前3个NPC的头像信息
      response.npcs.slice(0, 3).forEach((npc: any) => {
        console.log(`  - ${npc.name}: 头像=${npc.avatar ? (npc.avatar.startsWith('data:image') ? 'Base64图片' : npc.avatar) : '无'}`)
      })
      
      // 默认收起所有房间
      const roomIds = new Set<string>()
      npcs.value.forEach((npc: any) => {
        if (npc.room_id) {
          roomIds.add(npc.room_id)
        }
      })
      collapsedRooms.value = roomIds
      console.log('📦 默认收起', roomIds.size, '个房间')
    }
  } catch (error) {
    console.error('获取NPC列表失败:', error)
    alert('获取NPC列表失败')
  }
}

// 按房间分组NPC
const npcsByRoom = computed(() => {
  const grouped: any = {}
  
  npcs.value.forEach((npc: any) => {
    const roomId = npc.room_id || 'unknown'
    
    if (!grouped[roomId]) {
      grouped[roomId] = {
        room_id: roomId,
        room_name: npc.room_name || roomId,
        npcs: []
      }
    }
    
    grouped[roomId].npcs.push(npc)
  })
  
  return grouped
})

// 切换房间折叠状态
const toggleRoomCollapse = (roomKey: string) => {
  if (collapsedRooms.value.has(roomKey)) {
    collapsedRooms.value.delete(roomKey)
  } else {
    collapsedRooms.value.add(roomKey)
  }
  // 触发响应式更新
  collapsedRooms.value = new Set(collapsedRooms.value)
}

// 编辑NPC
const editNPC = (npc: any) => {
  editingNPC.value = {
    id: npc.id,
    name: npc.name || '',
    avatar: npc.avatar || '',
    persona: npc.persona || '',
    profile: npc.profile || '',
    personality: npc.personality || '',
    habits: npc.habits || '',
    skills: npc.skills || '',
    likes: npc.likes || '',
    dislikes: npc.dislikes || '',
    age: npc.age || '',
    occupation: npc.occupation || '',
    background: npc.background || '',
    goals: npc.goals || '',
    fears: npc.fears || '',
    room_id: npc.room_id || ''
  }
  showEditNPCModal.value = true
}

// 处理NPC头像上传
const handleNPCAvatarUpload = (event: any) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 检查文件大小（限制10MB）
  if (file.size > 10 * 1024 * 1024) {
    alert('图片大小不能超过10MB')
    return
  }
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  
  console.log('📁 上传NPC头像:', {
    name: file.name,
    type: file.type,
    size: (file.size / 1024).toFixed(2) + ' KB'
  })
  
  const reader = new FileReader()
  reader.onload = (e: any) => {
    editingNPC.value.avatar = e.target.result
    console.log('✅ NPC头像已转换为base64，格式:', file.type)
  }
  reader.onerror = (e) => {
    console.error('❌ 读取文件失败:', e)
    alert('读取文件失败')
  }
  reader.readAsDataURL(file)
}

// 保存NPC
const saveNPC = async () => {
  if (!editingNPC.value.name) {
    alert('请输入NPC名称')
    return
  }
  
  console.log('💾 保存NPC:', {
    id: editingNPC.value.id,
    name: editingNPC.value.name,
    avatar_type: editingNPC.value.avatar?.startsWith('data:image') ? 'Base64图片' : editingNPC.value.avatar ? 'Text/Emoji' : '无',
    avatar_preview: editingNPC.value.avatar?.substring(0, 50) + '...'
  })
  
  try {
    const response = await $fetch('/api/admin/npcs/update', {
      method: 'POST',
      body: editingNPC.value
    })
    
    if (response.success) {
      console.log('✅ NPC保存成功，刷新列表...')
      alert('✅ 保存成功')
      showEditNPCModal.value = false
      await fetchNPCs()
    } else {
      alert(response.error || '保存失败')
    }
  } catch (error) {
    console.error('保存NPC失败:', error)
    alert('保存失败')
  }
}

// ============ 朋友圈手动控制 ============

// 加载发帖NPC
const loadPostNPCs = async () => {
  selectedPostNPC.value = ''
  postNPCs.value = []
  
  if (!selectedPostRoom.value) return
  
  try {
    const response = await $fetch('/api/rooms/get-npcs', {
      method: 'POST',
      body: { room_id: selectedPostRoom.value }
    })
    
    if (response.success) {
      postNPCs.value = response.npcs
    }
  } catch (error) {
    console.error('加载NPC失败:', error)
  }
}

// 加载评论数据（NPC、玩家和朋友圈）
const loadCommentData = async () => {
  selectedCommentNPC.value = ''
  selectedMoment.value = ''
  selectedMomentAuthor.value = ''
  commentNPCs.value = []
  roomMoments.value = []
  roomUsers.value = []
  filteredMoments.value = []
  
  if (!selectedCommentRoom.value) return
  
  try {
    // 获取房间的NPC
    const npcResponse = await $fetch('/api/rooms/get-npcs', {
      method: 'POST',
      body: { room_id: selectedCommentRoom.value }
    })
    
    if (npcResponse.success) {
      commentNPCs.value = npcResponse.npcs
    }
    
    // 获取房间的成员（玩家）
    const membersResponse = await $fetch(`/api/rooms/${selectedCommentRoom.value}/info`)
    if (membersResponse.success && membersResponse.members) {
      roomUsers.value = membersResponse.members.filter((m: any) => m.user_id)
      console.log('🔍 房间玩家:', roomUsers.value)
      console.log('🔍 玩家数量:', roomUsers.value.length)
    }
    
    // 获取房间相关的朋友圈（包括玩家和NPC的）
    const momentsResponse = await $fetch('/api/moments/recent', {
      query: {
        limit: 100 // 多加载一些，方便筛选
      }
    })
    
    if (momentsResponse.success) {
      // 筛选出该房间相关的朋友圈
      // 包括：房间内NPC的朋友圈 + 房间成员的朋友圈
      const roomNPCIds = commentNPCs.value.map((npc: any) => npc.id)
      const roomUserIds = roomUsers.value.map((user: any) => user.user_id)
      
      console.log('🔍 房间NPC IDs:', roomNPCIds)
      console.log('🔍 房间玩家 IDs:', roomUserIds)
      console.log('🔍 所有朋友圈:', momentsResponse.moments)
      
      roomMoments.value = momentsResponse.moments
        .filter((m: any) => {
          return (m.npc_id && roomNPCIds.includes(m.npc_id)) || 
                 (m.user_id && roomUserIds.includes(m.user_id))
        })
        .map((m: any) => ({
          ...m,
          author_name: m.npc_name || m.user_nickname || m.user_name || '未知',
          author_type: m.npc_id ? 'npc' : 'user',
          author_id: m.npc_id || m.user_id
        }))
      
      console.log('🔍 筛选后的朋友圈:', roomMoments.value)
      filteredMoments.value = roomMoments.value
    }
  } catch (error) {
    console.error('加载评论数据失败:', error)
  }
}

// 根据作者筛选朋友圈
const filterMomentsByAuthor = () => {
  if (!selectedMomentAuthor.value) {
    filteredMoments.value = roomMoments.value
  } else {
    const [type, id] = selectedMomentAuthor.value.split('-')
    const authorId = parseInt(id)
    
    filteredMoments.value = roomMoments.value.filter((m: any) => {
      if (type === 'user') {
        return m.author_type === 'user' && m.author_id === authorId
      } else if (type === 'npc') {
        return m.author_type === 'npc' && m.author_id === authorId
      }
      return false
    })
  }
  
  // 重置选择的朋友圈
  selectedMoment.value = ''
  
  console.log('🔍 筛选作者:', selectedMomentAuthor.value)
  console.log('🔍 筛选结果:', filteredMoments.value)
  console.log('🔍 筛选结果数量:', filteredMoments.value.length)
}

// NPC选择变化 - 朋友圈
const onPostNPCChange = () => {
  showPostPromptEditor.value = false
  customPostPrompt.value = ''
  currentPostNPCInfo.value = postNPCs.value.find((npc: any) => npc.id === selectedPostNPC.value)
}

// 生成默认朋友圈Prompt
const generateDefaultPostPrompt = (npc: any, momentType: string) => {
  const momentTypes: any = {
    '日常生活': '分享你今天的日常生活、见闻或感受',
    '情感表达': '表达你当前的情绪或心情',
    '观点态度': '针对当前事件发表你的看法和态度',
    '回忆思考': '回忆过去或思考未来',
    '互动吐槽': '对某事进行吐槽或幽默评论',
    '自我展示': '展示你的成就、兴趣或正在做的事'
  }
  
  return `【角色扮演 - 朋友圈生成】

你是：${npc.name}

🎭 性格：${npc.personality || '未设置'}
📝 习惯：${npc.habits || '未设置'}
❤️ 喜好：${npc.likes || '未设置'}
💢 厌恶：${npc.dislikes || '未设置'}
🎯 目标：${npc.goals || '未设置'}
😨 恐惧：${npc.fears || '未设置'}
📚 背景：${npc.background || '未设置'}

📱 本次朋友圈类型：${momentType}
${momentTypes[momentType] || momentType}

⚠️ 重要要求：
1. 必须完全符合你的性格、习惯和当前剧情
2. 内容要独特且有个性，避免套路化
3. 20-80字，自然真实，像真人发的
4. 可以用emoji，但不要过度
5. 根据你的情绪状态调整语气
6. 绝对不要提到"作为XX"等死板用语
7. 可以是：一句话、感叹、提问、描述场景、调侃等任何形式

只返回朋友圈内容文本，不要引号、不要解释。`
}

// 预览朋友圈Prompt
const previewPostPrompt = () => {
  if (!currentPostNPCInfo.value) {
    currentPostNPCInfo.value = postNPCs.value.find((npc: any) => npc.id === selectedPostNPC.value)
  }
  
  customPostPrompt.value = generateDefaultPostPrompt(currentPostNPCInfo.value, customPostMomentType.value)
  showPostPromptEditor.value = true
}

// 重置朋友圈Prompt
const resetPostPrompt = () => {
  if (currentPostNPCInfo.value) {
    customPostPrompt.value = generateDefaultPostPrompt(currentPostNPCInfo.value, customPostMomentType.value)
  }
}

// 手动发送朋友圈
const triggerManualPost = async () => {
  if (!selectedPostNPC.value) {
    alert('请选择NPC')
    return
  }
  
  try {
    const body: any = { npc_id: selectedPostNPC.value }
    
    // 如果有自定义Prompt，传递给后端
    if (customPostPrompt.value) {
      body.customPrompt = customPostPrompt.value
      body.momentType = customPostMomentType.value
    }
    
    const response = await $fetch('/api/moments/ai-generate', {
      method: 'POST',
      body
    })
    
    if (response.success) {
      console.log('✅ AI生成响应:', response)
      
      // 保存prompt信息用于显示
      lastGeneratedPrompt.value = {
        npcName: response.npcInfo?.name || '未知NPC',
        momentType: response.momentType || '未知类型',
        prompt: response.prompt || '无Prompt',
        content: response.content || '无内容',
        timestamp: new Date().toISOString()
      }
      
      alert('✅ 发送成功')
      // 重置
      selectedPostNPC.value = ''
      showPostPromptEditor.value = false
      customPostPrompt.value = ''
      // 刷新统计
      await fetchStats()
      await fetchRecentMoments()
    } else {
      alert('❌ 发送失败: ' + (response.error || '未知错误'))
    }
  } catch (error: any) {
    console.error('手动发送失败:', error)
    alert('❌ 发送失败: ' + error.message)
  }
}

// NPC选择变化 - 评论
const onCommentNPCChange = () => {
  showCommentPromptEditor.value = false
  customCommentPrompt.value = ''
  currentCommentNPCInfo.value = commentNPCs.value.find((npc: any) => npc.id === selectedCommentNPC.value)
}

// 情感标签映射
const getEmotionLabel = (emotion: string) => {
  const labels: any = {
    neutral: '中性',
    positive: '正面/支持',
    negative: '负面/反对',
    happy: '开心/兴奋',
    sad: '悲伤/同情',
    angry: '愤怒/不满',
    surprised: '惊讶/意外',
    sarcastic: '讽刺/调侃'
  }
  return labels[emotion] || emotion
}

// 生成默认评论Prompt
const generateDefaultCommentPrompt = (npc: any, moment: any, emotion: string) => {
  const emotionGuides: any = {
    neutral: '保持客观中立的态度',
    positive: '表达支持和赞同',
    negative: '表达反对和批评',
    happy: '展现开心和兴奋的情绪',
    sad: '表达悲伤或同情',
    angry: '表达愤怒或强烈不满',
    surprised: '表达惊讶或意外',
    sarcastic: '使用讽刺或调侃的语气'
  }
  
  return `【角色扮演 - 评论生成】

你是：${npc.name}

🎭 性格：${npc.personality || '未设置'}
📝 习惯：${npc.habits || '未设置'}
❤️ 喜好：${npc.likes || '未设置'}
💢 厌恶：${npc.dislikes || '未设置'}
📚 背景：${npc.background || '未设置'}

📱 朋友圈内容：
${moment?.content || '（未知内容）'}

😊 情感倾向：${getEmotionLabel(emotion)}
${emotionGuides[emotion] || ''}

⚠️ 重要要求：
1. 必须完全符合你的性格和当前的情感倾向
2. 评论要简短精炼，10-40字
3. 要自然真实，像真人的评论
4. 可以用emoji，但不要过度
5. 根据情感倾向调整语气和内容
6. 不要说"作为XX"等死板用语
7. 可以是：赞同、质疑、调侃、吐槽、安慰等任何形式

只返回评论内容，不要引号、不要解释。`
}

// 预览评论Prompt
const previewCommentPrompt = () => {
  if (!currentCommentNPCInfo.value) {
    currentCommentNPCInfo.value = commentNPCs.value.find((npc: any) => npc.id === selectedCommentNPC.value)
  }
  
  const moment = roomMoments.value.find((m: any) => m.id === selectedMoment.value)
  customCommentPrompt.value = generateDefaultCommentPrompt(currentCommentNPCInfo.value, moment, commentEmotion.value)
  showCommentPromptEditor.value = true
}

// 重置评论Prompt
const resetCommentPrompt = () => {
  if (currentCommentNPCInfo.value) {
    const moment = roomMoments.value.find((m: any) => m.id === selectedMoment.value)
    customCommentPrompt.value = generateDefaultCommentPrompt(currentCommentNPCInfo.value, moment, commentEmotion.value)
  }
}

// 手动发送评论
const triggerManualComment = async () => {
  if (!selectedCommentNPC.value || !selectedMoment.value) {
    alert('请选择NPC和朋友圈')
    return
  }
  
  try {
    const body: any = {
      moment_id: selectedMoment.value,
      npc_id: selectedCommentNPC.value,
      emotion: commentEmotion.value
    }
    
    // 如果有自定义Prompt，传递给后端
    if (customCommentPrompt.value) {
      body.customPrompt = customCommentPrompt.value
    }
    
    const response = await $fetch('/api/moments/ai-comment', {
      method: 'POST',
      body
    })
    
    if (response.success) {
      alert('✅ 评论成功')
      // 重置
      selectedCommentNPC.value = ''
      selectedMoment.value = ''
      showCommentPromptEditor.value = false
      customCommentPrompt.value = ''
      commentEmotion.value = 'neutral'
      // 刷新统计
      await fetchStats()
      await fetchRecentMoments()
    } else {
      alert('❌ 评论失败: ' + (response.error || '未知错误'))
    }
  } catch (error: any) {
    console.error('手动评论失败:', error)
    alert('❌ 评论失败: ' + error.message)
  }
}

// ============ 朋友圈自动化 ============

const toggleAutoMode = async () => {
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
  
  // 发帖定时器
  postInterval = setInterval(async () => {
    try {
      const response = await $fetch('/api/moments/auto/post', { method: 'POST' })
      if (response.success) {
        autoStats.value.posts++
      }
    } catch (error) {
      console.error('自动发帖失败:', error)
    }
  }, postFrequency.value * 1000)
  
  // 评论定时器
  commentInterval = setInterval(async () => {
    try {
      const response = await $fetch('/api/moments/auto/comment', { method: 'POST' })
      if (response.success) {
        autoStats.value.comments += response.commentCount || 0
      }
    } catch (error) {
      console.error('自动评论失败:', error)
    }
  }, commentFrequency.value * 1000)
  
  // 运行时间计时器
  timeInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - autoStartTime.value) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    autoRunTime.value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }, 1000)
}

const stopAutoMode = () => {
  autoMode.value = false
  if (postInterval) clearInterval(postInterval)
  if (commentInterval) clearInterval(commentInterval)
  if (timeInterval) clearInterval(timeInterval)
  autoRunTime.value = '00:00'
}

// 获取统计
const fetchStats = async () => {
  try {
    const response = await $fetch('/api/moments/stats')
    if (response.success) {
      stats.value = response.stats
    }
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 获取最近朋友圈
const fetchRecentMoments = async () => {
  try {
    const response = await $fetch('/api/moments/recent')
    if (response.success) {
      recentMoments.value = response.moments
    }
  } catch (error) {
    console.error('获取朋友圈失败:', error)
  }
}

// 返回
const goBack = () => {
  router.push('/')
}

// 加载最近的玩家评论
const loadRecentPlayerComments = async () => {
  try {
    const response = await $fetch('/api/moments/recent-player-comments')
    if (response.success) {
      recentPlayerComments.value = response.comments
      console.log('📝 最近的玩家评论:', recentPlayerComments.value)
    }
  } catch (error) {
    console.error('加载玩家评论失败:', error)
  }
}

// 触发NPC回复玩家评论
const triggerNPCReplyToPlayer = async () => {
  if (!selectedPlayerComment.value) return
  
  npcReplyResult.value = null
  
  try {
    const response = await $fetch('/api/moments/auto-reply-player-comment', {
      method: 'POST',
      body: {
        commentId: selectedPlayerComment.value
      }
    })
    
    npcReplyResult.value = response
    
    if (response.success) {
      console.log('✅ NPC回复成功:', response)
      // 刷新评论列表
      await loadRecentPlayerComments()
    }
  } catch (error: any) {
    console.error('触发NPC回复失败:', error)
    npcReplyResult.value = {
      success: false,
      message: '触发失败: ' + (error.message || '未知错误')
    }
  }
}

// ============ 智能控制 ============

// 获取智能控制配置和统计
const fetchControlStats = async () => {
  try {
    const response = await $fetch('/api/admin/auto-control/config')
    if (response.success) {
      controlConfig.value = response.config
      controlStats.value = response.stats
      console.log('📊 智能控制统计:', response.stats)
    }
  } catch (error) {
    console.error('获取智能控制配置失败:', error)
  }
}

// 保存配置
const saveControlConfig = async () => {
  try {
    const response = await $fetch('/api/admin/auto-control/update', {
      method: 'POST',
      body: {
        config: controlConfig.value
      }
    })
    
    if (response.success) {
      console.log('✅ 配置已保存')
      // 刷新统计
      await fetchControlStats()
    } else {
      alert('保存失败: ' + response.error)
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    alert('保存失败')
  }
}

// 切换全局自动化
const toggleGlobalAuto = async (event: any) => {
  const enabled = event.target.checked
  controlConfig.value.globalAutoEnabled = enabled
  await saveControlConfig()
  
  if (!enabled) {
    alert('⏸️ 全局自动化已关闭')
  } else {
    alert('✅ 全局自动化已开启')
  }
}

// 切换在线检测
const toggleOnlineCheck = async (event: any) => {
  const enabled = event.target.checked
  controlConfig.value.requireOnlineUsers = enabled
  await saveControlConfig()
}

// 紧急停止
const emergencyStop = async () => {
  const confirm = window.confirm(
    '🚨 确定要紧急停止所有自动化吗？\n\n这将：\n• 关闭全局自动化开关\n• 停止所有房间的自动对话\n• 停止朋友圈自动生成'
  )
  
  if (!confirm) return
  
  try {
    const response = await $fetch('/api/admin/auto-control/emergency-stop', {
      method: 'POST'
    })
    
    if (response.success) {
      alert('🚨 ' + response.message)
      await fetchControlStats()
      await fetchRooms()
    } else {
      alert('操作失败: ' + response.error)
    }
  } catch (error) {
    console.error('紧急停止失败:', error)
    alert('操作失败')
  }
}

// 获取使用率样式类
const getUsageClass = (percent: number) => {
  if (percent >= 90) return 'usage-critical'
  if (percent >= 75) return 'usage-warning'
  if (percent >= 50) return 'usage-normal'
  return 'usage-good'
}

// 快速切换房间自动模式
const quickToggleRoomAuto = async (roomId: string, enabled: boolean) => {
  try {
    const response = await $fetch('/api/admin/rooms/auto-mode', {
      method: 'POST',
      body: {
        roomId,
        enabled
      }
    })
    
    if (response.success) {
      console.log(`✅ 房间 ${roomId} 自动模式已${enabled ? '开启' : '关闭'}`)
      await fetchRooms()
    } else {
      alert('操作失败: ' + (response.error || '未知错误'))
      // 恢复开关状态
      await fetchRooms()
    }
  } catch (error) {
    console.error('切换房间自动模式失败:', error)
    alert('操作失败')
    // 恢复开关状态
    await fetchRooms()
  }
}

// ============ 朋友圈自动化控制（智能控制页面）============

// 启动/停止发帖
const toggleMomentsPost = () => {
  if (momentsPostRunning.value) {
    stopMomentsPost()
  } else {
    startMomentsPost()
  }
}

// 启动发帖
const startMomentsPost = async () => {
  if (!momentsPostInterval.value || momentsPostInterval.value < 10) {
    alert('请设置有效的发帖间隔（最少10秒）')
    return
  }
  
  momentsPostRunning.value = true
  
  // 更新开始时间
  if (!momentsCommentRunning.value) {
    momentsStartTime.value = Date.now()
    startMomentsTimer()
  }
  
  console.log(`▶️ 启动朋友圈自动发帖，间隔：${momentsPostInterval.value}秒`)
  
  // 立即执行一次
  await executeMomentsPost()
  
  // 设置定时器
  momentsPostTimer = setInterval(async () => {
    await executeMomentsPost()
  }, momentsPostInterval.value * 1000)
}

// 停止发帖
const stopMomentsPost = () => {
  momentsPostRunning.value = false
  if (momentsPostTimer) {
    clearInterval(momentsPostTimer)
    momentsPostTimer = null
  }
  
  // 如果评论也停止了，停止计时器
  if (!momentsCommentRunning.value) {
    stopMomentsTimer()
  }
  
  console.log('⏸️ 停止朋友圈自动发帖')
}

// 执行发帖
const executeMomentsPost = async () => {
  try {
    const response = await $fetch('/api/moments/auto/post', { method: 'POST' })
    if (response.success) {
      momentsStats.value.posts++
      console.log('✅ 自动发布朋友圈成功')
    }
  } catch (error) {
    console.error('自动发帖失败:', error)
  }
}

// 启动/停止评论
const toggleMomentsComment = () => {
  if (momentsCommentRunning.value) {
    stopMomentsComment()
  } else {
    startMomentsComment()
  }
}

// 启动评论
const startMomentsComment = async () => {
  if (!momentsCommentInterval.value || momentsCommentInterval.value < 5) {
    alert('请设置有效的评论间隔（最少5秒）')
    return
  }
  
  momentsCommentRunning.value = true
  
  // 更新开始时间
  if (!momentsPostRunning.value) {
    momentsStartTime.value = Date.now()
    startMomentsTimer()
  }
  
  console.log(`▶️ 启动朋友圈自动评论，间隔：${momentsCommentInterval.value}秒`)
  
  // 立即执行一次
  await executeMomentsComment()
  
  // 设置定时器
  momentsCommentTimer = setInterval(async () => {
    await executeMomentsComment()
  }, momentsCommentInterval.value * 1000)
}

// 停止评论
const stopMomentsComment = () => {
  momentsCommentRunning.value = false
  if (momentsCommentTimer) {
    clearInterval(momentsCommentTimer)
    momentsCommentTimer = null
  }
  
  // 如果发帖也停止了，停止计时器
  if (!momentsPostRunning.value) {
    stopMomentsTimer()
  }
  
  console.log('⏸️ 停止朋友圈自动评论')
}

// 执行评论
const executeMomentsComment = async () => {
  try {
    const response = await $fetch('/api/moments/auto/comment', { method: 'POST' })
    if (response.success) {
      momentsStats.value.comments += response.commentCount || 0
      console.log('✅ 自动评论成功')
    }
  } catch (error) {
    console.error('自动评论失败:', error)
  }
}

// 启动计时器
const startMomentsTimer = () => {
  momentsTimeTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - momentsStartTime.value) / 1000)
    const hours = Math.floor(elapsed / 3600)
    const minutes = Math.floor((elapsed % 3600) / 60)
    const seconds = elapsed % 60
    
    if (hours > 0) {
      momentsRunTime.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    } else {
      momentsRunTime.value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
  }, 1000)
}

// 停止计时器
const stopMomentsTimer = () => {
  if (momentsTimeTimer) {
    clearInterval(momentsTimeTimer)
    momentsTimeTimer = null
  }
  momentsRunTime.value = '00:00'
}

// 启动全部
const startAllMomentsAuto = () => {
  if (!momentsPostInterval.value || !momentsCommentInterval.value) {
    alert('请先设置发帖和评论的间隔时间')
    return
  }
  
  momentsStats.value = { posts: 0, comments: 0 }
  startMomentsPost()
  startMomentsComment()
}

// 停止全部
const stopAllMomentsAuto = () => {
  stopMomentsPost()
  stopMomentsComment()
}

// 应用预设
const applyMomentsPreset = (preset: string) => {
  switch (preset) {
    case 'slow':
      momentsPostInterval.value = 120
      momentsCommentInterval.value = 60
      break
    case 'normal':
      momentsPostInterval.value = 60
      momentsCommentInterval.value = 30
      break
    case 'fast':
      momentsPostInterval.value = 30
      momentsCommentInterval.value = 15
      break
  }
  console.log(`📋 已应用预设: ${preset}`)
}

// 计算开启自动模式的房间
const autoRooms = computed(() => {
  return rooms.value.filter((room: any) => room.auto_mode === 1)
})

// 测试单个房间的自动对话
const testRoomAutoChat = async (roomId: string, roomName: string) => {
  console.log(`🧪 测试房间 ${roomId} (${roomName}) 的自动对话`)
  
  try {
    const response = await $fetch('/api/admin/rooms/trigger-auto-chat', {
      method: 'POST',
      body: { roomId }
    })
    
    if (response.success) {
      const messageCount = response.messages?.length || 0
      alert(`✅ 测试成功！\n\n房间：${roomName}\n生成消息：${messageCount} 条`)
      console.log(`✅ 房间 ${roomName} 生成了 ${messageCount} 条消息`)
    } else {
      alert(`❌ 测试失败\n\n${response.error || '未知错误'}`)
      console.error('测试失败:', response.error)
    }
  } catch (error: any) {
    console.error('测试房间自动对话失败:', error)
    alert(`❌ 测试失败\n\n${error.message || '未知错误'}`)
  }
}

// 批量触发所有开启自动模式的房间
const triggerAllAutoRooms = async () => {
  const count = autoRooms.value.length
  
  if (count === 0) {
    alert('没有开启自动模式的房间')
    return
  }
  
  const confirm = window.confirm(
    `确定要触发 ${count} 个房间的自动对话吗？\n\n这将为每个开启自动模式的房间生成一轮对话。`
  )
  
  if (!confirm) return
  
  console.log(`🚀 批量触发 ${count} 个房间的自动对话`)
  
  try {
    const response = await $fetch('/api/admin/rooms/auto-task')
    
    if (response.success) {
      const results = response.results || []
      const successCount = results.filter((r: any) => r.success).length
      const failCount = results.length - successCount
      
      let message = `✅ 批量触发完成！\n\n`
      message += `成功：${successCount} 个房间\n`
      if (failCount > 0) {
        message += `失败：${failCount} 个房间\n\n`
        message += `失败的房间：\n`
        results.filter((r: any) => !r.success).forEach((r: any) => {
          message += `• ${r.roomName}: ${r.error}\n`
        })
      }
      
      alert(message)
      console.log('📊 批量触发结果:', results)
    } else {
      alert(`❌ 批量触发失败\n\n${response.error || '未知错误'}`)
    }
  } catch (error: any) {
    console.error('批量触发失败:', error)
    alert(`❌ 批量触发失败\n\n${error.message || '未知错误'}`)
  }
}

// ========== 房间自动发言控制 ==========

// 切换房间自动发言
const toggleRoomAutoSpeak = (roomId: string, roomName: string) => {
  if (autoRoomRunning.value[roomId]) {
    stopRoomAutoSpeak(roomId)
  } else {
    startRoomAutoSpeak(roomId, roomName)
  }
}

// 启动房间自动发言
const startRoomAutoSpeak = (roomId: string, roomName: string) => {
  const interval = autoIntervals.value[roomId]
  
  if (!interval || interval < 10) {
    alert('请设置至少10秒的间隔时间')
    return
  }
  
  console.log(`▶️ 启动房间 ${roomName} (ID: ${roomId}) 自动发言，间隔 ${interval} 秒`)
  
  // 设置运行状态
  autoRoomRunning.value[roomId] = true
  
  // 初始化倒计时
  autoCountdowns.value[roomId] = interval
  
  // 立即执行一次
  executeRoomAutoChat(roomId, roomName)
  
  // 启动定时器
  autoTimers.value[roomId] = setInterval(() => {
    executeRoomAutoChat(roomId, roomName)
    autoCountdowns.value[roomId] = interval // 重置倒计时
  }, interval * 1000)
  
  // 启动倒计时定时器（每秒更新一次）
  countdownTimers.value[roomId] = setInterval(() => {
    if (autoCountdowns.value[roomId] > 0) {
      autoCountdowns.value[roomId]--
    }
  }, 1000)
}

// 停止房间自动发言
const stopRoomAutoSpeak = (roomId: string) => {
  console.log(`⏸️ 停止房间 ${roomId} 自动发言`)
  
  // 清除定时器
  if (autoTimers.value[roomId]) {
    clearInterval(autoTimers.value[roomId])
    delete autoTimers.value[roomId]
  }
  
  // 清除倒计时定时器
  if (countdownTimers.value[roomId]) {
    clearInterval(countdownTimers.value[roomId])
    delete countdownTimers.value[roomId]
  }
  
  // 更新状态
  autoRoomRunning.value[roomId] = false
  autoCountdowns.value[roomId] = 0
}

// 执行房间自动对话
const executeRoomAutoChat = async (roomId: string, roomName: string) => {
  console.log(`💬 执行房间 ${roomName} (ID: ${roomId}) 自动对话...`)
  
  try {
    const response = await $fetch('/api/admin/rooms/trigger-auto-chat', {
      method: 'POST',
      body: { roomId }
    })
    
    if (response.success) {
      const messageCount = response.messages?.length || 0
      console.log(`✅ 房间 ${roomName} 生成了 ${messageCount} 条对话`)
    } else {
      console.error(`❌ 房间 ${roomName} 生成失败:`, response.error)
      
      // 如果是被智能控制阻止，停止该房间的自动发言
      if (response.blocked) {
        console.log(`⏸️ 房间 ${roomName} 因智能控制限制自动停止`)
        stopRoomAutoSpeak(roomId)
      }
    }
  } catch (error: any) {
    console.error(`❌ 房间 ${roomName} 自动对话失败:`, error)
  }
}

// 停止所有房间的自动发言
const stopAllRoomAutoSpeak = () => {
  console.log('⏸️ 停止所有房间的自动发言')
  
  Object.keys(autoTimers.value).forEach(roomId => {
    stopRoomAutoSpeak(roomId)
  })
}

// 初始化房间间隔设置（加载房间时调用）
const initRoomAutoIntervals = () => {
  rooms.value.forEach((room: any) => {
    if (!autoIntervals.value[room.id]) {
      // 默认间隔60秒
      autoIntervals.value[room.id] = 60
    }
    if (autoRoomRunning.value[room.id] === undefined) {
      autoRoomRunning.value[room.id] = false
    }
  })
}

// 检查登录状态
const checkAuth = async () => {
  try {
    const response = await $fetch('/api/auth/me')
    if (!response.user) {
      // 未登录，跳转到管理后台登录页
      console.log('⚠️ 未登录，跳转到管理后台登录页')
      router.push('/admin/login')
      return false
    }
    console.log('✅ 已登录:', response.user.username)
    currentUser.value = response.user.nickname || response.user.username
    return true
  } catch (error) {
    console.error('检查登录状态失败:', error)
    router.push('/admin/login')
    return false
  }
}

// 退出登录
const logout = async () => {
  const confirm = window.confirm('确定要退出登录吗？')
  if (!confirm) return
  
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    console.log('✅ 已退出登录')
    router.push('/admin/login')
  } catch (error) {
    console.error('退出登录失败:', error)
    // 即使失败也跳转到登录页
    router.push('/admin/login')
  }
}

onMounted(async () => {
  // 检查登录状态
  const isLoggedIn = await checkAuth()
  if (!isLoggedIn) {
    return // 未登录，已跳转到登录页
  }
  
  // 已登录，加载数据
  fetchControlStats()
  fetchRooms()
  fetchStats()
  fetchRecentMoments()
  loadRecentPlayerComments()
  
  // 每30秒自动刷新统计
  setInterval(() => {
    if (currentTab.value === 'control') {
      fetchControlStats()
    }
  }, 30000)
})

onUnmounted(() => {
  stopAutoMode()
  stopAllMomentsAuto()
  stopAllRoomAutoSpeak()
})
</script>

<style scoped>
/* NPC回复结果样式 */
.result-message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
}

.result-message.success {
  background: #e8f5e9;
  border: 1px solid #4caf50;
  color: #2e7d32;
}

.result-message.error {
  background: #ffebee;
  border: 1px solid #f44336;
  color: #c62828;
}

.reply-list {
  margin-top: 0.5rem;
}

.reply-list ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
}

.reply-list li {
  padding: 0.5rem;
  margin: 0.3rem 0;
  background: rgba(255,255,255,0.6);
  border-radius: 4px;
  font-size: 0.9rem;
}

/* 模态框遮罩层 */
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
  z-index: 9999;
  padding: 20px;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 模态框内容 */
.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.admin-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
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
}

.admin-header h1 {
  font-size: 2rem;
  margin: 0;
}

.header-actions-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  font-size: 0.95rem;
  color: #666;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border-radius: 20px;
}

.btn-logout {
  background: #ff4757;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #ee5a6f;
  transform: translateY(-1px);
}

.btn-back {
  background: white;
  border: 1px solid #e0e0e0;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f5f5f5;
}

/* Tab导航 */
.admin-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: white;
  padding: 0.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #f5f5f5;
}

.tab-btn.active {
  background: #07c160;
  color: white;
}

/* 卡片 */
.admin-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.card-header h2 {
  font-size: 1.25rem;
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}

/* 群聊列表 */
.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.room-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.room-info-section {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.room-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
}

.room-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.room-details p {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.room-details small {
  color: #999;
  font-size: 0.8rem;
}

.room-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 开关样式 */
.switch-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.switch-input {
  display: none;
}

.switch-slider {
  width: 40px;
  height: 20px;
  background: #ccc;
  border-radius: 20px;
  position: relative;
  transition: background 0.2s;
}

.switch-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
}

.switch-input:checked + .switch-slider {
  background: #07c160;
}

.switch-input:checked + .switch-slider::before {
  transform: translateX(20px);
}

.form-input-small {
  width: 80px;
  padding: 0.25rem 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.btn-delete-room {
  background: #ff4757;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-delete-room:hover {
  background: #ee5a6f;
  transform: translateY(-1px);
}

.btn-delete-room:active {
  transform: translateY(0);
}

/* NPC管理样式 */
.npcs-by-room {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.room-group {
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.room-group:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.room-group.collapsed {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.room-group-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem 1.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  user-select: none;
}

.room-group-header:hover {
  background: linear-gradient(135deg, #5568d3 0%, #6b3f91 100%);
}

.room-group-header:active {
  transform: scale(0.98);
}

.collapse-icon {
  font-size: 0.9rem;
  transition: transform 0.3s ease;
  width: 20px;
  display: inline-block;
}

.room-group.collapsed .collapse-icon {
  transform: rotate(-90deg);
}

.room-group-header h3 {
  margin: 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.npc-count {
  font-size: 0.9rem;
  font-weight: normal;
  opacity: 0.9;
}

.npcs-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0.5rem;
}

.npc-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  margin: 0.5rem;
  transition: all 0.2s;
}

.npc-item-clickable {
  cursor: pointer;
  border: 2px solid transparent;
}

.npc-item-clickable:hover {
  background: #e9ecef;
  transform: translateX(4px);
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.npc-item-clickable:active {
  transform: translateX(2px);
  box-shadow: 0 1px 4px rgba(102, 126, 234, 0.3);
}

.npc-avatar-section {
  flex-shrink: 0;
}

.npc-avatar-preview {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  overflow: hidden;
}

.npc-avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.npc-info-section {
  flex: 1;
  min-width: 0;
}

.npc-info-section h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: #333;
}

.npc-room {
  font-size: 0.875rem;
  color: #666;
  margin: 0.25rem 0;
}

.npc-profile {
  font-size: 0.875rem;
  color: #888;
  margin: 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.npc-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.edit-hint {
  color: #667eea;
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0;
  transition: all 0.3s;
  white-space: nowrap;
}

.npc-item-clickable:hover .edit-hint {
  opacity: 1;
  transform: translateX(4px);
}

.btn-edit {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: #5568d3;
  transform: translateY(-1px);
}

.btn-refresh {
  background: #07c160;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: #06ad56;
}

/* 过渡动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Creator风格模态框 */
.modal-large {
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-creator-style {
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-creator-style .modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: none;
}

.modal-title-section h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.modal-subtitle {
  margin: 0;
  font-size: 1rem;
  opacity: 0.9;
}

.btn-close-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-close-circle:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-creator-style .modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: #f8f9fa;
}

.modal-creator-style .modal-footer {
  background: white;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:hover {
  border-color: #c0c4d0;
}

.avatar-upload-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.avatar-input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-upload {
  background: #667eea;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
  font-size: 0.9rem;
}

.btn-upload:hover {
  background: #5568d3;
}

.format-hint {
  font-size: 0.75rem;
  color: #07c160;
  font-weight: 500;
}

.avatar-preview-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f0f0f0;
  border: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  overflow: hidden;
  margin-top: 0.5rem;
}

.avatar-preview-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea:hover {
  border-color: #c0c4d0;
}

/* Creator风格按钮 */
.modal-creator-style .btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.modal-creator-style .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.modal-creator-style .btn-primary:active {
  transform: translateY(0);
}

.modal-creator-style .btn-secondary {
  background: #f0f0f0;
  color: #666;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-creator-style .btn-secondary:hover {
  background: #e0e0e0;
}

/* 朋友圈管理样式 */
.manual-controls {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.control-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.control-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
}

/* Prompt显示样式 */
.prompt-display {
  margin-top: 2rem;
  background: #fff;
  border: 2px solid #07c160;
  border-radius: 12px;
  padding: 1.5rem;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f0f0f0;
}

.prompt-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.btn-close-small {
  background: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close-small:hover {
  background: #ff4d4f;
  color: white;
  transform: rotate(90deg);
}

.prompt-meta {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 0.9rem;
  color: #666;
  padding: 0.4rem 0.8rem;
  background: #f5f5f5;
  border-radius: 6px;
}

.prompt-content {
  background: #f9f9f9;
  border-left: 4px solid #07c160;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
  max-height: 400px;
  overflow-y: auto;
}

.prompt-content pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #333;
}

.prompt-result {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.prompt-result strong {
  color: #0050b3;
  display: block;
  margin-bottom: 0.5rem;
}

.prompt-result p {
  margin: 0;
  color: #333;
  line-height: 1.6;
}

/* Prompt编辑器样式 */
.prompt-editor {
  margin-top: 2rem;
  background: #f0f7ff;
  border: 2px solid #4096ff;
  border-radius: 12px;
  padding: 1.5rem;
  animation: slideDown 0.3s ease-out;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #d0e5ff;
}

.editor-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #0050b3;
}

.editor-info {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.info-item {
  font-size: 0.9rem;
  color: #0050b3;
  padding: 0.4rem 0.8rem;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #91d5ff;
}

.editor-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.editor-controls label {
  font-weight: bold;
  color: #0050b3;
}

.form-input-small {
  padding: 0.5rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 0.9rem;
}

.editor-body {
  margin: 1rem 0;
}

.editor-body label {
  display: block;
  font-weight: bold;
  color: #0050b3;
  margin-bottom: 0.5rem;
}

.form-textarea-large {
  width: 100%;
  padding: 1rem;
  border: 2px solid #d0e5ff;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  resize: vertical;
  background: #fff;
}

.form-textarea-large:focus {
  outline: none;
  border-color: #4096ff;
  box-shadow: 0 0 0 2px rgba(64, 150, 255, 0.2);
}

.editor-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn-action {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-action:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-action:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.description {
  color: #666;
  margin-bottom: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-group {
  flex: 1;
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.hint {
  display: block;
  color: #999;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.auto-stats {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.stat-row {
  display: flex;
  gap: 2rem;
  justify-content: center;
  font-weight: 500;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-large {
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
  font-weight: 500;
}

.btn-success {
  background: #07c160;
  color: white;
}

.btn-success:hover {
  background: #06ad56;
}

.btn-danger {
  background: #ff4757;
  color: white;
}

.btn-danger:hover {
  background: #ee5a6f;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-running {
  background: #d1f4e0;
  color: #07c160;
}

.status-idle {
  background: #f0f0f0;
  color: #999;
}

.btn-refresh {
  background: #f0f0f0;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-refresh:hover {
  background: #e0e0e0;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  text-align: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #07c160;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

/* 朋友圈列表 */
.moments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.moment-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.moment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img-small {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.moment-content {
  flex: 1;
}

.moment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.moment-author {
  font-weight: 600;
}

.moment-time {
  color: #999;
  font-size: 0.85rem;
}

.moment-text {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.moment-stats {
  display: flex;
  gap: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.empty-hint {
  text-align: center;
  color: #999;
  padding: 2rem;
}

/* 智能控制样式 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-box {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  color: #333;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid #e0e0e0;
  transition: all 0.3s;
}

.stat-box:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.stat-icon {
  font-size: 2.5rem;
  opacity: 1;
  filter: none;
}

.stat-details {
  flex: 1;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
  color: #667eea;
}

.stat-sub {
  font-size: 0.8rem;
  color: #999;
}

.usage-good {
  color: #07c160 !important;
}

.usage-normal {
  color: #1890ff !important;
}

.usage-warning {
  color: #faad14 !important;
}

.usage-critical {
  color: #ff4d4f !important;
}

.progress-section {
  margin-top: 1rem;
}

.progress-bar {
  width: 100%;
  height: 30px;
  background: #f0f0f0;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  transition: all 0.5s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  font-weight: bold;
  font-size: 0.85rem;
  color: white;
}

.progress-fill.usage-good {
  background: linear-gradient(90deg, #07c160, #06ad56);
}

.progress-fill.usage-normal {
  background: linear-gradient(90deg, #1890ff, #1370d8);
}

.progress-fill.usage-warning {
  background: linear-gradient(90deg, #faad14, #e09c0b);
}

.progress-fill.usage-critical {
  background: linear-gradient(90deg, #ff4d4f, #e03e40);
}

.control-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.control-item {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.label-icon {
  font-size: 1.2rem;
}

.label-text {
  flex: 1;
}

.control-hint {
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  color: #666;
}

.control-hint.danger {
  color: #ff4757;
  font-weight: 500;
}

.emergency-control {
  background: #fff5f5;
  border-color: #ff4d4f;
}

.btn-emergency {
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4757, #ee5a6f);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
}

.btn-emergency:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 71, 87, 0.4);
}

.btn-emergency:active:not(:disabled) {
  transform: translateY(0);
}

.btn-emergency:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-range input {
  width: 80px;
}

.header-hint {
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  color: #666;
  font-weight: normal;
}

.header-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.btn-trigger-all {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-trigger-all:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-trigger-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rooms-auto-status {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.room-status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  transition: all 0.3s;
}

.room-status-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

/* 扩展版房间状态项（包含自动发言控制） */
.room-status-item-expanded {
  padding: 1.25rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  transition: all 0.3s;
  margin-bottom: 1rem;
}

.room-status-item-expanded:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.room-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

/* 房间自动发言控制区域 */
.room-auto-speak-control {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #e0e0e0;
}

.auto-speak-settings {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.setting-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
}

.form-input-number-small {
  width: 80px;
  padding: 0.4rem 0.6rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.form-input-number-small:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input-number-small:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.input-unit {
  font-size: 0.85rem;
  color: #999;
}

.btn-auto-toggle {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-auto-start {
  background: linear-gradient(135deg, #07c160, #05a34d);
  color: white;
  box-shadow: 0 2px 6px rgba(7, 193, 96, 0.3);
}

.btn-auto-start:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(7, 193, 96, 0.4);
}

.btn-auto-stop {
  background: linear-gradient(135deg, #ff4757, #ee5a6f);
  color: white;
  box-shadow: 0 2px 6px rgba(255, 71, 87, 0.3);
}

.btn-auto-stop:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(255, 71, 87, 0.4);
}

.btn-auto-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.auto-speak-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #bae7ff;
}

.status-indicator {
  font-size: 0.8rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text-run {
  font-size: 0.85rem;
  font-weight: 600;
  color: #07c160;
}

.countdown-text {
  font-size: 0.85rem;
  color: #666;
  margin-left: auto;
}

.room-status-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.room-status-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.room-status-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.room-status-name {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
}

.room-status-meta {
  font-size: 0.8rem;
  color: #999;
}

.room-status-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn-test {
  padding: 0.4rem 0.8rem;
  background: linear-gradient(135deg, #1890ff, #1370d8);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
}

.btn-test:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(24, 144, 255, 0.4);
}

.btn-test:active {
  transform: translateY(0);
}

.switch-label-inline {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.status-text {
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 40px;
}

.text-active {
  color: #07c160;
}

.text-inactive {
  color: #999;
}

.room-status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-active {
  background: #d1f4e0;
  color: #07c160;
}

.status-inactive {
  background: #f0f0f0;
  color: #999;
}

/* 朋友圈自动化样式 */
.moments-auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.moments-control-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  transition: all 0.3s;
}

.moments-control-section:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.moments-control-section.full-width {
  grid-column: 1 / -1;
}

.section-title {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row-compact {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.form-label {
  font-weight: 500;
  color: #666;
  white-space: nowrap;
}

.form-input-number {
  width: 120px;
  padding: 0.5rem 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input-number:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-hint {
  font-size: 0.8rem;
  color: #999;
}

.stats-row {
  display: flex;
  gap: 2rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #667eea;
}

.btn-toggle {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-toggle:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-toggle:active:not(:disabled) {
  transform: translateY(0);
}

.btn-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-toggle.btn-success {
  background: linear-gradient(135deg, #07c160, #06ad56);
  color: white;
}

.btn-toggle.btn-danger {
  background: linear-gradient(135deg, #ff4757, #ee5a6f);
  color: white;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-quick {
  padding: 0.75rem 1.5rem;
  border: 2px solid;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.btn-quick:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-quick:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-success-outline {
  border-color: #07c160;
  color: #07c160;
}

.btn-success-outline:hover:not(:disabled) {
  background: #07c160;
  color: white;
}

.btn-danger-outline {
  border-color: #ff4757;
  color: #ff4757;
}

.btn-danger-outline:hover:not(:disabled) {
  background: #ff4757;
  color: white;
}

.quick-presets {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 1rem;
  background: #f0f7ff;
  border-radius: 8px;
}

.preset-label {
  font-weight: 600;
  color: #667eea;
}

.btn-preset {
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #667eea;
  border-radius: 6px;
  color: #667eea;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preset:hover {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}

.btn-preset:active {
  transform: translateY(0);
}
</style>

