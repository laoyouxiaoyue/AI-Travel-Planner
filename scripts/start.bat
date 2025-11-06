@echo off
REM AI旅行规划器启动脚本 (Windows)

echo 🚀 启动AI旅行规划器...

REM 检查Go环境
go version >nul 2>&1
if errorlevel 1 (
    echo ❌ Go未安装，请先安装Go 1.21或更高版本
    pause
    exit /b 1
)

REM 检查环境变量文件
if not exist ".env" (
    echo ⚠️  未找到.env文件，正在复制示例配置...
    copy env.example .env
    echo 📝 请编辑.env文件，填入相应的API密钥
    echo    必需的配置项：
    echo    - SUPABASE_URL
    echo    - SUPABASE_ANON_KEY
    echo    - OPENAI_API_KEY
    echo    - AMAP_API_KEY
    echo    - XUNFEI_APP_ID
    echo    - XUNFEI_API_KEY
    echo    - XUNFEI_API_SECRET
    echo.
    pause
)

REM 下载依赖
echo 📦 下载依赖包...
go mod tidy

REM 运行测试
echo 🧪 运行测试...
go test ./...

REM 启动服务器
echo 🌟 启动服务器...
echo    服务地址: http://localhost:8080
echo    API文档: http://localhost:8080/health
echo.
echo 按Ctrl+C停止服务器

go run main.go





