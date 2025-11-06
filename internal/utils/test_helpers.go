package utils

import (
	"ai-travel-planner/internal/models"
	"time"
)

// CreateTestUser 创建测试用户
func CreateTestUser() *models.User {
	return &models.User{
		ID:        "test-user-id",
		Email:     "test@example.com",
		Username:  "testuser",
		Password:  "hashed_password",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// CreateTestTravelPlan 创建测试旅行计划
func CreateTestTravelPlan() *models.TravelPlan {
	return &models.TravelPlan{
		ID:          "test-plan-id",
		UserID:      "test-user-id",
		Title:       "测试旅行计划",
		Destination: "日本",
		StartDate:   time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		EndDate:     time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC),
		Budget:      10000.0,
		People:      2,
		Status:      "planned",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

// CreateTestExpense 创建测试费用记录
func CreateTestExpense() *models.Expense {
	return &models.Expense{
		ID:          "test-expense-id",
		PlanID:      "test-plan-id",
		Category:    "food",
		Description: "午餐",
		Amount:      100.0,
		Currency:    "CNY",
		Date:        time.Now(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}





