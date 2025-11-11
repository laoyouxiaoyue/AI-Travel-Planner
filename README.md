# AI旅行规划器

一个基于AI的智能旅行规划应用，支持语音输入、智能行程规划和费用管理。

## 功能特性

### 🎯 核心功能
- **智能行程规划**: 通过语音或文字输入，AI自动生成个性化旅行路线
- **语音识别**: 支持科大讯飞语音识别，方便用户输入
- **费用预算管理**: AI预算分析和实时费用记录
- **地图集成**: 基于高德地图API的位置服务和导航
- **用户管理**: 注册登录、云端数据同步

### 🛠 技术栈
- **后端**: Go + Gin框架
- **数据库**: Supabase (PostgreSQL)
- **语音识别**: 科大讯飞API
- **地图服务**: 高德地图API
- **AI服务**: OpenAI GPT-3.5
- **认证**: JWT Token

## 配置说明

本项目使用 YAML 配置文件进行配置，不再使用环境变量。

### 配置文件设置

1. **创建配置文件**
   ```bash
   # 使用脚本（推荐）
   # Windows PowerShell
   .\setup-config.ps1
   
   # Windows CMD
   setup-config.bat
   
   # Linux/Mac
   chmod +x setup-config.sh
   ./setup-config.sh
   ```

2. **编辑配置文件**
   打开 `config.yaml` 文件，填入必要的配置：
   - 数据库配置（Supabase）
   - OpenAI API 配置
   - 其他可选配置

详细配置说明请参考 [config.yaml.example](config.yaml.example)

## Docker 部署

### 环境检查

在开始之前，请先检查 Docker 环境：

```bash
# Windows PowerShell
.\check-docker.ps1

# Linux/Mac
chmod +x check-docker.sh
./check-docker.sh
```

如果遇到 Docker 未运行的问题，请参考 [DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md)

### 快速开始

1. **配置配置文件**

   创建 `config.yaml` 文件（多种方法）：
   
   **方法一：使用脚本（推荐）**
   ```powershell
   # Windows PowerShell
   .\setup-config.ps1
   
   # Windows CMD
   setup-config.bat
   
   # Linux/Mac
   chmod +x setup-config.sh
   ./setup-config.sh
   ```
   
   **方法二：手动创建**
   ```powershell
   # Windows PowerShell
   Copy-Item config.yaml.example config.yaml
   
   # Windows CMD
   copy config.yaml.example config.yaml
   
   # Linux/Mac
   cp config.yaml.example config.yaml
   ```
   
   然后编辑 `config.yaml` 文件，填入必要的配置：
   - `database.supabase_url`: Supabase 数据库 URL
   - `database.supabase_key`: Supabase 匿名密钥
   - `database.supabase_secret`: Supabase 服务角色密钥
   - `apis.openai.api_key`: OpenAI API 密钥（必需）
   
   **注意：** `jwt.secret` 已内置默认密钥，无需配置。如需自定义，可在 `config.yaml` 文件中设置。

2. **构建 Docker 镜像**

   **重要：** 构建前必须先编译 Go 程序！请使用构建脚本，它会自动完成编译和构建。

   ```bash
   # Windows
   docker-build.bat
   
   # Linux/Mac
   chmod +x docker-build.sh
   ./docker-build.sh
   ```
   
   **注意：** 
   - 需要安装 Go 1.21+ 环境用于编译程序
   - 不要直接运行 `docker build`，必须先编译 Go 程序
   - 详细说明请参考 [BUILD.md](BUILD.md)

3. **使用 Docker Compose 运行**
   ```bash
   # 启动服务
   docker-compose up -d
   
   # 查看日志
   docker-compose logs -f
   
   # 停止服务
   docker-compose down
   ```

   或者使用 Docker Run：
   ```bash
   docker run -d \
     --name ai-travel-planner \
     -p 9090:9090 \
     -v ./config.yaml:/app/config.yaml:ro \
     --restart unless-stopped \
     ai-travel-planner:latest
   ```

详细说明请参考 [DOCKER.md](DOCKER.md)

### 上传到阿里云镜像仓库

