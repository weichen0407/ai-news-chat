# 🎉 朋友圈功能设计文档

## 📋 功能概述

朋友圈功能允许玩家和NPC发布动态、点赞、评论，模拟真实的社交网络体验。

### 核心特点

1. **房间隔离** - 只有同一房间的玩家和NPC可以互相看到朋友圈
2. **AI驱动** - NPC根据人设自动发布和评论
3. **实时互动** - 点赞、评论、未读提示
4. **自动生成** - 房主设置频率，NPC自动活跃
5. **智能回复** - NPC根据人设和剧情回复玩家

---

## 🗄️ 数据库设计

### 1. moments表（朋友圈内容）
```sql
CREATE TABLE moments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,           -- 房间ID（隔离）
  user_id INTEGER,                 -- 用户ID（玩家）
  npc_id INTEGER,                  -- NPC ID
  content TEXT NOT NULL,           -- 内容
  images TEXT,                     -- 图片（JSON数组）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 2. moment_likes表（点赞）
```sql
CREATE TABLE moment_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  moment_id INTEGER NOT NULL,
  user_id INTEGER,                 -- 点赞者（玩家）
  npc_id INTEGER,                  -- 点赞者（NPC）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(moment_id, user_id, npc_id)  -- 防止重复点赞
)
```

### 3. moment_comments表（评论）
```sql
CREATE TABLE moment_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  moment_id INTEGER NOT NULL,
  user_id INTEGER,                 -- 评论者（玩家）
  npc_id INTEGER,                  -- 评论者（NPC）
  reply_to_user_id INTEGER,        -- 回复的用户
  reply_to_npc_id INTEGER,         -- 回复的NPC
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 4. moment_read_status表（已读状态）
```sql
CREATE TABLE moment_read_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  room_id TEXT NOT NULL,
  last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, room_id)
)
```

---

## 🔌 API端点设计

### 基础API

#### 1. 初始化数据表
```
POST /api/moments/init
响应: { success: true, message: "初始化成功" }
```

#### 2. 获取朋友圈列表
```
GET /api/moments/{roomId}/list?limit=50&offset=0
响应: {
  success: true,
  moments: [
    {
      id: 1,
      room_id: "ROOM123",
      user_id: null,
      npc_id: 1,
      npc_name: "王宝强",
      npc_avatar: "👨",
      content: "今天拍戏很累，但很开心！",
      images: [],
      like_count: 5,
      comment_count: 3,
      likes: [...],
      comments: [...],
      created_at: "2025-11-03 10:00:00"
    }
  ]
}
```

#### 3. 创建朋友圈（玩家发布）
```
POST /api/moments/create
请求: {
  room_id: "ROOM123",
  user_id: 1,
  content: "今天天气真好！",
  images: ["url1", "url2"]
}
响应: { success: true, momentId: 1 }
```

#### 4. 点赞/取消点赞
```
POST /api/moments/like
请求: {
  moment_id: 1,
  user_id: 1
}
响应: { success: true, liked: true }
```

#### 5. 添加评论
```
POST /api/moments/comment
请求: {
  moment_id: 1,
  user_id: 1,
  content: "说得对！",
  reply_to_npc_id: 2  // 可选，回复某个NPC
}
响应: { success: true, commentId: 1 }
```

#### 6. 获取未读数量
```
GET /api/moments/{roomId}/unread?userId=1
响应: { success: true, unreadCount: 5 }
```

#### 7. 标记已读
```
POST /api/moments/{roomId}/mark-read
请求: { user_id: 1 }
响应: { success: true }
```

### AI生成API

#### 8. AI生成朋友圈内容
```
POST /api/moments/ai-generate
请求: {
  room_id: "ROOM123",
  npc_id: 1
}
响应: { 
  success: true, 
  momentId: 1,
  content: "AI生成的内容"
}
```

#### 9. AI生成评论
```
POST /api/moments/ai-comment
请求: {
  moment_id: 1,
  npc_id: 2,
  reply_to_user_id: 1  // 可选
}
响应: { 
  success: true, 
  commentId: 1,
  content: "AI生成的评论"
}
```

#### 10. 触发自动生成（房主功能）
```
POST /api/moments/{roomId}/auto-generate
请求: {
  room_id: "ROOM123",
  frequency: 30  // 每30秒一次
}
响应: { success: true, message: "自动生成已启动" }
```

---

## 🎨 前端页面设计

### 1. 朋友圈列表页 `/room/{roomId}/moments`

