<template>
  <div class="app-wrapper">
    <!-- 主容器 -->
    <div :class="['main-container', { 'mobile-mode': !isFullscreen }]">
      <!-- 左侧/底部导航栏 -->
      <nav :class="['nav-bar', { 'mobile': !isFullscreen }]">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['nav-item', { active: currentTab === tab.key }]"
          @click="switchTab(tab.key)"
        >
          <span class="nav-icon">{{ tab.icon }}</span>
          <span class="nav-label">{{ tab.label }}</span>
          <span v-if="tab.badge > 0" class="nav-badge">{{ tab.badge > 99 ? '99+' : tab.badge }}</span>
        </button>
      </nav>

      <!-- 主内容区 -->
      <div class="content-area">
        <!-- Tab 1: 聊天列表 -->
        <div v-show="currentTab === 'chats'" class="tab-content">
          <div class="content-header">
            <h1>聊天</h1>
            <div class="header-actions">
              <button @click="showCreateRoomModal = true" class="btn-action">
                ➕
              </button>
              <button @click="showJoinRoomModal = true" class="btn-action">
                🔍
              </button>
              <button @click="toggleViewMode" class="btn-action">
                {{ isFullscreen ? '📱' : '🖥️' }}
              </button>
            </div>
          </div>

          <div class="chat-list">
            <!-- 预设房间 -->
            <div class="section">
              <h3 class="section-title">🎭 热门房间</h3>
              <div class="room-grid">
                <div
                  v-for="room in presetRooms"
                  :key="room.id"
                  class="room-card preset"
                  @click="joinPresetRoom(room.id)"
                >
                  <div class="room-avatar">{{ room.avatar }}</div>
                  <div class="room-info">
                    <div class="room-name">{{ room.name }}</div>
                    <div class="room-desc">{{ room.description }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 我的群聊 -->
            <div class="section">
              <h3 class="section-title">我的群聊</h3>
              <div v-if="myRooms.length === 0" class="empty-state">
                <div class="empty-icon">📭</div>
                <p>还没有加入任何群聊</p>
              </div>
              <div v-else class="room-list">
                <div
                  v-for="room in myRooms"
                  :key="room.id"
                  class="room-item"
                  @click="enterRoom(room.id)"
                >
                  <div class="room-avatar">{{ room.avatar || '聊' }}</div>
                  <div class="room-info">
                    <div class="room-top">
                      <span class="room-name">{{ room.name }}</span>
                      <span class="room-time">{{ formatTime(room.last_message_time) }}</span>
                    </div>
                    <div class="room-bottom">
                      <span class="room-last-msg">{{ room.last_message || '暂无消息' }}</span>
                      <span v-if="room.unread_count > 0" class="unread-badge">
                        {{ room.unread_count > 99 ? '99+' : room.unread_count }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: 联系人 -->
        <div v-show="currentTab === 'contacts'" class="tab-content">
          <div class="content-header">
            <h1>联系人</h1>
          </div>
          <div class="contacts-content">
            <div v-if="myContacts.length === 0" class="empty-state">
              <div class="empty-icon">👥</div>
              <p>还没有联系人</p>
              <p class="hint">加入房间后，房间里的NPC会成为你的好友</p>
            </div>
            <div v-else class="contacts-list">
              <!-- 玩家好友 -->
              <div class="section" v-if="playerFriends.length > 0">
                <h3 class="section-title">👥 玩家好友（{{ playerFriends.length }}）</h3>
                <div
                  v-for="friend in playerFriends"
                  :key="'user-' + friend.id"
                  class="contact-item"
                  @click="viewPlayerProfile(friend)"
                >
                  <div class="contact-avatar">
                    <img 
                      v-if="isImageAvatar(friend.avatar)"
                      :src="friend.avatar" 
                      alt="avatar"
                      class="avatar-img"
                    />
                    <span v-else>👤</span>
                  </div>
                  <div class="contact-info">
                    <div class="contact-name">{{ friend.nickname || friend.username }}</div>
                    <div class="contact-desc">{{ friend.signature || '这个人很懒，什么都没留下' }}</div>
                  </div>
                  <div class="contact-actions">
                    <button @click.stop="viewPlayerProfile(friend)" class="btn-icon">
                      📋
                    </button>
                  </div>
                </div>
              </div>

              <!-- NPC好友 -->
              <div class="section">
                <h3 class="section-title">🤖 NPC好友（{{ myContacts.length }}）</h3>
                <div
                  v-for="contact in myContacts"
                  :key="'npc-' + contact.id"
                  class="contact-item"
                  @click="viewContactProfile(contact)"
                >
                  <div class="contact-avatar">
                    <img 
                      v-if="isImageAvatar(contact.avatar)"
                      :src="contact.avatar" 
                      alt="avatar"
                      class="avatar-img"
                    />
                    <span v-else>{{ contact.avatar || '🤖' }}</span>
                  </div>
                  <div class="contact-info">
                    <div class="contact-name">{{ contact.name }}</div>
                    <div class="contact-desc">来自：{{ contact.room_name }}</div>
                  </div>
                  <div class="contact-actions">
                    <button @click.stop="viewContactProfile(contact)" class="btn-icon">
                      📋
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: 朋友圈 -->
        <div v-show="currentTab === 'moments'" class="tab-content">
          <div class="content-header">
            <h1>朋友圈</h1>
            <button @click="showCreateMomentModal = true" class="btn-action">
              ➕
            </button>
          </div>
          
          <!-- 通知横幅 -->
          <div v-if="showNotifications && momentsNotifications.length > 0" class="notifications-banner">
            <div class="banner-header">
              <div class="banner-title">
                <span class="badge-pulse">{{ momentsNotifications.length }}</span>
                <span>条新互动</span>
              </div>
              <button @click="showNotifications = false" class="btn-collapse">
                <span>收起</span>
                <span class="arrow">▲</span>
              </button>
            </div>
            <div class="notifications-scroll">
              <div 
                v-for="(notif, index) in momentsNotifications.slice(0, 5)" 
                :key="notif.id"
                class="notif-card"
                :style="{ animationDelay: `${index * 0.1}s` }"
              >
                <div class="notif-icon" :class="`notif-type-${notif.type}`">
                  <span v-if="notif.type === 'moment_comment'">💬</span>
                  <span v-else-if="notif.type === 'reply'">↩️</span>
                  <span v-else>👥</span>
                </div>
                <div class="notif-avatar-wrapper">
                  <img 
                    v-if="isImageAvatar(notif.author_avatar)"
                    :src="notif.author_avatar" 
                    alt="avatar"
                    class="notif-avatar-img"
                  />
                  <span v-else class="notif-avatar-text">{{ notif.author_avatar }}</span>
                </div>
                <div class="notif-body">
                  <div class="notif-header">
                    <span class="notif-author">{{ notif.author_name }}</span>
                    <span class="notif-time">{{ formatTime(notif.created_at) }}</span>
                  </div>
                  <div class="notif-action">
                    <span v-if="notif.type === 'moment_comment'" class="action-text">评论了你的朋友圈</span>
                    <span v-else-if="notif.type === 'reply'" class="action-text">回复了你</span>
                    <span v-else class="action-text">也参与了评论</span>
                  </div>
                  <div class="notif-message">
                    <span class="quote-mark">"</span>
                    {{ notif.comment_content }}
                    <span class="quote-mark">"</span>
                  </div>
                  <div v-if="notif.moment_content" class="notif-context">
                    原内容：{{ notif.moment_content }}
                  </div>
                </div>
              </div>
            </div>
            <div class="banner-footer">
              <button @click="markMomentsAsRead" class="btn-mark-read">
                <span class="btn-icon">✓</span>
                <span>全部已读</span>
              </button>
            </div>
          </div>
          
          <div class="moments-feed">
            <div v-if="allMoments.length === 0" class="empty-state">
              <div class="empty-icon">💬</div>
              <p>还没有朋友圈动态</p>
              <p class="hint">加入房间后，可以在这里看到NPC和玩家的朋友圈</p>
            </div>
            <div v-else class="moments-list">
              <div
                v-for="moment in allMoments"
                :key="moment.id"
                class="moment-card"
              >
                <div class="moment-header">
                  <div class="moment-avatar">
                    <img 
                      v-if="isImageAvatar(moment.user_avatar || moment.npc_avatar)"
                      :src="moment.user_avatar || moment.npc_avatar" 
                      alt="avatar"
                      class="avatar-img"
                    />
                    <span v-else>{{ moment.user_avatar || moment.npc_avatar || '👤' }}</span>
                  </div>
                  <div class="moment-user">
                    <div class="user-name">
                      {{ moment.user_nickname || moment.npc_name }}
                    </div>
                    <div class="moment-time">{{ formatTime(moment.created_at) }}</div>
                  </div>
                </div>
                <div class="moment-content">{{ moment.content }}</div>
                <div class="moment-actions">
                  <button @click="toggleLike(moment)" class="action-btn">
                    {{ isLiked(moment) ? '❤️' : '🤍' }} {{ moment.like_count || 0 }}
                  </button>
                  <button @click="showCommentInput(moment)" class="action-btn">
                    💬 {{ moment.comment_count || 0 }}
                  </button>
                </div>
                <div v-if="moment.likes && moment.likes.length > 0" class="likes-section">
                  <span class="likes-icon">❤️</span>
                  <span class="likes-names">{{ getLikesNames(moment.likes) }}</span>
                </div>
                <div v-if="moment.comments && moment.comments.length > 0" class="comments-section">
                  <div
                    v-for="comment in moment.comments"
                    :key="comment.id"
                    class="comment-item"
                  >
                    <span class="comment-author" v-if="comment.user_nickname || comment.npc_name">
                      {{ comment.user_nickname || comment.npc_name }}:
                    </span>
                    <span v-if="comment.reply_to_user_id || comment.reply_to_npc_id" class="comment-reply">
                      回复 @{{ comment.reply_to_user_nickname || comment.reply_to_npc_name }}:
                    </span>
                    <span class="comment-content">{{ comment.content }}</span>
                    <button @click="replyToComment(moment, comment)" class="btn-reply-comment-small">回复</button>
                  </div>
                </div>
                
                <!-- 回复输入框 (主朋友圈) -->
                <div v-if="replyingComment?.moment_id === moment.id" class="comment-reply-input">
                  <div class="reply-hint">回复 @{{ replyingComment.author_name }}:</div>
                  <div class="input-group-inline">
                    <input
                      v-model="replyText"
                      type="text"
                      placeholder="说点什么..."
                      @keyup.enter="submitReply(moment)"
                      class="comment-input"
                    />
                    <button @click="cancelReply" class="btn-cancel-small">取消</button>
                    <button @click="submitReply(moment)" class="btn-send">发送</button>
                  </div>
                </div>
                
                <!-- 评论输入 -->
                <div v-if="currentCommentMoment?.id === moment.id && !replyingComment" class="comment-input-box">
                  <input
                    v-model="commentText"
                    type="text"
                    placeholder="说点什么..."
                    @keyup.enter="submitComment(moment)"
                    class="comment-input"
                  />
                  <button @click="submitComment(moment)" class="btn-send">发送</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 4: 我的 -->
        <div v-show="currentTab === 'profile'" class="tab-content">
          <div class="content-header">
            <h1>我的</h1>
            <button @click="handleLogout" class="btn-action">🚪</button>
          </div>
          <div class="profile-content">
            <div class="profile-header">
              <div class="profile-avatar-section">
                <div class="profile-avatar-large">
                  <img 
                    v-if="currentUser?.avatar && isImageAvatar(currentUser.avatar)"
                    :src="currentUser.avatar" 
                    alt="avatar"
                    class="profile-avatar-img"
                  />
                  <span v-else>{{ currentUser?.avatar || '👤' }}</span>
                </div>
                <div class="profile-info">
                  <h2>{{ currentUser?.nickname || currentUser?.username }}</h2>
                  <p class="profile-username">@{{ currentUser?.username }}</p>
                </div>
              </div>
              <button @click="showEditProfileModal = true" class="btn-edit-profile">
                编辑资料
              </button>
            </div>

            <div class="profile-menu">
              <div class="menu-item" @click="goToMyRooms">
                <span class="menu-icon">💬</span>
                <span class="menu-label">我的群聊</span>
                <span class="menu-arrow">›</span>
              </div>
              <div class="menu-item" @click="goToCreatedRooms">
                <span class="menu-icon">🎨</span>
                <span class="menu-label">我创建的群聊</span>
                <span class="menu-arrow">›</span>
              </div>
              <div class="menu-item" @click="goToCreator">
                <span class="menu-icon">🛠️</span>
                <span class="menu-label">创作工具</span>
                <span class="menu-arrow">›</span>
              </div>
              <div v-if="isAdmin" class="menu-item" @click="goToAdminPanel">
                <span class="menu-icon">🎛️</span>
                <span class="menu-label">管理后台</span>
                <span class="menu-arrow">›</span>
              </div>
              <div v-if="isAdmin" class="menu-item" @click="goToAdmin">
                <span class="menu-icon">⚙️</span>
                <span class="menu-label">数据库管理</span>
                <span class="menu-arrow">›</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建房间模态框 -->
    <div v-if="showCreateRoomModal" class="modal-overlay" @click.self="showCreateRoomModal = false">
      <div class="modal-content creator-modal">
        <div class="modal-header">
          <h2>🎭 创建群聊剧情</h2>
          <button @click="closeCreateRoomModal" class="btn-close">✕</button>
        </div>
        <div class="modal-body creator-body">
          <!-- 左侧：基本信息 -->
          <div class="creator-left">
            <!-- AI智能解析区域 -->
            <div class="ai-parse-section">
              <div class="ai-parse-header">
                <span class="ai-icon">🤖</span>
                <span class="ai-title">AI智能解析</span>
                <button @click="toggleAIParse" class="btn-toggle-ai">
                  {{ showAIParse ? '收起' : '展开' }}
                </button>
              </div>
              
              <div v-if="showAIParse" class="ai-parse-content">
                <textarea 
                  v-model="aiParseText" 
                  placeholder="输入一段新闻或文本，AI将自动解析出剧情和角色信息...

例如：
2025年1月16日，王宝强马蓉宋喆离婚案在社交媒体上引发巨大争议。据爆料，马蓉与宋喆有婚外情，被王宝强发现后申请离婚..."
                  rows="6"
                  class="ai-textarea"
                  :disabled="aiParsing"
                ></textarea>
                <div class="ai-parse-actions">
                  <button 
                    @click="parseWithAI" 
                    class="btn btn-primary"
                    :disabled="!aiParseText.trim() || aiParsing"
                  >
                    {{ aiParsing ? '🤖 解析中...' : '🚀 智能解析' }}
                  </button>
                  <button 
                    v-if="aiParseText" 
                    @click="clearAIParse" 
                    class="btn btn-secondary"
                    :disabled="aiParsing"
                  >
                    清空
                  </button>
                </div>
                <div v-if="aiParseError" class="ai-error">
                  ❌ {{ aiParseError }}
                </div>
                <div v-if="aiParseSuccess" class="ai-success">
                  ✅ 解析成功！已自动填充剧情和NPC信息
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label>📝 群聊名称 *</label>
              <input v-model="newRoom.name" type="text" placeholder="例如：王宝强马蓉事件" class="form-input" />
            </div>
            
            <div class="form-group">
              <label>📄 群聊描述</label>
              <textarea v-model="newRoom.description" placeholder="简单描述这个剧情的背景..." rows="3" class="form-textarea"></textarea>
            </div>
            
            <div class="form-group">
              <label>🎬 剧情背景 *</label>
              <textarea v-model="newRoom.eventBackground" placeholder="详细描述剧情的主要事件、冲突和背景..." rows="4" class="form-textarea"></textarea>
            </div>
            
            <div class="form-group">
              <label>💬 对话密度 (1-10)</label>
              <input v-model.number="newRoom.dialogueDensity" type="number" min="1" max="10" class="form-input" />
              <small>数值越大，NPC发言频率越高</small>
            </div>
            
            <div class="form-group">
              <label>🖼️ 群聊头像</label>
              <div class="avatar-input-group">
                <input v-model="newRoom.avatar" type="text" placeholder="输入emoji或上传图片" class="form-input" />
                <button @click="openEmojiPicker" class="btn-emoji">😀</button>
                <button @click="uploadRoomAvatar" class="btn-upload">📁</button>
              </div>
            </div>
          </div>
          
          <!-- 右侧：NPC管理 -->
          <div class="creator-right">
            <div class="npc-header">
              <h3>🎮 角色管理 ({{ newRoom.npcs.length }})</h3>
              <button @click="addNewNPC" class="btn btn-primary btn-sm">➕ 添加角色</button>
            </div>
            
            <div class="npc-list">
              <div v-if="newRoom.npcs.length === 0" class="empty-hint">
                还没有添加角色，点击上方按钮添加
              </div>
              
              <div 
                v-for="(npc, index) in newRoom.npcs" 
                :key="index"
                class="npc-card"
              >
                <div class="npc-card-header">
                  <div class="npc-avatar">{{ npc.avatar || '👤' }}</div>
                  <div class="npc-info">
                    <div class="npc-name">{{ npc.name || '未命名' }}</div>
                    <div class="npc-brief">{{ npc.personality?.substring(0, 20) || '暂无描述' }}...</div>
                  </div>
                  <div class="npc-actions">
                    <button @click="editNPC(index)" class="btn-icon">✏️</button>
                    <button @click="deleteNPC(index)" class="btn-icon">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeCreateRoomModal" class="btn btn-secondary">取消</button>
          <button @click="createRoom" class="btn btn-primary" :disabled="!newRoom.name || !newRoom.eventBackground">
            🎬 创建剧情
          </button>
        </div>
      </div>
    </div>
    
    <!-- NPC编辑模态框 -->
    <div v-if="currentNPCEdit !== null" class="modal-overlay" @click.self="currentNPCEdit = null">
      <div class="modal-content npc-edit-modal">
        <div class="modal-header">
          <h2>{{ currentNPCEdit === -1 ? '➕ 添加角色' : '✏️ 编辑角色' }}</h2>
          <button @click="currentNPCEdit = null" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>角色名称 *</label>
            <input v-model="tempNPC.name" type="text" placeholder="例如：王宝强" class="form-input" />
          </div>
          
          <div class="form-group">
            <label>角色头像</label>
            <input v-model="tempNPC.avatar" type="text" placeholder="输入emoji" class="form-input" />
          </div>
          
          <div class="form-group">
            <label>性格特点 *</label>
            <textarea v-model="tempNPC.personality" placeholder="描述角色的性格特征..." rows="2" class="form-textarea"></textarea>
          </div>
          
          <div class="form-group">
            <label>行为习惯</label>
            <textarea v-model="tempNPC.habits" placeholder="角色的日常习惯、口头禅等..." rows="2" class="form-textarea"></textarea>
          </div>
          
          <div class="form-group">
            <label>背景故事</label>
            <textarea v-model="tempNPC.background" placeholder="角色的过往经历..." rows="2" class="form-textarea"></textarea>
          </div>
          
          <div class="form-group">
            <label>目标追求</label>
            <textarea v-model="tempNPC.goals" placeholder="角色想要达成的目标..." rows="2" class="form-textarea"></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>喜好</label>
              <input v-model="tempNPC.likes" type="text" placeholder="喜欢的事物" class="form-input" />
            </div>
            <div class="form-group">
              <label>厌恶</label>
              <input v-model="tempNPC.dislikes" type="text" placeholder="讨厌的事物" class="form-input" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>年龄</label>
              <input v-model.number="tempNPC.age" type="number" placeholder="年龄" class="form-input" />
            </div>
            <div class="form-group">
              <label>职业</label>
              <input v-model="tempNPC.occupation" type="text" placeholder="职业" class="form-input" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="currentNPCEdit = null" class="btn btn-secondary">取消</button>
          <button @click="saveNPC" class="btn btn-primary" :disabled="!tempNPC.name || !tempNPC.personality">
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 加入房间模态框 -->
    <div v-if="showJoinRoomModal" class="modal-overlay" @click.self="showJoinRoomModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>加入群聊</h2>
          <button @click="showJoinRoomModal = false" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>房间ID</label>
            <input v-model="joinRoomId" type="text" placeholder="输入房间ID" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showJoinRoomModal = false" class="btn btn-secondary">取消</button>
          <button @click="joinRoom" class="btn btn-primary">加入</button>
        </div>
      </div>
    </div>

    <!-- 发布朋友圈模态框 -->
    <div v-if="showCreateMomentModal" class="modal-overlay" @click.self="showCreateMomentModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>发布朋友圈</h2>
          <button @click="showCreateMomentModal = false" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <textarea
            v-model="newMoment.content"
            placeholder="这一刻的想法..."
            rows="6"
            class="moment-textarea"
          ></textarea>
          <p class="moment-hint">💡 你的所有好友NPC都能看到这条朋友圈</p>
        </div>
        <div class="modal-footer">
          <button @click="showCreateMomentModal = false" class="btn btn-secondary">取消</button>
          <button @click="publishMoment" class="btn btn-primary" :disabled="!newMoment.content">
            发布
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑资料模态框 -->
    <div v-if="showEditProfileModal" class="modal-overlay" @click.self="showEditProfileModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>编辑资料</h2>
          <button @click="showEditProfileModal = false" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>昵称</label>
            <input v-model="editProfile.nickname" type="text" />
          </div>
          <div class="form-group">
            <label>个性签名</label>
            <input v-model="editProfile.signature" type="text" placeholder="填写你的个性签名..." maxlength="50" />
          </div>
          <div class="form-group">
            <label>头像</label>
            <div class="avatar-input-group">
              <input v-model="editProfile.avatar" type="text" placeholder="输入emoji或图片URL" />
              <label class="btn-upload-avatar">
                📁 上传图片
                <input
                  type="file"
                  accept="image/*"
                  @change="handleAvatarUpload"
                  style="display: none;"
                />
              </label>
            </div>
            <div class="avatar-format-hint">支持 WebP、PNG、JPEG、GIF 等所有图片格式</div>
            <div class="avatar-preview">
              <img 
                v-if="editProfile.avatar && isImageAvatar(editProfile.avatar)"
                :src="editProfile.avatar" 
                alt="preview"
                class="avatar-preview-img"
                @error="onAvatarError"
              />
              <span v-else>{{ editProfile.avatar || '👤' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showEditProfileModal = false" class="btn btn-secondary">取消</button>
          <button @click="saveProfile" class="btn btn-primary">保存</button>
        </div>
      </div>
    </div>

    <!-- 玩家个人主页模态框 -->
    <div v-if="showPlayerProfileModal" class="modal-overlay" @click.self="showPlayerProfileModal = false">
      <div class="npc-profile-modal">
        <div class="profile-header">
          <button @click="showPlayerProfileModal = false" class="btn-close-profile">✕</button>
          <div class="profile-info">
            <div class="profile-avatar-large">
              <img
                v-if="isImageAvatar(selectedPlayer?.avatar)"
                :src="selectedPlayer?.avatar"
                :alt="selectedPlayer?.nickname"
                class="avatar-img"
              />
              <span v-else>👤</span>
            </div>
            <h2>{{ selectedPlayer?.nickname || selectedPlayer?.username }}</h2>
            <p class="profile-desc">玩家</p>
          </div>
        </div>
        
        <div class="profile-content">
          <!-- 朋友圈列表 -->
          <div class="npc-moments-list">
            <div v-if="loadingPlayerMoments" class="loading-state">加载中...</div>
            <div v-else-if="playerMoments.length === 0" class="empty-state">
              该用户还没有发过朋友圈
            </div>
            <div v-else>
              <div
                v-for="moment in playerMoments"
                :key="moment.id"
                class="moment-card"
              >
                <div class="moment-header">
                  <div class="moment-avatar">
                    <img
                      v-if="isImageAvatar(selectedPlayer?.avatar)"
                      :src="selectedPlayer.avatar"
                      :alt="selectedPlayer.nickname"
                      class="avatar-img"
                    />
                    <span v-else>👤</span>
                  </div>
                  <div class="moment-info">
                    <div class="moment-author">{{ selectedPlayer?.nickname || selectedPlayer?.username }}</div>
                    <div class="moment-time">{{ formatTime(moment.created_at) }}</div>
                  </div>
                </div>
                <div class="moment-content">{{ moment.content }}</div>
                
                <!-- 点赞列表 -->
                <div v-if="moment.likes && moment.likes.length > 0" class="moment-likes">
                  <span class="likes-icon">❤️</span>
                  <span class="likes-text">
                    {{ moment.likes.map(l => l.user_nickname || l.npc_name).join('、') }}
                  </span>
                </div>
                
                <!-- 评论列表 -->
                <div v-if="moment.comments && moment.comments.length > 0" class="moment-comments">
                  <div
                    v-for="comment in moment.comments"
                    :key="comment.id"
                    class="comment-item"
                  >
                    <span class="comment-author" v-if="comment.user_nickname || comment.npc_name">
                      {{ comment.user_nickname || comment.npc_name }}:
                    </span>
                    <span v-if="comment.reply_to_user_id || comment.reply_to_npc_id" class="comment-reply">
                      回复 @{{ comment.reply_to_user_nickname || comment.reply_to_npc_name }}:
                    </span>
                    <span class="comment-content">{{ comment.content }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- NPC个人主页模态框 -->
    <div v-if="showContactProfileModal" class="modal-overlay" @click.self="showContactProfileModal = false">
      <div class="npc-profile-modal">
        <div class="profile-header">
          <button @click="showContactProfileModal = false" class="btn-close-profile">✕</button>
          <div class="profile-info">
            <div class="profile-avatar-large">
              <img
                v-if="isImageAvatar(selectedContact?.avatar)"
                :src="selectedContact?.avatar"
                :alt="selectedContact?.name"
                class="avatar-img"
              />
              <span v-else>{{ selectedContact?.avatar || "🤖" }}</span>
            </div>
            <h2>{{ selectedContact?.name }}</h2>
            <p class="profile-desc">{{ selectedContact?.profile || selectedContact?.persona || "AI角色" }}</p>
          </div>
          <div class="profile-tabs">
            <button 
              :class="['tab-btn', npcProfileTab === 'moments' ? 'active' : '']"
              @click="npcProfileTab = 'moments'; loadNPCMoments()"
            >
              📝 朋友圈 ({{ npcMoments.length }})
            </button>
            <button 
              :class="['tab-btn', npcProfileTab === 'info' ? 'active' : '']"
              @click="npcProfileTab = 'info'"
            >
              ℹ️ 详细信息
            </button>
          </div>
        </div>
        
        <div class="profile-content">
          <!-- 朋友圈列表 -->
          <div v-if="npcProfileTab === 'moments'" class="npc-moments-list">
            <div v-if="loadingNPCMoments" class="loading-state">加载中...</div>
            <div v-else-if="npcMoments.length === 0" class="empty-state">
              该角色还没有发过朋友圈
            </div>
            <div v-else>
              <div
                v-for="moment in npcMoments"
                :key="moment.id"
                class="moment-card"
              >
                <div class="moment-header">
                  <div class="moment-avatar">
                    <img
                      v-if="isImageAvatar(moment.avatar)"
                      :src="moment.avatar"
                      :alt="moment.author_name"
                      class="avatar-img"
                    />
                    <span v-else>{{ moment.avatar || "🤖" }}</span>
                  </div>
                  <div class="moment-info">
                    <div class="moment-author">{{ moment.author_name }}</div>
                    <div class="moment-time">{{ formatTime(moment.created_at) }}</div>
                  </div>
                </div>
                <div class="moment-content">{{ moment.content }}</div>
                
                <!-- 点赞列表 -->
                <div v-if="moment.likes && moment.likes.length > 0" class="moment-likes">
                  <span class="likes-icon">❤️</span>
                  <span class="likes-text">{{ moment.likes.map(l => l.name).join('、') }}</span>
                </div>
                
                <!-- 评论列表 -->
                <div v-if="moment.comments && moment.comments.length > 0" class="moment-comments">
                  <div
                    v-for="comment in moment.comments"
                    :key="comment.id"
                    class="comment-item"
                  >
                    <span class="comment-author" v-if="comment.user_nickname || comment.npc_name">{{ comment.user_nickname || comment.npc_name }}:</span>
                    <span v-if="comment.reply_to_user_id || comment.reply_to_npc_id" class="comment-reply">
                      回复 @{{ comment.reply_to_user_nickname || comment.reply_to_npc_name }}:
                    </span>
                    <span class="comment-content">{{ comment.content }}</span>
                    <button @click="replyToNPCComment(moment, comment)" class="btn-reply-comment">回复</button>
                  </div>
                </div>
                
                <!-- 回复输入框 (NPC朋友圈) -->
                <div v-if="replyingNPCComment?.moment_id === moment.id" class="comment-reply-input">
                  <div class="reply-hint">回复 @{{ replyingNPCComment.author_name }}:</div>
                  <div class="input-group">
                    <input
                      v-model="replyNPCText"
                      type="text"
                      placeholder="说点什么..."
                      @keyup.enter="submitNPCReply(moment)"
                      class="reply-input"
                    />
                    <button @click="cancelNPCReply" class="btn-cancel">取消</button>
                    <button @click="submitNPCReply(moment)" class="btn-send">发送</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 详细信息 -->
          <div v-if="npcProfileTab === 'info'" class="npc-info-detail">
            <div class="info-section" v-if="selectedContact?.personality">
              <h3>性格特点</h3>
              <p>{{ selectedContact.personality }}</p>
            </div>
            <div class="info-section" v-if="selectedContact?.habits">
              <h3>行为习惯</h3>
              <p>{{ selectedContact.habits }}</p>
            </div>
            <div class="info-section" v-if="selectedContact?.background">
              <h3>背景故事</h3>
              <p>{{ selectedContact.background }}</p>
            </div>
            <div class="info-section" v-if="selectedContact?.goals">
              <h3>目标追求</h3>
              <p>{{ selectedContact.goals }}</p>
            </div>
            <div class="info-section" v-if="selectedContact?.likes">
              <h3>喜好</h3>
              <p>{{ selectedContact.likes }}</p>
            </div>
            <div class="info-section" v-if="selectedContact?.dislikes">
              <h3>厌恶</h3>
              <p>{{ selectedContact.dislikes }}</p>
            </div>
            <div v-if="!selectedContact?.personality && !selectedContact?.habits && !selectedContact?.background && !selectedContact?.goals && !selectedContact?.likes && !selectedContact?.dislikes" class="empty-state">
              暂无详细信息
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { formatRelativeTime } from '~/utils/time'

const router = useRouter()

// 状态
const currentTab = ref('chats')
const isFullscreen = ref(false)
const currentUser = ref(null)
const myRooms = ref([])
const presetRooms = ref([])
const allMoments = ref([])
const myContacts = ref([])
const showCreateRoomModal = ref(false)
const showJoinRoomModal = ref(false)
const showCreateMomentModal = ref(false)
const showEditProfileModal = ref(false)
const showContactProfileModal = ref(false)
const selectedContact = ref(null)
const joinRoomId = ref('')
const currentCommentMoment = ref(null)
const commentText = ref('')
const replyingComment = ref(null)  // 正在回复的评论（主朋友圈）
const replyText = ref('')          // 回复内容（主朋友圈）
const replyingNPCComment = ref(null)  // 正在回复的评论（NPC个人主页）
const replyNPCText = ref('')          // 回复内容（NPC个人主页）

// 未读通知数量
const momentsUnreadCount = ref(0)

// Tab配置
const tabs = computed(() => [
  { key: 'chats', label: '聊天', icon: '💬', badge: 0 },
  { key: 'contacts', label: '联系人', icon: '👥', badge: 0 },
  { key: 'moments', label: '朋友圈', icon: '🎭', badge: momentsUnreadCount.value },
  { key: 'profile', label: '我的', icon: '👤', badge: 0 }
])

// 新房间数据
const newRoom = ref({
  name: '',
  description: '',
  eventBackground: '',
  dialogueDensity: 5,
  avatar: '💬',
  npcs: []
})
const currentNPCEdit = ref(null)  // 当前编辑的NPC索引，-1表示新建
const tempNPC = ref({
  name: '',
  avatar: '👤',
  personality: '',
  habits: '',
  background: '',
  goals: '',
  likes: '',
  dislikes: '',
  age: null,
  occupation: ''
})

// AI解析相关
const showAIParse = ref(true)
const aiParseText = ref('')
const aiParsing = ref(false)
const aiParseError = ref('')
const aiParseSuccess = ref(false)

// 新朋友圈数据
const newMoment = ref({
  content: ''
})

// 编辑资料数据
const editProfile = ref({
  nickname: '',
  avatar: '',
  signature: ''
})

// 计算属性
const isAdmin = computed(() => {
  return currentUser.value?.username === 'jerry' || currentUser.value?.username === 'admin'
})

// 获取当前用户
const fetchCurrentUser = async () => {
  try {
    const response = await $fetch('/api/auth/session')
    if (response.user) {
      currentUser.value = response.user
      editProfile.value = {
        nickname: response.user.nickname,
        avatar: response.user.avatar || '',
        signature: response.user.signature || ''
      }
    } else {
      router.push('/login')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    router.push('/login')
  }
}

// 获取我的群聊
const fetchMyRooms = async () => {
  try {
    const response = await $fetch('/api/rooms/my-rooms')
    if (response.success) {
      myRooms.value = response.rooms
    }
  } catch (error) {
    console.error('获取群聊列表失败:', error)
  }
}

// 获取预设房间
const fetchPresetRooms = async () => {
  try {
    const response = await $fetch('/api/rooms/preset-rooms')
    if (response.success) {
      presetRooms.value = response.rooms
    }
  } catch (error) {
    console.error('获取预设房间失败:', error)
  }
}

// 获取好友朋友圈
const fetchAllMoments = async () => {
  try {
    const response = await $fetch('/api/moments/friends')
    if (response.success) {
      allMoments.value = response.moments
    }
  } catch (error) {
    console.error('获取朋友圈失败:', error)
  }
}

// 获取联系人
const fetchContacts = async () => {
  try {
    const response = await $fetch('/api/contacts/list')
    if (response.success) {
      myContacts.value = response.contacts
    }
  } catch (error) {
    console.error('获取联系人失败:', error)
  }
}

// NPC个人主页状态
const npcProfileTab = ref('moments')
const npcMoments = ref([])
const loadingNPCMoments = ref(false)

// 查看NPC联系人详情
const viewContactProfile = (contact) => {
  selectedContact.value = contact
  showContactProfileModal.value = true
  npcProfileTab.value = 'moments'
  loadNPCMoments()
}

// 查看玩家好友详情
const showPlayerProfileModal = ref(false)
const selectedPlayer = ref(null)
const playerMoments = ref([])
const loadingPlayerMoments = ref(false)

const viewPlayerProfile = (player) => {
  selectedPlayer.value = player
  showPlayerProfileModal.value = true
  loadPlayerMoments()
}

// 加载玩家的朋友圈
const loadPlayerMoments = async () => {
  if (!selectedPlayer.value) return
  
  loadingPlayerMoments.value = true
  
  try {
    const response = await $fetch(`/api/moments/user/${selectedPlayer.value.id}`)
    
    if (response.success) {
      playerMoments.value = response.moments
      console.log('📝 玩家朋友圈:', playerMoments.value)
    }
  } catch (error) {
    console.error('加载玩家朋友圈失败:', error)
  } finally {
    loadingPlayerMoments.value = false
  }
}

// 加载NPC的朋友圈
const loadNPCMoments = async () => {
  if (!selectedContact.value) return
  
  loadingNPCMoments.value = true
  
  try {
    const response = await $fetch(`/api/moments/npc/${selectedContact.value.id}`)
    
    if (response.success) {
      npcMoments.value = response.moments
      console.log('📝 NPC朋友圈:', npcMoments.value)
    }
  } catch (error) {
    console.error('加载NPC朋友圈失败:', error)
  } finally {
    loadingNPCMoments.value = false
  }
}

// 切换Tab
const switchTab = async (tab) => {
  currentTab.value = tab
  if (tab === 'moments') {
    fetchAllMoments()
    // 标记朋友圈为已读
    await markMomentsAsRead()
    // 如果有未读通知，显示通知框
    if (momentsUnreadCount.value > 0) {
      showNotifications.value = true
      // 重置未读数量
      momentsUnreadCount.value = 0
    }
  } else if (tab === 'contacts') {
    await fetchContacts()
    await fetchPlayerFriends()
  }
}

// 玩家好友相关
const playerFriends = ref([])

// 获取玩家好友列表
const fetchPlayerFriends = async () => {
  try {
    const response = await $fetch('/api/friends/list')
    if (response.success) {
      playerFriends.value = response.friends || []
    }
  } catch (error) {
    console.error('获取好友列表失败:', error)
  }
}

// 切换视图模式
const toggleViewMode = () => {
  isFullscreen.value = !isFullscreen.value
}

// 进入房间
const enterRoom = (roomId) => {
  router.push(`/room/${roomId}`)
}

// 加入预设房间
const joinPresetRoom = async (roomId) => {
  // 先获取房间信息
  try {
    const roomInfo = await $fetch(`/api/rooms/${roomId}/info`)
    if (!roomInfo.success) {
      alert(roomInfo.error || '获取房间信息失败')
      return
    }
    
    // 如果已经是成员，直接进入
    if (roomInfo.isMember) {
      router.push(`/room/${roomId}`)
      return
    }
    
    // 确认是否加入
    const confirmJoin = confirm(`是否加入群聊「${roomInfo.room.name}」？\n\n${roomInfo.room.description}`)
    if (!confirmJoin) {
      return
    }
    
    // 调用加入房间API（不需要选择角色，进入房间页面后再选）
    const joinResponse = await $fetch('/api/rooms/join', {
      method: 'POST',
      body: {
        roomId: roomId,
        roleName: null,
        roleProfile: null,
        avatar: null
      }
    })
    
    if (joinResponse.success) {
      // 刷新我的群聊列表
      await fetchMyRooms()
      // 跳转到房间页面
      router.push(`/room/${roomId}`)
    } else {
      alert(joinResponse.error || '加入失败')
    }
  } catch (error) {
    console.error('加入房间失败:', error)
    alert('加入房间失败，请重试')
  }
}

// 关闭创建房间模态框
const closeCreateRoomModal = () => {
  showCreateRoomModal.value = false
  newRoom.value = {
    name: '',
    description: '',
    eventBackground: '',
    dialogueDensity: 5,
    avatar: '💬',
    npcs: []
  }
}

// 添加新NPC
const addNewNPC = () => {
  tempNPC.value = {
    name: '',
    avatar: '👤',
    personality: '',
    habits: '',
    background: '',
    goals: '',
    likes: '',
    dislikes: '',
    age: null,
    occupation: ''
  }
  currentNPCEdit.value = -1  // -1表示新建
}

// 编辑NPC
const editNPC = (index) => {
  tempNPC.value = { ...newRoom.value.npcs[index] }
  currentNPCEdit.value = index
}

// 删除NPC
const deleteNPC = (index) => {
  if (confirm('确定要删除这个角色吗？')) {
    newRoom.value.npcs.splice(index, 1)
  }
}

// 保存NPC
const saveNPC = () => {
  if (!tempNPC.value.name || !tempNPC.value.personality) {
    alert('请填写角色名称和性格特点')
    return
  }
  
  if (currentNPCEdit.value === -1) {
    // 新建
    newRoom.value.npcs.push({ ...tempNPC.value })
  } else {
    // 编辑
    newRoom.value.npcs[currentNPCEdit.value] = { ...tempNPC.value }
  }
  
  currentNPCEdit.value = null
}

// 打开emoji选择器（简化版）
const openEmojiPicker = () => {
  const emoji = prompt('输入一个emoji:')
  if (emoji) {
    newRoom.value.avatar = emoji
  }
}

// 上传房间头像
const uploadRoomAvatar = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        newRoom.value.avatar = e.target.result
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

// 切换AI解析面板
const toggleAIParse = () => {
  showAIParse.value = !showAIParse.value
}

// 清空AI解析
const clearAIParse = () => {
  aiParseText.value = ''
  aiParseError.value = ''
  aiParseSuccess.value = false
}

// AI智能解析
const parseWithAI = async () => {
  if (!aiParseText.value.trim()) {
    aiParseError.value = '请输入要解析的文本'
    return
  }
  
  aiParsing.value = true
  aiParseError.value = ''
  aiParseSuccess.value = false
  
  try {
    console.log('🤖 开始AI解析...')
    const response = await $fetch('/api/creator/ai-parse', {
      method: 'POST',
      body: { text: aiParseText.value }
    })
    
    if (response.success) {
      console.log('✅ AI解析成功:', response)
      
      // 填充剧情信息
      newRoom.value.name = response.story.name
      newRoom.value.description = response.story.description
      newRoom.value.eventBackground = response.story.eventBackground
      
      // 填充NPC信息
      newRoom.value.npcs = response.npcs.map(npc => ({
        name: npc.name,
        avatar: npc.avatar || '👤',
        personality: npc.personality,
        profile: npc.personality,  // profile字段用于验证
        habits: npc.habits || '',
        background: npc.background || '',
        goals: npc.goals || '',
        likes: npc.likes || '',
        dislikes: npc.dislikes || '',
        age: npc.age || null,
        occupation: npc.occupation || '',
        skills: npc.skills || '',
        fears: npc.fears || ''
      }))
      
      console.log('✅ AI解析成功，填充了', newRoom.value.npcs.length, '个NPC')
      console.log('NPC列表:', newRoom.value.npcs.map(n => n.name))
      
      aiParseSuccess.value = true
      
      // 3秒后自动收起AI解析面板
      setTimeout(() => {
        showAIParse.value = false
        aiParseSuccess.value = false
      }, 3000)
    } else {
      aiParseError.value = response.error || 'AI解析失败'
    }
  } catch (error) {
    console.error('❌ AI解析失败:', error)
    aiParseError.value = '解析失败：' + (error.data?.message || error.message || '未知错误')
  } finally {
    aiParsing.value = false
  }
}

// 创建房间
const createRoom = async () => {
  if (!newRoom.value.name) {
    alert('请输入群聊名称')
    return
  }
  if (!newRoom.value.eventBackground) {
    alert('请输入剧情背景')
    return
  }
  
  console.log('🎬 准备创建房间，数据：')
  console.log('- 房间名称:', newRoom.value.name)
  console.log('- NPC数量:', newRoom.value.npcs.length)
  console.log('- NPC列表:', newRoom.value.npcs.map(n => n.name))
  
  try {
    const response = await $fetch('/api/rooms/create', {
      method: 'POST',
      body: newRoom.value
    })
    
    if (response.success) {
      showCreateRoomModal.value = false
      
      // 显示房间ID复制提示
      const roomId = response.roomId
      const message = `房间创建成功！\n\n房间ID: ${roomId}\n\n点击确定复制房间ID`
      
      if (confirm(message)) {
        // 复制到剪贴板
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(roomId)
          alert('房间ID已复制到剪贴板！')
        } else {
          // 降级方案
          const textArea = document.createElement('textarea')
          textArea.value = roomId
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          alert('房间ID已复制到剪贴板！')
        }
      }
      
      closeCreateRoomModal()
      await fetchMyRooms()
      router.push(`/room/${roomId}`)
    } else {
      alert(response.error || '创建失败')
    }
  } catch (error) {
    console.error('创建房间失败:', error)
    alert('创建失败：' + (error.data?.error || error.message))
  }
}

// 加入房间
const joinRoom = async () => {
  if (!joinRoomId.value) {
    alert('请输入房间ID')
    return
  }
  
  const roomIdToJoin = joinRoomId.value  // 保存roomId，因为后面会清空
  
  try {
    const response = await $fetch('/api/rooms/join', {
      method: 'POST',
      body: { roomId: roomIdToJoin }
    })
    if (response.success) {
      showJoinRoomModal.value = false
      joinRoomId.value = ''
      await fetchMyRooms()
      router.push(`/room/${roomIdToJoin}`)
    } else {
      alert(response.error || '加入失败')
    }
  } catch (error) {
    console.error('加入房间失败:', error)
    alert('加入失败：' + (error.data?.error || error.message))
  }
}

// 发布朋友圈
const publishMoment = async () => {
  if (!newMoment.value.content.trim()) {
    alert('请输入内容')
    return
  }
  
  if (!currentUser.value?.id) {
    alert('请先登录')
    return
  }
  
  try {
    console.log('发布朋友圈:', {
      user_id: currentUser.value.id,
      content: newMoment.value.content
    })
    
    const response = await $fetch('/api/moments/create', {
      method: 'POST',
      body: {
        user_id: currentUser.value.id,
        content: newMoment.value.content.trim()
      }
    })
    
    console.log('发布结果:', response)
    
    if (response.success) {
      showCreateMomentModal.value = false
      newMoment.value = { content: '' }
      alert('发布成功！你的好友NPC会在几秒后评论~')
      
      // 立即刷新一次，显示朋友圈
      fetchAllMoments()
      
      // 8秒后再次刷新，等待NPC评论（总延迟：1-3秒触发 + 1-6秒评论 = 最多9秒）
      setTimeout(() => {
        console.log('🔄 刷新朋友圈，查看NPC评论...')
        fetchAllMoments()
      }, 8000)
      
      // 15秒后最后一次刷新，确保所有评论都显示
      setTimeout(() => {
        console.log('🔄 最后一次刷新朋友圈...')
        fetchAllMoments()
      }, 15000)
    } else {
      alert('发布失败：' + (response.error || '未知错误'))
    }
  } catch (error) {
    console.error('发布失败:', error)
    alert('发布失败：' + error.message)
  }
}

// 点赞
const toggleLike = async (moment) => {
  try {
    await $fetch('/api/moments/like', {
      method: 'POST',
      body: {
        moment_id: moment.id,
        user_id: currentUser.value.id
      }
    })
    await fetchAllMoments()
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
    await $fetch('/api/moments/comment', {
      method: 'POST',
      body: {
        moment_id: moment.id,
        user_id: currentUser.value.id,
        content: commentText.value.trim()
      }
    })
    commentText.value = ''
    currentCommentMoment.value = null
    await fetchAllMoments()
  } catch (error) {
    console.error('评论失败:', error)
  }
}

// 回复评论（主朋友圈）
const replyToComment = (moment, comment) => {
  replyingComment.value = {
    moment_id: moment.id,
    comment_id: comment.id,
    author_name: comment.user_nickname || comment.npc_name,
    user_id: comment.user_id,
    npc_id: comment.npc_id
  }
  replyText.value = ''
  currentCommentMoment.value = null  // 关闭普通评论输入框
}

// 提交回复（主朋友圈）
const submitReply = async (moment) => {
  if (!replyText.value.trim()) return
  try {
    await $fetch('/api/moments/comment', {
      method: 'POST',
      body: {
        moment_id: moment.id,
        user_id: currentUser.value.id,
        content: replyText.value.trim(),
        reply_to_user_id: replyingComment.value.user_id || null,
        reply_to_npc_id: replyingComment.value.npc_id || null
      }
    })
    replyText.value = ''
    replyingComment.value = null
    await fetchAllMoments()
  } catch (error) {
    console.error('回复失败:', error)
  }
}

// 取消回复（主朋友圈）
const cancelReply = () => {
  replyingComment.value = null
  replyText.value = ''
}

// 回复评论（NPC个人主页）
const replyToNPCComment = (moment, comment) => {
  replyingNPCComment.value = {
    moment_id: moment.id,
    comment_id: comment.id,
    author_name: comment.user_nickname || comment.npc_name,
    user_id: comment.user_id,
    npc_id: comment.npc_id
  }
  replyNPCText.value = ''
}

// 提交回复（NPC个人主页）
const submitNPCReply = async (moment) => {
  if (!replyNPCText.value.trim()) return
  try {
    await $fetch('/api/moments/comment', {
      method: 'POST',
      body: {
        moment_id: moment.id,
        user_id: currentUser.value.id,
        content: replyNPCText.value.trim(),
        reply_to_user_id: replyingNPCComment.value.user_id || null,
        reply_to_npc_id: replyingNPCComment.value.npc_id || null
      }
    })
    replyNPCText.value = ''
    replyingNPCComment.value = null
    await loadNPCMoments()  // 刷新NPC朋友圈
  } catch (error) {
    console.error('回复失败:', error)
  }
}

// 取消回复（NPC个人主页）
const cancelNPCReply = () => {
  replyingNPCComment.value = null
  replyNPCText.value = ''
}

// 获取点赞名单
const getLikesNames = (likes) => {
  return likes.slice(0, 10).map(like => 
    like.user_nickname || like.user_name || like.npc_name
  ).join('、')
}
  
  // 朋友圈通知相关
  const momentsNotifications = ref([])
  const showNotifications = ref(false)

// 获取朋友圈未读数量
// 加载未读通知数量
const fetchMomentsUnreadCount = async () => {
  try {
    const response = await $fetch('/api/moments/unread-count')
    if (response.success) {
      momentsUnreadCount.value = response.count || 0
    }
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

// 标记朋友圈为已读
const markMomentsAsRead = async () => {
  try {
    await $fetch('/api/moments/mark-read', {
      method: 'POST'
    })
    momentsUnreadCount.value = 0
    showNotifications.value = false
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

// 获取朋友圈通知
const fetchMomentsNotifications = async () => {
  try {
    const response = await $fetch('/api/moments/notifications')
    if (response.success) {
      momentsNotifications.value = response.notifications || []
      momentsUnreadCount.value = response.unreadCount || 0
    }
  } catch (error) {
    console.error('获取通知失败:', error)
  }
}


// 切换到朋友圈并显示通知
const switchToMoments = () => {
  currentTab.value = 'moments'
  if (momentsUnreadCount.value > 0) {
    showNotifications.value = true
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

// 处理头像上传
const handleAvatarUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 检查文件大小（限制5MB）
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过5MB')
    return
  }
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  
  console.log('📁 上传头像:', {
    name: file.name,
    type: file.type,
    size: (file.size / 1024).toFixed(2) + ' KB'
  })
  
  const reader = new FileReader()
  reader.onload = (e) => {
    editProfile.value.avatar = e.target.result
    console.log('✅ 头像已转换为base64，格式:', file.type)
  }
  reader.onerror = (e) => {
    console.error('❌ 读取文件失败:', e)
    alert('读取文件失败')
  }
  reader.readAsDataURL(file)
}

// 头像加载错误处理
const onAvatarError = (event) => {
  console.error('❌ 头像加载失败:', editProfile.value.avatar?.substring(0, 100))
  event.target.style.display = 'none'
}

// 保存资料
const saveProfile = async () => {
  try {
    const response = await $fetch('/api/user/update-profile', {
      method: 'POST',
      body: editProfile.value
    })
    if (response.success) {
      currentUser.value.nickname = editProfile.value.nickname
      currentUser.value.avatar = editProfile.value.avatar
      currentUser.value.signature = editProfile.value.signature
      showEditProfileModal.value = false
      alert('✅ 资料已更新')
    }
  } catch (error) {
    console.error('更新资料失败:', error)
    alert('更新失败')
  }
}

// 导航功能
const goToMyRooms = () => {
  currentTab.value = 'chats'
}

const goToCreatedRooms = () => {
  currentTab.value = 'chats'
}

const goToCreator = () => {
  window.location.href = '/creator'
}

const goToAdminPanel = () => {
  router.push('/admin')
}

const goToAdmin = () => {
  window.location.href = '/admin/database'
}

// 登出
const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  } catch (error) {
    console.error('登出失败:', error)
  }
}

// 初始化
onMounted(async () => {
  await fetchCurrentUser()
  await fetchMyRooms()
  await fetchPresetRooms()
  await fetchMomentsNotifications() // 初始化通知
  await fetchMomentsUnreadCount() // 初始化未读数量
  
  // 检查是否是电脑端
  isFullscreen.value = window.innerWidth > 768
  
  // 每30秒刷新一次数据
  setInterval(() => {
    fetchMyRooms()
    fetchMomentsNotifications() // 定期检查通知
    fetchMomentsUnreadCount() // 定期检查未读数量
    if (currentTab.value === 'moments') {
      fetchAllMoments()
    }
  }, 30000)
})
</script>

<style scoped>
.app-wrapper {
  width: 100vw;
  height: 100vh;
  background: #f0f2f5;
  overflow: hidden;
}

.main-container {
  width: 100%;
  height: 100%;
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.main-container.mobile-mode {
  flex-direction: column;
  max-width: 480px;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.nav-bar:not(.mobile) {
  flex-direction: column;
  width: 80px;
  padding: 1rem 0;
}

.nav-bar.mobile {
  flex-direction: row;
  width: 100%;
  height: 60px;
  border-right: none;
  border-top: 1px solid #e0e0e0;
  order: 2;
}

.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.8rem;
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.nav-item:hover {
  background: rgba(7, 193, 96, 0.1);
}

.nav-item.active {
  color: #07c160;
}

.nav-item.active .nav-icon {
  transform: scale(1.1);
}

.nav-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
  transition: transform 0.2s;
}

.nav-label {
  font-size: 0.75rem;
}

.nav-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* 内容区 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.content-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  width: 36px;
  height: 36px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-action:hover {
  background: #e0e0e0;
}

/* 聊天列表 */
.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.room-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.room-card:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.room-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.room-item:hover {
  background: #f8f9fa;
}

.room-avatar {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.room-info {
  flex: 1;
  min-width: 0;
}

.room-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.room-name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-time {
  font-size: 0.75rem;
  color: #999;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.room-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-last-msg {
  font-size: 0.85rem;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.unread-badge {
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.room-desc {
  font-size: 0.85rem;
  color: #666;
  text-align: center;
  margin-top: 0.5rem;
}

/* 朋友圈 */
.moments-feed {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.moments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.moment-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
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
  overflow: hidden;
}

.moment-avatar .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.moment-user {
  flex: 1;
}

.user-name {
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
}

.moment-actions {
  display: flex;
  gap: 1rem;
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

.comment-content {
  color: #333;
}

.comment-input-box {
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

.btn-send {
  padding: 0.5rem 1rem;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

/* 个人中心 */
.profile-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  margin-bottom: 1rem;
}

.profile-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}

.profile-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: white;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.profile-avatar-large .profile-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info h2 {
  font-size: 1.25rem;
  margin: 0;
  text-align: center;
}

.profile-username {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.btn-edit-profile {
  padding: 0.5rem 1.5rem;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
}

.profile-menu {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background: #f8f9fa;
}

.menu-icon {
  font-size: 1.25rem;
  margin-right: 0.75rem;
}

.menu-label {
  flex: 1;
  font-size: 0.95rem;
}

.menu-arrow {
  font-size: 1.5rem;
  color: #ccc;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #999;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.hint {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* 联系人 */
.contacts-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.contacts-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  transition: background 0.2s;
  border: 1px solid #f0f0f0;
}

.contact-item:hover {
  background: #f8f9fa;
}

/* NPC个人主页模态框 */
.npc-profile-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  position: relative;
}

.btn-close-profile {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close-profile:hover {
  background: rgba(255,255,255,0.3);
  transform: rotate(90deg);
}

.profile-info {
  text-align: center;
  margin-bottom: 1rem;
}

.profile-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  background: white;
  font-size: 2.5rem;
  overflow: hidden;
}

.profile-avatar-large .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info h2 {
  margin: 0.5rem 0 0.3rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.profile-desc {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0;
}

.profile-tabs {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.tab-btn {
  flex: 1;
  padding: 0.7rem;
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  font-weight: 500;
}

.tab-btn:hover {
  background: rgba(255,255,255,0.3);
}

.tab-btn.active {
  background: white;
  color: #667eea;
  font-weight: 600;
}

.profile-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* NPC朋友圈列表 */
.npc-moments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.moment-card {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.moment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.moment-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.8rem;
}

.moment-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  margin-right: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  font-size: 1.8rem;
  overflow: hidden;
  flex-shrink: 0;
}

.moment-avatar .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.moment-info {
  flex: 1;
}

.moment-author {
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
}

.moment-time {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.2rem;
}

.moment-content {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #333;
  margin-bottom: 0.8rem;
  word-wrap: break-word;
}

.moment-likes {
  background: #f0f0f0;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.likes-icon {
  font-size: 1rem;
}

.likes-text {
  color: #555;
}

.moment-comments {
  background: #f0f0f0;
  padding: 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
}

.comment-item {
  padding: 0.3rem 0;
  color: #333;
}

.comment-item:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 0.3rem;
  padding-bottom: 0.5rem;
}

.comment-author {
  font-weight: 600;
  color: #667eea;
  margin-right: 0.3rem;
}

.comment-content {
  color: #555;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-size: 0.9rem;
}

/* NPC详细信息 */
.npc-info-detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-section {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.info-section h3 {
  margin: 0 0 0.6rem 0;
  font-size: 1rem;
  color: #667eea;
  font-weight: 600;
}

.info-section p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #555;
}

.contact-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 0.75rem;
  flex-shrink: 0;
  overflow: hidden;
}

.contact-avatar .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

/* 通知横幅 */
.notifications-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin: 1rem;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.banner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.banner-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.badge-pulse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  background: #ff4757;
  color: white;
  border-radius: 14px;
  font-size: 0.9rem;
  font-weight: bold;
  padding: 0 0.5rem;
  animation: pulse 2s infinite;
  box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 71, 87, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 71, 87, 0);
  }
}

.btn-collapse {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-collapse:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.btn-collapse .arrow {
  font-size: 0.7rem;
  transition: transform 0.2s;
}

.notifications-scroll {
  max-height: 450px;
  overflow-y: auto;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.notif-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  display: flex;
  gap: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  animation: fadeInUp 0.4s ease-out backwards;
  position: relative;
  overflow: hidden;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notif-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.notif-card:last-child {
  margin-bottom: 0;
}

.notif-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
}

.notif-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
  position: relative;
}

.notif-type-moment_comment {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.notif-type-reply {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.notif-type-participated {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.notif-avatar-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.notif-avatar-text {
  font-size: 1.5rem;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.notif-author {
  font-weight: 700;
  color: #1a1a1a;
  font-size: 0.95rem;
}

.notif-time {
  font-size: 0.75rem;
  color: #999;
  font-weight: 400;
}

.notif-action {
  margin-bottom: 0.5rem;
}

.action-text {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.notif-message {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #333;
  line-height: 1.5;
  position: relative;
  margin-bottom: 0.5rem;
}

.quote-mark {
  color: #667eea;
  font-weight: bold;
  font-size: 1.2rem;
  opacity: 0.5;
}

.notif-context {
  font-size: 0.8rem;
  color: #999;
  padding-left: 0.75rem;
  border-left: 2px solid #e0e0e0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banner-footer {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: center;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.btn-mark-read {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 24px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-mark-read:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-mark-read:active {
  transform: translateY(0);
}

.btn-mark-read .btn-icon {
  font-size: 1.1rem;
  font-weight: bold;
}

.contact-name {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
}

.contact-desc {
  font-size: 0.85rem;
  color: #999;
}

.contact-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #e0e0e0;
}

.coming-soon {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #999;
}

.coming-soon-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
}

.coming-soon h2 {
  color: #666;
  margin-bottom: 0.5rem;
}

/* 模态框 */
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

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.moment-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 150px;
  margin-bottom: 0.5rem;
}

.moment-hint {
  font-size: 0.85rem;
  color: #666;
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: #f0f9ff;
  border-radius: 4px;
  border-left: 3px solid #07c160;
}

.avatar-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.avatar-input-group input[type="text"] {
  flex: 1;
}

.btn-upload-avatar {
  background: #667eea;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-upload-avatar:hover {
  background: #5568d3;
}

.avatar-format-hint {
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.25rem;
}

.avatar-preview {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-top: 0.5rem;
  overflow: hidden;
}

.avatar-preview .avatar-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

/* 创建房间模态框样式 */
.creator-modal {
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
}

.creator-body {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  overflow-y: auto;
  max-height: 70vh;
}

.creator-left {
  flex: 1;
  min-width: 0;
}

.creator-right {
  flex: 1;
  min-width: 0;
  border-left: 1px solid #e0e0e0;
  padding-left: 1.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  resize: vertical;
  font-family: inherit;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.85rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.avatar-input-group {
  display: flex;
  gap: 0.5rem;
}

.avatar-input-group .form-input {
  flex: 1;
}

.btn-emoji, .btn-upload {
  padding: 0.75rem 1rem;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-emoji:hover, .btn-upload:hover {
  background: #e0e0e0;
}

/* NPC管理 */
.npc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.npc-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.npc-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.empty-hint {
  text-align: center;
  padding: 2rem 1rem;
  color: #999;
  font-size: 0.95rem;
}

.npc-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.2s;
}

.npc-card:hover {
  border-color: #07c160;
  box-shadow: 0 2px 8px rgba(7, 193, 96, 0.1);
}

.npc-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.npc-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.npc-info {
  flex: 1;
  min-width: 0;
}

.npc-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.npc-brief {
  font-size: 0.85rem;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.npc-actions {
  display: flex;
  gap: 0.25rem;
}

.btn-icon {
  background: none;
  border: none;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #f0f0f0;
}

/* NPC编辑模态框 */
.npc-edit-modal {
  max-width: 600px;
}

/* AI智能解析样式 */
.ai-parse-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.ai-parse-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.ai-icon {
  font-size: 1.5rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.ai-title {
  flex: 1;
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
}

.btn-toggle-ai {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.btn-toggle-ai:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ai-parse-content {
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

.ai-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 0.95rem;
  resize: vertical;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.95);
  margin-bottom: 0.75rem;
  transition: all 0.3s;
}

.ai-textarea:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background: white;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
}

.ai-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-parse-actions {
  display: flex;
  gap: 0.5rem;
}

.ai-parse-actions .btn {
  flex: 1;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.ai-parse-actions .btn-primary {
  background: white;
  color: #667eea;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.ai-parse-actions .btn-primary:hover:not(:disabled) {
  background: #f8f9ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.ai-parse-actions .btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.ai-parse-actions .btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.ai-parse-actions .btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.ai-error {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 59, 48, 0.9);
  color: white;
  border-radius: 6px;
  font-size: 0.9rem;
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.ai-success {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(52, 199, 89, 0.9);
  color: white;
  border-radius: 6px;
  font-size: 0.9rem;
  animation: slideDown 0.3s ease-out;
}

/* 回复评论样式 */
.comment-reply {
  color: #576b95;
  font-size: 0.9rem;
  margin: 0 0.25rem;
}

.btn-reply-comment, .btn-reply-comment-small {
  background: none;
  border: none;
  color: #576b95;
  font-size: 0.85rem;
  padding: 0 0.5rem;
  cursor: pointer;
  margin-left: 0.5rem;
}

.btn-reply-comment:hover, .btn-reply-comment-small:hover {
  text-decoration: underline;
}

.comment-reply-input {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #f7f7f7;
  border-radius: 6px;
}

.reply-hint {
  font-size: 0.85rem;
  color: #576b95;
  margin-bottom: 0.5rem;
}

.input-group, .input-group-inline {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.reply-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.btn-cancel, .btn-cancel-small {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-cancel:hover, .btn-cancel-small:hover {
  background: #e0e0e0;
}

/* 响应式 */
@media (max-width: 768px) {
  .creator-body {
    flex-direction: column;
  }
  
  .creator-right {
    border-left: none;
    border-top: 1px solid #e0e0e0;
    padding-left: 0;
    padding-top: 1.5rem;
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .creator-modal {
    width: 100%;
    max-width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
