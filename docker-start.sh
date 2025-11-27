#!/bin/bash

# 快速启动脚本

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 习惯小英雄 Docker 快速启动${NC}\n"

# 检查是否已有容器在运行
if [ "$(docker ps -q -f name=habit-hero)" ]; then
    echo -e "${YELLOW}⚠️  容器已在运行${NC}"
    read -p "是否重启? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🔄 正在重启...${NC}"
        docker-compose restart
    fi
else
    echo -e "${YELLOW}📦 正在启动容器...${NC}"
    docker-compose up -d
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 启动成功!${NC}"
    echo -e "\n${BLUE}🌐 访问地址: ${GREEN}http://localhost:4000${NC}"
    echo -e "${BLUE}📊 查看日志: ${GREEN}docker-compose logs -f${NC}"
    echo -e "${BLUE}🛑 停止服务: ${GREEN}docker-compose down${NC}\n"
else
    echo -e "${RED}❌ 启动失败${NC}"
    exit 1
fi

