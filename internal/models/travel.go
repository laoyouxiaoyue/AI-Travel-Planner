package models

import (
	"encoding/json"
	"strings"
	"time"
)

// DateOnly 自定义日期类型，用于处理 YYYY-MM-DD 格式
type DateOnly struct {
	time.Time
}

// UnmarshalJSON 自定义JSON反序列化方法
func (d *DateOnly) UnmarshalJSON(data []byte) error {
	// 移除JSON字符串的引号
	dateStr := strings.Trim(string(data), `"`)

	// 如果字符串为空，返回错误
	if dateStr == "" {
		return &time.ParseError{
			Layout:     "2006-01-02",
			Value:      "",
			LayoutElem: "date",
			ValueElem:  "",
			Message:    "empty date string",
		}
	}

	// 尝试解析不同的日期格式
	layouts := []string{
		"2006-01-02",           // YYYY-MM-DD
		"2006-01-02T15:04:05Z", // RFC3339格式 (完整)
		time.RFC3339,           // RFC3339格式
	}

	for _, layout := range layouts {
		var err error
		d.Time, err = time.Parse(layout, dateStr)
		if err == nil {
			return nil
		}
	}

	// 如果所有格式都失败，返回一个更友好的错误信息
	return &time.ParseError{
		Layout:     "2006-01-02",
		Value:      dateStr,
		LayoutElem: "date",
		ValueElem:  dateStr,
		Message:    "unable to parse date, expected formats: 2006-01-02, RFC3339",
	}
}

// MarshalJSON 自定义JSON序列化方法
func (d DateOnly) MarshalJSON() ([]byte, error) {
	return json.Marshal(d.Time.Format("2006-01-02"))
}

// TravelPlan 旅行计划
type TravelPlan struct {
	ID          string    `json:"id" db:"id"`
	UserID      string    `json:"user_id" db:"user_id"`
	Title       string    `json:"title" db:"title"`
	Destination string    `json:"destination" db:"destination"`
	StartDate   time.Time `json:"start_date" db:"start_date"`
	EndDate     time.Time `json:"end_date" db:"end_date"`
	Budget      float64   `json:"budget" db:"budget"`
	People      int       `json:"people" db:"people"`
	Preferences string    `json:"preferences" db:"preferences"` // JSON字符串存储偏好
	Status      string    `json:"status" db:"status"`           // draft, planned, active, completed
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// TravelDay 旅行日程
type TravelDay struct {
	ID         string    `json:"id" db:"id"`
	PlanID     string    `json:"plan_id" db:"plan_id"`
	DayNumber  int       `json:"day_number" db:"day_number"`
	Date       time.Time `json:"date" db:"date"`
	Activities string    `json:"activities" db:"activities"` // JSON字符串存储活动列表
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

// Activity 活动
type Activity struct {
	ID          string    `json:"id" db:"id"`
	DayID       string    `json:"day_id" db:"day_id"`
	Type        string    `json:"type" db:"type"` // attraction, restaurant, hotel, transport
	Title       string    `json:"title" db:"title"`
	Description string    `json:"description" db:"description"`
	Location    string    `json:"location" db:"location"` // 地址
	Latitude    float64   `json:"latitude" db:"latitude"`
	Longitude   float64   `json:"longitude" db:"longitude"`
	StartTime   time.Time `json:"start_time" db:"start_time"`
	EndTime     time.Time `json:"end_time" db:"end_time"`
	Cost        float64   `json:"cost" db:"cost"`
	Notes       string    `json:"notes" db:"notes"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// Expense 费用记录
type Expense struct {
	ID          string    `json:"id" db:"id"`
	PlanID      string    `json:"plan_id" db:"plan_id"`
	Category    string    `json:"category" db:"category"` // food, transport, accommodation, shopping, other
	Description string    `json:"description" db:"description"`
	Amount      float64   `json:"amount" db:"amount"`
	Currency    string    `json:"currency" db:"currency"`
	Date        time.Time `json:"date" db:"date"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// CreateTravelPlanRequest 创建旅行计划请求
type CreateTravelPlanRequest struct {
	Title         string                 `json:"title" binding:"required"`
	Destination   string                 `json:"destination" binding:"required"`
	StartDate     DateOnly               `json:"start_date" binding:"required"`
	EndDate       DateOnly               `json:"end_date" binding:"required"`
	Budget        float64                `json:"budget" binding:"required,min=0"`
	People        int                    `json:"people" binding:"required,min=1"`
	Preferences   map[string]interface{} `json:"preferences"`
	OpenAIApiKey  string                 `json:"openai_api_key"`  // 可选的用户API Key
	OpenAIBaseURL string                 `json:"openai_base_url"` // 可选的用户Base URL
    OpenAIModel   string                 `json:"openai_model"`    // 可选的模型名
}

// VoiceInputRequest 语音输入请求
type VoiceInputRequest struct {
	AudioData string `json:"audio_data" binding:"required"` // base64编码的音频数据
	Language  string `json:"language"`                      // 语言代码，如 "zh-cn"
}

// VoiceInputResponse 语音输入响应
type VoiceInputResponse struct {
	Text       string                 `json:"text"`
	Intent     string                 `json:"intent"`     // travel_plan, budget_query, etc.
	Entities   map[string]interface{} `json:"entities"`   // 提取的实体信息
	Confidence float64                `json:"confidence"` // 识别置信度
}
