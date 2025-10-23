# Railway 部署指南 🚂

## 方法一：通过GitHub部署（推荐）

### 1. 准备Git仓库

```bash
# 初始化git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "准备部署到Railway"

# 创建GitHub仓库后，关联远程仓库
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送到GitHub
git push -u origin main
```

### 2. 在Railway上部署

1. 访问 https://railway.app
2. 点击 **"Start a New Project"**
3. 选择 **"Deploy from GitHub repo"**
4. 授权GitHub并选择你的仓库
5. Railway会自动检测到Nuxt项目并开始构建

### 3. 设置环境变量

在Railway项目页面：
1. 点击 **"Variables"** 标签
2. 添加以下变量：

```
DEEPSEEK_API_KEY=sk-da419e3d9ba94926991572267c0c086a
SESSION_SECRET=随机生成一个复杂的字符串
```

### 4. 等待部署完成

- Railway会自动构建和部署
- 完成后会生成一个公网URL，例如：`https://你的项目名.up.railway.app`

---

## 方法二：通过Railway CLI部署

### 1. 安装Railway CLI

```bash
npm install -g @railway/cli
```

### 2. 登录Railway

```bash
railway login
```

### 3. 初始化项目

```bash
railway init
```

按提示选择：
- 创建新项目
- 输入项目名称

### 4. 关联项目

```bash
railway link
```

### 5. 设置环境变量

```bash
railway variables set DEEPSEEK_API_KEY=sk-da419e3d9ba94926991572267c0c086a
railway variables set SESSION_SECRET=$(openssl rand -hex 32)
```

### 6. 部署

```bash
railway up
```

### 7. 查看部署状态

```bash
railway status
```

### 8. 生成公网域名

```bash
railway domain
```

---

## 重要提示 ⚠️

### 数据持久化

Railway会自动为你的SQLite数据库提供持久化存储。但为了安全：

1. **定期备份数据库**
```bash
# 下载数据库备份
railway run cat data/app.db > backup.db
```

2. **生产环境建议**：
   - 考虑使用Railway提供的PostgreSQL插件
   - 或使用外部数据库服务

### 文件上传

- Base64头像会存储在数据库中，无需额外配置
- 如果将来需要存储大量图片，考虑：
  - Cloudinary
  - AWS S3
  - 阿里云OSS

### 监控和日志

查看实时日志：
```bash
railway logs
```

或在Railway网页控制台查看。

---

## 常见问题

### Q: 部署失败怎么办？
A: 检查Railway控制台的Build Logs，通常是依赖安装或构建错误。

### Q: 数据库在哪里？
A: Railway会在 `/app/data/` 目录下自动创建SQLite数据库。

### Q: 如何更新部署？
A: 
- GitHub方式：直接push代码，Railway会自动重新部署
- CLI方式：运行 `railway up`

### Q: 费用多少？
A: 
- 免费试用：$5额度
- Hobby计划：$5/月（包含500小时运行时间）
- 按实际使用量计费

---

## 部署后测试

1. 访问Railway给你的URL
2. 注册一个测试账号
3. 创建一个群聊
4. 测试AI对话功能

---

## 技术支持

遇到问题？
- Railway文档：https://docs.railway.app
- Railway Discord：https://discord.gg/railway

---

**祝部署顺利！🎉**

