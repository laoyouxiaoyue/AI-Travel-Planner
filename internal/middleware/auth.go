package middleware

import (
	"ai-travel-planner/internal/services"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthRequired JWT认证中间件
func AuthRequired(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取Authorization头
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// 检查Bearer前缀
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		// 验证token
		claims, err := authService.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// 将用户ID存储到上下文中
		c.Set("user_id", claims.UserID)
		c.Next()
	}
}


