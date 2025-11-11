# 快速开始指南

## 一键部署步骤

### 1. 配置配置文件

#### 方法一：使用脚本（推荐）

**Windows PowerShell:**
```powershell
.\setup-config.ps1
```

**Windows CMD:**
```cmd
setup-config.bat
```

**Linux/Mac:**
```bash
chmod +x setup-config.sh
./setup-config.sh
```

#### 方法二：手动创建

**Windows PowerShell:**
```powershell
Copy-Item config.yaml.example config.yaml
```

**Windows CMD:**
```cmd
copy config.yaml.example config.yaml
```

**Linux/Mac:**
```bash
cp config.yaml.example config.yaml
```

### 2. 编辑配置文件

打开 `config.yaml` 文件，填入必要的配置。至少需要配置以下项：

- `database.supabase_url`: Supabase 数据库 URL
- `database.supabase_key`: Supabase 匿名密钥
- `database.supabase_secret`: Supabase 服务角色密钥
- `apis.openai.api_key`: OpenAI API 密钥（必需）

**注意：** `jwt.secret` 已内置默认密钥，无需配置。应用会自动使用内置的安全密钥。

### 3. 构建 Docker 镜像

```bash
# Windows
docker-build.bat

# Linux/Mac
chmod +x docker-build.sh
./docker-build.sh
```

### 4. 启动服务

```bash
docker-compose up -d
```

### 5. 查看日志

```bash
docker-compose logs -f
```

## 常见问题

### 问题 1：setup-config.bat 运行不了

**解决方案：**

1. **使用 PowerShell 脚本：**
   ```powershell
   .\setup-config.ps1
   ```

2. **手动创建文件：**
   ```powershell
   # PowerShell
   Copy-Item config.yaml.example config.yaml
   
   # 或 CMD
   copy config.yaml.example config.yaml
   ```

3. **检查文件路径：**
   - 确保在项目根目录运行脚本
   - 确保 `config.yaml.example` 文件存在

### 问题 2：缺少 config.yaml 文件

**错误信息：** `读取配置文件失败: open config.yaml: no such file or directory`

**解决方案：**
```powershell
# 方法1：使用脚本
.\setup-config.ps1

# 方法2：手动创建
Copy-Item config.yaml.example config.yaml
```

### 问题 3：配置验证失败

**错误信息：** `配置验证失败: database.supabase_url 不能为空`

**解决方案：** 编辑 `config.yaml` 文件，填入相应的配置值。

### 问题 4：镜像构建失败

**错误信息：** `"/ai-travel-planner-linux": not found`

**解决方案：** 使用构建脚本 `docker-build.bat` 或 `./docker-build.sh`，它会自动编译 Go 程序。

### 问题 5：YAML 格式错误

**错误信息：** `解析配置文件失败: yaml: ...`

**解决方案：** 检查 `config.yaml` 文件格式，确保：
- 使用空格缩进（不要使用 Tab）
- 缩进层级正确
- 冒号后有空格
- 字符串值用引号包裹（如果包含特殊字符）

## 详细文档

- [BUILD.md](BUILD.md) - 构建说明
- [DOCKER.md](DOCKER.md) - Docker 部署指南
- [README.md](README.md) - 项目说明
- [config.yaml.example](config.yaml.example) - 配置文件示例

## 快速命令参考

```powershell
# 1. 创建配置文件
Copy-Item config.yaml.example config.yaml

# 2. 编辑配置文件（使用记事本）
notepad config.yaml

# 3. 构建镜像
.\docker-build.bat

# 4. 启动服务
docker-compose up -d

# 5. 查看日志
docker-compose logs -f

# 6. 停止服务
docker-compose down
```

## 重要提示

- **YAML 配置文件**：本项目使用 YAML 配置文件，不再使用环境变量
- **配置文件位置**：配置文件 `config.yaml` 需要在项目根目录
- **Docker 部署**：Docker 部署时通过卷挂载配置文件
- **安全**：不要将包含敏感信息的 `config.yaml` 文件提交到版本控制
- **生产环境建议**：生产环境建议通过环境变量 `CONFIG_PATH` 指定配置文件路径，或使用 Kubernetes Secrets 等方案管理配置
