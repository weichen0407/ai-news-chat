# 使用 Node.js 20 LTS
FROM node:20-slim

# 设置工作目录
WORKDIR /app

# 安装构建工具（SQLite需要）
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用文件
COPY . .

# 创建数据目录
RUN mkdir -p db

# 运行数据库迁移和预设数据
RUN node migrate.js || true
RUN node seed-all-dramas.js || true

# 暴露端口
EXPOSE 5001

# 启动应用
CMD ["npm", "start"]

