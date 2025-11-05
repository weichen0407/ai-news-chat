# ✅ Story Creator 已启动！

## 🎉 应用正在运行

**访问地址**: http://localhost:5001

---

## 📊 当前状态

✅ 服务器运行中 (端口 5001)  
✅ 数据库已初始化  
✅ 前端界面可访问  
✅ API接口正常  

---

## 🚀 立即使用

### 在浏览器打开:
```
http://localhost:5001
```

### 快速测试API:
```bash
curl http://localhost:5001/api/stats
```

---

## 📝 创建第一个剧情

1. 访问 http://localhost:5001
2. 点击"➕ 新建剧情"
3. 填写:
   - 名称: `办公室风云`
   - 背景: `某科技公司的职场故事...`
4. 点击"创建"
5. 添加NPC角色
6. 开始创作！

---

## 🛠️ 管理命令

```bash
# 查看应用状态
ps aux | grep "node server.js"

# 停止应用
pkill -f "node server.js"

# 重启应用
cd /Users/QRF/Desktop/AI-news/chat-api && npm start

# 查看端口占用
lsof -i:5001
```

---

## 📂 项目位置

```
/Users/QRF/Desktop/AI-news/chat-api/
```

### 重要文件:
- `server.js` - 服务器主文件
- `db/stories.db` - 数据库文件
- `public/` - 前端界面
- `README-APP.md` - 完整文档
- `QUICK-START.md` - 快速入门

---

## 🔧 配置说明

### 端口号
默认: `5001`  
(5000被macOS AirPlay占用，已改为5001)

修改端口:
```javascript
// server.js 第16行
const PORT = process.env.PORT || 5001;
```

### 数据库
位置: `db/stories.db`  
类型: SQLite  
备份: 直接复制文件

---

## 📖 功能概览

### 剧情管理
- ✅ 创建/编辑/删除剧情
- ✅ 设置事件背景
- ✅ 导出JSON

### NPC管理
- ✅ 添加AI角色
- ✅ 定义人设
- ✅ 自定义头像

### Prompt管理
- ✅ 系统提示
- ✅ 角色设定
- ✅ 对话引导
- ✅ 情节推进

---

## 🎯 下一步

1. 📖 创建你的第一个剧情
2. 🤖 添加2-3个NPC角色
3. 💬 设置Prompt模板
4. 📤 导出并测试

---

## ❓ 遇到问题？

### 访问不了?
- 确认地址: http://localhost:5001 ✅
- 检查进程: `lsof -i:5001`
- 查看日志: 终端输出

### 数据丢失?
- 备份数据库: `cp db/stories.db db/stories.db.backup`

### 端口冲突?
- 修改 `server.js` 中的端口号

---

🎭 **Story Creator - 让创作更简单！**

