package handlers

import (
	"ai-travel-planner/internal/models"
	"ai-travel-planner/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type VoiceHandler struct {
	voiceService *services.VoiceService
}

func NewVoiceHandler(voiceService *services.VoiceService) *VoiceHandler {
	return &VoiceHandler{
		voiceService: voiceService,
	}
}

// UnderstandSpeech 使用LLM解析语音文本为表单字段
func (h *VoiceHandler) UnderstandSpeech(c *gin.Context) {
    var req struct {
        Transcript   string `json:"transcript" binding:"required"`
        OpenAIApiKey string `json:"openai_api_key"`
        BaseURL      string `json:"openai_base_url"`
        Model        string `json:"openai_model"`
    }
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // 兜底从Header取Key/URL/Model
    if req.OpenAIApiKey == "" {
        req.OpenAIApiKey = c.GetHeader("X-OpenAI-API-Key")
    }
    if req.BaseURL == "" {
        req.BaseURL = c.GetHeader("X-OpenAI-Base-URL")
    }
    if req.Model == "" {
        req.Model = c.GetHeader("X-OpenAI-Model")
    }

    // 需要LLMService，当前通过voiceService无法直接访问，改为从全局服务获取不便。
    // 简化实现：复用注入到TravelHandler的 LLMService 更合理，但此处快速接入，
    // 先构造一个临时 LLMService 使用同一配置。
    cfg := h.voiceService.Config()
    llm := services.NewLLMService(cfg)

    fields, err := llm.ParseVoiceToPlanFieldsWithKey(req.Transcript, req.OpenAIApiKey, req.BaseURL, req.Model)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to understand speech", "details": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"fields": fields})
}

// UnderstandExpense 使用LLM解析语音文本为费用字段
func (h *VoiceHandler) UnderstandExpense(c *gin.Context) {
    var req struct {
        Transcript   string `json:"transcript" binding:"required"`
        OpenAIApiKey string `json:"openai_api_key"`
        BaseURL      string `json:"openai_base_url"`
        Model        string `json:"openai_model"`
    }
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    if req.OpenAIApiKey == "" {
        req.OpenAIApiKey = c.GetHeader("X-OpenAI-API-Key")
    }
    if req.BaseURL == "" {
        req.BaseURL = c.GetHeader("X-OpenAI-Base-URL")
    }
    if req.Model == "" {
        req.Model = c.GetHeader("X-OpenAI-Model")
    }

    cfg := h.voiceService.Config()
    llm := services.NewLLMService(cfg)

    fields, err := llm.ParseVoiceToExpenseFieldsWithKey(req.Transcript, req.OpenAIApiKey, req.BaseURL, req.Model)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to understand expense speech", "details": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"fields": fields})
}

// RecognizeSpeech 语音识别
func (h *VoiceHandler) RecognizeSpeech(c *gin.Context) {
	var req models.VoiceInputRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置默认语言
	if req.Language == "" {
		req.Language = "zh-cn"
	}

	// 调用语音识别服务
	response, err := h.voiceService.RecognizeSpeech(req.AudioData, req.Language)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to recognize speech"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// SynthesizeSpeech 语音合成
func (h *VoiceHandler) SynthesizeSpeech(c *gin.Context) {
	var req struct {
		Text     string `json:"text" binding:"required"`
		Language string `json:"language"`
		Voice    string `json:"voice"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置默认语言
	if req.Language == "" {
		req.Language = "zh-cn"
	}

	// 调用语音合成服务
	audioData, err := h.voiceService.SynthesizeSpeech(req.Text, req.Language)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to synthesize speech"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"audio_data": audioData})
}


