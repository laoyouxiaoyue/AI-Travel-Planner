# 多阶段构建Dockerfile
FROM golang:1.21-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制go mod文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o ai-travel-planner .

# 最终镜像
FROM alpine:latest

# 安装ca证书
RUN apk --no-cache add ca-certificates tzdata

# 设置时区
ENV TZ=Asia/Shanghai

# 创建非root用户
RUN adduser -D -s /bin/sh appuser

# 设置工作目录
WORKDIR /app

# 复制二进制文件
COPY --from=builder /app/ai-travel-planner .

# 复制配置文件
COPY --from=builder /app/env.example .

# 设置权限
RUN chown -R appuser:appuser /app

# 切换到非root用户
USER appuser

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# 启动应用
CMD ["./ai-travel-planner"]





