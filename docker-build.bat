@echo off
REM Docker 构建脚本 (Windows)
REM 使用方法: docker-build.bat [tag]

setlocal enabledelayedexpansion

set TAG=%1
if "%TAG%"=="" set TAG=latest

set IMAGE_NAME=ai-travel-planner
set BINARY_NAME=ai-travel-planner-linux

echo ========================================
echo 构建 Docker 镜像
echo ========================================
echo 镜像名称: %IMAGE_NAME%:%TAG%
echo.

REM 检查 Go 环境
echo [1/4] 检查 Go 环境...
go version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 未找到 Go 环境，请先安装 Go
    exit /b 1
)
go version
echo.

REM 编译 Go 程序为 Linux 版本
echo [2/4] 交叉编译 Go 程序 (Linux amd64)...
set GOOS=linux
set GOARCH=amd64
set CGO_ENABLED=0

go build -a -installsuffix cgo -ldflags="-w -s" -o %BINARY_NAME% .

if %ERRORLEVEL% NEQ 0 (
    echo 错误: Go 程序编译失败
    exit /b 1
)

if not exist %BINARY_NAME% (
    echo 错误: 编译后的二进制文件不存在: %BINARY_NAME%
    exit /b 1
)

echo 编译成功: %BINARY_NAME%
echo.

REM 检查 web 目录
echo [3/4] 检查静态文件...
if not exist web (
    echo 错误: web 目录不存在
    exit /b 1
)
echo 静态文件检查通过
echo.

REM 构建 Docker 镜像
echo [4/4] 构建 Docker 镜像...
docker build -t %IMAGE_NAME%:%TAG% .

if %ERRORLEVEL% NEQ 0 (
    echo 错误: Docker 镜像构建失败
    if exist %BINARY_NAME% del %BINARY_NAME%
    exit /b 1
)

echo.
echo ========================================
echo 镜像构建成功！
echo ========================================
echo 镜像名称: %IMAGE_NAME%:%TAG%
echo.

REM 清理临时文件
echo 清理临时文件...
if exist %BINARY_NAME% del %BINARY_NAME%
echo.

echo 使用以下命令运行容器:
echo   docker run -d -p 9090:9090 -v ./config.yaml:/app/config.yaml:ro --name ai-travel-planner %IMAGE_NAME%:%TAG%
echo.
echo 或使用 docker-compose:
echo   1. 确保已创建 config.yaml 文件（如果不存在，请从 config.yaml.example 复制）
echo   2. 编辑 config.yaml 文件，填入必要的配置
echo   3. 运行: docker-compose up -d
echo.

endlocal

