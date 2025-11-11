#!/bin/bash
# 配置文件设置脚本 (Linux/Mac)
# 从 config.yaml.example 创建 config.yaml 文件

echo "========================================"
echo "设置配置文件"
echo "========================================"
echo ""

# 检查 config.yaml.example 是否存在
if [ ! -f "config.yaml.example" ]; then
    echo "错误: config.yaml.example 文件不存在"
    exit 1
fi

# 检查 config.yaml 是否已存在
if [ -f "config.yaml" ]; then
    echo "警告: config.yaml 文件已存在"
    echo "是否要覆盖？(y/n)"
    read -r OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo "已取消操作"
        exit 0
    fi
fi

# 复制 config.yaml.example 到 config.yaml
cp config.yaml.example config.yaml
if [ $? -eq 0 ]; then
    echo "[成功] 已创建 config.yaml 文件"
    echo ""
    echo "下一步："
    echo "1. 编辑 config.yaml 文件，填入必要的配置"
    echo "2. 至少需要配置以下项："
    echo "   - database.supabase_url"
    echo "   - database.supabase_key"
    echo "   - database.supabase_secret"
    echo "   - apis.openai.api_key"
    echo ""
    echo "3. 然后运行应用或构建 Docker 镜像"
    echo ""
else
    echo "[错误] 创建 config.yaml 文件失败"
    exit 1
fi

