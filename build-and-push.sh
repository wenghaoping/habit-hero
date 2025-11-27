#!/bin/bash

# 习惯小英雄 Docker 构建和推送脚本

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 习惯小英雄 Docker 构建和推送脚本${NC}\n"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 错误: Docker 未安装${NC}"
    exit 1
fi

# 获取 Docker Hub 用户名
read -p "请输入你的 Docker Hub 用户名: " DOCKER_USERNAME

if [ -z "$DOCKER_USERNAME" ]; then
    echo -e "${RED}❌ 错误: 用户名不能为空${NC}"
    exit 1
fi

# 设置镜像名称和标签
IMAGE_NAME="$DOCKER_USERNAME/habit-hero"
VERSION="latest"

echo -e "\n${YELLOW}📦 开始构建 Docker 镜像...${NC}"
docker build -t $IMAGE_NAME:$VERSION .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 构建成功!${NC}\n"

# 询问是否推送
read -p "是否推送到 Docker Hub? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🔐 正在登录 Docker Hub...${NC}"
    docker login
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 登录失败${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}📤 正在推送镜像...${NC}"
    docker push $IMAGE_NAME:$VERSION
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 推送成功!${NC}"
        echo -e "\n${BLUE}📋 其他人可以使用以下命令拉取并运行你的镜像:${NC}"
        echo -e "${GREEN}docker pull $IMAGE_NAME:$VERSION${NC}"
        echo -e "${GREEN}docker run -d --name habit-hero -p 4000:4000 -v habit-data:/app/data $IMAGE_NAME:$VERSION${NC}"
    else
        echo -e "${RED}❌ 推送失败${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}ℹ️  跳过推送${NC}"
fi

echo -e "\n${GREEN}🎉 完成!${NC}"

