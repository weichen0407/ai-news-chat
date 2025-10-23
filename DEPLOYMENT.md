# 部署指南

## Railway 部署

### 1. 准备工作
1. 注册 [Railway](https://railway.app) 账号
2. 安装 Railway CLI: `npm install -g @railway/cli`

### 2. 部署步骤

```bash
# 登录 Railway
railway login

# 初始化项目
railway init

# 添加环境变量
railway variables set DEEPSEEK_API_KEY=sk-da419e3d9ba94926991572267c0c086a

# 部署
railway up
```

### 3. 数据库配置

Railway会自动为SQLite创建持久存储。如果需要PostgreSQL：

```bash
# 添加PostgreSQL服务
railway add

# 获取数据库URL
railway variables
```

然后修改 `server/utils/db.ts` 切换到PostgreSQL。

---

## Vercel 部署

### 1. 准备工作
1. 注册 [Vercel](https://vercel.com) 账号
2. 安装 Vercel CLI: `npm install -g vercel`

### 2. 部署步骤

```bash
# 登录 Vercel
vercel login

# 部署
vercel

# 添加环境变量
vercel env add DEEPSEEK_API_KEY
# 输入: sk-da419e3d9ba94926991572267c0c086a
```

### 3. 注意事项

Vercel是无服务器环境，SQLite无法持久化。建议使用以下方案：

**选项1: 使用Vercel KV（推荐）**
```bash
vercel integration add neon
```

**选项2: 使用外部PostgreSQL**
- [Supabase](https://supabase.com) - 免费500MB
- [Neon](https://neon.tech) - 免费PostgreSQL

---

## 数据库迁移到PostgreSQL

如果使用PostgreSQL，需要修改 `server/utils/db.ts`:

```typescript
import { Pool } from 'pg'

let pool: Pool | null = null

export function getDB() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    })
    initDB()
  }
  return pool
}

// 修改SQL语法适配PostgreSQL
// INTEGER PRIMARY KEY AUTOINCREMENT -> SERIAL PRIMARY KEY
// DATETIME -> TIMESTAMP
```

安装pg依赖：
```bash
npm install pg @types/pg
```

---

## 环境变量

所有平台都需要设置：

```
DEEPSEEK_API_KEY=sk-da419e3d9ba94926991572267c0c086a
```

如果使用PostgreSQL，还需要：
```
DATABASE_URL=postgres://user:pass@host:5432/dbname
```

---

## 本地测试生产构建

```bash
# 构建
npm run build

# 预览
npm run preview
```

---

## 故障排查

### 数据库连接失败
- 检查 `data/` 目录权限
- 确保 `.gitignore` 包含 `data/`
- Railway/Vercel 检查持久存储配置

### API调用失败
- 验证 DEEPSEEK_API_KEY 是否正确设置
- 检查网络出站权限

### 构建失败
- 清理缓存: `rm -rf .nuxt .output node_modules`
- 重新安装: `npm install`
- 重新构建: `npm run build`

