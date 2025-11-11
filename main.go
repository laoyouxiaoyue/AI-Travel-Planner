package main

import (
	"ai-travel-planner/internal/config"
	"ai-travel-planner/internal/handlers"
	"ai-travel-planner/internal/middleware"
	"ai-travel-planner/internal/services"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置（从 YAML 文件）
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	// 初始化服务
	userService := services.NewUserService(cfg)
	authService := services.NewAuthService(cfg)
	travelService := services.NewTravelService(cfg)
	voiceService := services.NewVoiceService(cfg)
	llmService := services.NewLLMService(cfg)
	mapService := services.NewAmapService(cfg)

	// 初始化处理器
	userHandler := handlers.NewUserHandler(userService, authService)
	travelHandler := handlers.NewTravelHandler(travelService, llmService)
	voiceHandler := handlers.NewVoiceHandler(voiceService)
	settingsHandler := handlers.NewSettingsHandler(userService, llmService)
	mapHandler := handlers.NewMapHandler(mapService)

	// 设置Gin模式
	if cfg.GetMode() == "release" {
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

		// 公开的地图API Key接口（获取系统配置的API Key）
		api.GET("/map/api-key", mapHandler.GetAmapApiKey)

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
				// 费用
				travel.GET("/expenses", travelHandler.GetExpenses)
				travel.POST("/expenses", travelHandler.CreateExpense)
				travel.PUT("/expenses/:id", travelHandler.UpdateExpense)
				travel.DELETE("/expenses/:id", travelHandler.DeleteExpense)
			}

			// 语音功能
			voice := protected.Group("/voice")
			{
				voice.POST("/recognize", voiceHandler.RecognizeSpeech)
				voice.POST("/synthesize", voiceHandler.SynthesizeSpeech)
				voice.POST("/understand", voiceHandler.UnderstandSpeech)
				voice.POST("/understand-expense", voiceHandler.UnderstandExpense)
			}

			// 地图功能（需要认证，使用用户配置的API Key或系统配置的API Key）
			mapGroup := protected.Group("/map")
			{
				mapGroup.POST("/geocode", mapHandler.Geocode)           // 地理编码
				mapGroup.POST("/regeocode", mapHandler.Regeocode)       // 逆地理编码
				mapGroup.POST("/search-poi", mapHandler.SearchPOI)      // POI搜索
				mapGroup.POST("/route", mapHandler.Route)               // 路线规划
				mapGroup.POST("/distance", mapHandler.Distance)         // 距离计算
			}

		}
	}

	// 健康检查
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 启动服务器
	port := cfg.GetPort()
	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
