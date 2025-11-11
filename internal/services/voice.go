package services

import (
	"ai-travel-planner/internal/config"
	"ai-travel-planner/internal/models"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type VoiceService struct {
	config *config.Config
}

type XunfeiResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    struct {
		Result struct {
			Text string `json:"text"`
		} `json:"result"`
	} `json:"data"`
}

func NewVoiceService(cfg *config.Config) *VoiceService {
	return &VoiceService{
		config: cfg,
	}
}

// Config 返回服务配置
func (s *VoiceService) Config() *config.Config {
    return s.config
}

// RecognizeSpeech 语音识别
func (s *VoiceService) RecognizeSpeech(audioData, language string) (*models.VoiceInputResponse, error) {
	// 解码base64音频数据
	audioBytes, err := base64.StdEncoding.DecodeString(audioData)
	if err != nil {
		return nil, fmt.Errorf("failed to decode audio data: %v", err)
	}

	// 调用科大讯飞语音识别API
	text, err := s.callXunfeiAPI(audioBytes, language)
	if err != nil {
		return nil, err
	}

	// 解析用户意图和实体
	intent, entities, confidence := s.parseUserIntent(text)

	return &models.VoiceInputResponse{
		Text:       text,
		Intent:     intent,
		Entities:   entities,
		Confidence: confidence,
	}, nil
}

// callXunfeiAPI 调用科大讯飞API
func (s *VoiceService) callXunfeiAPI(audioData []byte, language string) (string, error) {
	// 构建请求URL
	url := fmt.Sprintf("https://iat-api.xfyun.cn/v2/iat?language=%s", language)

	// 创建请求
	req, err := http.NewRequest("POST", url, bytes.NewReader(audioData))
	if err != nil {
		return "", err
	}

	// 设置请求头
	req.Header.Set("Content-Type", "audio/pcm")
	req.Header.Set("X-Appid", s.config.APIs.Xunfei.AppID)
	req.Header.Set("X-CurTime", fmt.Sprintf("%d", time.Now().Unix()))
	req.Header.Set("X-Param", s.buildXunfeiParam(language))
	req.Header.Set("X-CheckSum", s.calculateXunfeiChecksum())

	// 发送请求
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// 解析响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var xunfeiResp XunfeiResponse
	if err := json.Unmarshal(body, &xunfeiResp); err != nil {
		return "", err
	}

	if xunfeiResp.Code != 0 {
		return "", fmt.Errorf("xunfei API error: %s", xunfeiResp.Message)
	}

	return xunfeiResp.Data.Result.Text, nil
}

// buildXunfeiParam 构建科大讯飞参数
func (s *VoiceService) buildXunfeiParam(language string) string {
	param := map[string]interface{}{
		"common": map[string]interface{}{
			"app_id": s.config.APIs.Xunfei.AppID,
		},
		"business": map[string]interface{}{
			"language": language,
			"domain":   "iat",
			"accent":   "mandarin",
		},
		"data": map[string]interface{}{
			"status":   0,
			"format":   "audio/pcm",
			"audio":    "base64",
			"encoding": "raw",
		},
	}

	paramBytes, _ := json.Marshal(param)
	return base64.StdEncoding.EncodeToString(paramBytes)
}

// calculateXunfeiChecksum 计算科大讯飞校验和
func (s *VoiceService) calculateXunfeiChecksum() string {
	// 这里需要实现MD5校验和计算
	// 简化实现，实际项目中需要正确实现
	return "checksum"
}

// parseUserIntent 解析用户意图
func (s *VoiceService) parseUserIntent(text string) (string, map[string]interface{}, float64) {
	// 简化的意图识别逻辑
	// 实际项目中可以使用NLP模型或规则引擎

	entities := make(map[string]interface{})
	intent := "unknown"
	confidence := 0.8

	// 关键词匹配
	if contains(text, []string{"旅行", "旅游", "去", "计划"}) {
		intent = "travel_plan"
	} else if contains(text, []string{"预算", "费用", "花钱", "多少钱"}) {
		intent = "budget_query"
	} else if contains(text, []string{"酒店", "住宿", "住"}) {
		intent = "accommodation"
	} else if contains(text, []string{"美食", "吃", "餐厅"}) {
		intent = "food"
	}

	// 提取实体（简化版）
	if contains(text, []string{"日本", "东京", "大阪"}) {
		entities["destination"] = "日本"
	}
	if contains(text, []string{"5天", "一周", "3天"}) {
		entities["duration"] = "5天"
	}

	return intent, entities, confidence
}

// contains 检查字符串是否包含任一关键词
func contains(text string, keywords []string) bool {
	for _, keyword := range keywords {
		if len(text) >= len(keyword) {
			for i := 0; i <= len(text)-len(keyword); i++ {
				if text[i:i+len(keyword)] == keyword {
					return true
				}
			}
		}
	}
	return false
}

// SynthesizeSpeech 语音合成
func (s *VoiceService) SynthesizeSpeech(text, language string) (string, error) {
	// 实现语音合成功能
	// 返回base64编码的音频数据
	return "", fmt.Errorf("not implemented")
}