```
┌─────────────────────────────────────┐
│ 🏠 返回    朋友圈    ➕ 发布         │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👨 王宝强  3分钟前               │ │
│ │ 今天拍戏很累，但很开心！          │ │
│ │ [图片]                          │ │
│ │ ───────────────────────────────  │ │
│ │ ❤️ 5 💬 3                        │ │
│ │                                 │ │
│ │ 💬 马蓉: 加油！                  │ │
│ │ 💬 宋喆: 辛苦了                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👤 我  5分钟前                   │ │
│ │ 周末愉快！                       │ │
│ │ ───────────────────────────────  │ │
│ │ ❤️ 8 💬 5                        │ │
│ │                                 │ │
│ │ 💬 王宝强: 你也是！               │ │
│ │ 💬 马蓉: 周末快乐~                │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### 2. 发布朋友圈界面

```
┌─────────────────────────────────────┐
│ ✕     发布朋友圈      发布           │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 这一刻的想法...                  │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [📷 添加图片]                        │
│                                     │
└─────────────────────────────────────┘
```

### 3. 红点提示

在聊天室列表的朋友圈入口显示红点：
```
┌─────────────────────────────────────┐
│ 💬 聊天  🎭 朋友圈 🔴5  ⚙️ 设置      │
└─────────────────────────────────────┘
```

---

## 🤖 AI生成逻辑

### 1. NPC发布朋友圈

```typescript
// Prompt示例
const prompt = `
你是${npc.name}，性格：${npc.personality}
当前剧情：${room.event_background}

请根据你的性格和当前剧情，发布一条朋友圈动态。
要求：
1. 符合人设和性格
2. 30-100字
3. 可以是日常生活、工作、情感等内容
4. 自然真实，不要过于正式

只返回朋友圈内容，不要其他文字。
`
```

### 2. NPC评论朋友圈

```typescript
// Prompt示例
const prompt = `
你是${npc.name}，性格：${npc.personality}
你看到了${authorName}发布的朋友圈：
"${momentContent}"

${existingComments}

请根据你的性格，对这条朋友圈进行评论。
要求：
1. 符合你的人设
2. 10-50字
3. 可以是认同、反对、调侃等
4. 考虑你和发布者的关系

只返回评论内容，不要其他文字。
`
```

### 3. NPC回复玩家评论

```typescript
// Prompt示例
const prompt = `
你是${npc.name}，性格：${npc.personality}
当前剧情：${room.event_background}

玩家对你的朋友圈评论说：
"${playerComment}"

请根据你的性格和当前剧情，回复这条评论。
要求：
1. 符合人设
2. 10-50字
3. 要针对玩家的评论内容回复
4. 保持角色一致性

只返回回复内容，不要其他文字。
`
```

---

## ⚙️ 自动生成机制

### 房间设置

```typescript
{
  room_id: "ROOM123",
  moment_frequency: 30,  // 秒，NPC发朋友圈的频率
  comment_frequency: 60, // 秒，NPC评论的频率
  auto_generate_enabled: true
}
```

### 后台任务逻辑

```typescript
// 每个房间的定时任务
setInterval(async () => {
  // 1. 随机选择一个NPC
  const randomNPC = selectRandomNPC(room.npcs)
  
  // 2. 生成朋友圈或评论
  const action = Math.random() > 0.5 ? 'post' : 'comment'
  
  if (action === 'post') {
    // 发布新朋友圈
    await aiGenerateMoment(room_id, randomNPC.id)
  } else {
    // 评论已有朋友圈
    const recentMoments = getRecentMoments(room_id, 5)
    if (recentMoments.length > 0) {
      const targetMoment = selectRandomMoment(recentMoments)
      await aiGenerateComment(targetMoment.id, randomNPC.id)
    }
  }
}, room.moment_frequency * 1000)
```

---

## 🔔 红点提示逻辑

### 前端轮询

```typescript
// 每30秒检查未读数量
setInterval(async () => {
  const response = await fetch(`/api/moments/${roomId}/unread?userId=${userId}`)
  const { unreadCount } = await response.json()
  
  // 更新UI红点
  updateBadge(unreadCount)
}, 30000)
```

### 实时更新

用户进入朋友圈页面时：
1. 获取朋友圈列表
2. 标记为已读
3. 清除红点

用户离开朋友圈页面时：
1. 记录离开时间
2. 后续新朋友圈会触发红点

---

## 📱 前端组件结构

```
pages/
  room/
    [roomId]/
      moments/
        index.vue       # 朋友圈列表
        create.vue      # 发布朋友圈
        [momentId].vue  # 朋友圈详情

components/
  moments/
    MomentCard.vue      # 朋友圈卡片
    MomentList.vue      # 朋友圈列表
    CommentList.vue     # 评论列表
    CommentInput.vue    # 评论输入框
    LikeButton.vue      # 点赞按钮
```

---

## 🚀 实现步骤

### Phase 1: 数据库和基础API（已完成）
- [x] 创建数据表
- [x] 基础CRUD API
- [ ] 完善所有API端点

### Phase 2: AI生成功能
- [ ] AI生成朋友圈内容
- [ ] AI生成评论
- [ ] AI回复玩家评论
- [ ] 后台自动生成任务

### Phase 3: 前端页面
- [ ] 朋友圈列表页
- [ ] 发布朋友圈界面
- [ ] 点赞和评论交互
- [ ] 红点提示

### Phase 4: 优化和测试
- [ ] 性能优化
- [ ] 实时更新优化
- [ ] 测试各种场景
- [ ] 用户体验优化

---

## 🧪 测试场景

### 1. 基础功能测试
- [ ] 玩家发布朋友圈
- [ ] 玩家点赞NPC朋友圈
- [ ] 玩家评论NPC朋友圈
- [ ] NPC自动回复玩家评论

### 2. 隔离性测试
- [ ] 不同房间的朋友圈互不可见
- [ ] A房间的NPC不能评论B房间的朋友圈

### 3. AI测试
- [ ] NPC发布的内容符合人设
- [ ] NPC评论符合性格
- [ ] NPC回复玩家时考虑上下文

### 4. 红点测试
- [ ] 有新朋友圈时显示红点
- [ ] 进入朋友圈后红点消失
- [ ] 离开朋友圈后新内容再次显示红点

---

## 💡 优化建议

### 1. 性能优化
- 分页加载朋友圈
- 图片懒加载
- 评论折叠（超过3条时）

### 2. 用户体验
- 上拉加载更多
- 下拉刷新
- 骨架屏加载
- 乐观更新（点赞、评论）

### 3. AI优化
- 缓存NPC最近的行为，避免重复内容
- 根据剧情进度调整朋友圈内容
- NPC之间的互动要考虑关系

---

## 📊 数据统计

可以添加的统计功能：
- 最受欢迎的朋友圈（点赞数）
- NPC活跃度排行
- 玩家参与度统计

---

**当前状态：** Phase 1 进行中
**下一步：** 完成剩余的API端点，然后实现AI生成功能

是否继续实现完整功能？

