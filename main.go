package main

import (
	"ai-travel-planner/internal/config"
	"ai-travel-planner/internal/handlers"
	"ai-travel-planner/internal/middleware"
	"ai-travel-planner/internal/services"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// 初始化配置
	cfg := config.Load()

	// 初始化服务
	userService := services.NewUserService(cfg)
	authService := services.NewAuthService(cfg)
	travelService := services.NewTravelService(cfg)
	voiceService := services.NewVoiceService(cfg)
	mapService := services.NewMapService(cfg)
	llmService := services.NewLLMService(cfg)

	// 初始化处理器
	userHandler := handlers.NewUserHandler(userService, authService)
	travelHandler := handlers.NewTravelHandler(travelService, llmService)
	voiceHandler := handlers.NewVoiceHandler(voiceService)
	mapHandler := handlers.NewMapHandler(mapService)
	settingsHandler := handlers.NewSettingsHandler(userService, llmService)

	// 设置Gin模式
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建路由
	router := gin.Default()

	// 中间件
	router.Use(middleware.CORS())
	router.Use(middleware.Logger())

	// 静态文件服务
	router.Static("/static", "./web")
	router.StaticFile("/", "./web/index.html")
	router.StaticFile("/index.html", "./web/index.html")
	router.StaticFile("/styles.css", "./web/styles.css")
	router.StaticFile("/app.js", "./web/app.js")

	// API路由组
	api := router.Group("/api/v1")
	{
		// 用户认证路由
		auth := api.Group("/auth")
		{
			auth.POST("/register", userHandler.Register)
			auth.POST("/login", userHandler.Login)
			auth.POST("/refresh", userHandler.RefreshToken)
		}

		// 需要认证的路由
		protected := api.Group("/")
		protected.Use(middleware.AuthRequired(authService))
		{
			// 用户管理
			protected.GET("/profile", userHandler.GetProfile)
			protected.PUT("/profile", userHandler.UpdateProfile)

			// 设置管理
			protected.GET("/settings", settingsHandler.GetSettings)
			protected.PUT("/settings", settingsHandler.UpdateSettings)
			protected.POST("/settings/test-api-key", settingsHandler.TestApiKey)

			// 旅行规划
			travel := protected.Group("/travel")
			{
				travel.POST("/plan", travelHandler.CreateTravelPlan)
				travel.GET("/plans", travelHandler.GetTravelPlans)
				travel.GET("/plans/:id", travelHandler.GetTravelPlan)
				travel.PUT("/plans/:id", travelHandler.UpdateTravelPlan)
				travel.DELETE("/plans/:id", travelHandler.DeleteTravelPlan)
			}

			// 语音功能
			voice := protected.Group("/voice")
			{
				voice.POST("/recognize", voiceHandler.RecognizeSpeech)
				voice.POST("/synthesize", voiceHandler.SynthesizeSpeech)
                voice.POST("/understand", voiceHandler.UnderstandSpeech)
			}

			// 地图服务
			mapGroup := protected.Group("/map")
			{
				mapGroup.GET("/search", mapHandler.SearchPlaces)
				mapGroup.GET("/route", mapHandler.GetRoute)
				mapGroup.GET("/nearby", mapHandler.GetNearbyPlaces)
			}
		}
	}

	// 健康检查
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 启动服务器
    port := os.Getenv("PORT")
    if port == "" {
        port = "9091"
    }

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
