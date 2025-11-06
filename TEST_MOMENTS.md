# 🧪 朋友圈功能测试指南

## 📋 测试准备

### Step 1: 初始化数据库表

访问: http://localhost:3001/api/moments/init (POST)

或使用curl:
```bash
curl -X POST http://localhost:3001/api/moments/init
```

预期结果:
```json
{
  "success": true,
  "message": "朋友圈数据表初始化成功"
}
```

---

## 🧪 基础功能测试

### Test 1: 创建朋友圈（玩家发布）

**前提**: 已登录，已加入某个房间

```bash
curl -X POST http://localhost:3001/api/moments/create \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "ROOM123",
    "user_id": 1,
    "content": "今天天气真好！☀️"
  }'
```

预期结果:
```json
{
  "success": true,
  "momentId": 1
}
```

---

### Test 2: 获取朋友圈列表

```bash
curl http://localhost:3001/api/moments/ROOM123/list
```

预期结果:
```json
{
  "success": true,
  "moments": [
    {
      "id": 1,
      "room_id": "ROOM123",
      "user_id": 1,
      "user_nickname": "Jerry",
      "content": "今天天气真好！☀️",
      "like_count": 0,
      "comment_count": 0,
      "likes": [],
      "comments": [],
      "created_at": "2025-11-05 10:00:00"
    }
  ]
}
```

---

### Test 3: 点赞功能

```bash
curl -X POST http://localhost:3001/api/moments/like \
  -H "Content-Type: application/json" \
  -d '{
    "moment_id": 1,
    "user_id": 1
  }'
```

预期结果:
```json
{
  "success": true,
  "liked": true
}
```

再次调用（取消点赞）:
```json
{
  "success": true,
  "liked": false
}
```

---

### Test 4: 添加评论

```bash
curl -X POST http://localhost:3001/api/moments/comment \
  -H "Content-Type: application/json" \
  -d '{
    "moment_id": 1,
    "user_id": 1,
    "content": "确实是个好天气！"
  }'
```

预期结果:
```json
{
  "success": true,
  "commentId": 1
}
```

---

### Test 5: 获取未读数量

```bash
curl "http://localhost:3001/api/moments/ROOM123/unread?userId=1"
```

预期结果:
```json
{
  "success": true,
  "unreadCount": 0
}
```

---

### Test 6: 标记已读

```bash
curl -X POST http://localhost:3001/api/moments/ROOM123/mark-read \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1
  }'
```

预期结果:
```json
{
  "success": true
}
```

---

## 🤖 AI功能测试

### Test 7: AI生成朋友圈

**前提**: 房间内有NPC

```bash
curl -X POST http://localhost:3001/api/moments/ai-generate \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "ROOM123",
    "npc_id": 1
  }'
```

预期结果:
```json
{
  "success": true,
  "momentId": 2,
  "content": "今天拍戏很累，但是心里很充实。这就是演员的生活吧。"
}
```

---

### Test 8: AI生成评论

```bash
curl -X POST http://localhost:3001/api/moments/ai-comment \
  -H "Content-Type: application/json" \
  -d '{
    "moment_id": 1,
    "npc_id": 2
  }'
```

预期结果:
```json
{
  "success": true,
  "commentId": 2,
  "content": "是啊，出来走走心情都好了！"
}
```

---

### Test 9: NPC自动评论玩家朋友圈

**触发条件**: 玩家发布朋友圈后自动调用

```bash
curl -X POST http://localhost:3001/api/moments/ai-auto-comment \
  -H "Content-Type: application/json" \
  -d '{
    "moment_id": 1,
    "room_id": "ROOM123"
  }'
```

预期结果:
```json
{
  "success": true,
  "message": "已触发 2 个NPC评论"
}
```

*注意*: 实际评论会在2-12秒后异步生成

---

## 📱 前端页面测试

### Test 10: 访问朋友圈列表页

访问: http://localhost:3001/room/ROOM123/moments

检查项:
- [x] 页面正常加载
- [x] 显示朋友圈列表
- [x] 显示点赞数和评论数
- [x] "发布"按钮可点击

