@echo off
REM Docker 镜像上传到阿里云容器镜像服务脚本 (Windows)
REM 使用方法: docker-push-aliyun.bat [tag] [region] [namespace] [repository]
REM 示例: docker-push-aliyun.bat latest cn-hangzhou my-namespace ai-travel-planner

setlocal enabledelayedexpansion

set TAG=%1
if "%TAG%"=="" set TAG=latest

set REGION=%2
if "%REGION%"=="" set REGION=cn-hangzhou

set NAMESPACE=%3
set REPOSITORY=%4
if "%REPOSITORY%"=="" set REPOSITORY=ai-travel-planner

set LOCAL_IMAGE=ai-travel-planner:%TAG%

echo ========================================
echo   阿里云容器镜像服务上传脚本
echo ========================================
echo.

REM 检查参数
if "%NAMESPACE%"=="" (
    echo 错误: 请提供命名空间名称
    echo 使用方法: docker-push-aliyun.bat [tag] [region] [namespace] [repository]
    echo 示例: docker-push-aliyun.bat latest cn-hangzhou my-namespace ai-travel-planner
    exit /b 1
)

REM 构建阿里云镜像地址
set ALIYUN_REGISTRY=registry.%REGION%.aliyuncs.com
set ALIYUN_IMAGE=%ALIYUN_REGISTRY%/%NAMESPACE%/%REPOSITORY%:%TAG%

echo 配置信息:
echo   本地镜像: %LOCAL_IMAGE%
echo   阿里云镜像: %ALIYUN_IMAGE%
echo   区域: %REGION%
echo   命名空间: %NAMESPACE%
echo   仓库名: %REPOSITORY%
echo   标签: %TAG%
echo.

REM 检查本地镜像是否存在
echo 检查本地镜像...
docker images | findstr "ai-travel-planner" | findstr "%TAG%" >nul
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 本地镜像 %LOCAL_IMAGE% 不存在
    echo 请先构建镜像: docker build -t %LOCAL_IMAGE% .
    exit /b 1
)
echo 本地镜像存在
echo.

REM 提示登录阿里云
echo 请先登录阿里云容器镜像服务
echo 如果尚未登录，请运行以下命令：
echo   docker login --username=你的用户名 %ALIYUN_REGISTRY%
echo.
set /p LOGGED_IN="是否已经登录？(y/n) "
if /i not "%LOGGED_IN%"=="y" (
    echo 正在登录阿里云容器镜像服务...
    docker login --username=%ALIYUN_USERNAME% %ALIYUN_REGISTRY%
    if %ERRORLEVEL% NEQ 0 (
        echo 登录失败，请检查用户名和密码
        exit /b 1
    )
)
echo.

REM 给镜像打标签
echo 给镜像打标签...
docker tag %LOCAL_IMAGE% %ALIYUN_IMAGE%
if %ERRORLEVEL% NEQ 0 (
    echo 镜像标签创建失败
    exit /b 1
)
echo 镜像标签创建成功
echo.

REM 推送镜像
echo 推送镜像到阿里云...
docker push %ALIYUN_IMAGE%
if %ERRORLEVEL% EQU 0 (
    echo 镜像推送成功！
    echo.
    echo ========================================
    echo   推送完成
    echo ========================================
    echo.
    echo 镜像地址: %ALIYUN_IMAGE%
    echo.
    echo 拉取镜像命令:
    echo   docker pull %ALIYUN_IMAGE%
    echo.
    echo 在阿里云容器服务中使用:
    echo   %ALIYUN_IMAGE%
) else (
    echo 镜像推送失败
    exit /b 1
)

endlocal


