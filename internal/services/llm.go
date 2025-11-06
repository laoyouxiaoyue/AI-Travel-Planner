package services

import (
	"ai-travel-planner/internal/config"
	"ai-travel-planner/internal/models"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type LLMService struct {
	config *config.Config
}

type OpenAIRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	MaxTokens   int       `json:"max_tokens"`
	Temperature float64   `json:"temperature"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type TravelPlanResult struct {
	Days   []DayPlan `json:"days"`
	Budget struct {
		Total     float64            `json:"total"`
		Breakdown map[string]float64 `json:"breakdown"`
	} `json:"budget"`
	Recommendations []string `json:"recommendations"`
}

type DayPlan struct {
	Day        int        `json:"day"`
	Date       string     `json:"date"`
	Activities []Activity `json:"activities"`
}

type Activity struct {
	Time        string  `json:"time"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Location    string  `json:"location"`
	Cost        float64 `json:"cost"`
	Type        string  `json:"type"`
}

// ParseVoiceToPlanFieldsWithKey 使用LLM将语音文本解析为结构化行程字段
func (s *LLMService) ParseVoiceToPlanFieldsWithKey(transcript, apiKey, baseURL, model string) (map[string]interface{}, error) {
	prompt := fmt.Sprintf(`你是一个旅行助手。请从下面的中文用户语音文本中提取旅行规划表单所需字段，并只以JSON返回：

文本："%s"

严格返回以下JSON字段（缺失请填空或合理推断，日期用YYYY-MM-DD）：
{
  "destination": "字符串，目的地",
  "start_date": "YYYY-MM-DD，可空",
  "end_date": "YYYY-MM-DD，可空",
  "people": 2,
  "budget": 10000,
  "preferences": ["美食", "亲子"]
}
注意：
- 不要输出除JSON以外的任何文字；
- 如果只给出时长（例如3天）和开始日期，请按开始日期+时长计算结束日期；
- 预算单位默认人民币；
`, transcript)

	resp, err := s.callOpenAIWithKey(prompt, apiKey, baseURL, model)
	if err != nil {
		return nil, err
	}

	resp = strings.TrimSpace(resp)
	if strings.HasPrefix(resp, "`") { // 清理潜在代码块
		resp = strings.Trim(resp, "` ")
	}

	var obj map[string]interface{}
	if err := json.Unmarshal([]byte(resp), &obj); err != nil {
		return nil, fmt.Errorf("failed to parse LLM response: %v. Raw: %s", err, resp)
	}
	return obj, nil
}

func NewLLMService(cfg *config.Config) *LLMService {
	return &LLMService{
		config: cfg,
	}
}

// GenerateTravelPlan 生成旅行计划
func (s *LLMService) GenerateTravelPlan(request *models.CreateTravelPlanRequest) (*TravelPlanResult, error) {
	return s.GenerateTravelPlanWithKey(request, "", "")
}

// GenerateTravelPlanWithKey 使用指定的API Key生成旅行计划
func (s *LLMService) GenerateTravelPlanWithKey(request *models.CreateTravelPlanRequest, apiKey, baseURL string) (*TravelPlanResult, error) {
	// 构建提示词
	prompt := s.buildTravelPrompt(request)

	// 调用OpenAI API
	response, err := s.callOpenAIWithKey(prompt, apiKey, baseURL, request.OpenAIModel)
	if err != nil {
		return nil, err
	}

	// 解析响应 - 先清理响应文本，提取JSON部分
	response = strings.TrimSpace(response)

	// 如果响应被markdown代码块包围，提取其中的JSON
	if strings.HasPrefix(response, "```json") {
		lines := strings.Split(response, "\n")
		var jsonLines []string
		inJsonBlock := false
		for _, line := range lines {
			if strings.TrimSpace(line) == "```json" {
				inJsonBlock = true
				continue
			}
			if strings.TrimSpace(line) == "```" {
				break
			}
			if inJsonBlock {
				jsonLines = append(jsonLines, line)
			}
		}
		response = strings.Join(jsonLines, "\n")
	} else if strings.HasPrefix(response, "```") {
		// 处理没有json标记的代码块
		lines := strings.Split(response, "\n")
		var jsonLines []string
		inJsonBlock := false
		for _, line := range lines {
			if strings.TrimSpace(line) == "```" {
				if !inJsonBlock {
					inJsonBlock = true
					continue
				} else {
					break
				}
			}
			if inJsonBlock && strings.TrimSpace(line) != "```" {
				jsonLines = append(jsonLines, line)
			}
		}
		response = strings.Join(jsonLines, "\n")
	}

	var result TravelPlanResult
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		return nil, fmt.Errorf("failed to parse LLM response: %v. Raw response: %s", err, response)
	}

	return &result, nil
}

