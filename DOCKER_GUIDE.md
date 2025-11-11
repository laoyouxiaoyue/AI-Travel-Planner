# Docker 使用指南

本文档介绍如何使用 Docker 部署和运行 AI Travel Planner 应用。

## 目录

- [快速开始](#快速开始)
- [从阿里云拉取镜像](#从阿里云拉取镜像)
- [配置文件设置](#配置文件设置)
- [运行容器](#运行容器)
- [使用 Docker Compose](#使用-docker-compose)
- [常用命令](#常用命令)
- [故障排查](#故障排查)

## 快速开始

### 1. 拉取镜像

从阿里云容器镜像服务拉取镜像：

```bash
docker pull crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest
```

### 2. 创建配置文件

创建 `config.yaml` 配置文件：

```bash
# 复制示例配置文件
cp config.yaml.example config.yaml

# 编辑配置文件，填入必要的配置
vi config.yaml
```

**必需配置：**
- `database.supabase_url`: Supabase 数据库 URL
- `database.supabase_key`: Supabase 匿名密钥
- `database.supabase_secret`: Supabase 服务角色密钥
- `apis.openai.api_key`: OpenAI API 密钥

### 3. 运行容器

```bash
docker run -d \
  --name ai-travel-planner \
  -p 9090:9090 \
  -v $(pwd)/config.yaml:/app/config.yaml:ro \
  --restart unless-stopped \
  crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest
```

### 4. 访问应用

- 应用地址: http://localhost:9090
- 健康检查: http://localhost:9090/health

## 从阿里云拉取镜像

### 登录阿里云 Registry

```bash
docker login --username=aliyun4101854321 crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com
```

输入密码后，即可拉取镜像。

### 拉取镜像

```bash
docker pull crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest
```

### 镜像信息

- **Registry**: `crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com`
- **命名空间**: `shuaiyun`
- **仓库**: `work`
- **标签**: `latest`
- **完整地址**: `crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest`

## 配置文件设置

### 配置文件位置

配置文件 `config.yaml` 需要放在运行 `docker run` 命令的目录中，或者使用绝对路径。

### 配置文件示例

```yaml
server:
  port: "9090"
  mode: "release"

database:
  supabase_url: "your_supabase_url"
  supabase_key: "your_supabase_anon_key"
  supabase_secret: "your_supabase_service_role_key"

apis:
  openai:
    api_key: "your_openai_api_key"
    base_url: "https://api.openai.com/v1"
    model: "gpt-4o-mini"
    timeout_seconds: 120
  amap:
    api_key: ""  # 可选
  xunfei:
    app_id: ""     # 可选
    api_key: ""    # 可选
    api_secret: "" # 可选

jwt:
  secret: ""  # 可选，留空使用内置默认密钥
  expire_time: 24
```

### 重要提示

⚠️ **安全警告**: 
- 不要将包含真实 API Key 的 `config.yaml` 提交到 Git
- 确保配置文件权限正确：`chmod 600 config.yaml`
- 生产环境建议使用 Secrets 管理（如 Kubernetes Secrets）

## 运行容器

### 基本运行

```bash
docker run -d \
  --name ai-travel-planner \
  -p 9090:9090 \
  -v $(pwd)/config.yaml:/app/config.yaml:ro \
  --restart unless-stopped \
  crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest
```

### 使用绝对路径

```bash
docker run -d \
  --name ai-travel-planner \
  -p 9090:9090 \
  -v /path/to/config.yaml:/app/config.yaml:ro \
  --restart unless-stopped \
  crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest
```

### 参数说明

- `-d`: 后台运行（detached mode）
- `--name ai-travel-planner`: 容器名称
- `-p 9090:9090`: 端口映射（宿主机:容器）
- `-v $(pwd)/config.yaml:/app/config.yaml:ro`: 挂载配置文件（只读）
- `--restart unless-stopped`: 自动重启策略
- 最后是镜像地址

### 自定义端口

如果 9090 端口被占用，可以映射到其他端口：

```bash
docker run -d \
  --name ai-travel-planner \
  -p 8080:9090 \
  -v $(pwd)/config.yaml:/app/config.yaml:ro \
  --restart unless-stopped \
  crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest
```

此时应用访问地址为：http://localhost:8080

## 使用 Docker Compose

### 1. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  ai-travel-planner:
    image: crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest
    container_name: ai-travel-planner
    ports:
      - "9090:9090"
    volumes:
      - ./config.yaml:/app/config.yaml:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9090/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 2. 运行服务

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 常用命令

### 查看容器状态

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括已停止的）
docker ps -a

# 查看容器详情
docker inspect ai-travel-planner
```

### 查看日志

```bash
# 查看日志
docker logs ai-travel-planner

# 实时查看日志
docker logs -f ai-travel-planner

# 查看最近 100 行日志
docker logs --tail 100 ai-travel-planner
```

### 容器管理

```bash
# 启动容器
docker start ai-travel-planner

# 停止容器
docker stop ai-travel-planner

# 重启容器
docker restart ai-travel-planner

# 删除容器
docker rm ai-travel-planner

# 删除容器并删除卷
docker rm -v ai-travel-planner
```

### 进入容器

```bash
# 进入容器 shell
docker exec -it ai-travel-planner sh

# 查看容器内的文件
docker exec ai-travel-planner ls -la /app

# 查看配置文件
docker exec ai-travel-planner cat /app/config.yaml
```

### 镜像管理

```bash
# 查看本地镜像
docker images

# 删除镜像
docker rmi crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest

# 拉取最新镜像
docker pull crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest
```

## 故障排查

### 问题 1: 配置文件读取失败

**错误信息：**
```
读取配置文件失败: read config.yaml: is a directory
```

**原因：** `config.yaml` 是一个目录而不是文件

**解决方案：**
```bash
# 检查 config.yaml 是否是目录
ls -ld config.yaml

# 如果是目录，删除它
rm -rf config.yaml

# 重新创建配置文件
cp config.yaml.example config.yaml
vi config.yaml
```

### 问题 2: 配置文件不存在

**错误信息：**
```
读取配置文件失败: open config.yaml: no such file or directory
```

**解决方案：**
```bash
# 确保配置文件存在
ls -la config.yaml

# 如果不存在，创建它
cp config.yaml.example config.yaml
vi config.yaml

# 确保配置文件路径正确
docker run -v $(pwd)/config.yaml:/app/config.yaml:ro ...
```

### 问题 3: 端口被占用

**错误信息：**
```
bind: address already in use
```

**解决方案：**
```bash
# 检查端口占用
netstat -tulpn | grep 9090

# 或者使用其他端口
docker run -p 8080:9090 ...
```

### 问题 4: 容器无法启动

**查看日志：**
```bash
docker logs ai-travel-planner
```

**检查配置：**
```bash
# 进入容器检查配置文件
docker exec ai-travel-planner cat /app/config.yaml

# 检查配置文件格式
docker exec ai-travel-planner sh -c "cat /app/config.yaml | head -20"
```

### 问题 5: 健康检查失败

**检查健康状态：**
```bash
# 查看容器健康状态
docker inspect --format='{{.State.Health.Status}}' ai-travel-planner

# 手动测试健康检查
docker exec ai-travel-planner curl -f http://localhost:9090/health
```

### 问题 6: 无法访问应用

**检查步骤：**
1. 检查容器是否运行：`docker ps`
2. 检查端口映射：`docker port ai-travel-planner`
3. 检查防火墙设置
4. 检查应用日志：`docker logs ai-travel-planner`

## 生产环境部署

### 1. 使用 Secrets 管理配置

生产环境不建议将配置文件直接挂载，建议使用 Secrets：

```bash
# 使用 Docker Secrets（Swarm 模式）
echo "your_config_content" | docker secret create config_yaml -

# 在 docker-compose.yml 中使用
services:
  ai-travel-planner:
    secrets:
      - config_yaml
```

### 2. 使用环境变量指定配置路径

```bash
docker run -d \
  --name ai-travel-planner \
  -p 9090:9090 \
  -v /secure/path/config.yaml:/app/config.yaml:ro \
  -e CONFIG_PATH=/app/config.yaml \
  --restart unless-stopped \
  crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest
```

### 3. 资源限制

```bash
docker run -d \
  --name ai-travel-planner \
  -p 9090:9090 \
  -v $(pwd)/config.yaml:/app/config.yaml:ro \
  --memory="512m" \
  --cpus="1.0" \
  --restart unless-stopped \
  crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest
```

### 4. 日志管理

```bash
docker run -d \
  --name ai-travel-planner \
  -p 9090:9090 \
  -v $(pwd)/config.yaml:/app/config.yaml:ro \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  --restart unless-stopped \
  crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest
```

## 更新镜像

### 拉取最新镜像

```bash
# 拉取最新镜像
docker pull crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest

# 停止旧容器
docker stop ai-travel-planner

# 删除旧容器
docker rm ai-travel-planner

# 运行新容器
docker run -d \
  --name ai-travel-planner \
  -p 9090:9090 \
  -v $(pwd)/config.yaml:/app/config.yaml:ro \
  --restart unless-stopped \
  crpi-zs2qvynk5d8h7r6k.cn-hangzhou.personal.cr.aliyuncs.com/shuaiyun/work:latest
```

## 相关文档

- [README.md](README.md) - 项目说明
- [BUILD.md](BUILD.md) - 构建说明
- [DOCKER.md](DOCKER.md) - Docker 部署详细指南
- [QUICKSTART.md](QUICKSTART.md) - 快速开始指南
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - 故障排除指南

## 支持

如有问题，请查看：
- [故障排查](#故障排查)
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- 项目 Issues

