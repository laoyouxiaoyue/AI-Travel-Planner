package handlers

import (
	"ai-travel-planner/internal/models"
	"ai-travel-planner/internal/services"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TravelHandler struct {
	travelService *services.TravelService
	llmService    *services.LLMService
}

func NewTravelHandler(travelService *services.TravelService, llmService *services.LLMService) *TravelHandler {
	return &TravelHandler{
		travelService: travelService,
		llmService:    llmService,
	}
}

// CreateTravelPlan 创建旅行计划
func (h *TravelHandler) CreateTravelPlan(c *gin.Context) {
	userID := c.GetString("user_id")

	// 检查用户ID是否存在（用于调试）
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated", "details": "user_id is empty"})
		return
	}

	var req models.CreateTravelPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}
	fmt.Println("req", req)
	// 使用LLM生成旅行计划（优先使用用户配置的API Key），并从请求头兜底
	apiKey := req.OpenAIApiKey
	baseURL := req.OpenAIBaseURL
	if apiKey == "" {
		apiKey = c.GetHeader("X-OpenAI-API-Key")
	}
	if baseURL == "" {
		baseURL = c.GetHeader("X-OpenAI-Base-URL")
	}
	if req.OpenAIModel == "" {
		req.OpenAIModel = c.GetHeader("X-OpenAI-Model")
	}

	if apiKey == "" && h.llmService != nil {
		// 明确返回可读错误，避免误导性"未配置环境变量"信息
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "OpenAI API key missing",
			"details": "请在设置中保存Key，或在请求头 X-OpenAI-API-Key 传入，或在请求体 openai_api_key 字段传入",
		})
		return
	}

	planResult, err := h.llmService.GenerateTravelPlanWithKey(&req, apiKey, baseURL)
	if err != nil {
		// 返回具体的错误信息以便调试
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to generate travel plan",
			"details": err.Error(),
		})
		return
	}

	// 创建旅行计划记录
	plan := &models.TravelPlan{
		ID:          uuid.New().String(),
		UserID:      userID,
		Title:       req.Title,
		Destination: req.Destination,
		StartDate:   req.StartDate.Time,
		EndDate:     req.EndDate.Time,
		Budget:      req.Budget,
		People:      req.People,
		Status:      "planned",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := h.travelService.CreateTravelPlan(plan); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create travel plan"})
		return
	}

	// 创建每日行程
	for i, dayPlan := range planResult.Days {
		travelDay := &models.TravelDay{
			ID:        uuid.New().String(),
			PlanID:    plan.ID,
			DayNumber: dayPlan.Day,
			Date:      req.StartDate.Time.AddDate(0, 0, i),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if err := h.travelService.CreateTravelDay(travelDay); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create travel day"})
			return
		}

		// 创建活动
		for _, activity := range dayPlan.Activities {
			activityRecord := &models.Activity{
				ID:          uuid.New().String(),
				DayID:       travelDay.ID,
				Type:        activity.Type,
				Title:       activity.Title,
				Description: activity.Description,
				Location:    activity.Location,
				Cost:        activity.Cost,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}

			if err := h.travelService.CreateActivity(activityRecord); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create activity"})
				return
			}
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"plan":   plan,
		"result": planResult,
	})
}

// GetTravelPlans 获取旅行计划列表
func (h *TravelHandler) GetTravelPlans(c *gin.Context) {
	userID := c.GetString("user_id")

	plans, err := h.travelService.GetTravelPlans(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get travel plans"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"plans": plans})
}

// GetTravelPlan 获取单个旅行计划
func (h *TravelHandler) GetTravelPlan(c *gin.Context) {
	userID := c.GetString("user_id")
	planID := c.Param("id")

	plan, err := h.travelService.GetTravelPlan(planID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Travel plan not found"})
		return
	}

	// 获取日程
	days, err := h.travelService.GetTravelDays(planID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get travel days"})
		return
	}

	// 为每个日程加载活动
	activitiesByDay := make(map[string][]*models.Activity)
	for _, day := range days {
		acts, err := h.travelService.GetActivities(day.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get activities"})
			return
		}
		activitiesByDay[day.ID] = acts
	}

	// 获取费用汇总
	expenseSummary, err := h.travelService.GetExpenseSummary(planID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get expense summary"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"plan":              plan,
		"days":              days,
		"activities_by_day": activitiesByDay,
		"expense_summary":   expenseSummary,
	})
}

// UpdateTravelPlan 更新旅行计划
func (h *TravelHandler) UpdateTravelPlan(c *gin.Context) {
	userID := c.GetString("user_id")
	planID := c.Param("id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.travelService.UpdateTravelPlan(planID, userID, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update travel plan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Travel plan updated successfully"})
}

// DeleteTravelPlan 删除旅行计划
func (h *TravelHandler) DeleteTravelPlan(c *gin.Context) {
	userID := c.GetString("user_id")
	planID := c.Param("id")

	if err := h.travelService.DeleteTravelPlan(planID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete travel plan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Travel plan deleted successfully"})
}

// GetExpenses 获取费用记录
func (h *TravelHandler) GetExpenses(c *gin.Context) {
	planID := c.Query("plan_id")
	if planID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "plan_id is required"})
		return
	}

	expenses, err := h.travelService.GetExpenses(planID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get expenses"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"expenses": expenses})
}

// CreateExpense 创建费用记录
func (h *TravelHandler) CreateExpense(c *gin.Context) {
	var req struct {
		PlanID      string  `json:"plan_id" binding:"required"`
		Category    string  `json:"category" binding:"required"`
		Description string  `json:"description" binding:"required"`
		Amount      float64 `json:"amount" binding:"required"`
		Currency    string  `json:"currency"`
		Date        string  `json:"date" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, expected YYYY-MM-DD"})
		return
	}

	expense := models.Expense{
		ID:          uuid.New().String(),
		PlanID:      req.PlanID,
		Category:    req.Category,
		Description: req.Description,
		Amount:      req.Amount,
		Currency:    req.Currency,
		Date:        parsedDate,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	if expense.Currency == "" {
		expense.Currency = "CNY"
	}

	if err := h.travelService.CreateExpense(&expense); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create expense"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"expense": expense})
}

// UpdateExpense 更新费用记录
func (h *TravelHandler) UpdateExpense(c *gin.Context) {
	id := c.Param("id")
	expense, err := h.travelService.GetExpense(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "expense not found"})
		return
	}

	var req struct {
		PlanID      string  `json:"plan_id" binding:"required"`
		Category    string  `json:"category" binding:"required"`
		Description string  `json:"description" binding:"required"`
		Amount      float64 `json:"amount" binding:"required"`
		Currency    string  `json:"currency"`
		Date        string  `json:"date" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	parsedDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, expected YYYY-MM-DD"})
		return
	}

	expense.PlanID = req.PlanID
	expense.Category = req.Category
	expense.Description = req.Description
	expense.Amount = req.Amount
	expense.Currency = req.Currency
	if expense.Currency == "" {
		expense.Currency = "CNY"
	}
	expense.Date = parsedDate
	expense.UpdatedAt = time.Now()

	if err := h.travelService.UpdateExpense(expense); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update expense"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"expense": expense})
}

// DeleteExpense 删除费用记录
func (h *TravelHandler) DeleteExpense(c *gin.Context) {
	id := c.Param("id")
	if err := h.travelService.DeleteExpense(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "expense not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Expense deleted"})
}