---

### Test 11: 发布朋友圈

步骤:
1. 点击"➕ 发布"按钮
2. 输入内容
3. 点击"发布"按钮

检查项:
- [x] 模态框正常打开
- [x] 输入框可用
- [x] 发布成功后自动刷新列表
- [x] 新朋友圈显示在列表顶部

---

### Test 12: 点赞功能

步骤:
1. 点击某条朋友圈的"🤍"按钮

检查项:
- [x] 图标变为"❤️"
- [x] 点赞数+1
- [x] 再次点击取消点赞

---

### Test 13: 评论功能

步骤:
1. 点击某条朋友圈的"💬"按钮
2. 输入评论内容
3. 按回车或点击"发送"

检查项:
- [x] 评论输入框展开
- [x] 评论成功后显示在评论列表
- [x] 评论数+1

---

### Test 14: 未读红点

步骤:
1. 进入朋友圈页面（会自动标记已读）
2. 返回聊天室
3. 等待NPC发布新朋友圈
4. 观察"🎭 朋友圈"按钮

检查项:
- [x] 有新朋友圈时显示红色数字徽章
- [x] 点击进入朋友圈后徽章消失

---

## 🔄 集成测试场景

### Scenario 1: 玩家发布 → NPC自动评论

1. 玩家A登录并进入房间
2. 玩家A发布朋友圈："周末愉快！"
3. 等待3-12秒
4. 刷新朋友圈列表
5. 应该看到NPC们的评论

**预期**: 房间内50%的NPC会评论，每个NPC评论延迟不同

---

### Scenario 2: 房间隔离测试

1. 创建两个房间：Room A 和 Room B
2. 在Room A发布朋友圈
3. 在Room B查看朋友圈列表

**预期**: Room B看不到Room A的朋友圈

---

### Scenario 3: NPC互评测试

1. 触发NPC1生成朋友圈
2. 触发NPC2评论NPC1的朋友圈
3. 触发NPC1回复NPC2的评论

**预期**: 评论内容符合各自人设，形成对话

---

## 🐛 已知问题和注意事项

### 注意事项
1. **DeepSeek API**: 确保 `DEEPSEEK_API_KEY` 已配置
2. **数据库**: 首次使用需要初始化表
3. **NPC数据**: 确保房间内有NPC且NPC有完整的人设信息
4. **延迟**: NPC评论有随机延迟，测试时需要等待

### 可能的错误
- `DeepSeek API密钥未配置`: 检查环境变量
- `房间ID不能为空`: 检查API调用参数
- `NPC不存在或不属于该房间`: 检查NPC和房间的关联

---

## ✅ 测试检查清单

### 后端API测试
- [ ] 数据表初始化成功
- [ ] 创建朋友圈成功
- [ ] 获取朋友圈列表成功
- [ ] 点赞/取消点赞成功
- [ ] 添加评论成功
- [ ] 获取未读数量成功
- [ ] 标记已读成功
- [ ] AI生成朋友圈成功
- [ ] AI生成评论成功
- [ ] NPC自动评论成功

### 前端页面测试
- [ ] 朋友圈列表页正常加载
- [ ] 发布朋友圈功能正常
- [ ] 点赞功能正常
- [ ] 评论功能正常
- [ ] 未读红点显示正常
- [ ] 从聊天室跳转到朋友圈正常

### 集成测试
- [ ] 玩家发布→NPC自动评论流程正常
- [ ] 房间隔离功能正常
- [ ] AI生成内容符合人设

### 性能测试
- [ ] 列表加载速度 < 1秒
- [ ] AI生成响应 < 5秒
- [ ] 页面交互流畅

---

## 🚀 部署前最终检查

- [ ] 所有API测试通过
- [ ] 所有前端测试通过
- [ ] 所有集成测试通过
- [ ] 无console错误
- [ ] 无网络请求失败
- [ ] 已测试多个房间场景
- [ ] 已测试多用户场景
- [ ] 代码已提交到Git

**测试完成后，即可部署到Railway！**

