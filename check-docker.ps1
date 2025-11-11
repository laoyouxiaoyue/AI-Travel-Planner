# Docker 环境检查脚本 (Windows PowerShell)
# 使用方法: .\check-docker.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Docker 环境检查脚本" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker 是否安装
Write-Host "1. 检查 Docker 是否安装..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Docker 已安装: $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Docker 未安装" -ForegroundColor Red
        Write-Host "   请访问 https://www.docker.com/products/docker-desktop 下载安装" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ✗ Docker 未安装或未添加到 PATH" -ForegroundColor Red
    Write-Host "   请访问 https://www.docker.com/products/docker-desktop 下载安装" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 检查 Docker Compose 是否安装
Write-Host "2. 检查 Docker Compose 是否安装..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Docker Compose 已安装: $composeVersion" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Docker Compose 未安装（可选）" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠ Docker Compose 未安装（可选）" -ForegroundColor Yellow
}
Write-Host ""

# 检查 Docker 守护进程是否运行
Write-Host "3. 检查 Docker 守护进程状态..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Docker 守护进程正在运行" -ForegroundColor Green
        
        # 提取一些关键信息
        $serverVersion = ($dockerInfo | Select-String "Server Version:").ToString().Split(":")[1].Trim()
        Write-Host "   Server Version: $serverVersion" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ Docker 守护进程未运行" -ForegroundColor Red
        Write-Host "   请启动 Docker Desktop" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   解决步骤：" -ForegroundColor Yellow
        Write-Host "   1. 在开始菜单搜索 'Docker Desktop'" -ForegroundColor White
        Write-Host "   2. 点击启动 Docker Desktop" -ForegroundColor White
        Write-Host "   3. 等待 Docker 启动完成" -ForegroundColor White
        Write-Host "   4. 重新运行此脚本" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "   ✗ 无法连接到 Docker 守护进程" -ForegroundColor Red
    Write-Host "   请确保 Docker Desktop 已启动" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 检查 Docker 容器
Write-Host "4. 检查运行中的容器..." -ForegroundColor Yellow
try {
    $containers = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        $containerCount = (docker ps -q).Count
        Write-Host "   运行中的容器数量: $containerCount" -ForegroundColor Gray
        if ($containerCount -gt 0) {
            docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        }
    }
} catch {
    Write-Host "   ⚠ 无法获取容器信息" -ForegroundColor Yellow
}
Write-Host ""

# 检查 Docker 镜像
Write-Host "5. 检查本地镜像..." -ForegroundColor Yellow
try {
    $images = docker images 2>&1
    if ($LASTEXITCODE -eq 0) {
        $imageCount = (docker images -q).Count
        Write-Host "   本地镜像数量: $imageCount" -ForegroundColor Gray
        if ($imageCount -gt 0) {
            docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | Select-Object -First 6
        }
    }
} catch {
    Write-Host "   ⚠ 无法获取镜像信息" -ForegroundColor Yellow
}
Write-Host ""

# 检查磁盘空间
Write-Host "6. 检查磁盘空间..." -ForegroundColor Yellow
try {
    $drive = Get-PSDrive C
    $freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
    $usedSpaceGB = [math]::Round(($drive.Used / 1GB), 2)
    $totalSpaceGB = [math]::Round(($drive.Free + $drive.Used) / 1GB, 2)
    
    Write-Host "   C盘可用空间: $freeSpaceGB GB / $totalSpaceGB GB" -ForegroundColor Gray
    if ($freeSpaceGB -lt 10) {
        Write-Host "   ⚠ 磁盘空间不足，建议清理 Docker 资源" -ForegroundColor Yellow
        Write-Host "   运行: docker system prune -a" -ForegroundColor White
    } else {
        Write-Host "   ✓ 磁盘空间充足" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠ 无法检查磁盘空间" -ForegroundColor Yellow
}
Write-Host ""

# 检查 WSL 2 (Windows)
Write-Host "7. 检查 WSL 2 状态..." -ForegroundColor Yellow
try {
    $wslVersion = wsl --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ WSL 已安装" -ForegroundColor Green
        $wslList = wsl --list --verbose 2>&1
        if ($wslList -match "2.0") {
            Write-Host "   ✓ WSL 2 正在使用" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ 建议使用 WSL 2" -ForegroundColor Yellow
            Write-Host "   运行: wsl --set-default-version 2" -ForegroundColor White
        }
    } else {
        Write-Host "   ⚠ WSL 未安装（Docker Desktop 可能需要 WSL 2）" -ForegroundColor Yellow
        Write-Host "   运行: wsl --install" -ForegroundColor White
    }
} catch {
    Write-Host "   ⚠ 无法检查 WSL 状态" -ForegroundColor Yellow
}
Write-Host ""

# 总结
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   检查完成" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否可以构建镜像
Write-Host "测试 Docker 构建功能..." -ForegroundColor Yellow
try {
    $testBuild = docker build --help 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Docker 构建功能正常" -ForegroundColor Green
        Write-Host ""
        Write-Host "现在可以构建镜像：" -ForegroundColor Green
        Write-Host "   docker build -t ai-travel-planner:latest ." -ForegroundColor White
    }
} catch {
    Write-Host "   ✗ Docker 构建功能异常" -ForegroundColor Red
}

Write-Host ""

