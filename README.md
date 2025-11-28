
# 习惯小英雄 (Habit Hero)

> 本项目由 [Cursor](https://cursor.sh) AI 代码编辑器生成，是一个帮助家长培养孩子良好习惯的奖励系统应用。

## 📖 项目简介

习惯小英雄是一个面向家庭的习惯养成应用，通过积分奖励机制帮助孩子建立良好的日常习惯。应用包含家长端和儿童端，支持习惯管理、积分系统、奖励兑换等功能。

## 🚀 本地运行

### 前置要求

- **Node.js** 20+ 
- **npm** 或 **yarn**

### 安装依赖

```bash
# 清理旧的依赖（可选）
rm -rf node_modules

# 安装依赖
npm install
```

### 配置环境变量（可选）

如果需要使用 Gemini API 功能，创建 `.env.local` 文件并设置：

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 启动开发服务器

**方式一：分别启动前后端（推荐用于开发）**

1. 启动后端服务器：
   ```bash
   npm run server:dev
   ```
   后端将在 `http://localhost:4000` 运行

2. 在另一个终端启动前端开发服务器：
   ```bash
   npm run dev
   ```
   前端将在 `http://localhost:3000` 运行

3. 在浏览器中打开 `http://localhost:3000`

**方式二：使用生产模式（测试生产构建）**

```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```

访问 `http://localhost:4000`

## 🐳 Docker 本地运行

### 前置要求

- **Docker** 和 **Docker Compose**

### 快速启动（推荐）

使用提供的便捷脚本：

```bash
# 添加执行权限（首次使用）
chmod +x docker-start.sh

# 启动 Docker 容器
./docker-start.sh
```

脚本会自动：
- ✅ 检查并启动/重启容器
- ✅ 显示访问地址和常用命令

### 手动启动

```bash
# 构建并启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

启动后访问：`http://localhost:4000`

### Docker 常用命令

```bash
# 查看运行状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 进入容器调试
docker exec -it habit-hero sh

# 备份数据库
docker cp habit-hero:/app/data/habit_hero.db ./backup.db
```

## 📦 Docker 镜像打包

### 方式一：使用便捷脚本（推荐）

```bash
# 添加执行权限（首次使用）
chmod +x build-and-push.sh

# 运行脚本
./build-and-push.sh
```

脚本会引导你完成：
- ✅ 输入 Docker Hub 用户名
- ✅ 构建 Docker 镜像
- ✅ 登录 Docker Hub
- ✅ 推送镜像到远程仓库

### 方式二：手动打包

```bash
# 构建镜像
docker build -t habit-hero:latest .

# 或者指定平台（推荐用于跨平台部署）
docker build --platform linux/amd64 -t habit-hero:latest .
```

### 导出镜像到文件

```bash
# 导出镜像为 tar 文件
docker save -o habit-hero-amd64.tar habit-hero:latest

# 在其他机器上导入
docker load -i habit-hero-amd64.tar
```

## 📤 推送到 Docker Hub

### 使用脚本（推荐）

```bash
./build-and-push.sh
```

### 手动推送

```bash
# 1. 登录 Docker Hub
docker login

# 2. 构建并标记镜像（替换 YOUR_USERNAME 为你的 Docker Hub 用户名）
docker build -t YOUR_USERNAME/habit-hero:latest .

# 3. 推送镜像
docker push YOUR_USERNAME/habit-hero:latest
```

### 从 Docker Hub 拉取并运行

其他人可以使用你推送的镜像：

```bash
# 拉取镜像
docker pull YOUR_USERNAME/habit-hero:latest

# 运行容器
docker run -d \
  --name habit-hero \
  -p 4000:4000 \
  -v habit-data:/app/data \
  YOUR_USERNAME/habit-hero:latest
```

## 🛠️ 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具
- **Vue Router** - Vue.js 官方路由管理器
- **Lucide Vue Next** - 现代化图标库

### 后端
- **Express** - Node.js Web 应用框架
- **better-sqlite3** - 高性能 SQLite 数据库驱动
- **CORS** - 跨域资源共享支持

### 开发工具
- **TypeScript** - 类型检查
- **Vue TSC** - Vue 单文件组件类型检查
- **Vite Plugin Vue** - Vue 3 单文件组件支持

### 部署
- **Docker** - 容器化部署
- **Docker Compose** - 多容器应用编排
- **多阶段构建** - 优化镜像大小

## 📁 项目结构

```
habit-hero/
├── src/                    # 前端源码
│   ├── components/         # Vue 组件
│   ├── composables/        # Vue 组合式函数
│   ├── router/             # 路由配置
│   ├── views/              # 页面视图
│   └── main.ts             # 应用入口
├── server/                 # 后端代码
│   ├── server.js           # 开发环境服务器
│   ├── server-production.js # 生产环境服务器
│   └── habit_hero.db       # SQLite 数据库
├── public/                 # 静态资源
├── Dockerfile              # Docker 镜像构建文件
├── docker-compose.yml      # Docker Compose 配置
├── build-and-push.sh       # Docker 构建和推送脚本
├── docker-start.sh         # Docker 快速启动脚本
└── package.json            # 项目依赖配置
```

## 🔧 环境变量

### 开发环境

在 `.env.local` 文件中配置：

```bash
GEMINI_API_KEY=your_api_key_here  # Google Gemini API Key（可选）
```

### Docker 环境

在 `docker-compose.yml` 中配置：

```yaml
environment:
  - PORT=4000                    # 服务器端口
  - NODE_ENV=production          # 运行环境
  - GEMINI_API_KEY=your_key      # Google Gemini API Key（可选）
```

## 📚 相关文档

- [DOCKER_README.md](./DOCKER_README.md) - Docker 部署详细指南
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署文档

## 🎯 快速开始流程

1. **本地开发**：
   ```bash
   npm install
   npm run server:dev  # 终端 1
   npm run dev         # 终端 2
   ```

2. **Docker 测试**：
   ```bash
   ./docker-start.sh
   ```

3. **构建并推送**：
   ```bash
   ./build-and-push.sh
   ```

## ⚠️ 注意事项

- 默认家长密码：`0000`（首次登录后请立即修改）
- 数据库文件：`server/habit_hero.db`（开发环境）或 `/app/data/habit_hero.db`（Docker 环境）
- 生产环境建议使用 Nginx 反向代理 + HTTPS

## 📄 License

本项目由 Cursor AI 生成，请根据实际需求选择合适的开源协议。

---

**祝你使用愉快！** 🚀
