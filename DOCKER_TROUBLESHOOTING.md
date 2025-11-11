# Docker 故障排查指南

## 常见错误及解决方案

### 错误：Docker daemon is not running

**错误信息**：
```
ERROR: error during connect: this error may indicate that the docker daemon is not running: 
Get "http://%2F%2F.%2Fpipe%2Fdocker_engine/_ping": open //./pipe/docker_engine: 
The system cannot find the file specified.
```

**原因**：
- Docker Desktop 未安装
- Docker Desktop 未启动
- Docker 服务未运行

**解决方案**：

#### Windows 系统

1. **检查 Docker Desktop 是否安装**
   ```powershell
   # 检查 Docker 是否安装
   docker --version
   ```
   
   如果提示命令不存在，需要安装 Docker Desktop：
   - 下载地址：https://www.docker.com/products/docker-desktop
   - 安装后重启电脑

2. **启动 Docker Desktop**
   - 在开始菜单搜索 "Docker Desktop"
   - 点击启动 Docker Desktop
   - 等待 Docker 启动完成（系统托盘会显示 Docker 图标）

3. **验证 Docker 是否运行**
   ```powershell
   # 检查 Docker 状态
   docker info
   
   # 或者运行简单命令测试
   docker ps
   ```

4. **如果 Docker Desktop 已启动但仍报错**
   - 右键点击系统托盘的 Docker 图标
   - 选择 "Restart Docker Desktop"
   - 等待重启完成

5. **检查 Windows 功能**
   - 确保已启用 "Windows Subsystem for Linux" (WSL 2)
   - 确保已启用 "Virtual Machine Platform"
   - 在 PowerShell (管理员) 中运行：
     ```powershell
     wsl --install
     ```

#### Linux 系统

1. **检查 Docker 服务状态**
   ```bash
   # 检查 Docker 服务状态
   sudo systemctl status docker
   ```

2. **启动 Docker 服务**
   ```bash
   # 启动 Docker 服务
   sudo systemctl start docker
   
   # 设置开机自启
   sudo systemctl enable docker
   ```

3. **验证 Docker 是否运行**
   ```bash
   # 检查 Docker 状态
   docker info
   ```

#### Mac 系统

1. **启动 Docker Desktop**
   - 在应用程序中找到 Docker Desktop
   - 点击启动
   - 等待 Docker 启动完成

2. **验证 Docker 是否运行**
   ```bash
   docker info
   ```

## 其他常见问题

### 问题 1：权限不足

**错误信息**：
```
permission denied while trying to connect to the Docker daemon socket
```

**解决方案（Linux）**：
```bash
# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

# 重新登录或执行
newgrp docker

# 验证
docker ps
```

### 问题 2：端口被占用

**错误信息**：
```
Bind for 0.0.0.0:9090 failed: port is already allocated
```

**解决方案**：
```bash
# 检查端口占用（Windows）
netstat -ano | findstr :9090

# 检查端口占用（Linux/Mac）
lsof -i :9090

# 停止占用端口的进程或更改端口
```

### 问题 3：镜像构建失败

**错误信息**：
```
failed to solve: failed to fetch
```

**解决方案**：
```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker build --no-cache -t ai-travel-planner:latest .
```

### 问题 4：磁盘空间不足

**错误信息**：
```
no space left on device
```

**解决方案**：
```bash
# 查看磁盘使用情况
docker system df

# 清理未使用的资源
docker system prune -a --volumes

# 清理构建缓存
docker builder prune -a
```

## Windows 特定问题

### WSL 2 相关问题

如果使用 WSL 2，可能需要：

1. **更新 WSL 2**
   ```powershell
   wsl --update
   ```

2. **设置默认 WSL 版本**
   ```powershell
   wsl --set-default-version 2
   ```

3. **检查 WSL 2 是否正常运行**
   ```powershell
   wsl --list --verbose
   ```

### Hyper-V 相关问题

如果遇到 Hyper-V 相关错误：

1. **启用 Hyper-V**（Windows 专业版/企业版）
   - 控制面板 -> 程序 -> 启用或关闭 Windows 功能
   - 勾选 "Hyper-V"
   - 重启电脑

2. **检查虚拟化是否启用**
   - 在 BIOS 中启用虚拟化支持（VT-x 或 AMD-V）

## 诊断命令

### 检查 Docker 环境

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker-compose --version

# 检查 Docker 信息
docker info

# 检查 Docker 守护进程状态
docker ps
```

### 检查系统资源

```bash
# 检查磁盘空间（Windows PowerShell）
Get-PSDrive C

# 检查磁盘空间（Linux/Mac）
df -h

# 检查内存使用（Windows）
systeminfo | findstr /C:"Total Physical Memory"

# 检查内存使用（Linux/Mac）
free -h
```

## 获取帮助

如果以上方法都无法解决问题：

1. **查看 Docker 日志**
   - Windows: 查看 Docker Desktop 日志
   - Linux: `journalctl -u docker.service`
   - Mac: 查看 Docker Desktop 日志

2. **重启 Docker**
   - Windows: 重启 Docker Desktop
   - Linux: `sudo systemctl restart docker`
   - Mac: 重启 Docker Desktop

3. **重新安装 Docker**
   - 完全卸载 Docker
   - 清理残留文件
   - 重新安装最新版本

4. **寻求帮助**
   - Docker 官方文档：https://docs.docker.com/
   - Docker 社区：https://forums.docker.com/
   - GitHub Issues：https://github.com/docker/for-win/issues

## 预防措施

1. **定期更新 Docker**
   - 保持 Docker Desktop 为最新版本
   - 定期检查更新

2. **监控资源使用**
   - 定期清理未使用的镜像和容器
   - 监控磁盘空间使用

3. **备份配置**
   - 备份 Docker 配置文件
   - 备份重要的镜像和容器

