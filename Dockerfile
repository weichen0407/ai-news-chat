# 使用Node.js 20官方镜像
FROM node:20-alpine

# 安装构建工具（better-sqlite3需要）
RUN apk add --no-cache python3 make g++

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制所有文件
COPY . .

# 构建应用
RUN npm run build

# 创建数据目录
RUN mkdir -p /app/data

# 设置环境变量
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# 暴露端口（Railway会使用PORT环境变量）
EXPOSE 3000

# 启动命令
CMD ["node", ".output/server/index.mjs"]

