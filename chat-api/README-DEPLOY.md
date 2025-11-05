# 🚀 快速部署指南

## 一键部署到Railway

### 方法1：使用部署助手（推荐）

```bash
cd /Users/QRF/Desktop/AI-news/chat-api
./deploy-helper.sh
```

按照提示操作即可！

---

### 方法2：手动部署

#### 1️⃣ 创建GitHub仓库
访问 https://github.com/new 创建新仓库

#### 2️⃣ 推送代码
```bash
git remote add origin https://github.com/你的用户名/chat-api.git
git push -u origin main
```

#### 3️⃣ 在Railway部署
1. 访问 https://railway.app
2. New Project → Deploy from GitHub repo
3. 选择你的chat-api仓库
4. 等待部署完成
5. Generate Domain获取访问地址

---

## 验证部署

访问你的域名，应该看到：
- ✅ Chat-API主界面
- ✅ 11个预设剧情
- ✅ 55个NPC角色

---

## 测试API

```bash
# 获取统计
curl https://你的域名.up.railway.app/api/stats

# 获取剧情列表
curl https://你的域名.up.railway.app/api/stories
```

---

## 详细文档

查看 `DEPLOY-RAILWAY.md` 了解：
- 环境变量配置
- 数据持久化方案
- 故障排查
- 自定义域名
- 更多部署选项

---

## 成本

Railway免费计划完全够用：
- ✅ $5/月免费额度
- ✅ 500小时运行时间
- ✅ 100GB流量

---

## 获取帮助

有问题？查看：
1. `DEPLOY-RAILWAY.md` - 完整部署文档
2. `功能文档.md` - 功能说明
3. Railway Discord - https://discord.gg/railway

---

**快速开始 → 运行 `./deploy-helper.sh`** 🚀