// buildTravelPrompt 构建旅行规划提示词
func (s *LLMService) buildTravelPrompt(request *models.CreateTravelPlanRequest) string {
	preferences := ""
	if request.Preferences != nil {
		prefs, _ := json.Marshal(request.Preferences)
		preferences = string(prefs)
	}

	return fmt.Sprintf(`
你是一个专业的旅行规划师。请根据以下信息生成详细的旅行计划：

目的地：%s
出发日期：%s
结束日期：%s
预算：%.2f元
人数：%d人
偏好：%s

请严格按照以下JSON格式返回旅行计划，不要添加任何markdown标记或其他文字：

{
  "days": [
    {
      "day": 1,
      "date": "2025-01-01",
      "activities": [
        {
          "time": "09:00",
          "title": "活动名称",
          "description": "活动描述",
          "location": "地点",
          "cost": 100.0,
          "type": "attraction"
        }
      ]
    }
  ],
  "budget": {
    "total": %.2f,
    "breakdown": {
      "accommodation": 1000.0,
      "food": 500.0,
      "transport": 800.0,
      "attractions": 600.0
    }
  },
  "recommendations": [
    "实用建议1",
    "实用建议2"
  ]
}

要求：
- 行程要合理，不要过于紧凑
- 考虑当地特色和文化
- 提供具体的费用估算
- 包含交通方式和时间安排
- 给出实用的旅行建议
- 只返回JSON，不要其他内容
`, request.Destination, request.StartDate.Time.Format("2006-01-02"),
		request.EndDate.Time.Format("2006-01-02"), request.Budget, request.People, preferences, request.Budget)
}

// callOpenAI 调用OpenAI API（使用配置中的Key）
func (s *LLMService) callOpenAI(prompt string) (string, error) {
	return s.callOpenAIWithKey(prompt, "", "", "")
}

// callOpenAIWithKey 使用指定的API Key调用OpenAI API
func (s *LLMService) callOpenAIWithKey(prompt, apiKey, baseURL, model string) (string, error) {
	// 优先使用传入的API Key，否则使用配置中的
	actualApiKey := apiKey
	if actualApiKey == "" {
		actualApiKey = s.config.APIs.OpenAIAPIKey
	}

	// 检查OpenAI API密钥是否配置
	if actualApiKey == "" {
		return "", fmt.Errorf("OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable or configure it in settings")
	}

	// 优先使用传入的BaseURL，否则使用配置中的
	actualBaseURL := baseURL
	if actualBaseURL == "" {
		actualBaseURL = s.config.APIs.OpenAIBaseURL
	}

	// 模型名：优先使用传入的，否则配置中的
	actualModel := model
	if actualModel == "" {
		actualModel = s.config.APIs.OpenAIModel
		if actualModel == "" {
			actualModel = "gpt-4o-mini"
		}
	}

	requestBody := OpenAIRequest{
		Model: actualModel,
		Messages: []Message{
			{
				Role:    "system",
				Content: "你是一个专业的旅行规划师，擅长制定详细的旅行计划。你必须只返回有效的JSON格式响应，不要包含任何markdown标记、代码块或其他文字说明。只返回纯JSON数据。",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
		MaxTokens:   4000,
		Temperature: 0.7,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", actualBaseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+actualApiKey)

	timeout := time.Duration(s.config.APIs.OpenAITimeoutSeconds)
	if timeout <= 0 {
		timeout = 60
	}
	client := &http.Client{Timeout: timeout * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to make request to OpenAI: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read OpenAI response: %v", err)
	}

	// 检查HTTP状态码
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("OpenAI API returned status %d: %s", resp.StatusCode, string(body))
	}

	var openAIResp OpenAIResponse
	if err := json.Unmarshal(body, &openAIResp); err != nil {
		return "", fmt.Errorf("failed to parse OpenAI response: %v. Response: %s", err, string(body))
	}

	if len(openAIResp.Choices) == 0 {
		return "", fmt.Errorf("no choices in OpenAI response: %s", string(body))
	}

	return openAIResp.Choices[0].Message.Content, nil
}

// TestApiKey 测试API Key是否有效
func (s *LLMService) TestApiKey(apiKey, baseURL string) error {
	if apiKey == "" {
		return fmt.Errorf("API key is required")
	}

	if baseURL == "" {
		baseURL = s.config.APIs.OpenAIBaseURL
		if baseURL == "" {
			baseURL = "https://api.openai.com/v1"
		}
	}

	// 发送一个简单的测试请求
	requestBody := OpenAIRequest{
		Model: s.config.APIs.OpenAIModel,
		Messages: []Message{
			{
				Role:    "user",
				Content: "test",
			},
		},
		MaxTokens:   5,
		Temperature: 0.7,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %v", err)
	}

	req, err := http.NewRequest("POST", baseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return fmt.Errorf("invalid API key")
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// AnalyzeBudget 分析预算
func (s *LLMService) AnalyzeBudget(planID string, expenses []models.Expense) (map[string]interface{}, error) {
	// 构建预算分析提示词
	prompt := fmt.Sprintf(`
请分析以下旅行费用数据，并提供预算建议：

费用记录：
%s

请提供：
1. 费用趋势分析
2. 预算超支警告
3. 省钱建议
4. 费用优化方案

请用JSON格式回复。
`, s.formatExpenses(expenses))

	response, err := s.callOpenAI(prompt)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		return nil, err
	}

	return result, nil
}

// formatExpenses 格式化费用数据
func (s *LLMService) formatExpenses(expenses []models.Expense) string {
	var result string
	for _, expense := range expenses {
		result += fmt.Sprintf("- %s: %.2f元 (%s) - %s\n",
			expense.Category, expense.Amount, expense.Currency, expense.Description)
	}
	return result
}
