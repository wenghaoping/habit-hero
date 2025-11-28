# 习惯小英雄 Docker 部署指南

## 📦 快速开始

### 方式一：使用 Docker Compose（推荐）

1. **构建并启动容器**
```bash
docker-compose up -d
```

2. **访问应用**
```
http://localhost:4000
```

3. **停止容器**
```bash
docker-compose down
```

4. **查看日志**
```bash
docker-compose logs -f
```

### 方式二：使用 Docker 命令

1. **构建镜像**
```bash
docker build -t mmweng/habit-hero:latest .
```

2. **运行容器**
```bash
docker run -d \
  --name habit-hero \
  -p 4000:4000 \
  -v habit-data:/app/data \
  habit-hero:latest
```

3. **停止容器**
```bash
docker stop habit-hero
docker rm habit-hero
```

## 🚀 推送到 Docker Hub

### 1. 登录 Docker Hub
```bash
docker login
```

### 2. 构建并打标签
```bash
# 替换 mmweng 为你的 Docker Hub 用户名
docker build -t mmweng/habit-hero:latest .
```

### 3. 推送到 Docker Hub
```bash
docker push mmweng/habit-hero:latest
```

### 4. 其他人使用你的镜像
```bash
# 拉取镜像
docker pull mmweng/habit-hero:latest

# 运行
docker run -d \
  --name habit-hero \
  -p 4000:4000 \
  -v habit-data:/app/data \
  mmweng/habit-hero:latest
```

## 🔧 配置说明

### 端口
- 默认端口：`4000`
- 如需修改，可以通过环境变量 `PORT` 设置，或修改端口映射：
```bash
docker run -d -p 8080:4000 -v habit-data:/app/data habit-hero:latest
```

### 数据持久化
- 数据库文件存储在 `/app/data/habit_hero.db`
- 使用 Docker Volume 持久化数据：`-v habit-data:/app/data`
- 如需备份数据，可以将卷映射到主机目录：
```bash
docker run -d -p 4000:4000 -v ./data:/app/data habit-hero:latest
```

### 环境变量
- `PORT`: 服务器端口（默认 4000）
- `NODE_ENV`: 运行环境（默认 production）
- `DB_PATH`: 数据库文件路径（默认 /app/data/habit_hero.db）
- `GEMINI_API_KEY`: Google Gemini API Key（如果应用使用 AI 功能）

示例：
```bash
docker run -d \
  -p 4000:4000 \
  -v habit-data:/app/data \
  -e GEMINI_API_KEY=your_api_key \
  habit-hero:latest
```

## 📝 生产环境建议

### 1. 使用反向代理（Nginx）
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. 使用 HTTPS（Let's Encrypt）
```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

### 3. 定期备份数据
```bash
# 备份数据库
docker cp habit-hero:/app/data/habit_hero.db ./backup/habit_hero_$(date +%Y%m%d).db

# 或者直接备份 volume
docker run --rm -v habit-data:/data -v $(pwd):/backup alpine tar czf /backup/habit-data-backup.tar.gz /data
```

### 4. 监控和日志
```bash
# 查看容器状态
docker ps

# 查看实时日志
docker logs -f habit-hero

# 查看资源使用
docker stats habit-hero
```

## 🐛 故障排查

### 容器无法启动
```bash
# 查看详细日志
docker logs habit-hero

# 检查端口是否被占用
netstat -tlnp | grep 4000
```

### 数据丢失
- 确保使用了 Volume 持久化：`-v habit-data:/app/data`
- 检查卷是否存在：`docker volume ls`
- 查看卷详情：`docker volume inspect habit-data`

### 连接问题
- 确保防火墙允许端口 4000
- 检查容器网络：`docker network inspect bridge`
- 确认容器正在运行：`docker ps`

## 📊 性能优化

### 多阶段构建优化
当前 Dockerfile 已使用多阶段构建，可以：
1. 减小最终镜像大小
2. 提高构建速度
3. 提高安全性

### 资源限制
```bash
docker run -d \
  --name habit-hero \
  -p 4000:4000 \
  -v habit-data:/app/data \
  --memory="512m" \
  --cpus="0.5" \
  habit-hero:latest
```

## 🔄 更新应用

### 1. 停止旧容器
```bash
docker-compose down
```

### 2. 拉取新镜像（如果从 Docker Hub）
```bash
docker pull mmweng/habit-hero:latest
```

### 3. 重新构建（如果本地开发）
```bash
docker-compose build
```

### 4. 启动新容器
```bash
docker-compose up -d
```

## 📚 其他命令

### 进入容器调试
```bash
docker exec -it habit-hero sh
```

### 清理未使用的资源
```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 清理所有未使用的资源
docker system prune -a
```

## 🌐 云平台部署

### Railway
1. 连接 GitHub 仓库
2. Railway 会自动检测 Dockerfile
3. 设置环境变量
4. 部署

### Render
1. 创建新的 Web Service
2. 连接 GitHub 仓库
3. 选择 Docker 运行时
4. 设置端口和环境变量
5. 部署

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

## 💡 提示

- 首次运行会自动创建默认数据
- 数据库使用 SQLite，轻量且无需额外配置
- 默认家长密码是 `0000`，请在设置中修改
- 建议定期备份数据卷

