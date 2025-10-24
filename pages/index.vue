<template>
  <div class="viewport">
    <div :class="['app-container', { fullscreen: isFullscreen }]">
      <!-- 顶部导航栏 -->
      <div class="top-bar">
        <h1 class="app-title">💬 AI聊天模拟器</h1>
        <div class="top-actions">
          <button @click="showCreateRoomModal = true" class="btn-create">
            ➕ 创建群聊
          </button>
          <button @click="showJoinRoomModal = true" class="btn-join">
            🔍 加入群聊
          </button>
          <button
            @click="toggleViewMode"
            class="btn-view-mode"
            :title="isFullscreen ? '手机模式' : '全屏模式'"
          >
            {{ isFullscreen ? "📱" : "🖥️" }}
          </button>
        </div>
      </div>

      <!-- Tab导航 -->
      <div class="tabs">
        <button
          :class="['tab-btn', { active: activeTab === 'my-rooms' }]"
          @click="activeTab = 'my-rooms'"
        >
          我的群聊
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'created' }]"
          @click="activeTab = 'created'"
        >
          我创建的
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'profile' }]"
          @click="activeTab = 'profile'"
        >
          我的
        </button>
      </div>

      <!-- Tab内容 -->
      <div class="tab-content">
        <!-- 我的群聊列表 -->
        <div v-if="activeTab === 'my-rooms'" class="room-list">
          <div v-if="myRooms.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <p>还没有加入任何群聊</p>
            <p class="hint">点击上方按钮创建或加入群聊</p>
          </div>

          <div
            v-for="room in myRooms"
            :key="room.id"
            class="room-card"
            :data-avatar="room.avatar || '聊'"
            @click="enterRoom(room.id)"
          >
            <div class="room-content">
              <div class="room-header">
                <h3>{{ room.name }}</h3>
                <span class="room-time">{{ formatDate(room.created_at) }}</span>
              </div>
              <div class="room-footer">
                <div class="last-message">
                  {{ room.last_message || "还没有消息" }}
                </div>
                <span class="room-members">{{ formatMemberCount(room) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 我创建的群聊 -->
        <div v-if="activeTab === 'created'" class="room-list">
          <div v-if="createdRooms.length === 0" class="empty-state">
            <div class="empty-icon">✨</div>
            <p>还没有创建任何群聊</p>
            <p class="hint">点击上方"创建群聊"开始创作</p>
          </div>

          <div
            v-for="room in createdRooms"
            :key="room.id"
            class="room-card-created"
          >
            <div class="room-header">
              <h3>{{ room.name }}</h3>
              <span class="creator-badge">创建者</span>
            </div>
            <p class="room-id">房间ID：{{ room.id }}</p>
            <p class="room-desc">{{ room.description || "暂无描述" }}</p>
            <div class="room-footer">
              <span>{{ room.member_count }}名成员</span>
              <span>{{ room.message_count }}条消息</span>
            </div>
            <div class="room-actions">
              <button @click="enterRoom(room.id)" class="btn-enter">
                💬 进入聊天室
              </button>
              <button @click="editRoom(room.id)" class="btn-edit">
                ⚙️ 编辑设置
              </button>
            </div>
          </div>
        </div>

        <!-- 个人信息 -->
        <div v-if="activeTab === 'profile'" class="profile-section">
          <div class="profile-card">
            <div class="avatar-section">
              <img
                :src="user?.avatar || '/avatars/placeholder.svg'"
                alt="头像"
                class="profile-avatar"
              />
              <label class="change-avatar-btn">
                更换头像
                <input
                  type="file"
                  accept="image/*"
                  @change="uploadAvatar"
                  hidden
                />
              </label>
            </div>

            <div class="profile-info">
              <div class="info-item">
                <label>用户名</label>
                <div class="info-value">{{ user?.username }}</div>
              </div>

              <div class="info-item">
                <label>昵称</label>
                <div class="info-value">{{ user?.nickname }}</div>
              </div>

              <div class="info-item">
                <label>加入时间</label>
                <div class="info-value">{{ formatDate(user?.created_at) }}</div>
              </div>
            </div>

            <button @click="handleLogout" class="btn-logout">退出登录</button>
          </div>
        </div>
      </div>

      <!-- 创建房间弹窗 -->
      <div
        v-if="showCreateRoomModal"
        class="modal-overlay"
        @click="showCreateRoomModal = false"
      >
        <div class="modal-content" @click.stop>
          <h2>创建群聊</h2>
          <p class="modal-subtitle">设置剧情和NPC角色</p>

          <CreateRoomForm
            @created="handleRoomCreated"
            @cancel="showCreateRoomModal = false"
          />
        </div>
      </div>

      <!-- 加入房间弹窗 -->
      <div
        v-if="showJoinRoomModal"
        class="modal-overlay"
        @click="showJoinRoomModal = false"
      >
        <div class="modal-content small" @click.stop>
          <h2>{{ joinRoomId ? "设置人设" : "加入群聊" }}</h2>
          <p class="modal-subtitle">
            {{ joinRoomId ? "选择你的角色并设置人设" : "输入群聊ID即可加入" }}
          </p>

          <div class="join-form">
            <div class="form-group">
              <label>房间ID</label>
              <input
                v-if="!joinRoomIdLocked"
                v-model="joinRoomId"
                type="text"
                placeholder="请输入6位房间ID"
                class="input"
                maxlength="6"
              />
              <div v-else class="input-readonly">{{ joinRoomId }}</div>
            </div>

            <div class="join-character-setup">
              <h3>设置你的角色</h3>
              <input
                v-model="joinRoleName"
                type="text"
                placeholder="角色名称（可选）"
                class="input"
              />
              <textarea
                v-model="joinRoleProfile"
                placeholder="角色人设（可选）"
                rows="3"
                class="textarea"
              ></textarea>
            </div>

            <div v-if="joinError" class="error-msg">{{ joinError }}</div>

            <div class="modal-actions">
              <button @click="showJoinRoomModal = false" class="btn-cancel">
                取消
              </button>
              <button
                @click="handleJoinRoom"
                class="btn-confirm"
                :disabled="!joinRoomId"
              >
                加入
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

definePageMeta({
  middleware: "auth",
});

const activeTab = ref("my-rooms");
const user = ref(null);
const myRooms = ref([]);
const createdRooms = ref([]);
const isFullscreen = ref(true); // 默认全屏（电脑模式）

const showCreateRoomModal = ref(false);
const showJoinRoomModal = ref(false);
const joinRoomId = ref("");
const joinRoomIdLocked = computed(() => !!joinRoomId.value);
const joinRoleName = ref("");
const joinRoleProfile = ref("");
const joinError = ref("");

onMounted(async () => {
  await loadUser();
  await loadMyRooms();
  await loadCreatedRooms();
});

const loadUser = async () => {
  try {
    const response = await $fetch("/api/auth/me");
    if (response.success) {
      user.value = response.user;
    } else {
      navigateTo("/login");
    }
  } catch (error) {
    navigateTo("/login");
  }
};

const loadMyRooms = async () => {
  try {
    const response = await $fetch("/api/rooms/my-rooms");
    if (response.success) {
      myRooms.value = response.rooms;
    }
  } catch (error) {
    console.error("加载房间列表失败:", error);
  }
};

const loadCreatedRooms = async () => {
  try {
    const response = await $fetch("/api/rooms/my-created");
    if (response.success) {
      createdRooms.value = response.rooms;
    }
  } catch (error) {
    console.error("加载创建的房间失败:", error);
  }
};

const enterRoom = (roomId) => {
  navigateTo(`/room/${roomId}`);
};

const editRoom = (roomId) => {
  navigateTo(`/room/${roomId}/edit`);
};

const handleRoomCreated = async (roomId) => {
  showCreateRoomModal.value = false;
  await loadMyRooms();
  await loadCreatedRooms();

  // 群主创建后需要设置自己的人设才能进入
  alert("群聊创建成功！请设置你的角色人设");
  showJoinRoomModal.value = true;
  joinRoomId.value = roomId;
};

const handleJoinRoom = async () => {
  joinError.value = "";

  if (!joinRoomId.value) {
    joinError.value = "请输入房间ID";
    return;
  }

  const targetRoomId = joinRoomId.value.toUpperCase();

  try {
    const response = await $fetch("/api/rooms/join", {
      method: "POST",
      body: {
        roomId: targetRoomId,
        roleName: joinRoleName.value,
        roleProfile: joinRoleProfile.value,
      },
    });

    if (response.success) {
      showJoinRoomModal.value = false;
      joinRoomId.value = "";
      joinRoleName.value = "";
      joinRoleProfile.value = "";
      await loadMyRooms();
      enterRoom(targetRoomId); // 修复：使用保存的roomId
    } else {
      joinError.value = response.error;
    }
  } catch (error) {
    joinError.value = "加入失败，请重试";
  }
};

const uploadAvatar = async (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const avatarData = e.target.result;

      try {
        const response = await $fetch("/api/user/update-avatar", {
          method: "POST",
          body: { avatar: avatarData },
        });

        if (response.success) {
          user.value.avatar = avatarData;
          alert("头像更新成功！");
        } else {
          alert("头像更新失败：" + response.error);
        }
      } catch (error) {
        alert("上传失败，请重试");
      }
    };
    reader.readAsDataURL(file);
  }
};

