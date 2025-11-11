# Docker 部署指南

本文档介绍如何使用 Docker 部署 AI Travel Planner 应用。

## 前置要求

- **Go 1.21+**：用于编译 Go 程序（**必需**）
- **Docker Engine 20.10+**：用于构建和运行 Docker 镜像
- **Docker Compose 2.0+**（可选）：用于 docker-compose 部署

## ⚠️ 重要提示

**本项目使用 YAML 配置文件，不再使用环境变量！**

配置方式：
- ✅ **正确方式**：创建 `config.yaml` 文件，填入配置
- ❌ **错误方式**：使用环境变量或 `.env` 文件

## 快速开始

### 1. 配置配置文件

**Windows:**
```bash
# 使用设置脚本
setup-config.bat

# 或手动复制
copy config.yaml.example config.yaml
```

**Linux/Mac:**
```bash
# 使用设置脚本
chmod +x setup-config.sh
./setup-config.sh

# 或手动复制
cp config.yaml.example config.yaml
```

然后编辑 `config.yaml` 文件，至少需要配置以下项：
- `database.supabase_url`: Supabase 数据库 URL
- `database.supabase_key`: Supabase 匿名密钥
- `database.supabase_secret`: Supabase 服务角色密钥
- `apis.openai.api_key`: OpenAI API 密钥（必需）

**注意：** `jwt.secret` 已内置默认密钥，无需配置。应用会自动使用内置的安全密钥。如需自定义，可在 `config.yaml` 文件中设置。

### 2. 构建 Docker 镜像

构建脚本会自动编译 Go 程序并将编译后的二进制文件打包到 Docker 镜像中。

**Windows:**
```bash
# 使用构建脚本（自动编译并构建镜像）
docker-build.bat

# 或指定标签
docker-build.bat v1.0.0
```

**Linux/Mac:**
```bash
# 添加执行权限
chmod +x docker-build.sh

# 使用构建脚本（自动编译并构建镜像）
./docker-build.sh

# 或指定标签
./docker-build.sh v1.0.0
```

**手动构建（如果已编译好二进制文件）：**
```bash
# 确保已编译好 ai-travel-planner-linux 文件
docker build -t ai-travel-planner:latest .
```

**查看镜像：**
```bash
# 查看镜像
docker images | grep ai-travel-planner
```

### 3. 运行容器

#### 方式一：使用 docker run

```bash
# 运行容器（挂载配置文件）
docker run -d \
  --name ai-travel-planner \
  -p 9090:9090 \
  -v ./config.yaml:/app/config.yaml:ro \
  --restart unless-stopped \
  ai-travel-planner:latest
```

#### 方式二：使用 docker-compose（推荐）

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f ai-travel-planner

# 停止服务
docker-compose down
```

## 配置文件说明

### 配置文件位置

- **开发环境**：项目根目录的 `config.yaml`
- **Docker 环境**：通过卷挂载 `./config.yaml:/app/config.yaml:ro`

### 必需配置

在 `config.yaml` 文件中配置以下项：

```yaml
database:
  supabase_url: "your_supabase_url"
  supabase_key: "your_supabase_anon_key"
  supabase_secret: "your_supabase_service_role_key"

apis:
  openai:
    api_key: "your_openai_api_key"
```

### 已内置配置（无需设置）

- `jwt.secret`: JWT 密钥已内置默认值，无需配置。如需自定义，可在配置文件中设置。

### 可选配置

**服务器配置（有默认值）：**
- `server.port`: 服务端口（默认: 9090）
- `server.mode`: 运行模式（默认: debug）

**OpenAI 高级配置（有默认值）：**
- `apis.openai.base_url`: OpenAI API 基础 URL（默认: https://api.openai.com/v1）
- `apis.openai.model`: OpenAI 模型名称（默认: gpt-4o-mini）
- `apis.openai.timeout_seconds`: 超时时间（默认: 120秒）

**可选功能配置：**
- `apis.amap.api_key`: 高德地图 API 密钥（地图导航功能）
- `apis.xunfei.app_id`: 科大讯飞应用 ID（语音识别功能）
- `apis.xunfei.api_key`: 科大讯飞 API 密钥
- `apis.xunfei.api_secret`: 科大讯飞 API 密钥
- `jwt.secret`: JWT 密钥（已内置默认值，如需自定义可覆盖）

## Docker Compose 服务说明

### ai-travel-planner

主应用服务，提供 API 和前端页面。

- 端口: 9090
- 健康检查: `/health` 端点
- 配置文件: 通过卷挂载 `./config.yaml:/app/config.yaml:ro`

### redis（可选）

Redis 缓存服务，用于缓存数据。

- 端口: 6379（可通过 REDIS_PORT 环境变量修改）

### nginx（可选）

Nginx 反向代理服务，用于负载均衡和 SSL 终止。

- HTTP 端口: 80
- HTTPS 端口: 443

## 常用命令

### 构建和运行

```bash
# 构建镜像（使用构建脚本，自动编译并构建）
# Windows
docker-build.bat

