@echo off
setlocal enabledelayedexpansion
REM 配置文件设置脚本 (Windows CMD)
REM 从 config.yaml.example 创建 config.yaml 文件

echo ========================================
echo 设置配置文件
echo ========================================
echo.

REM 切换到脚本所在目录
cd /d "%~dp0"

REM 检查 config.yaml.example 是否存在
if not exist "config.yaml.example" (
    echo [错误] config.yaml.example 文件不存在
    echo 当前目录: %CD%
    pause
    exit /b 1
)

REM 检查 config.yaml 是否已存在
if exist "config.yaml" (
    echo [警告] config.yaml 文件已存在
    echo.
    set /p OVERWRITE=是否要覆盖？(Y/N): 
    if /i not "!OVERWRITE!"=="Y" (
        echo 已取消操作
        pause
        exit /b 0
    )
)

REM 复制 config.yaml.example 到 config.yaml
echo 正在创建 config.yaml 文件...
copy /Y "config.yaml.example" "config.yaml" >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo [成功] 已创建 config.yaml 文件
    echo.
    echo 下一步：
    echo 1. 编辑 config.yaml 文件，填入必要的配置
    echo 2. 至少需要配置以下项：
    echo    - database.supabase_url
    echo    - database.supabase_key
    echo    - database.supabase_secret
    echo    - apis.openai.api_key
    echo.
    echo 3. 然后运行应用或构建 Docker 镜像
    echo.
    set /p OPEN_FILE=是否现在打开 config.yaml 文件进行编辑？(Y/N): 
    if /i "!OPEN_FILE!"=="Y" (
        start notepad config.yaml
    )
) else (
    echo [错误] 创建 config.yaml 文件失败
    echo 错误代码: !ERRORLEVEL!
    pause
    exit /b 1
)

echo.
pause

