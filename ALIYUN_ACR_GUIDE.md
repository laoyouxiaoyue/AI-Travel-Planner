# 阿里云容器镜像服务 (ACR) 上传指南

本文档介绍如何将 Docker 镜像上传到阿里云容器镜像服务。

## 前置准备

### 1. 创建阿里云账户

如果没有阿里云账户，请先注册：
- 访问 [阿里云官网](https://www.aliyun.com/)
- 注册并完成实名认证

### 2. 开通容器镜像服务

1. 登录 [阿里云控制台](https://home.console.aliyun.com/)
2. 搜索 "容器镜像服务" 或 "Container Registry"
3. 开通容器镜像服务（个人版免费）

### 3. 创建命名空间

1. 进入 [容器镜像服务控制台](https://cr.console.aliyun.com/)
2. 点击左侧菜单 "命名空间"
3. 点击 "创建命名空间"
4. 输入命名空间名称（如：`my-apps`）
5. 选择地域（建议选择距离最近的地域）
6. 点击 "确定"

### 4. 创建镜像仓库

1. 在命名空间列表中，点击命名空间名称
2. 点击 "创建镜像仓库"
3. 填写仓库信息：
   - **仓库名称**: `ai-travel-planner`（或其他名称）
   - **仓库类型**: 选择 "私有" 或 "公开"
   - **摘要**: 填写仓库描述（可选）
   - **代码源**: 选择 "本地仓库"（不关联代码源）
4. 点击 "下一步" -> "创建镜像仓库"

### 5. 获取登录信息

1. 在镜像仓库详情页，点击 "登录指令"
2. 复制登录命令，例如：
   ```bash
   docker login --username=你的用户名 registry.cn-hangzhou.aliyuncs.com
   ```
3. 输入密码（阿里云账户密码或访问凭证）

## 上传镜像

### 方式一：使用上传脚本（推荐）

#### Linux/Mac

```bash
# 1. 给脚本添加执行权限
chmod +x docker-push-aliyun.sh

# 2. 运行脚本
./docker-push-aliyun.sh latest cn-hangzhou my-namespace ai-travel-planner

# 参数说明：
# - latest: 镜像标签
# - cn-hangzhou: 地域（根据你的命名空间选择）
# - my-namespace: 命名空间名称
# - ai-travel-planner: 仓库名称
```

#### Windows

```batch
# 运行脚本
docker-push-aliyun.bat latest cn-hangzhou my-namespace ai-travel-planner
```

### 方式二：手动上传

#### 1. 登录阿里云容器镜像服务

```bash
# 替换为你的用户名和地域
docker login --username=你的用户名 registry.cn-hangzhou.aliyuncs.com

# 输入密码
# Password: 你的阿里云密码
```

#### 2. 给镜像打标签

```bash
# 格式: docker tag 本地镜像 阿里云镜像地址
docker tag ai-travel-planner:latest registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest

# 说明：
# - ai-travel-planner:latest: 本地镜像名称和标签
# - registry.cn-hangzhou.aliyuncs.com: 阿里云容器镜像服务地址（根据地域选择）
# - my-namespace: 你的命名空间名称
# - ai-travel-planner: 你的仓库名称
# - latest: 镜像标签
```

#### 3. 推送镜像

```bash
# 推送镜像到阿里云
docker push registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest
```

#### 4. 验证上传

1. 登录 [容器镜像服务控制台](https://cr.console.aliyun.com/)
2. 进入你的命名空间
3. 点击镜像仓库名称
4. 在 "镜像版本" 标签页中查看上传的镜像

## 地域和镜像地址

阿里云容器镜像服务支持多个地域，镜像地址格式为：

```
registry.{地域}.aliyuncs.com/{命名空间}/{仓库名}:{标签}
```

### 常用地域

| 地域 | 镜像地址 |
|------|----------|
| 华东1（杭州） | `registry.cn-hangzhou.aliyuncs.com` |
| 华东2（上海） | `registry.cn-shanghai.aliyuncs.com` |
| 华北2（北京） | `registry.cn-beijing.aliyuncs.com` |
| 华南1（深圳） | `registry.cn-shenzhen.aliyuncs.com` |
| 香港 | `registry.cn-hongkong.aliyuncs.com` |
| 美国西部1（硅谷） | `registry.us-west-1.aliyuncs.com` |
| 新加坡 | `registry.ap-southeast-1.aliyuncs.com` |

## 使用上传的镜像

### 1. 从阿里云拉取镜像

```bash
# 拉取镜像
docker pull registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest
```

### 2. 在阿里云容器服务中使用

在阿里云容器服务 Kubernetes (ACK) 或容器服务 Swarm 中，可以直接使用镜像地址：

```yaml
# Kubernetes Deployment 示例
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-travel-planner
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ai-travel-planner
  template:
    metadata:
      labels:
        app: ai-travel-planner
    spec:
      containers:
      - name: ai-travel-planner
        image: registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest
        ports:
        - containerPort: 9090
```

### 3. 在 Docker Compose 中使用

```yaml
version: '3.8'
services:
  ai-travel-planner:
    image: registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest
    ports:
      - "9090:9090"
    volumes:
      - ./config.yaml:/app/config.yaml:ro
```

## 多标签推送

如果需要推送多个标签：

```bash
# 构建不同标签
docker tag ai-travel-planner:latest registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:v1.0.0
docker tag ai-travel-planner:latest registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:v1.0
docker tag ai-travel-planner:latest registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest

# 推送所有标签
docker push registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:v1.0.0
docker push registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:v1.0
docker push registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest
```

## 自动化推送（CI/CD）

### GitHub Actions 示例

```yaml
name: Build and Push to Aliyun ACR

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Aliyun ACR
        uses: docker/login-action@v2
        with:
          registry: registry.cn-hangzhou.aliyuncs.com
          username: ${{ secrets.ALIYUN_USERNAME }}
          password: ${{ secrets.ALIYUN_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest
            registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:${{ github.ref_name }}
```

### GitLab CI 示例

```yaml
build-and-push:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $ALIYUN_USERNAME -p $ALIYUN_PASSWORD registry.cn-hangzhou.aliyuncs.com
  script:
    - docker build -t registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:$CI_COMMIT_TAG .
    - docker push registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:$CI_COMMIT_TAG
  only:
    - tags
```

## 访问凭证管理

### 创建访问凭证（推荐）

为了安全，建议使用访问凭证而不是账户密码：

1. 进入 [访问凭证管理](https://cr.console.aliyun.com/cn-hangzhou/instance/credentials)
2. 点击 "设置Registry登录密码"
3. 设置独立的 Registry 密码
4. 使用此密码登录：

```bash
docker login --username=你的用户名 registry.cn-hangzhou.aliyuncs.com
# 输入 Registry 密码（不是阿里云账户密码）
```

## 常见问题

### 1. 登录失败

**问题**: `Error response from daemon: Get https://registry.cn-hangzhou.aliyuncs.com/v2/: unauthorized`

**解决方案**:
- 检查用户名和密码是否正确
- 确认地域是否正确
- 尝试使用访问凭证而不是账户密码

### 2. 推送失败 - 权限不足

**问题**: `denied: requested access to the resource is denied`

**解决方案**:
- 检查命名空间和仓库名称是否正确
- 确认你有该仓库的推送权限
- 检查仓库是否为私有仓库且已正确登录

### 3. 网络问题

**问题**: 推送速度慢或超时

**解决方案**:
- 使用距离较近的地域
- 检查网络连接
- 使用阿里云内网地址（如果在阿里云服务器上）

### 4. 镜像大小限制

**问题**: 镜像太大无法推送

**解决方案**:
- 优化 Dockerfile，减小镜像体积
- 使用多阶段构建
- 删除不必要的文件

## 镜像管理

### 查看镜像列表

在阿里云控制台可以：
- 查看所有镜像版本
- 查看镜像大小
- 查看推送时间
- 删除不需要的镜像版本

### 镜像安全扫描

阿里云容器镜像服务提供安全扫描功能：
1. 进入镜像仓库详情页
2. 点击 "安全扫描"
3. 查看扫描结果和漏洞信息

### 镜像同步

可以设置镜像同步规则，将镜像同步到其他地域：
1. 进入镜像仓库详情页
2. 点击 "同步管理"
3. 创建同步规则

## 参考资源

- [阿里云容器镜像服务文档](https://help.aliyun.com/product/60716.html)
- [Docker 官方文档](https://docs.docker.com/)
- [容器镜像服务控制台](https://cr.console.aliyun.com/)

## 完整示例

```bash
# 1. 构建镜像
docker build -t ai-travel-planner:latest .

# 2. 登录阿里云
docker login --username=your-username registry.cn-hangzhou.aliyuncs.com

# 3. 打标签
docker tag ai-travel-planner:latest registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest

# 4. 推送镜像
docker push registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest

# 5. 验证
# 在阿里云控制台查看镜像，或使用以下命令拉取测试
docker pull registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest
```


