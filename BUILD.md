# 构建说明

## 重要提示

**Docker 镜像构建需要先编译 Go 程序！**

本项目的 Docker 镜像使用预编译的二进制文件，因此构建前必须先编译 Go 程序。

## 配置说明

**本项目使用 YAML 配置文件，不再使用环境变量！**

在构建和运行前，需要先创建 `config.yaml` 配置文件。

## 构建步骤

### 方式一：使用构建脚本（推荐）

构建脚本会自动完成编译和 Docker 镜像构建：

**Windows:**
```bash
docker-build.bat
```

**Linux/Mac:**
```bash
chmod +x docker-build.sh
./docker-build.sh
```

### 方式二：手动构建

1. **先编译 Go 程序：**
   ```bash
   # Windows PowerShell
   $env:GOOS="linux"
   $env:GOARCH="amd64"
   $env:CGO_ENABLED="0"
   go build -a -installsuffix cgo -ldflags="-w -s" -o ai-travel-planner-linux .
   
   # Linux/Mac
   GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -a -installsuffix cgo -ldflags="-w -s" -o ai-travel-planner-linux .
   ```

2. **然后构建 Docker 镜像：**
   ```bash
   docker build -t ai-travel-planner:latest .
   ```

3. **清理临时文件：**
   ```bash
   # Windows
   del ai-travel-planner-linux
   
   # Linux/Mac
   rm ai-travel-planner-linux
   ```

### 方式三：使用 Docker Compose

如果使用 `docker-compose build`，请确保先编译 Go 程序：

```bash
# 1. 先编译 Go 程序（参考方式二）
# 2. 然后构建镜像
docker-compose build

# 或者使用构建脚本，它会自动处理
docker-build.bat  # Windows
./docker-build.sh # Linux/Mac
```

## 配置文件设置

### 创建配置文件

构建完成后，需要配置 `config.yaml` 文件才能运行容器：

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

### 配置说明

编辑 `config.yaml` 文件，至少需要配置以下项：

**必需配置：**
- `database.supabase_url`: Supabase 数据库 URL
- `database.supabase_key`: Supabase 匿名密钥
- `database.supabase_secret`: Supabase 服务角色密钥
- `apis.openai.api_key`: OpenAI API 密钥

**注意：** `jwt.secret` 已内置默认密钥，无需配置。

**可选配置：**（如需使用相应功能，请在 `config.yaml` 文件中配置）
- `server.port`: 服务端口（默认: 9090）
- `server.mode`: 运行模式（默认: debug）
- `apis.openai.base_url`: OpenAI API 基础 URL（默认: https://api.openai.com/v1）
- `apis.openai.model`: OpenAI 模型名称（默认: gpt-4o-mini）
- `apis.amap.api_key`: 高德地图 API 密钥（地图导航功能）
- `apis.xunfei.app_id`: 科大讯飞应用 ID（语音识别功能）
- `apis.xunfei.api_key`: 科大讯飞 API 密钥
- `apis.xunfei.api_secret`: 科大讯飞 API 密钥

### 运行容器

配置完成后，使用以下命令运行：

```bash
# 使用 docker-compose（推荐）
docker-compose up -d

# 或使用 docker run
docker run -d -p 9090:9090 -v ./config.yaml:/app/config.yaml:ro --name ai-travel-planner ai-travel-planner:latest
```

## 常见错误

### 错误：`"/ai-travel-planner-linux": not found`

**原因：** 直接运行 `docker build` 而没有先编译 Go 程序。

**解决方案：** 使用构建脚本 `docker-build.bat` 或 `./docker-build.sh`，它会自动完成编译和构建。

### 错误：`go: command not found`

**原因：** 未安装 Go 环境。

**解决方案：** 安装 Go 1.21+，下载地址：https://golang.org/dl/

### 错误：`读取配置文件失败`

**原因：** `config.yaml` 文件不存在或路径不正确。

**解决方案：** 
1. 确保 `config.yaml` 文件存在于项目根目录
2. 或通过环境变量 `CONFIG_PATH` 指定配置文件路径
3. 使用 `setup-config.bat` 或 `setup-config.sh` 脚本创建配置文件

### 错误：`解析配置文件失败`

**原因：** `config.yaml` 文件格式错误。

**解决方案：** 检查 YAML 文件格式，确保缩进正确，参考 `config.yaml.example`

### 错误：`配置验证失败`

**原因：** 必需配置项未填写。

**解决方案：** 检查 `config.yaml` 文件，确保以下项已配置：
- `database.supabase_url`
- `database.supabase_key`
- `database.supabase_secret`
- `apis.openai.api_key`

## 构建脚本说明

构建脚本 (`docker-build.bat` / `docker-build.sh`) 会自动完成：

1. ✅ 检查 Go 环境
2. ✅ 编译 Go 程序为 Linux amd64 版本
3. ✅ 检查静态文件目录
4. ✅ 构建 Docker 镜像
5. ✅ 清理临时文件

## 配置文件路径

应用会按以下顺序查找配置文件：

1. 环境变量 `CONFIG_PATH` 指定的路径
2. `config.yaml`（当前目录）
3. `config.yml`（当前目录）
4. `./config.yaml`（当前目录）
5. `./config.yml`（当前目录）

如果都不存在，应用会报错并退出。

## 注意事项

- 构建脚本会在构建完成后自动删除临时编译文件 `ai-travel-planner-linux`
- 如果需要保留编译文件，可以修改构建脚本，注释掉清理步骤
- Docker 镜像只包含运行时文件，不包含源代码和编译工具
- **重要**：运行容器前必须配置 `config.yaml` 文件，否则容器无法启动
- **安全**：不要将包含敏感信息的 `config.yaml` 文件提交到版本控制
