# 使用Node.js 20标准镜像（非Alpine，支持更多原生模块）
FROM node:20-slim

# 安装所有必要的构建工具
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    gcc \
    libc6-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制package文件和npm配置
COPY package*.json ./
COPY .npmrc ./

# 清除缓存并强制重新安装（解决oxc-parser原生模块问题）
RUN npm cache clean --force && \
    rm -f package-lock.json && \
    npm install --force

# 复制所有文件
COPY . .

# 构建应用（增加内存限制）
RUN OXC_PARSER_DISABLE=1 NODE_OPTIONS="--max-old-space-size=4096" npm run build

# 创建数据目录
RUN mkdir -p /app/data

# 设置环境变量
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV NUXT_TELEMETRY_DISABLED=1

# 暴露端口（Railway会使用PORT环境变量）
EXPOSE 3000

# 启动命令（使用启动脚本以便看到详细日志）
CMD ["node", "start.mjs"]