# Linux/Mac
chmod +x docker-build.sh
./docker-build.sh

# 运行容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps
```

### 调试

```bash
# 进入容器
docker exec -it ai-travel-planner sh

# 查看容器日志
docker logs -f ai-travel-planner

# 查看容器资源使用
docker stats ai-travel-planner

# 检查健康状态
docker inspect --format='{{.State.Health.Status}}' ai-travel-planner

# 查看配置文件
docker exec ai-travel-planner cat /app/config.yaml
```

### 清理

```bash
# 停止并删除容器
docker-compose down

# 删除镜像
docker rmi ai-travel-planner:latest

# 清理未使用的资源
docker system prune -a
```

## 生产环境部署建议

### 1. 使用配置文件

配置敏感信息存储在 `config.yaml` 文件中：

```bash
# 创建生产环境配置文件
cp config.yaml.example config.yaml.production

# 编辑配置文件
# 然后通过卷挂载
docker run -v ./config.yaml.production:/app/config.yaml:ro ...
```

### 2. 配置文件安全

- 不要将 `config.yaml` 文件提交到版本控制
- 使用文件权限限制访问：`chmod 600 config.yaml`
- 在生产环境使用 Secrets 管理（如 Kubernetes Secrets）

### 3. 配置 SSL/TLS

使用 Nginx 配置 SSL/TLS 证书：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://ai-travel-planner:9090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. 数据持久化

如果需要持久化数据，可以挂载卷：

```yaml
volumes:
  - ./data:/app/data
```

### 5. 资源限制

在 docker-compose.yml 中设置资源限制：

```yaml
services:
  ai-travel-planner:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 6. 日志管理

配置日志轮转和存储：

```yaml
services:
  ai-travel-planner:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 故障排查

### 容器无法启动

1. 检查日志: `docker-compose logs ai-travel-planner`
2. 检查配置文件: `docker exec ai-travel-planner cat /app/config.yaml`
3. 检查端口占用: `netstat -tulpn | grep 9090`

### 健康检查失败

1. 检查应用是否正常运行: `docker exec ai-travel-planner curl http://localhost:9090/health`
2. 检查端口映射: `docker port ai-travel-planner`
3. 检查防火墙设置

### 配置加载失败

1. 检查配置文件是否存在: `docker exec ai-travel-planner ls -la /app/config.yaml`
2. 检查配置文件格式: `docker exec ai-travel-planner cat /app/config.yaml`
3. 检查配置文件权限: 确保文件可读

### 数据库连接失败

1. 检查 Supabase 配置是否正确
2. 检查网络连接: `docker exec ai-travel-planner ping supabase.co`
3. 检查配置文件中的数据库配置

## 构建说明

### 构建流程

构建脚本会自动完成以下步骤：

1. **检查 Go 环境**：确保已安装 Go 并可以使用
2. **编译 Go 程序**：交叉编译为 Linux amd64 版本，生成 `ai-travel-planner-linux` 二进制文件
3. **检查静态文件**：验证 `web` 目录存在
4. **构建 Docker 镜像**：使用 Dockerfile 将编译后的二进制文件和静态文件打包到镜像中
5. **清理临时文件**：删除编译生成的临时文件

### 镜像特点

- **镜像体积小**：约 15-20MB，只包含运行时所需的文件
- **构建速度快**：不需要下载 Go 编译环境
- **安全性高**：使用非 root 用户运行，包含健康检查

### 前置要求

- **Go 环境**：需要安装 Go 1.21+ 用于编译程序
- **Docker 环境**：需要安装 Docker Engine 20.10+ 用于构建镜像

## 安全建议

1. 使用非 root 用户运行容器
2. 定期更新基础镜像
3. 使用 secrets 管理敏感信息（Docker Swarm 或 Kubernetes）
4. 限制容器资源使用
5. 启用日志审计
6. **配置文件安全**：不要将包含敏感信息的 `config.yaml` 提交到版本控制

## 上传镜像到阿里云容器镜像服务

### 快速开始

1. **使用上传脚本**（推荐）

   ```bash
   # Linux/Mac
   chmod +x docker-push-aliyun.sh
   ./docker-push-aliyun.sh latest cn-hangzhou my-namespace ai-travel-planner
   
   # Windows
   docker-push-aliyun.bat latest cn-hangzhou my-namespace ai-travel-planner
   ```

2. **手动上传**

   ```bash
   # 1. 登录阿里云
   docker login --username=你的用户名 registry.cn-hangzhou.aliyuncs.com
   
   # 2. 打标签
   docker tag ai-travel-planner:latest registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest
   
   # 3. 推送镜像
   docker push registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest
   ```

详细说明请参考 [ALIYUN_ACR_GUIDE.md](ALIYUN_ACR_GUIDE.md)

## 参考资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Alpine Linux 文档](https://alpinelinux.org/documentation/)
- [阿里云容器镜像服务文档](https://help.aliyun.com/product/60716.html)
- [YAML 配置文件格式](https://yaml.org/)
