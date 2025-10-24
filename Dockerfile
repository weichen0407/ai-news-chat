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

# 复制package文件和npm配置
COPY package*.json ./
COPY .npmrc ./

# 清除缓存并强制重新安装（解决oxc-parser原生模块问题）
RUN npm cache clean --force && \
    rm -f package-lock.json && \
    npm install --force

# 复制所有文件
COPY . .

# 强制删除oxc-parser（可选依赖，但有bug）
RUN rm -rf node_modules/oxc-parser node_modules/.cache/oxc-parser || true

# 构建应用
RUN npm run build

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

