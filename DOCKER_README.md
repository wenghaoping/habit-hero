# 习惯小英雄 Docker 部署 - 快速指南

## ⚡ 最快启动方式

### 1. 使用 Docker Compose（一键启动）

```bash
# 启动
docker-compose up -d

# 访问
open http://localhost:4000
```

### 2. 使用便捷脚本

```bash
# 添加执行权限（首次使用）
chmod +x docker-start.sh

# 运行
./docker-start.sh
```

## 🐳 推送到 Docker Hub

### 方式一：使用脚本（推荐）

```bash
# 添加执行权限（首次使用）
chmod +x build-and-push.sh

# 运行脚本（会引导你完成整个过程）
./build-and-push.sh
```

脚本会自动完成：
- ✅ 输入你的 Docker Hub 用户名
- ✅ 构建 Docker 镜像
- ✅ 登录 Docker Hub
- ✅ 推送镜像到 Docker Hub
- ✅ 显示使用说明

### 方式二：手动操作

```bash
# 1. 登录 Docker Hub
docker login

# 2. 构建镜像（替换 mmweng 为你的 Docker Hub 用户名）
docker build -t mmweng/habit-hero:latest .

# 3. 推送镜像
docker push mmweng/habit-hero:latest
```

## 📥 从 Docker Hub 拉取并运行

其他人可以直接使用你推送的镜像：

```bash
# 拉取镜像
docker pull mmweng/habit-hero:latest

# 运行
docker run -d \
  --name habit-hero \
  -p 4000:4000 \
  -v habit-data:/app/data \
  mmweng/habit-hero:latest

# 访问
open http://localhost:4000
```

## 🔧 常用命令

```bash
# 查看运行状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 进入容器调试
docker exec -it habit-hero sh

# 备份数据库
docker cp habit-hero:/app/data/habit_hero.db ./backup.db

# 恢复数据库
docker cp ./backup.db habit-hero:/app/data/habit_hero.db
```

## 📊 项目结构

```
习惯小英雄/
├── Dockerfile                  # Docker 镜像构建文件
├── .dockerignore              # Docker 忽略文件
├── docker-compose.yml         # Docker Compose 配置
├── build-and-push.sh          # 构建和推送脚本 ✨
├── docker-start.sh            # 快速启动脚本 ✨
├── DOCKER_README.md           # 快速指南（本文件）
├── DEPLOYMENT.md              # 详细部署文档
└── server/
    ├── server.js              # 开发环境服务器
    └── server-production.js  # 生产环境服务器
```

## 🌟 特性

- ✅ **单容器部署** - 前后端打包在一个容器中
- ✅ **自动构建** - 自动编译前端静态文件
- ✅ **数据持久化** - SQLite 数据库通过 volume 持久化
- ✅ **零配置启动** - 开箱即用，自动初始化
- ✅ **多阶段构建** - 优化镜像大小
- ✅ **便捷脚本** - 一键构建、推送、启动

## 🔐 安全配置

- **默认端口**：`4000`
- **默认家长密码**：`0000`（⚠️ 首次登录后请立即修改）
- **数据存储**：`/app/data/habit_hero.db`
- **建议**：生产环境使用 Nginx 反向代理 + HTTPS

## 📝 环境变量配置

在 `docker-compose.yml` 中可以配置以下环境变量：

```yaml
environment:
  - PORT=4000                    # 服务器端口
  - NODE_ENV=production          # 运行环境
  - GEMINI_API_KEY=your_key      # Google Gemini API Key（可选）
```

## 🚀 云平台部署

### Railway
1. Fork 项目到 GitHub
2. 在 Railway 连接你的仓库
3. Railway 自动检测 Dockerfile
4. 一键部署 ✅

### Render
1. 连接 GitHub 仓库
2. 选择 Docker 运行时
3. 设置端口为 `4000`
4. 一键部署 ✅

### Fly.io
```bash
# 安装 flyctl
curl -L https://fly.io/install.sh | sh

# 登录
flyctl auth login

# 部署
flyctl launch
flyctl deploy
```

## 🐛 常见问题

### 1. 端口被占用
```bash
# 修改 docker-compose.yml 中的端口映射
ports:
  - "8080:4000"  # 改为其他端口
```

### 2. 容器无法启动
```bash
# 查看详细日志
docker logs habit-hero

# 或使用 docker-compose
docker-compose logs
```

### 3. 数据丢失
确保使用了 volume 持久化：
```bash
# 检查 volume 是否存在
docker volume ls | grep habit

# 查看 volume 详情
docker volume inspect habit-data
```

### 4. 构建失败
```bash
# 清理旧的构建缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

## 📖 完整文档

- **DOCKER_README.md** - 快速上手指南（本文件）
- **DEPLOYMENT.md** - 完整部署文档
  - 详细配置说明
  - 性能优化建议
  - 故障排查指南
  - 生产环境部署

## 🎯 快速测试流程

```bash
# 1. 本地测试
./docker-start.sh

# 2. 访问应用
open http://localhost:4000

# 3. 测试功能
# - 添加习惯
# - 完成任务
# - 兑换奖励

# 4. 查看日志
docker-compose logs -f

# 5. 停止服务
docker-compose down
```

## 💡 使用技巧

### 定期备份数据
```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker cp habit-hero:/app/data/habit_hero.db ./backups/backup_$DATE.db
echo "✅ 备份完成: backup_$DATE.db"
EOF

chmod +x backup.sh
./backup.sh
```

### 查看容器资源使用
```bash
# 实时监控
docker stats habit-hero

# 查看详细信息
docker inspect habit-hero
```

### 更新应用
```bash
# 停止旧容器
docker-compose down

# 拉取新镜像（如果从 Docker Hub）
docker pull mmweng/habit-hero:latest

# 重新启动
docker-compose up -d
```

## 🎉 完成！

现在你可以：

1. ✅ 本地运行：`./docker-start.sh`
2. ✅ 推送镜像：`./build-and-push.sh`
3. ✅ 部署到云：参考上面的云平台部署说明

---

**祝你使用愉快！** 🚀

如有问题，请查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取更多帮助。


## 导出docker
```bash
docker save -o habit-hero-amd64.tar habit-hero:latest
``` 