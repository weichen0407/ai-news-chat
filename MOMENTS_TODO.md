# 🎯 朋友圈功能 - 待办清单

## ✅ 已完成的后端API

### 基础功能
- [x] 初始化数据表 `/api/moments/init`
- [x] 获取朋友圈列表 `/api/moments/[roomId]/list`
- [x] 创建朋友圈 `/api/moments/create`
- [x] 点赞/取消点赞 `/api/moments/like`
- [x] 添加评论 `/api/moments/comment`
- [x] 获取未读数量 `/api/moments/[roomId]/unread`
- [x] 标记已读 `/api/moments/[roomId]/mark-read`

### AI功能
- [x] AI生成朋友圈 `/api/moments/ai-generate`
- [x] AI生成评论 `/api/moments/ai-comment`
- [x] NPC自动评论玩家朋友圈 `/api/moments/ai-auto-comment`

### 待实现（可选，后续迭代）
- [ ] 自动生成任务管理（定时任务）
- [ ] 上传图片功能
- [ ] 朋友圈删除功能
- [ ] 举报/屏蔽功能

---

## 📱 前端页面（下一步）

### 核心页面
- [ ] 朋友圈列表页 `pages/room/[roomId]/moments/index.vue`
- [ ] 发布朋友圈页 `pages/room/[roomId]/moments/create.vue`

### 组件
- [ ] MomentCard 朋友圈卡片
- [ ] CommentList 评论列表
- [ ] LikeButton 点赞按钮
- [ ] UnreadBadge 未读红点

---

## 🧪 测试计划

### Phase 1: 数据库测试（现在）
1. 测试数据表初始化
2. 测试基础CRUD操作

### Phase 2: API测试
1. 测试创建朋友圈
2. 测试点赞功能
3. 测试评论功能
4. 测试AI生成

### Phase 3: 前端测试
1. 测试页面渲染
2. 测试交互功能
3. 测试红点提示

### Phase 4: 集成测试
1. 测试玩家发布 → NPC自动评论
2. 测试房间隔离
3. 测试未读状态

---

## 🚀 部署前检查

- [ ] 所有API测试通过
- [ ] 前端页面完成
- [ ] 本地测试无bug
- [ ] 性能测试通过
- [ ] 提交到Git
- [ ] 部署到Railway

---

**当前进度：** 后端API 90%完成
**下一步：** 创建前端页面

