# 使用预编译二进制文件的轻量级 Dockerfile
# 不需要源代码，只需要编译后的二进制文件和静态资源
# 
# 重要：构建前必须先编译 Go 程序！
# 请使用构建脚本：docker-build.bat (Windows) 或 ./docker-build.sh (Linux/Mac)
# 或者手动编译：GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o ai-travel-planner-linux .

FROM alpine:latest

# 安装必要的工具（ca证书、时区数据、curl用于健康检查）
RUN apk --no-cache add ca-certificates tzdata curl

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建非root用户
RUN adduser -D -s /bin/sh appuser

# 设置工作目录
WORKDIR /app

# 复制编译后的二进制文件（如果文件不存在，构建会失败并提示）
COPY ai-travel-planner-linux ./ai-travel-planner

# 复制web静态文件目录
COPY web ./web

# 复制配置文件示例（用于参考）
COPY config.yaml.example ./config.yaml.example

# 设置权限
RUN chown -R appuser:appuser /app && \
    chmod +x ./ai-travel-planner

# 切换到非root用户
USER appuser

# 暴露端口（默认9090，可通过环境变量PORT修改）
EXPOSE 9090

# 健康检查（使用curl检查健康状态，容器内固定使用9090端口）
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:9090/health || exit 1

# 启动应用
CMD ["./ai-travel-planner"]

