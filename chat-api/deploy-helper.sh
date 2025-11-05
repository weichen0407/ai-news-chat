#!/bin/bash

# Chat-API 部署助手脚本
# 帮助快速部署到Railway

echo "🚀 Chat-API 部署助手"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查是否已经创建了GitHub仓库
echo "📋 第一步：创建GitHub仓库"
echo ""
echo "请在GitHub上创建一个新仓库："
echo "1. 访问 https://github.com/new"
echo "2. 仓库名称建议：chat-api 或 story-creator"
echo "3. 选择 Public"
echo "4. 不要勾选 'Initialize with README'"
echo "5. 创建仓库"
echo ""
read -p "已创建GitHub仓库？(y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ 请先创建GitHub仓库后再运行此脚本"
    exit 1
fi

echo ""
echo "📝 第二步：输入GitHub仓库地址"
echo ""
echo "请输入完整的GitHub仓库地址（例如：https://github.com/username/chat-api.git）："
read GITHUB_REPO

if [ -z "$GITHUB_REPO" ]; then
    echo "❌ 仓库地址不能为空"
    exit 1
fi

echo ""
echo "🔗 第三步：关联远程仓库并推送"
echo ""

# 检查是否已经有远程仓库
if git remote | grep -q "origin"; then
    echo "⚠️  已存在远程仓库，删除旧的关联..."
    git remote remove origin
fi

# 添加远程仓库
git remote add origin "$GITHUB_REPO"

# 推送代码
echo "📤 推送代码到GitHub..."
if git push -u origin main 2>/dev/null; then
    echo "✅ 代码推送成功！"
else
    echo "⚠️  main分支推送失败，尝试master分支..."
    git branch -M main
    git push -u origin main
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 代码已推送到GitHub！"
echo ""
echo "🚂 第四步：部署到Railway"
echo ""
echo "现在请按照以下步骤部署："
echo ""
echo "1. 访问 https://railway.app"
echo "2. 点击 'New Project'"
echo "3. 选择 'Deploy from GitHub repo'"
echo "4. 选择你刚创建的仓库：$GITHUB_REPO"
echo "5. Railway会自动检测Dockerfile并开始部署"
echo "6. 等待2-3分钟完成构建"
echo "7. 点击 'Generate Domain' 获取访问域名"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 更多详细信息请查看："
echo "   DEPLOY-RAILWAY.md"
echo ""
echo "🎉 祝部署顺利！"
echo ""

