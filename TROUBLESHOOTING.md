# 故障排除指南

## setup-config.bat 运行不了

### 问题描述
运行 `setup-config.bat` 时出现错误或无法执行。

### 解决方案

#### 方案 1：使用 PowerShell 脚本（推荐）

```powershell
.\setup-config.ps1
```

如果 PowerShell 脚本也无法运行，可能需要设置执行策略：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 方案 2：手动创建 config.yaml 文件

**Windows PowerShell:**
```powershell
# 确保在项目根目录
cd "G:\work for ai\ai travel\AI-Travel-Planner"

# 复制文件
Copy-Item config.yaml.example config.yaml
```

**Windows CMD:**
```cmd
# 切换到项目目录
cd /d "G:\work for ai\ai travel\AI-Travel-Planner"

# 复制文件
copy config.yaml.example config.yaml
```

**Linux/Mac:**
```bash
cp config.yaml.example config.yaml
```

#### 方案 3：检查文件路径

1. 确保在项目根目录运行脚本
2. 检查 `config.yaml.example` 文件是否存在
3. 检查当前目录：
   ```powershell
   # PowerShell
   Get-Location
   Get-ChildItem config.yaml.example
   ```

#### 方案 4：直接编辑创建 config.yaml 文件

如果以上方法都不行，可以手动创建 `config.yaml` 文件：

1. 在项目根目录创建 `config.yaml` 文件
2. 复制 `config.yaml.example` 的内容到 `config.yaml`
3. 编辑 `config.yaml` 文件，填入配置

## 常见错误

### 错误 1：文件找不到

**错误信息：**
```
'setup-config.bat' 不是内部或外部命令，也不是可运行的程序
```

**原因：** 不在项目目录，或文件不存在

**解决方案：**
```powershell
# 切换到项目目录
cd "G:\work for ai\ai travel\AI-Travel-Planner"

# 检查文件是否存在
Test-Path setup-config.bat
Test-Path config.yaml.example

# 如果文件存在，运行脚本
.\setup-config.bat
```

### 错误 2：权限不足

**错误信息：**
```
无法加载文件，因为在此系统上禁止运行脚本
```

**解决方案：**
```powershell
# 设置执行策略
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 然后运行脚本
.\setup-config.ps1
```

### 错误 3：编码问题

**错误信息：** 中文字符显示乱码

**解决方案：**
- 使用 PowerShell 脚本（`setup-config.ps1`）
- 或在 CMD 中设置编码：`chcp 65001`

### 错误 4：配置文件加载失败

**错误信息：**
```
读取配置文件失败: open config.yaml: no such file or directory
```

**原因：** `config.yaml` 文件不存在

**解决方案：**
```powershell
# 方法1：使用脚本
.\setup-config.ps1

# 方法2：手动创建
Copy-Item config.yaml.example config.yaml
```

### 错误 5：配置文件格式错误

**错误信息：**
```
解析配置文件失败: yaml: ...
```

**原因：** YAML 格式错误

**解决方案：**
1. 检查 YAML 文件格式
2. 确保使用空格缩进（不要使用 Tab）
3. 确保冒号后有空格
4. 检查字符串值是否用引号包裹（如果包含特殊字符）
5. 参考 `config.yaml.example` 文件的格式

### 错误 6：配置验证失败

**错误信息：**
```
配置验证失败: database.supabase_url 不能为空
```

**原因：** 必需配置项未填写

**解决方案：**
1. 编辑 `config.yaml` 文件
2. 确保以下项已配置：
   - `database.supabase_url`
   - `database.supabase_key`
   - `database.supabase_secret`
   - `apis.openai.api_key`

## 快速创建 config.yaml 文件

如果所有脚本都无法运行，使用以下命令快速创建：

**Windows PowerShell:**
```powershell
cd "G:\work for ai\ai travel\AI-Travel-Planner"
Copy-Item config.yaml.example config.yaml -Force
notepad config.yaml
```

**Windows CMD:**
```cmd
cd /d "G:\work for ai\ai travel\AI-Travel-Planner"
copy config.yaml.example config.yaml
notepad config.yaml
```

**Linux/Mac:**
```bash
cp config.yaml.example config.yaml
nano config.yaml
```

## 验证 config.yaml 文件

创建后，验证文件是否正确：

```powershell
# 检查文件是否存在
Test-Path config.yaml

# 查看文件内容（前几行）
Get-Content config.yaml -Head 10
```

## 需要帮助？

如果问题仍然存在，请检查：

1. ✅ 是否在项目根目录
2. ✅ `config.yaml.example` 文件是否存在
3. ✅ 是否有文件写入权限
4. ✅ 文件路径中是否有特殊字符
5. ✅ YAML 文件格式是否正确
6. ✅ 必需配置项是否已填写

然后使用手动创建的方法（方案 2）创建 `config.yaml` 文件。

## 配置文件路径

应用会按以下顺序查找配置文件：

1. 环境变量 `CONFIG_PATH` 指定的路径
2. `config.yaml`（当前目录）
3. `config.yml`（当前目录）
4. `./config.yaml`（当前目录）
5. `./config.yml`（当前目录）

如果配置文件不存在，应用会报错并退出。

## 相关文档

- [README.md](README.md) - 项目说明
- [BUILD.md](BUILD.md) - 构建说明
- [DOCKER.md](DOCKER.md) - Docker 部署指南
- [QUICKSTART.md](QUICKSTART.md) - 快速开始指南
- [config.yaml.example](config.yaml.example) - 配置文件示例
