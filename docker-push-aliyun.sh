#!/bin/bash

# Docker 镜像上传到阿里云容器镜像服务脚本
# 使用方法: ./docker-push-aliyun.sh [tag] [region] [namespace] [repository]
# 示例: ./docker-push-aliyun.sh latest cn-hangzhou my-namespace ai-travel-planner

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认参数
TAG=${1:-latest}
REGION=${2:-cn-hangzhou}
NAMESPACE=${3:-}
REPOSITORY=${4:-ai-travel-planner}

# 镜像名称
LOCAL_IMAGE="ai-travel-planner:${TAG}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  阿里云容器镜像服务上传脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查参数
if [ -z "$NAMESPACE" ]; then
    echo -e "${RED}错误: 请提供命名空间名称${NC}"
    echo "使用方法: ./docker-push-aliyun.sh [tag] [region] [namespace] [repository]"
    echo "示例: ./docker-push-aliyun.sh latest cn-hangzhou my-namespace ai-travel-planner"
    exit 1
fi

# 构建阿里云镜像地址
# 格式: registry.cn-{region}.aliyuncs.com/{namespace}/{repository}:{tag}
ALIYUN_REGISTRY="registry.${REGION}.aliyuncs.com"
ALIYUN_IMAGE="${ALIYUN_REGISTRY}/${NAMESPACE}/${REPOSITORY}:${TAG}"

echo -e "${YELLOW}配置信息:${NC}"
echo "  本地镜像: ${LOCAL_IMAGE}"
echo "  阿里云镜像: ${ALIYUN_IMAGE}"
echo "  区域: ${REGION}"
echo "  命名空间: ${NAMESPACE}"
echo "  仓库名: ${REPOSITORY}"
echo "  标签: ${TAG}"
echo ""

# 检查本地镜像是否存在
echo -e "${YELLOW}检查本地镜像...${NC}"
if ! docker images | grep -q "ai-travel-planner.*${TAG}"; then
    echo -e "${RED}错误: 本地镜像 ${LOCAL_IMAGE} 不存在${NC}"
    echo "请先构建镜像: docker build -t ${LOCAL_IMAGE} ."
    exit 1
fi
echo -e "${GREEN}本地镜像存在${NC}"
echo ""

# 提示登录阿里云
echo -e "${YELLOW}请先登录阿里云容器镜像服务${NC}"
echo "如果尚未登录，请运行以下命令："
echo -e "${BLUE}  docker login --username=你的用户名 ${ALIYUN_REGISTRY}${NC}"
echo ""
read -p "是否已经登录？(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}正在登录阿里云容器镜像服务...${NC}"
    docker login --username=${ALIYUN_USERNAME:-} ${ALIYUN_REGISTRY}
    if [ $? -ne 0 ]; then
        echo -e "${RED}登录失败，请检查用户名和密码${NC}"
        exit 1
    fi
fi
echo ""

# 给镜像打标签
echo -e "${YELLOW}给镜像打标签...${NC}"
docker tag ${LOCAL_IMAGE} ${ALIYUN_IMAGE}
if [ $? -eq 0 ]; then
    echo -e "${GREEN}镜像标签创建成功${NC}"
else
    echo -e "${RED}镜像标签创建失败${NC}"
    exit 1
fi
echo ""

# 推送镜像
echo -e "${YELLOW}推送镜像到阿里云...${NC}"
docker push ${ALIYUN_IMAGE}
if [ $? -eq 0 ]; then
    echo -e "${GREEN}镜像推送成功！${NC}"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  推送完成${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "镜像地址: ${ALIYUN_IMAGE}"
    echo ""
    echo "拉取镜像命令:"
    echo -e "${BLUE}  docker pull ${ALIYUN_IMAGE}${NC}"
    echo ""
    echo "在阿里云容器服务中使用:"
    echo -e "${BLUE}  ${ALIYUN_IMAGE}${NC}"
else
    echo -e "${RED}镜像推送失败${NC}"
    exit 1
fi