const handleLogout = async () => {
  await $fetch("/api/auth/logout", { method: "POST" });
  navigateTo("/login");
};

const toggleViewMode = () => {
  isFullscreen.value = !isFullscreen.value;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("zh-CN");
};

const formatMemberCount = (room) => {
  const npcCount = room.npc_count || 0;
  const playerCount = room.member_count || 0;
  const total = npcCount + playerCount;

  if (npcCount > 0) {
    return `${total}人（${npcCount}AI+${playerCount}玩家）`;
  }
  return `${total}人`;
};
</script>

<style scoped>
.viewport {
  min-height: 100vh;
  background: #2c2c2c;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.app-container {
  width: 100%;
  max-width: 420px;
  height: 100vh;
  background: #ededed;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
}

.app-container.fullscreen {
  max-width: 100%;
  height: 100vh;
  border-radius: 0;
  box-shadow: none;
}

@media (max-width: 768px) {
  .viewport {
    padding: 0;
  }

  .app-container {
    max-width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
}

.top-bar {
  background: white;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.app-title {
  margin: 0;
  font-size: 1.3rem;
  color: #000;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.top-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-create,
.btn-join {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create {
  background: #07c160;
  color: white;
}

.btn-join {
  background: white;
  color: #576b95;
  border: 1px solid #576b95;
}

.btn-create:active {
  background: #06ad56;
}

.btn-join:active {
  background: #f0f0f0;
}

.btn-view-mode {
  padding: 0.5rem 0.8rem;
  border: none;
  border-radius: 4px;
  font-size: 1.2rem;
  cursor: pointer;
  background: transparent;
  transition: all 0.2s;
}

.btn-view-mode:hover {
  background: #f0f0f0;
}

.btn-view-mode:active {
  transform: scale(0.95);
}

.tabs {
  background: white;
  display: flex;
  border-bottom: 1px solid #e5e5e5;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.tab-btn {
  flex: 1;
  padding: 0.8rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 1rem;
  transition: all 0.2s;
  font-weight: 500;
  position: relative;
}

.tab-btn.active {
  color: #000;
  border-bottom-color: #07c160;
  font-weight: 600;
}

.tab-btn:hover {
  color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.room-list {
  display: flex;
  flex-direction: column;
}

.room-card {
  background: white;
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  position: relative;
}

.room-card:hover {
  background: #f8f8f8;
}

.room-card:active {
  background: #f0f0f0;
}

.room-card.created {
  background: #f8f8f8;
}

.room-card::before {
  content: attr(data-avatar);
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #07c160 0%, #05a850 100%);
  border-radius: 6px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  flex-shrink: 0;
}

.room-content {
  flex: 1;
  min-width: 0;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
}

.room-header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #000;
  font-weight: 500;
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

.room-members {
  background: #07c160;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  margin-left: 0.5rem;
}

.creator-badge {
  background: #576b95;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  margin-left: 0.5rem;
}

.room-id {
  font-family: "Courier New", monospace;
  color: #999;
  font-size: 0.8rem;
  margin: 0.2rem 0;
}

.room-desc {
  display: none;
}

.room-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #999;
}

.last-message {
  flex: 1;
  font-size: 0.9rem;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
  padding: 0;
  background: none;
}

.room-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.8rem;
}

.btn-enter,
.btn-edit {
  flex: 1;
  padding: 0.6rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s;
  font-size: 0.9rem;
}

.btn-enter {
  background: #07c160;
  color: white;
}

.btn-enter:active {
  background: #06ad56;
}

.btn-edit {
  background: #f0f0f0;
  color: #000;
}

.btn-edit:active {
  background: #e0e0e0;
}

.room-card-created {
  background: white;
  padding: 1.2rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  margin: 0 1rem 1rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.room-card-created:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #07c160;
}

.room-card-created .room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.room-card-created h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #000;
  font-weight: 500;
}

.room-card-created .room-id {
  font-family: "Courier New", monospace;
  color: #999;
  font-size: 0.85rem;
  margin: 0.3rem 0 0.5rem 0;
}

.room-card-created .room-desc {
  display: block;
  color: #888;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0.5rem 0;
}

.room-card-created .room-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #999;
  margin: 0.8rem 0;
  padding-top: 0.8rem;
  border-top: 1px solid #f0f0f0;
}

.empty-state {
  text-align: center;
  padding: 6rem 2rem;
  color: #999;
  background: white;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.3;
  filter: grayscale(1);
}

.empty-state p {
  font-size: 1rem;
  color: #666;
  margin: 0.5rem 0;
}

.hint {
  font-size: 0.9rem;
  color: #999;
  margin-top: 0.5rem;
}

.profile-section {
  background: white;
}

.profile-card {
  background: white;
  padding: 2rem 1.5rem;
  border-radius: 8px;
  margin: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
}

.change-avatar-btn {
  padding: 0.4rem 0.8rem;
  background: #07c160;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.change-avatar-btn:active {
  background: #06ad56;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item label {
  font-size: 0.9rem;
  color: #999;
}

.info-value {
  font-size: 1.1rem;
  color: #333;
}

.btn-logout {
  width: 100%;
  padding: 0.8rem;
  background: #fa5151;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s;
}

.btn-logout:active {
  background: #e84b4b;
}

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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.small {
  max-width: 450px;
}

.modal-content h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
  color: #000;
  font-weight: 500;
}

.modal-subtitle {
  color: #888;
  margin: 0 0 1.5rem 0;
  font-size: 0.9rem;
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.join-character-setup h3 {
  font-size: 1rem;
  color: #333;
  margin: 0 0 1rem 0;
}

.input,
.textarea {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: #07c160;
}

.input-readonly {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 0.95rem;
  background: #f5f5f5;
  color: #666;
  font-family: "Courier New", monospace;
}

.textarea {
  resize: vertical;
}

.error-msg {
  padding: 0.75rem;
  background: #fee;
  border: 2px solid #fcc;
  border-radius: 10px;
  color: #c33;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 0.7rem;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s;
}

.btn-cancel {
  background: #f0f0f0;
  color: #000;
}

.btn-cancel:active {
  background: #e0e0e0;
}

.btn-confirm {
  background: #07c160;
  color: white;
}

.btn-confirm:active {
  background: #06ad56;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
