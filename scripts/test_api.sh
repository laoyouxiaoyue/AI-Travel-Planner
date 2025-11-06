#!/bin/bash

# AI旅行规划器API测试脚本

BASE_URL="http://localhost:8080"
API_BASE="$BASE_URL/api/v1"

echo "🧪 开始API测试..."

# 测试健康检查
echo "1. 测试健康检查..."
curl -s "$BASE_URL/health" | jq '.' || echo "健康检查失败"

echo ""

# 测试用户注册
echo "2. 测试用户注册..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }')

echo "注册响应:"
echo "$REGISTER_RESPONSE" | jq '.' || echo "$REGISTER_RESPONSE"

# 提取token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
    echo "❌ 无法获取token，测试终止"
    exit 1
fi

echo "✅ 获取到token: ${TOKEN:0:20}..."

echo ""

# 测试获取用户资料
echo "3. 测试获取用户资料..."
curl -s -X GET "$API_BASE/profile" \
  -H "Authorization: Bearer $TOKEN" | jq '.' || echo "获取用户资料失败"

echo ""

# 测试创建旅行计划
echo "4. 测试创建旅行计划..."
TRAVEL_PLAN_RESPONSE=$(curl -s -X POST "$API_BASE/travel/plan" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "日本5日游",
    "destination": "日本",
    "start_date": "2024-01-01",
    "end_date": "2024-01-05",
    "budget": 10000,
    "people": 2,
    "preferences": {
      "interests": ["美食", "动漫"],
      "accommodation": "酒店"
    }
  }')

echo "旅行计划创建响应:"
echo "$TRAVEL_PLAN_RESPONSE" | jq '.' || echo "$TRAVEL_PLAN_RESPONSE"

echo ""

# 测试获取旅行计划列表
echo "5. 测试获取旅行计划列表..."
curl -s -X GET "$API_BASE/travel/plans" \
  -H "Authorization: Bearer $TOKEN" | jq '.' || echo "获取旅行计划列表失败"

echo ""

# 测试地图搜索
echo "6. 测试地图搜索..."
curl -s -X GET "$API_BASE/map/search?keyword=东京塔&city=东京" \
  -H "Authorization: Bearer $TOKEN" | jq '.' || echo "地图搜索失败"

echo ""

echo "🎉 API测试完成！"





