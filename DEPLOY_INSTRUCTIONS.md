# 🚀 Railway部署说明

## ✅ 代码已推送

所有更改已提交并推送到GitHub：`weichen0407/ai-news-chat`

## 🎯 本次更新内容

### 1. AI智能解析功能（Creator）
- 输入任何剧情文本，AI自动提取剧情和NPC
- 自动生成NPC的10项详细属性
- 一键创建完整剧情

### 2. Map Creator完整功能
- AI智能地图生成（优化prompt）
- 地图自动保存和加载
- AI自动分层（支持无区域）
- Tile Set管理
- 颜色-Tile映射
- 区域定义和编辑

### 3. 预设内容
- 11个完整预设剧情
- 每个剧情5个NPC角色
- 涵盖：办公室、绝命毒师、甄嬛传、NBA、加密货币、政治等主题

## 📋 Railway部署步骤

### 方式一：通过Railway Dashboard（推荐）

1. **访问Railway项目**
   ```
   https://railway.app/dashboard
   ```

2. **选择你的项目**
   - 找到 `ai-news-chat-production` 项目

3. **触发重新部署**
   - 点击项目进入详情页
   - Railway会自动检测到GitHub的新提交
   - 点击 "Deploy" 按钮触发部署
   - 或者等待自动部署（如果启用了自动部署）

4. **查看部署日志**
   - 在Deployments标签查看构建进度
   - 确保构建成功

5. **访问应用**
   ```
   https://ai-news-chat-production.up.railway.app
   ```

### 方式二：通过Railway CLI

```bash
# 1. 确保已安装Railway CLI
railway login

# 2. 链接项目
cd /Users/QRF/Desktop/AI-news
railway link

# 3. 触发部署
railway up

# 4. 查看日志
railway logs
```

## ⚙️ 环境变量（已配置）

确保以下环境变量在Railway中已设置：

- ✅ `DEEPSEEK_API_KEY` - DeepSeek API密钥（AI功能必需）
- ✅ `SESSION_SECRET` - Session密钥
- ✅ `DATABASE_URL` - PostgreSQL数据库URL（Railway自动提供）
- ✅ `NODE_VERSION` - 20

## 🔍 部署后验证

### 1. 主应用
```
https://ai-news-chat-production.up.railway.app
```
- 登录功能正常
- 群聊功能正常
- AI对话功能正常

### 2. Creator页面
```
https://ai-news-chat-production.up.railway.app/creator
```
- 预设剧情加载（11个剧情，55个角色）
- AI智能解析功能
- 创建剧情和NPC

### 3. Map Creator页面
```
https://ai-news-chat-production.up.railway.app/map-creator
```
- AI地图生成功能
- 地图保存和加载
- AI自动分层
- Tile Set管理

## 🐛 常见问题

### 问题1：部署失败 - 构建错误
**解决方案：**
```bash
# 清理缓存重新部署
railway up --detach
```

### 问题2：AI功能不工作
**检查：**
- Railway环境变量中 `DEEPSEEK_API_KEY` 是否正确设置
- 查看日志：`railway logs`

### 问题3：数据库连接错误
**检查：**
- PostgreSQL插件是否正常运行
- `DATABASE_URL` 环境变量是否自动设置

### 问题4：静态文件404
**说明：**
- Nuxt会自动处理public目录
- Map Creator和Creator的静态文件在 `public/` 目录下
- 部署后可通过 `/creator` 和 `/map-creator` 访问

## 📊 新功能测试清单

### Creator功能测试
- [ ] 访问 `/creator` 页面
- [ ] 查看11个预设剧情
- [ ] 点击任一剧情，查看5个NPC
- [ ] 测试AI智能解析：
  - 点击"新建剧情"
  - 输入测试文本
  - 点击"AI智能解析"
  - 查看自动填充的字段
  - 创建剧情
  - 验证NPC自动创建

### Map Creator功能测试
- [ ] 访问 `/map-creator` 页面
- [ ] 测试AI地图生成
- [ ] 查看保存的地图列表
- [ ] 测试加载地图
- [ ] 测试AI分层（无需定义区域）
- [ ] 测试Tile Set上传和切割

## 🎉 部署完成后

1. **通知用户**
   - 新功能已上线
   - 提供访问链接

2. **监控日志**
   ```bash
   railway logs --follow
   ```

3. **性能监控**
   - 在Railway Dashboard查看CPU和内存使用

4. **备份数据库**（重要！）
   ```bash
   railway db backup
   ```

---

**部署时间：** `date`
**版本：** 2.0 - AI智能解析 + Map Creator
**提交：** 1a6247a

🚀 准备就绪，可以开始部署！
