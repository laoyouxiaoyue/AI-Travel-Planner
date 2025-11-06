#!/bin/bash

# AI旅行规划器启动脚本

echo "🚀 启动AI旅行规划器..."

# 检查Go环境
if ! command -v go &> /dev/null; then
    echo "❌ Go未安装，请先安装Go 1.21或更高版本"
    exit 1
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到.env文件，正在复制示例配置..."
    cp env.example .env
    echo "📝 请编辑.env文件，填入相应的API密钥"
    echo "   必需的配置项："
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY" 
    echo "   - OPENAI_API_KEY"
    echo "   - AMAP_API_KEY"
    echo "   - XUNFEI_APP_ID"
    echo "   - XUNFEI_API_KEY"
    echo "   - XUNFEI_API_SECRET"
    echo ""
    read -p "按Enter键继续..."
fi

# 下载依赖
echo "📦 下载依赖包..."
go mod tidy

# 运行测试
echo "🧪 运行测试..."
go test ./...

# 启动服务器
echo "🌟 启动服务器..."
echo "   服务地址: http://localhost:8080"
echo "   API文档: http://localhost:8080/health"
echo ""
echo "按Ctrl+C停止服务器"

go run main.go





