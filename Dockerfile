# 多阶段构建 Dockerfile
# 阶段 1: 构建前端
FROM --platform=linux/amd64 node:20-alpine AS frontend-builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件和 pnpm 配置
COPY package.json pnpm-lock.yaml .npmrc ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制前端源码
COPY . .

# 构建前端（生成 dist 目录）
RUN pnpm run build

# 阶段 2: 最终运行镜像
FROM --platform=linux/amd64 node:20-alpine

WORKDIR /app

# 安装 python3 和 build 工具（sqlite3 需要）
RUN apk add --no-cache python3 make g++

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件和 pnpm 配置
COPY package.json pnpm-lock.yaml .npmrc ./

# 只安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 复制后端代码
COPY server ./server
COPY types.ts ./

# 从构建阶段复制前端构建产物
COPY --from=frontend-builder /app/dist ./dist

# 创建数据目录（用于持久化数据库）
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 4000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=4000

# 启动后端服务器（生产模式）
CMD ["node", "server/server-production.js"]

