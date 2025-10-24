# 使用Node.js 20标准镜像（非Alpine，支持更多原生模块）
FROM node:20-slim

# 安装构建工具（better-sqlite3需要）
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY .npmrc ./

# 安装依赖
RUN npm ci --legacy-peer-deps --force --omit=optional

# 复制所有文件
COPY . .

# 构建应用
RUN OXC_PARSER_DISABLE=1 npm run build

# 创建数据目录
RUN mkdir -p /app/data

# 设置环境变量
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV OXC_PARSER_DISABLE=1

# 暴露端口（Railway会使用PORT环境变量）
EXPOSE 3000

# 启动命令（使用启动脚本以便看到详细日志）
CMD ["node", "start.mjs"]

