# 🔧 数据导入修复 #6 - moments 表缺失

## ❌ 问题描述

Railway 部署后访问应用，报错：
```
no such table: moments
```

## 🔍 问题原因

### 双重数据库初始化

应用中有**两个地方**初始化数据库：

1. **start.mjs** → `import-initial-data.mjs` → `createTables()`
   - ✅ 包含 moments 表定义
   - 只在应用启动时运行一次

2. **server/utils/db.ts** → `initDB()`  
   - ❌ 缺少 moments 表定义
   - **每次调用 getDB() 都会执行**

### 问题流程

```
1. start.mjs 启动
   ↓
2. import-initial-data.mjs 创建所有表（包括 moments）✅
   ↓
3. Nuxt 应用运行
   ↓
4. API 调用 getDB()
   ↓
5. db.ts 的 initDB() 执行
   ↓
6. initDB() 只创建基础表，没有 moments ❌
   ↓
7. 查询 moments 表时报错：no such table
```

---

## ✅ 解决方案

### 在 server/utils/db.ts 中添加 moments 相关表

```typescript
// 朋友圈表
db.exec(`
  CREATE TABLE IF NOT EXISTS moments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    npc_id INTEGER,
    author_type TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// 朋友圈点赞表
db.exec(`
  CREATE TABLE IF NOT EXISTS moment_likes (
    moment_id INTEGER NOT NULL,
    user_id INTEGER,
    npc_id INTEGER,
    liker_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(moment_id, user_id, npc_id, liker_type)
  )
`)

// 朋友圈评论表
db.exec(`
  CREATE TABLE IF NOT EXISTS moment_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    moment_id INTEGER NOT NULL,
    user_id INTEGER,
    npc_id INTEGER,
    commenter_type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// 自动控制配置表
db.exec(`
  CREATE TABLE IF NOT EXISTS auto_control_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    enabled INTEGER DEFAULT 1,
    max_tokens_per_hour INTEGER DEFAULT 10000,
    max_tokens_per_day INTEGER DEFAULT 50000,
    require_online_users INTEGER DEFAULT 0,
    active_hours_start INTEGER DEFAULT 0,
    active_hours_end INTEGER DEFAULT 24,
    moments_enabled INTEGER DEFAULT 1,
    moments_post_interval INTEGER DEFAULT 7200,
    moments_comment_interval INTEGER DEFAULT 1800,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)
```

---

## 📊 修复后的表结构

### 现在 db.ts 会创建所有必需的表

#### 基础表
- ✅ users
- ✅ rooms
- ✅ npcs
- ✅ room_members
- ✅ messages
- ✅ sessions
- ✅ friendships

#### 朋友圈功能表（新增）
- ✅ **moments** ← 修复
- ✅ **moment_likes** ← 修复
- ✅ **moment_comments** ← 修复

#### 管理功能表（新增）
- ✅ **auto_control_config** ← 修复

#### 创作工具表
- ✅ stories
- ✅ story_npcs

---

## 🚀 修复验证

部署成功后，以下功能应该正常工作：

### 朋友圈功能
```
✅ 查看朋友圈列表
✅ 发布朋友圈
✅ 点赞朋友圈
✅ 评论朋友圈
✅ NPC 自动发朋友圈
✅ NPC 自动评论
```

### 管理后台
```
✅ 智能控制配置
✅ Token 使用统计
✅ 朋友圈自动化控制
```

---

## 🎯 根本原因总结

### 为什么会出现这个问题？

1. **表定义分散**
   - 有些表在 `import-initial-data.mjs`
   - 有些表在 `server/utils/db.ts`
   - 不一致！

2. **初始化时机不同**
   - `start.mjs` 只运行一次（启动时）
   - `db.ts` 每次 API 调用都可能运行
   - **db.ts 必须包含所有表定义**

### 最佳实践

**所有表定义都应该在 `server/utils/db.ts` 的 `initDB()` 中**

```typescript
function initDB() {
  // ✅ 所有表定义都写在这里
  // ✅ 确保任何时候调用 getDB() 都能正常工作
  // ✅ 使用 CREATE TABLE IF NOT EXISTS（幂等性）
}
```

---

## 📝 所有修复汇总

到目前为止，已完成 **6 个修复**：

1. ✅ 表结构创建（users 等基础表）
2. ✅ rooms.event_background 字段
3. ✅ rooms.creator_id 字段名
4. ✅ room_members 完整字段
5. ✅ friendships 表字段简化
6. ✅ **moments 相关表缺失** ← 刚刚完成

---

## 🎉 完成！

代码已推送，Railway 会自动部署。

**预计 5-8 分钟后，所有功能（包括朋友圈）应该完全正常！** 🚀