```bash
# 使用上传脚本
./docker-push-aliyun.sh latest cn-hangzhou my-namespace ai-travel-planner

# 或手动上传
docker login --username=你的用户名 registry.cn-hangzhou.aliyuncs.com
docker tag ai-travel-planner:latest registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest
docker push registry.cn-hangzhou.aliyuncs.com/my-namespace/ai-travel-planner:latest
```

详细说明请参考 [ALIYUN_ACR_GUIDE.md](ALIYUN_ACR_GUIDE.md)

## 项目结构

```
AI-Travel-Planner/
├── main.go                 # 应用入口
├── go.mod                  # Go模块文件
├── internal/               # 内部包
│   ├── config/            # 配置管理
│   ├── handlers/          # HTTP处理器
│   ├── middleware/         # 中间件
│   ├── models/            # 数据模型
│   ├── services/          # 业务服务
│   └── utils/             # 工具函数
├── config.yaml.example    # 配置文件示例
└── README.md              # 项目说明
```

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd AI-Travel-Planner

# 安装依赖
go mod tidy
```

### 2. 配置配置文件

复制 `config.yaml.example` 为 `config.yaml` 并填入相应配置：

```bash
# Windows PowerShell
Copy-Item config.yaml.example config.yaml

# Linux/Mac
cp config.yaml.example config.yaml
```

或使用配置脚本：
```bash
# Windows
setup-config.bat

# Linux/Mac
chmod +x setup-config.sh
./setup-config.sh
```

需要配置的API密钥：
- **Supabase**: 数据库和认证服务
- **科大讯飞**: 语音识别服务
- **高德地图**: 地图和位置服务
- **OpenAI**: AI语言模型服务

### 3. 数据库设置

在Supabase中创建以下表结构：

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 用户资料表
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 旅行计划表
CREATE TABLE travel_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(10,2),
    people INTEGER DEFAULT 1,
    preferences JSONB,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 旅行日程表
CREATE TABLE travel_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES travel_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    date DATE NOT NULL,
    activities JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 活动表
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID REFERENCES travel_days(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    cost DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 费用记录表
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES travel_plans(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'CNY',
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. 运行应用

```bash
# 开发模式
go run main.go

# 或构建后运行
go build -o ai-travel-planner
./ai-travel-planner
```

服务将在 `http://localhost:9090` 启动。

## API文档

### 认证相关

#### 用户注册
```http
POST /api/v1/auth/register
Content-Type: application/json

{
    "email": "user@example.com",
    "username": "username",
    "password": "password123"
}
```

#### 用户登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123"
}
```

### 旅行规划

#### 创建旅行计划
```http
POST /api/v1/travel/plan
Authorization: Bearer <token>
Content-Type: application/json

{
    "title": "日本5日游",
    "destination": "日本",
    "start_date": "2024-01-01",
    "end_date": "2024-01-05",
    "budget": 10000,
    "people": 2,
    "preferences": {
        "interests": ["美食", "动漫"],
        "accommodation": "酒店"
    }
}
```

#### 获取旅行计划
```http
GET /api/v1/travel/plans
Authorization: Bearer <token>
```

### 语音功能

#### 语音识别
```http
POST /api/v1/voice/recognize
Authorization: Bearer <token>
Content-Type: application/json

{
    "audio_data": "base64_encoded_audio",
    "language": "zh-cn"
}
```

### 地图服务

#### 搜索地点
```http
GET /api/v1/map/search?keyword=东京塔&city=东京
Authorization: Bearer <token>
```

## 开发指南

### 添加新功能

1. 在 `internal/models/` 中定义数据模型
2. 在 `internal/services/` 中实现业务逻辑
3. 在 `internal/handlers/` 中创建HTTP处理器
4. 在 `main.go` 中注册路由

### 测试

```bash
# 运行测试
go test ./...

# 运行特定测试
go test ./internal/services
```

## 部署

### Docker部署

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o ai-travel-planner

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/ai-travel-planner .
CMD ["./ai-travel-planner"]
```

### 环境变量

生产环境需要设置以下环境变量：
- `GIN_MODE=release`
- 所有API密钥
- 数据库连接信息

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License
