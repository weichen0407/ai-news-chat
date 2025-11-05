# 🎭 Story Creator

**独立的剧情和NPC创作工具**

一个完全独立的Web应用，用于创建、管理和导出AI对话所需的剧情、NPC角色和Prompt模板。

---

## ✨ 功能特性

### 📖 剧情管理
- ✅ 创建/编辑/删除剧情
- ✅ 设置事件背景和对话密度
- ✅ 自定义剧情图标
- ✅ 导出剧情为JSON文件

### 🤖 NPC角色管理
- ✅ 添加AI控制的角色
- ✅ 定义角色人设和性格
- ✅ 自定义角色头像
- ✅ 快速复制和删除

### 💬 Prompt模板管理
- ✅ 多种Prompt类型（系统提示、角色设定、对话引导等）
- ✅ 可视化编辑器
- ✅ 模板说明和分类
- ✅ 一键复制

### 🎨 界面特色
- 🎨 现代化渐变设计
- 📱 响应式布局
- ⚡ 快速操作
- 💾 实时保存

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd chat-api
npm install
```

### 2. 启动应用

```bash
npm start
```

服务器将运行在 `http://localhost:5001`

### 3. 开发模式（自动重启）

```bash
npm run dev
```

---

## 📦 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite (better-sqlite3)
- **前端**: 原生 JavaScript + HTML + CSS
- **无需框架**: 零依赖前端，快速启动

---

## 🗂️ 项目结构

```
chat-api/
├── server.js              # Express服务器
├── database.js            # 数据库初始化
├── package.json           # 项目配置
├── db/                    # SQLite数据库目录
│   └── stories.db
├── public/                # 前端静态文件
│   ├── index.html
│   ├── style.css
│   └── app.js
├── types.ts              # TypeScript类型定义
├── utils.ts              # 工具函数
├── createStory.ts        # 创建剧情API
├── createNPC.ts          # 创建NPC API
├── example.ts            # 使用示例
└── README-APP.md         # 本文档
```

---

## 📖 API文档

### 剧情相关

#### 获取所有剧情
```
GET /api/stories
```

#### 获取剧情详情
```
GET /api/stories/:id
```

#### 创建剧情
```
POST /api/stories
Body: {
  name: string,
  description: string,
  eventBackground: string,
  dialogueDensity: number,
  avatar: string
}
```

#### 更新剧情
```
PUT /api/stories/:id
```

#### 删除剧情
```
DELETE /api/stories/:id
```

#### 导出剧情
```
GET /api/stories/:id/export
```

### NPC相关

#### 获取剧情的所有NPC
```
GET /api/stories/:storyId/npcs
```

#### 创建NPC
```
POST /api/stories/:storyId/npcs
Body: {
  name: string,
  avatar: string,
  profile: string
}
```

#### 更新NPC
```
PUT /api/npcs/:id
```

#### 删除NPC
```
DELETE /api/npcs/:id
```

### Prompt相关

#### 获取剧情的所有Prompt
```
GET /api/stories/:storyId/prompts
```

#### 创建Prompt
```
POST /api/stories/:storyId/prompts
Body: {
  type: string,
  content: string,
  description: string
}
```

#### 更新Prompt
```
PUT /api/prompts/:id
```

#### 删除Prompt
```
DELETE /api/prompts/:id
```

### 统计信息
```
GET /api/stats
```

---

## 💡 使用场景

### 1. 游戏剧本创作
为游戏创建NPC对话和剧情分支

### 2. AI对话系统
为AI助手准备角色设定和对话模板

### 3. 教育培训
创建模拟场景和角色扮演剧本

### 4. 内容创作
管理小说、剧本的角色和情节

---

## 🔧 配置选项

### 环境变量

```bash
PORT=5000                    # 服务器端口
```

### 数据库位置

默认：`./db/stories.db`

可在 `database.js` 中修改

---

## 📊 数据导出格式

导出的JSON格式：

```json
{
  "version": "1.0",
  "story": {
    "id": "ABC123",
    "name": "剧情名称",
    "event_background": "背景描述",
    ...
  },
  "npcs": [
    {
      "id": 1,
      "name": "角色名",
      "profile": "人设",
      ...
    }
  ],
  "prompts": [
    {
      "id": 1,
      "type": "系统提示",
      "content": "prompt内容",
      ...
    }
  ],
  "exportedAt": "2025-10-30T..."
}
```

---

## 🔗 与AI-news项目集成

这个应用是完全独立的，但可以与AI-news项目配合使用：

1. 在Story Creator中创建剧情和NPC
2. 导出JSON文件
3. 在AI-news项目中导入
4. 或者通过API直接调用

---

## 🛠️ 开发计划

- [ ] 批量导入功能
- [ ] 标签分类系统
- [ ] 模板市场
- [ ] 协作编辑
- [ ] 版本历史
- [ ] AI辅助生成

---

## 📄 License

MIT

---

## 🙋 常见问题

### Q: 数据存储在哪里？
A: 所有数据存储在本地SQLite数据库 (`db/stories.db`)

### Q: 可以部署到服务器吗？
A: 可以！使用任何支持Node.js的服务器即可

### Q: 如何备份数据？
A: 直接备份 `db/stories.db` 文件

### Q: 支持多用户吗？
A: 当前版本不支持，未来版本会添加

---

## 📞 支持

如有问题或建议，欢迎提交Issue

Happy Creating! 🎉

