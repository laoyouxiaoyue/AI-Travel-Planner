# AI旅行规划器 Makefile

.PHONY: help build run test clean docker-build docker-run dev

# 默认目标
help:
	@echo "AI旅行规划器 - 可用命令:"
	@echo "  make build        - 构建应用"
	@echo "  make run          - 运行应用"
	@echo "  make test         - 运行测试"
	@echo "  make clean        - 清理构建文件"
	@echo "  make docker-build - 构建Docker镜像"
	@echo "  make docker-run    - 运行Docker容器"
	@echo "  make dev          - 开发模式运行"
	@echo "  make deps         - 下载依赖"
	@echo "  make fmt          - 格式化代码"
	@echo "  make lint         - 代码检查"

# 构建应用
build:
	@echo "🔨 构建应用..."
	go build -o ai-travel-planner main.go

# 运行应用
run: build
	@echo "🚀 启动应用..."
	./ai-travel-planner

# 开发模式运行
dev:
	@echo "🛠️  开发模式运行..."
	go run main.go

# 运行测试
test:
	@echo "🧪 运行测试..."
	go test -v ./...

# 运行测试并生成覆盖率报告
test-coverage:
	@echo "🧪 运行测试并生成覆盖率报告..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "📊 覆盖率报告已生成: coverage.html"

# 下载依赖
deps:
	@echo "📦 下载依赖..."
	go mod tidy
	go mod download

# 格式化代码
fmt:
	@echo "🎨 格式化代码..."
	go fmt ./...

# 代码检查
lint:
	@echo "🔍 代码检查..."
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run; \
	else \
		echo "⚠️  golangci-lint未安装，跳过代码检查"; \
		echo "   安装命令: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; \
	fi

# 清理构建文件
clean:
	@echo "🧹 清理构建文件..."
	rm -f ai-travel-planner
	rm -f coverage.out coverage.html
	go clean

# Docker相关命令
docker-build:
	@echo "🐳 构建Docker镜像..."
	docker build -t ai-travel-planner .

docker-run:
	@echo "🐳 运行Docker容器..."
	docker run -p 8080:8080 --env-file .env ai-travel-planner

docker-compose-up:
	@echo "🐳 使用Docker Compose启动服务..."
	docker-compose up -d

docker-compose-down:
	@echo "🐳 停止Docker Compose服务..."
	docker-compose down

# 数据库初始化
init-db:
	@echo "🗄️  初始化数据库..."
	@if [ -f "scripts/init_db.sql" ]; then \
		echo "请手动在Supabase中执行 scripts/init_db.sql 文件"; \
	else \
		echo "❌ 数据库初始化脚本不存在"; \
	fi

# 安装开发工具
install-tools:
	@echo "🛠️  安装开发工具..."
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/air-verse/air@latest

# 热重载开发
dev-air:
	@echo "🔥 热重载开发模式..."
	@if command -v air >/dev/null 2>&1; then \
		air; \
	else \
		echo "❌ air未安装，请运行: make install-tools"; \
	fi

# 生成API文档
api-docs:
	@echo "📚 生成API文档..."
	@if command -v swag >/dev/null 2>&1; then \
		swag init -g main.go; \
	else \
		echo "⚠️  swag未安装，跳过API文档生成"; \
		echo "   安装命令: go install github.com/swaggo/swag/cmd/swag@latest"; \
	fi

# 安全检查
security:
	@echo "🔒 安全检查..."
	@if command -v gosec >/dev/null 2>&1; then \
		gosec ./...; \
	else \
		echo "⚠️  gosec未安装，跳过安全检查"; \
		echo "   安装命令: go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest"; \
	fi

# 性能测试
benchmark:
	@echo "⚡ 性能测试..."
	go test -bench=. -benchmem ./...

# 完整检查
check: fmt lint test security
	@echo "✅ 完整检查完成"

# 发布准备
release: clean check build
	@echo "🎉 发布准备完成"
	@echo "构建文件: ai-travel-planner"





