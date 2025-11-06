package handlers

import (
	"ai-travel-planner/internal/models"
	"ai-travel-planner/internal/services"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SettingsHandler struct {
	userService *services.UserService
	llmService  *services.LLMService
}

func NewSettingsHandler(userService *services.UserService, llmService *services.LLMService) *SettingsHandler {
	return &SettingsHandler{
		userService: userService,
		llmService:  llmService,
	}
}

// GetSettings 获取用户设置
func (h *SettingsHandler) GetSettings(c *gin.Context) {
	userID := c.GetString("user_id")

	profile, err := h.userService.GetUserProfile(userID)
	if err != nil {
		// 如果没有资料，返回空设置
		c.JSON(http.StatusOK, gin.H{
			"settings": map[string]interface{}{
				"openai_api_key":  "",
				"openai_base_url": "https://api.openai.com/v1",
			},
		})
		return
	}

	// 解析Preferences中的设置
	var settings map[string]interface{}
	if profile.Preferences != "" {
		if err := json.Unmarshal([]byte(profile.Preferences), &settings); err != nil {
			settings = make(map[string]interface{})
		}
	} else {
		settings = make(map[string]interface{})
	}

	// 只返回API Key的前几位和后几位，中间用*代替（安全考虑）
	apiKey := ""
	if key, ok := settings["openai_api_key"].(string); ok && key != "" {
		if len(key) > 8 {
			apiKey = key[:4] + "****" + key[len(key)-4:]
		} else {
			apiKey = "****"
		}
	}

    c.JSON(http.StatusOK, gin.H{
        "settings": map[string]interface{}{
            "openai_api_key":  apiKey,
            "openai_base_url": settings["openai_base_url"],
            "openai_model":    settings["openai_model"],
        },
    })
}

// UpdateSettings 更新用户设置
func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		OpenAIApiKey  string `json:"openai_api_key"`
		OpenAIBaseURL string `json:"openai_base_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取或创建用户资料
	profile, err := h.userService.GetUserProfile(userID)
	if err != nil {
		// 创建新资料
		newProfile := &models.UserProfile{
			ID:        uuid.New().String(),
			UserID:    userID,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := h.userService.CreateUserProfile(newProfile); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user profile"})
			return
		}
		profile = newProfile
	}

	// 解析现有设置
	var settings map[string]interface{}
	if profile.Preferences != "" {
		if err := json.Unmarshal([]byte(profile.Preferences), &settings); err != nil {
			settings = make(map[string]interface{})
		}
	} else {
		settings = make(map[string]interface{})
	}

	// 更新设置
	if req.OpenAIApiKey != "" {
		settings["openai_api_key"] = req.OpenAIApiKey
	}
    if req.OpenAIBaseURL != "" {
		settings["openai_base_url"] = req.OpenAIBaseURL
	} else {
		settings["openai_base_url"] = "https://api.openai.com/v1"
	}
    if reqMap := c.Request.Context(); reqMap != nil {
        // no-op; keep placeholder for future
    }
    // 处理模型
    // 已经完成绑定 req，无需重复解析
    // 因为已绑定，读取原始模型字段可能已在req结构体外
    if c.Request.Header.Get("Content-Type") == "application/json" {
        // try decode raw body clone not available now; rely on req only
    }
    // 优先使用 req 里字段（若通过前端发送）
    if m, ok := c.GetPostForm("openai_model"); ok && m != "" {
        settings["openai_model"] = m
    } else if req.OpenAIBaseURL != "" { // no-op branch placeholder
    }

	// 保存设置
	settingsJSON, err := json.Marshal(settings)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal settings"})
		return
	}

	updates := map[string]interface{}{
		"preferences": string(settingsJSON),
		"updated_at":  time.Now(),
	}

	if err := h.userService.UpdateUserProfile(userID, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Settings updated successfully"})
}

// TestApiKey 测试API Key
func (h *SettingsHandler) TestApiKey(c *gin.Context) {
	var req struct {
		ApiKey  string `json:"api_key" binding:"required"`
		BaseURL string `json:"base_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.BaseURL == "" {
		req.BaseURL = "https://api.openai.com/v1"
	}

	// 使用LLM服务测试API Key
	err := h.llmService.TestApiKey(req.ApiKey, req.BaseURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "API Key test failed",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "API Key is valid"})
}

