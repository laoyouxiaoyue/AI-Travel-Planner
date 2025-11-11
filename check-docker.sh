#!/bin/bash

# Docker 环境检查脚本 (Linux/Mac)
# 使用方法: ./check-docker.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   Docker 环境检查脚本${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 检查 Docker 是否安装
echo -e "${YELLOW}1. 检查 Docker 是否安装...${NC}"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "   ${GREEN}✓ Docker 已安装: ${DOCKER_VERSION}${NC}"
else
    echo -e "   ${RED}✗ Docker 未安装${NC}"
    echo -e "   ${YELLOW}请访问 https://docs.docker.com/get-docker/ 安装 Docker${NC}"
    exit 1
fi
echo ""

# 检查 Docker Compose 是否安装
echo -e "${YELLOW}2. 检查 Docker Compose 是否安装...${NC}"
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "   ${GREEN}✓ Docker Compose 已安装: ${COMPOSE_VERSION}${NC}"
else
    echo -e "   ${YELLOW}⚠ Docker Compose 未安装（可选）${NC}"
fi
echo ""

# 检查 Docker 守护进程是否运行
echo -e "${YELLOW}3. 检查 Docker 守护进程状态...${NC}"
if docker info &> /dev/null; then
    echo -e "   ${GREEN}✓ Docker 守护进程正在运行${NC}"
    SERVER_VERSION=$(docker info 2>/dev/null | grep "Server Version:" | awk '{print $3}')
    echo -e "   Server Version: ${SERVER_VERSION}${NC}"
else
    echo -e "   ${RED}✗ Docker 守护进程未运行${NC}"
    echo -e "   ${YELLOW}请启动 Docker 服务${NC}"
    echo ""
    echo -e "   ${YELLOW}解决步骤：${NC}"
    echo -e "   ${YELLOW}Linux:${NC}"
    echo -e "   1. sudo systemctl start docker"
    echo -e "   2. sudo systemctl enable docker"
    echo -e "   ${YELLOW}Mac:${NC}"
    echo -e "   1. 启动 Docker Desktop"
    echo -e "   2. 等待 Docker 启动完成"
    exit 1
fi
echo ""

# 检查 Docker 容器
echo -e "${YELLOW}4. 检查运行中的容器...${NC}"
CONTAINER_COUNT=$(docker ps -q | wc -l)
echo -e "   运行中的容器数量: ${CONTAINER_COUNT}${NC}"
if [ "$CONTAINER_COUNT" -gt 0 ]; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
fi
echo ""

# 检查 Docker 镜像
echo -e "${YELLOW}5. 检查本地镜像...${NC}"
IMAGE_COUNT=$(docker images -q | wc -l)
echo -e "   本地镜像数量: ${IMAGE_COUNT}${NC}"
if [ "$IMAGE_COUNT" -gt 0 ]; then
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -6
fi
echo ""

# 检查磁盘空间
echo -e "${YELLOW}6. 检查磁盘空间...${NC}"
if command -v df &> /dev/null; then
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    DISK_FREE=$(df -h / | awk 'NR==2 {print $4}')
    echo -e "   可用空间: ${DISK_FREE}${NC}"
    if [ "$DISK_USAGE" -gt 90 ]; then
        echo -e "   ${YELLOW}⚠ 磁盘空间不足，建议清理 Docker 资源${NC}"
        echo -e "   运行: docker system prune -a${NC}"
    else
        echo -e "   ${GREEN}✓ 磁盘空间充足${NC}"
    fi
fi
echo ""

# 检查 Docker 用户权限 (Linux)
if [ "$(uname)" != "Darwin" ]; then
    echo -e "${YELLOW}7. 检查 Docker 用户权限...${NC}"
    if groups | grep -q docker; then
        echo -e "   ${GREEN}✓ 当前用户在 docker 组中${NC}"
    else
        echo -e "   ${YELLOW}⚠ 当前用户不在 docker 组中${NC}"
        echo -e "   运行: sudo usermod -aG docker \$USER${NC}"
        echo -e "   然后重新登录${NC}"
    fi
    echo ""
fi

# 总结
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   检查完成${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 检查是否可以构建镜像
echo -e "${YELLOW}测试 Docker 构建功能...${NC}"
if docker build --help &> /dev/null; then
    echo -e "   ${GREEN}✓ Docker 构建功能正常${NC}"
    echo ""
    echo -e "   ${GREEN}现在可以构建镜像：${NC}"
    echo -e "   ${YELLOW}docker build -t ai-travel-planner:latest .${NC}"
fi

echo ""

