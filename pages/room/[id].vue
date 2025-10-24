<template>
  <div class="viewport">
    <div :class="['chat-container', { fullscreen: isFullscreen }]">
      <!-- 顶部导航 -->
      <div class="chat-header">
        <button @click="goBack" class="btn-back">← 返回</button>
        <div class="room-info">
          <h2>{{ roomInfo?.name }}</h2>
          <span class="member-count">{{ formatMemberCount() }}</span>
        </div>
        <div class="header-actions">
          <button
            @click="toggleAutoMode"
            :class="['btn-auto', { active: isAutoMode }]"
            :title="isAutoMode ? '点击关闭自动对话' : '点击开启自动对话'"
          >
            {{ isAutoMode ? "⏸️ 自动中" : "▶️ 自动" }}
          </button>
          <button
            @click="toggleViewMode"
            class="btn-view-mode"
            :title="isFullscreen ? '手机模式' : '全屏模式'"
          >
            {{ isFullscreen ? "📱" : "🖥️" }}
          </button>
          <button @click="showRoomInfoModal = true" class="btn-info">
            ℹ️ 群信息
          </button>
          <button
            v-if="isCreator"
            @click="showEditModal = true"
            class="btn-settings"
          >
            ⚙️ 设置
          </button>
        </div>
      </div>

      <!-- 聊天消息区 -->
      <div class="messages-container" ref="messagesContainer">
        <!-- 普通消息显示 -->
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="[
            'message',
            msg.sender_type === 'user' && msg.sender_id === currentUserId
              ? 'mine'
              : 'other'
          ]"
        >
          <img
            :src="msg.avatar || '/avatars/placeholder.svg'"
            :alt="msg.sender_name"
            class="avatar"
          />
          <div class="message-content">
            <div class="sender-name">{{ msg.sender_name }}</div>
            <div class="message-bubble">{{ msg.content }}</div>
            <div class="message-time">{{ formatTime(msg.created_at) }}</div>
          </div>
        </div>

        <!-- 打字中提示 -->
        <div v-if="typingNPC" class="typing-indicator">
          <div class="typing-avatar">
            <img
              :src="typingNPC.avatar || '/avatars/placeholder.svg'"
              :alt="typingNPC.name"
              class="avatar"
            />
          </div>
          <div class="typing-content">
            <div class="sender-name">{{ typingNPC.name }}</div>
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="input-area">
        <!-- 模式切换 -->
        <div class="mode-switch">
          <button
            @click="isAIMode = false"
            :class="['mode-btn', { active: !isAIMode }]"
          >
            ✏️ 直接输入
          </button>
          <button
            @click="isAIMode = true"
            :class="['mode-btn', { active: isAIMode }]"
          >
            🤖 嘴替模式
          </button>
        </div>

        <!-- 嘴替模式 -->
        <template v-if="isAIMode">
          <!-- 命令输入 -->
          <div class="command-section">
            <label class="command-label">💬 给AI的指令：</label>
            <div class="command-input-wrapper">
              <input
                v-model="command"
                type="text"
                placeholder="例如：进行交涉、表达观点..."
                class="command-input"
                @keyup.enter="generateMessage"
                :disabled="isGenerating || isTypingMessage"
              />
              <button
                @click="generateMessage"
                class="btn-generate"
                :disabled="!command || isGenerating || isTypingMessage"
              >
                ✨ 生成
              </button>
            </div>
          </div>

          <!-- 消息预览 -->
          <div v-if="draftMessage" class="draft-section">
            <label class="draft-label">📝 消息预览（可编辑）：</label>
            <div class="draft-wrapper">
              <textarea
                v-model="draftMessage"
                rows="3"
                class="draft-textarea"
                :disabled="isTypingMessage"
              ></textarea>
              <button
                @click="sendMessage"
                class="btn-send"
                :disabled="!draftMessage || isTypingMessage"
              >
                📤 发送
              </button>
            </div>
          </div>
        </template>

        <!-- 直接输入模式 -->
        <template v-else>
          <div class="direct-input-section">
            <label class="input-label"
              >💬 直接发送消息
              <span class="hint-text">(Ctrl+Enter快速发送)</span></label
            >
            <div class="direct-input-wrapper">
              <textarea
                v-model="draftMessage"
                rows="3"
                placeholder="输入你想说的话..."
                class="draft-textarea"
                @keyup.enter.ctrl="sendMessage"
              ></textarea>
              <button
                @click="sendMessage"
                class="btn-send"
                :disabled="!draftMessage"
              >
                📤 发送
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- 编辑设置弹窗（群主） -->
      <div
        v-if="showEditModal"
        class="modal-overlay"
        @click="showEditModal = false"
      >
        <div class="edit-modal" @click.stop>
          <div class="edit-modal-header">
            <h2>⚙️ 群聊设置</h2>
            <button @click="showEditModal = false" class="btn-close">✕</button>
          </div>

          <div class="edit-modal-content">
            <!-- 基本信息 -->
            <section class="setting-section">
              <h3>📝 基本信息</h3>

              <div class="form-group">
                <label>群聊头像</label>
                <div class="avatar-selector">
                  <div class="current-avatar-display">
                    {{ editData.avatar || "聊" }}
                  </div>
                  <div class="avatar-buttons">
                    <button
                      @click="showAvatarPicker = !showAvatarPicker"
                      class="btn-pick-avatar"
                    >
                      选择Emoji
                    </button>
                    <label class="btn-upload-file">
                      上传图片
                      <input
                        type="file"
                        accept="image/*"
                        @change="uploadRoomAvatar"
                        hidden
                      />
                    </label>
                  </div>
                </div>
                <div v-if="showAvatarPicker" class="emoji-grid">
                  <button
                    v-for="emoji in avatarEmojis"
                    :key="emoji"
                    @click="selectRoomAvatar(emoji)"
                    class="emoji-option"
                  >
                    {{ emoji }}
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>群聊名称</label>
                <input v-model="editData.name" type="text" class="form-input" />
              </div>

              <div class="form-group">
                <label>群聊描述</label>
                <textarea
                  v-model="editData.description"
                  rows="2"
                  class="form-textarea"
                ></textarea>
              </div>

              <div class="form-group">
                <label>事件背景（主导剧情）</label>
                <div class="background-editor">
                  <div
                    class="current-background"
                    v-if="originalEventBackground"
                  >
                    <h4>📖 当前剧情背景：</h4>
                    <div class="background-preview">
                      {{ originalEventBackground }}
                    </div>
                  </div>
                  <div class="background-summary" v-if="storySummary">
                    <h4>📝 剧情发展摘要：</h4>
                    <div class="summary-content">{{ storySummary }}</div>
                  </div>
                  <textarea
                    v-model="editData.event_background"
                    rows="4"
                    class="form-textarea"
                    placeholder="描述故事背景和主要剧情线..."
                  ></textarea>
                  <div class="background-actions">
                    <button
                      @click="generateStorySummary"
                      class="btn-summary"
                      :disabled="isGeneratingSummary"
                    >
                      {{
                        isGeneratingSummary ? "生成中..." : "📊 生成剧情摘要"
                      }}
                    </button>
                    <button
                      @click="restoreOriginalBackground"
                      class="btn-restore"
                    >
                      🔄 恢复原剧情
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- 自动对话设置 -->
            <section class="setting-section">
              <h3>🤖 自动对话设置</h3>

              <div class="form-group">
                <label>对话密度</label>
                <div class="density-buttons">
                  <button
                    @click="editData.dialogue_density = 1"
                    :class="[
                      'density-btn',
                      { active: editData.dialogue_density === 1 },
                    ]"
                  >
                    低
                  </button>
                  <button
                    @click="editData.dialogue_density = 2"
                    :class="[
                      'density-btn',
                      { active: editData.dialogue_density === 2 },
                    ]"
                  >
                    中
                  </button>
                  <button
                    @click="editData.dialogue_density = 3"
                    :class="[
                      'density-btn',
                      { active: editData.dialogue_density === 3 },
                    ]"
                  >
                    高
                  </button>
                  <button
                    @click="editData.dialogue_density = 4"
                    :class="[
                      'density-btn',
                      { active: editData.dialogue_density === 4 },
                    ]"
                  >
                    极高
                  </button>
                </div>
                <p class="hint-text">{{ getDensityHint() }}</p>
              </div>

              <div class="form-group">
                <button
                  @click="triggerPlot"
                  class="btn-action"
                  :disabled="isTriggering"
                >
                  {{ isTriggering ? "生成中..." : "🎬 立即推动剧情" }}
                </button>
              </div>
            </section>

            <!-- NPC管理 -->
            <section class="setting-section">
              <h3>👥 NPC角色管理</h3>

              <div
                v-for="(npc, index) in editData.npcs"
                :key="index"
                class="npc-item"
              >
                <div class="npc-header">
                  <div class="npc-name">{{ npc.name }}</div>
                  <div class="npc-avatar-section">
                    <div class="npc-avatar-display">
                      <img
                        v-if="npc.avatar && !npc.avatar.startsWith('data:')"
                        :src="npc.avatar"
                        :alt="npc.name"
                        class="npc-avatar-img"
                      />
                      <span v-else class="npc-avatar-emoji">{{
                        npc.avatar || "👤"
                      }}</span>
                    </div>
                    <div class="npc-avatar-buttons">
                      <button
                        @click="showNPCAvatarPicker = index"
                        class="btn-pick-avatar-small"
                      >
                        Emoji
                      </button>
                      <label class="btn-upload-file-small">
                        图片
                        <input
                          type="file"
                          accept="image/*"
                          @change="uploadNPCAvatar($event, index)"
                          hidden
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div
                  v-if="showNPCAvatarPicker === index"
                  class="npc-emoji-grid"
                >
                  <button
                    v-for="emoji in avatarEmojis"
                    :key="emoji"
                    @click="selectNPCAvatar(emoji, index)"
                    class="emoji-option-small"
                  >
                    {{ emoji }}
                  </button>
                </div>
                <textarea
                  v-model="npc.persona"
                  rows="2"
                  class="form-textarea"
                  placeholder="描述角色性格、背景、目标..."
                ></textarea>
              </div>
            </section>
          </div>

          <div class="edit-modal-footer">
            <button @click="showEditModal = false" class="btn-cancel">
              取消
            </button>
            <button
              @click="saveSettings"
              class="btn-save-modal"
              :disabled="isSaving"
            >
              {{ isSaving ? "保存中..." : "💾 保存" }}
            </button>
          </div>
        </div>
      </div>

      <!-- 群信息弹窗 -->
      <div
        v-if="showRoomInfoModal"
        class="modal-overlay"
        @click="showRoomInfoModal = false"
      >
        <div class="room-info-modal" @click.stop>
          <div class="room-info-header">
            <h2>群信息</h2>
            <button @click="showRoomInfoModal = false" class="btn-close">
              ✕
            </button>
          </div>

          <div class="room-info-content">
            <!-- 群基本信息 -->
            <div class="info-section">
              <div class="room-avatar-large">
                <span
                  v-if="roomInfo?.avatar && !roomInfo.avatar.startsWith('http')"
                  class="avatar-emoji"
                  >{{ roomInfo.avatar }}</span
                >
                <img
                  v-else-if="roomInfo?.avatar"
                  :src="roomInfo.avatar"
                  :alt="roomInfo.name"
                  class="avatar-img"
                />
                <span v-else class="avatar-emoji">💬</span>
              </div>
              <h3>{{ roomInfo?.name }}</h3>
              <p class="room-description">{{ roomInfo?.description }}</p>
              <div class="room-stats">
                <span class="stat-item">{{ totalMemberCount }}人</span>
                <span class="stat-item">{{ npcCount }}个AI</span>
                <span class="stat-item">{{ memberCount }}个玩家</span>
              </div>
            </div>

            <!-- 故事背景 -->
            <div class="info-section">
              <h4>📖 故事背景</h4>
              <div class="story-background">
                {{ roomInfo?.event_background }}
              </div>
            </div>

            <!-- 群成员 -->
            <div class="info-section">
              <h4>👥 群成员 ({{ totalMemberCount }})</h4>
              <div class="members-list">
                <!-- 群主 -->
                <div class="member-item creator">
                  <img
                    :src="
                      roomInfo?.creator?.avatar || '/avatars/placeholder.svg'
                    "
                    :alt="roomInfo?.creator?.nickname"
                    class="member-avatar"
                  />
                  <div class="member-info">
                    <div class="member-name">
                      {{ roomInfo?.creator?.nickname }} (群主)
                    </div>
                    <div class="member-role">创建者</div>
                  </div>
                </div>

                <!-- 其他成员 -->
                <div
                  v-for="member in members"
                  :key="member.id"
                  class="member-item"
                >
                  <img
                    :src="member.avatar || '/avatars/placeholder.svg'"
                    :alt="member.nickname"
                    class="member-avatar"
                  />
                  <div class="member-info">
                    <div class="member-name">{{ member.nickname }}</div>
                    <div class="member-role" v-if="member.role_name">
                      {{ member.role_name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- NPC角色 -->
            <div class="info-section">
              <h4>🤖 AI角色 ({{ npcCount }})</h4>
              <div class="npcs-list">
                <div v-for="npc in npcs" :key="npc.id" class="npc-item-info">
                  <img
                    :src="npc.avatar || '/avatars/placeholder.svg'"
                    :alt="npc.name"
                    class="npc-avatar-info"
                  />
                  <div class="npc-info">
                    <div class="npc-name">{{ npc.name }}</div>
                    <div class="npc-profile">{{ npc.profile }}</div>
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

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";

definePageMeta({
  middleware: "auth",
});

const route = useRoute();
const router = useRouter();
const roomId = route.params.id;

const roomInfo = ref(null);
const npcs = ref([]);
const members = ref([]);
const isCreator = ref(false);
const currentUserId = ref(null);

const messages = ref([]);
const command = ref("");
const draftMessage = ref("");
const isGenerating = ref(false);
const isTypingMessage = ref(false);
const isTyping = ref(false);
const isAIMode = ref(true); // true=嘴替模式, false=直接输入模式
const isAutoMode = ref(false); // 自动对话模式
const isFullscreen = ref(true); // 默认全屏（电脑模式）
const typingNPC = ref(null); // 当前正在输入的NPC
let autoModeInterval = null;

const messagesContainer = ref(null);
const showSettings = ref(false);
const showEditModal = ref(false);
const showRoomInfoModal = ref(false);
const showAvatarPicker = ref(false);
const showNPCAvatarPicker = ref(null);
const originalEventBackground = ref("");
const storySummary = ref("");
const isGeneratingSummary = ref(false);
const editData = ref({
  name: "",
  description: "",
  event_background: "",
  dialogue_density: 2,
  avatar: "聊",
  npcs: [],
});
const isSaving = ref(false);
const isTriggering = ref(false);

const avatarEmojis = [
  "💬",
  "👥",
  "🎭",
  "🎬",
  "📱",
  "💡",
  "🌟",
  "🔥",
  "❤️",
  "😀",
  "😎",
  "🤔",
  "😂",
  "😍",
  "🎉",
  "🎊",
  "🎈",
  "🎯",
  "🚀",
  "⭐",
  "🌈",
  "🎨",
  "🎵",
  "🎮",
  "⚡",
  "💰",
  "🏆",
  "👑",
  "🎪",
  "🎢",
];

onMounted(async () => {
  await loadCurrentUser();
  await loadRoomInfo();
  await loadMessages();
  scrollToBottom();
  
  // 标记为已读
  await markAsRead();
});

const loadCurrentUser = async () => {
  const response = await $fetch("/api/auth/me");
  if (response.success) {
    currentUserId.value = response.user.id;
  }
};

const loadRoomInfo = async () => {
  try {
    const response = await $fetch(`/api/rooms/${roomId}/info`);
    if (response.success) {
      roomInfo.value = response.room;
      npcs.value = response.npcs;
      members.value = response.members;
      isCreator.value = response.isCreator;
      console.log(
        "🔧 isCreator:",
        isCreator.value,
        "Room:",
        roomInfo.value?.name
      );

      // 保存原始剧情背景
      originalEventBackground.value = response.room.event_background || "";

      // 初始化编辑数据
      editData.value = {
        name: response.room.name || "",
        description: response.room.description || "",
        event_background: response.room.event_background || "",
        dialogue_density: response.room.dialogue_density || 2,
        avatar: response.room.avatar || "聊",
        npcs: response.npcs
          ? response.npcs.map((npc) => ({
              id: npc.id,
              name: npc.name,
              avatar: npc.avatar,
              persona: npc.profile || npc.persona || "", // 映射 profile 到 persona
            }))
          : [],
      };
    } else {
      alert("无法加载房间信息");
      goBack();
    }
  } catch (error) {
    alert("加载失败");
    goBack();
  }
};

const loadMessages = async () => {
  try {
    const response = await $fetch(`/api/messages/${roomId}`);
    if (response.success) {
      messages.value = response.messages;
    }
  } catch (error) {
    console.error("加载消息失败:", error);
  }
};

const generateMessage = async () => {
  if (!command.value || isGenerating.value) return;

  isGenerating.value = true;
  draftMessage.value = "";

  try {
    const response = await $fetch("/api/messages/generate-my-message", {
      method: "POST",
      body: {
        roomId,
        command: command.value,
      },
    });

    if (response.success) {
      await typeMessage(response.message);
      command.value = "";
    }
  } catch (error) {
    alert("生成失败");
  } finally {
    isGenerating.value = false;
  }
};

const typeMessage = async (text) => {
  isTypingMessage.value = true;
  draftMessage.value = "";

  for (let i = 0; i < text.length; i++) {
    draftMessage.value += text[i];
    await new Promise((resolve) => setTimeout(resolve, 30));
  }

  isTypingMessage.value = false;
};

const sendMessage = async () => {
  if (!draftMessage.value) return;

  const content = draftMessage.value;
  draftMessage.value = "";
  command.value = ""; // 清空命令

  try {
    // 发送消息
    await $fetch("/api/messages/send", {
      method: "POST",
      body: {
        roomId,
        content,
      },
    });

    // 重新加载消息
    await loadMessages();
    await nextTick();
    scrollToBottom();

    // 生成NPC回复（延迟显示）
    await generateNPCResponsesWithDelay();
  } catch (error) {
    console.error("发送消息失败:", error);
    alert("发送失败");
    isTyping.value = false;
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const goBack = () => {
  router.push("/");
};

const getDensityHint = () => {
  const hints = {
    1: "低频率：每60秒左右生成对话",
    2: "中频率：每40秒左右生成对话",
    3: "高频率：每25秒左右生成对话",
    4: "极高频率：每15秒左右生成对话",
  };
  return hints[editData.value.dialogue_density] || hints[2];
};

const selectRoomAvatar = (emoji) => {
  editData.value.avatar = emoji;
  showAvatarPicker.value = false;
};

const uploadRoomAvatar = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      editData.value.avatar = e.target.result;
      showAvatarPicker.value = false;
    };
    reader.readAsDataURL(file);
  }
};

// NPC头像相关方法
const selectNPCAvatar = (emoji, index) => {
  editData.value.npcs[index].avatar = emoji;
  showNPCAvatarPicker.value = null;
};

const uploadNPCAvatar = (event, index) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      editData.value.npcs[index].avatar = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// 剧情摘要相关方法
const generateStorySummary = async () => {
  if (isGeneratingSummary.value) return;

  isGeneratingSummary.value = true;
  try {
    // 获取最近的聊天记录
    const recentMessages = messages.value
      .slice(-20)
      .map((msg) => `${msg.sender_name}: ${msg.content}`)
      .join("\n");

    const response = await $fetch("/api/messages/generate-story-summary", {
      method: "POST",
      body: {
        roomId: roomId,
        originalBackground: originalEventBackground.value,
        currentBackground: editData.value.event_background,
        recentMessages: recentMessages,
      },
    });

    if (response.success) {
      storySummary.value = response.summary;
    } else {
      alert("生成摘要失败: " + response.error);
    }
  } catch (error) {
    console.error("生成摘要失败:", error);
    alert("生成摘要时出错");
  } finally {
    isGeneratingSummary.value = false;
  }
};

const restoreOriginalBackground = () => {
  editData.value.event_background = originalEventBackground.value;
  storySummary.value = "";
};

const saveSettings = async () => {
  if (isSaving.value) return;

  isSaving.value = true;
  try {
    const response = await $fetch(`/api/rooms/${roomId}/update`, {
      method: "POST",
      body: {
        name: editData.value.name,
        description: editData.value.description,
        event_background: editData.value.event_background,
        dialogue_density: editData.value.dialogue_density,
        avatar: editData.value.avatar,
        npcs: editData.value.npcs,
      },
    });

    if (response.success) {
      alert("✅ 保存成功！");
      showEditModal.value = false;
      await loadRoomInfo(); // 重新加载数据
    } else {
      alert("保存失败: " + response.error);
    }
  } catch (error) {
    console.error("保存失败:", error);
    alert("保存时出错");
  } finally {
    isSaving.value = false;
  }
};

const triggerPlot = async () => {
  if (isTriggering.value) return;

  isTriggering.value = true;
  try {
    const response = await $fetch("/api/messages/auto-generate", {
      method: "POST",
      body: {
        roomId: roomId,
        rounds: 1,
      },
    });

    if (response.success) {
      alert(`✅ 已生成 ${response.messageCount} 条对话！`);
      await loadMessages(); // 重新加载消息
    } else {
      alert("生成失败: " + response.error);
    }
  } catch (error) {
    console.error("生成失败:", error);
    alert("生成剧情时出错");
  } finally {
    isTriggering.value = false;
  }
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

const formatMemberCount = () => {
  const npcCount = npcs.value?.length || 0;
  const playerCount = members.value?.length || 0;
  const total = npcCount + playerCount;

  return `${total}人（${npcCount}AI+${playerCount}玩家）`;
};

// 计算属性
const totalMemberCount = computed(() => {
  const npcCount = npcs.value?.length || 0;
  const playerCount = members.value?.length || 0;
  return npcCount + playerCount;
});

const memberCount = computed(() => members.value?.length || 0);
const npcCount = computed(() => npcs.value?.length || 0);

const toggleAutoMode = () => {
  isAutoMode.value = !isAutoMode.value;

  if (isAutoMode.value) {
    startAutoMode();
  } else {
    stopAutoMode();
  }
};

const startAutoMode = async () => {
  console.log("开启自动对话模式");

  // 立即生成一轮
  await generateAutoDialogue();

  // 根据房间密度设置决定间隔
  const getInterval = () => {
    const density = roomInfo.value?.dialogue_density || 2;
    const intervals = {
      1: { min: 20000, max: 30000 }, // 20-30秒
      2: { min: 10000, max: 20000 }, // 10-20秒
      3: { min: 5000, max: 15000 }, // 5-15秒
      4: { min: 3000, max: 10000 }, // 3-10秒
    };
    const config = intervals[density];
    return config.min + Math.random() * (config.max - config.min);
  };

  const scheduleNext = async () => {
    if (!isAutoMode.value) return;

    await generateAutoDialogue();
    autoModeInterval = setTimeout(scheduleNext, getInterval());
  };

  autoModeInterval = setTimeout(scheduleNext, getInterval());
};

const stopAutoMode = () => {
  console.log("关闭自动对话模式");
  if (autoModeInterval) {
    clearTimeout(autoModeInterval);
    autoModeInterval = null;
  }
};

const generateAutoDialogue = async () => {
  if (typingNPC.value) return; // 如果有人正在输入，跳过

  try {
    const response = await $fetch("/api/messages/auto-generate", {
      method: "POST",
      body: {
        roomId,
        rounds: 1, // 每次生成1轮（1-3条对话）
      },
    });

    if (response.success && response.messages && response.messages.length > 0) {
      console.log("自动生成了", response.messages.length, "条对话");

      // 逐条显示新消息，带"正在输入"效果
      for (let i = 0; i < response.messages.length; i++) {
        const msg = response.messages[i];

        // 找到对应的NPC
        const npc = npcs.value.find((n) => n.name === msg.sender_name);

        // 显示"正在输入..."
        if (npc) {
          typingNPC.value = npc;
          await nextTick();
          scrollToBottom();
        }

        // 随机延迟1.5-3秒
        const delay = 1500 + Math.random() * 1500;
        await new Promise((resolve) => setTimeout(resolve, delay));

        // 隐藏"正在输入"
        typingNPC.value = null;

        // 加载新消息
        await loadMessages();
        await nextTick();
        scrollToBottom();

        // 消息之间的间隔
        if (i < response.messages.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
  } catch (error) {
    console.error("自动对话生成失败:", error);
  }
};

const generateNPCResponsesWithDelay = async () => {
  try {
    const response = await $fetch("/api/messages/generate-npc-responses", {
      method: "POST",
      body: { roomId },
    });

    if (
      response.success &&
      response.responses &&
      response.responses.length > 0
    ) {
      // 逐个显示NPC回复，每个都有"正在输入"提示
      for (let i = 0; i < response.responses.length; i++) {
        const resp = response.responses[i];

        // 找到对应的NPC信息
        const npc = npcs.value.find(
          (n) => n.name === resp.sender_name || n.id === resp.npc_id
        );

        // 显示"正在输入..."
        if (npc) {
          typingNPC.value = npc;
          await nextTick();
          scrollToBottom();
        }

        // 随机延迟1-3秒（模拟打字）
        const delay = 1500 + Math.random() * 1500;
        await new Promise((resolve) => setTimeout(resolve, delay));

        // 隐藏"正在输入"
        typingNPC.value = null;

        // 重新加载消息（新消息已经在后端保存了）
        await loadMessages();
        await nextTick();
        scrollToBottom();

        // 消息之间的间隔
        if (i < response.responses.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
  } catch (error) {
    console.error("生成NPC回复失败:", error);
  }
};

const toggleViewMode = () => {
  isFullscreen.value = !isFullscreen.value;
};

const markAsRead = async () => {
  try {
    await $fetch(`/api/rooms/${roomId}/mark-read`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('标记已读失败:', error);
  }
};

// 组件卸载时清理定时器并标记已读
onUnmounted(async () => {
  stopAutoMode();
  // 离开房间时标记为已读
  await markAsRead();
});
</script>

<style scoped>
.viewport {
  height: 100vh;
  width: 100vw;
  background: #2c2c2c;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  overflow: hidden;
}

.chat-container {
  width: 100%;
  max-width: 420px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ededed;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
}

.chat-container.fullscreen {
  max-width: 100%;
  height: 100vh;
  border-radius: 0;
  box-shadow: none;
}

@media (max-width: 768px) {
  .viewport {
    padding: 0;
  }

  .chat-container {
    max-width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
}

.chat-header {
  background: #f7f7f7;
  padding: 0.4rem 1rem;
  border-bottom: 1px solid #d5d5d5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 44px;
}

.btn-back {
  padding: 0.3rem 0.6rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #576b95;
}

.btn-back:active {
  opacity: 0.6;
}

.room-info {
  flex: 1;
  text-align: center;
}

.room-info h2 {
  margin: 0;
  font-size: 1.05rem;
  color: #000;
  font-weight: 500;
}

.member-count {
  font-size: 0.75rem;
  color: #888;
}

.btn-info,
.btn-settings {
  padding: 0.3rem 0.6rem;
  background: transparent;
  color: #576b95;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.btn-info:active,
.btn-settings:active {
  opacity: 0.6;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-auto {
  padding: 0.3rem 0.8rem;
  background: transparent;
  color: #576b95;
  border: 1px solid #576b95;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-auto.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
  animation: pulse 2s infinite;
}

.btn-auto:active {
  transform: scale(0.95);
}

.btn-view-mode {
  padding: 0.3rem 0.6rem;
  background: transparent;
  color: #576b95;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-view-mode:active {
  opacity: 0.6;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #ededed;
}

.message {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1rem;
  animation: fadeIn 0.2s;
}

.message.mine {
  flex-direction: row-reverse;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.message-content {
  max-width: 60%;
  display: flex;
  flex-direction: column;
}

.message.mine .message-content {
  align-items: flex-end;
}

.sender-name {
  font-size: 0.8rem;
  color: #999;
  margin-bottom: 0.25rem;
  padding: 0 0.5rem;
}

.message-bubble {
  padding: 0.6rem 0.8rem;
  border-radius: 4px;
  background: white;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-word;
  font-size: 0.95rem;
  position: relative;
}

.message.mine .message-bubble {
  background: #95ec69;
}

.message-time {
  font-size: 0.7rem;
  color: #b8b8b8;
  margin-top: 0.2rem;
  padding: 0 0.5rem;
}

.typing-indicator {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.typing-avatar {
  flex-shrink: 0;
}

.typing-avatar .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.typing-content {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.typing-content .sender-name {
  font-size: 0.85rem;
  color: #888;
  font-weight: 500;
}

.typing-dots {
  display: flex;
  gap: 4px;
  padding: 0.6rem 1rem;
  background: #f0f0f0;
  border-radius: 18px;
  width: fit-content;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.input-area {
  background: #f7f7f7;
  border-top: 1px solid #d5d5d5;
  padding: 0.6rem 1rem;
}

.mode-switch {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
  background: #e8e8e8;
  padding: 0.3rem;
  border-radius: 6px;
}

.mode-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #666;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.mode-btn.active {
  background: white;
  color: #07c160;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mode-btn:active {
  transform: scale(0.98);
}

.command-section,
.draft-section,
.direct-input-section {
  margin-bottom: 0.6rem;
}

.command-section:last-child,
.draft-section:last-child,
.direct-input-section:last-child {
  margin-bottom: 0;
}

.command-label,
.draft-label,
.input-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #888;
  margin-bottom: 0.4rem;
}

.hint-text {
  font-size: 0.7rem;
  color: #b8b8b8;
  font-weight: 400;
}

.direct-input-wrapper {
  display: flex;
  gap: 0.6rem;
  align-items: flex-end;
}

.command-input-wrapper,
.draft-wrapper {
  display: flex;
  gap: 0.6rem;
  align-items: flex-end;
}

.command-input {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 0.95rem;
  background: white;
}

.command-input:focus {
  outline: none;
  border-color: #576b95;
}

.draft-textarea {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 0.95rem;
  resize: none;
  font-family: inherit;
  background: white;
  line-height: 1.5;
}

.draft-textarea:focus {
  outline: none;
  border-color: #07c160;
}

.btn-generate,
.btn-send {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.1s;
}

.btn-generate {
  background: #576b95;
  color: white;
}

.btn-generate:active {
  background: #495887;
}

.btn-send {
  background: #07c160;
  color: white;
}

.btn-send:active {
  background: #06ad56;
}

.btn-generate:disabled,
.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  font-weight: 500;
  color: #000;
}

/* 编辑弹窗样式 */
.edit-modal {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 90%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.edit-modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.2rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.edit-modal-header h2 {
  margin: 0;
  color: white;
  font-size: 1.3rem;
  font-weight: 600;
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.edit-modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.setting-section {
  margin-bottom: 2rem;
}

.setting-section:last-child {
  margin-bottom: 0;
}

.setting-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.2rem;
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

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.density-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.density-btn {
  padding: 0.8rem;
  background: #f5f5f5;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.density-btn:hover {
  background: #e8e8e8;
}

.density-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.hint-text {
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  color: #888;
}

.btn-action {
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

.btn-action:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.npc-item {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.8rem;
}

.npc-item:last-child {
  margin-bottom: 0;
}

.npc-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.edit-modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 0.8rem 1.5rem;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #e8e8e8;
}

.btn-save-modal {
  padding: 0.8rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-save-modal:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-save-modal:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 群聊头像选择器 */
.avatar-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.current-avatar-display {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  flex-shrink: 0;
}

.avatar-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-pick-avatar,
.btn-upload-file {
  padding: 0.6rem 1rem;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-pick-avatar:hover,
.btn-upload-file:hover {
  background: #e8e8e8;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 0.5rem;
  margin-top: 0.8rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-option {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.emoji-option:hover {
  transform: scale(1.1);
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* 剧情背景编辑器样式 */
.background-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.current-background,
.background-summary {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.current-background h4,
.background-summary h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #495057;
}

.background-preview,
.summary-content {
  font-size: 0.85rem;
  line-height: 1.5;
  color: #6c757d;
  white-space: pre-wrap;
  max-height: 100px;
  overflow-y: auto;
}

.background-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-summary,
.btn-restore {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-summary {
  background: #007bff;
  color: white;
}

.btn-summary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-summary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-restore {
  background: #6c757d;
  color: white;
}

.btn-restore:hover {
  background: #545b62;
}

/* NPC头像相关样式 */
.npc-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: white;
}

.npc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.npc-name {
  font-weight: 600;
  color: #495057;
}

.npc-avatar-section {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.npc-avatar-display {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e9ecef;
  overflow: hidden;
}

.npc-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.npc-avatar-emoji {
  font-size: 1.5rem;
}

.npc-avatar-buttons {
  display: flex;
  gap: 0.3rem;
}

.btn-pick-avatar-small,
.btn-upload-file-small {
  padding: 0.3rem 0.6rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.btn-pick-avatar-small:hover,
.btn-upload-file-small:hover {
  background: #e9ecef;
}

.npc-emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.3rem;
  margin: 0.8rem 0;
  padding: 0.8rem;
  background: #f8f9fa;
  border-radius: 6px;
  max-height: 150px;
  overflow-y: auto;
}

.emoji-option-small {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.emoji-option-small:hover {
  background: #e9ecef;
  transform: scale(1.1);
}

/* 群信息弹窗样式 */
.room-info-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.room-info-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.room-info-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.room-info-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.info-section {
  margin-bottom: 2rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #333;
  font-weight: 600;
}

.room-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  margin: 0 auto 1rem auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #07c160 0%, #05a850 100%);
  overflow: hidden;
}

.avatar-emoji {
  font-size: 2.5rem;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.room-description {
  text-align: center;
  color: #666;
  margin: 0.5rem 0 1rem 0;
  line-height: 1.5;
}

.room-stats {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.stat-item {
  background: #f0f0f0;
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.85rem;
  color: #666;
}

.story-background {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #07c160;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #555;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

.members-list,
.npcs-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.member-item,
.npc-item-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: background 0.2s;
}

.member-item:hover,
.npc-item-info:hover {
  background: #e9ecef;
}

.member-item.creator {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
}

.member-avatar,
.npc-avatar-info {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.member-info,
.npc-info {
  flex: 1;
  min-width: 0;
}

.member-name,
.npc-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.2rem;
}

.member-role,
.npc-profile {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
}

.npc-profile {
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
</style>
