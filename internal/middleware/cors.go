package middleware

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORS 跨域中间件
func CORS() gin.HandlerFunc {
    config := cors.Config{
        AllowOrigins:     []string{"*"}, // 开发环境允许所有来源
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "X-OpenAI-API-Key", "X-OpenAI-Base-URL"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: false, // 当AllowOrigins为*时，必须设为false
        MaxAge:           12 * time.Hour,
    }
	return cors.New(config)
}
