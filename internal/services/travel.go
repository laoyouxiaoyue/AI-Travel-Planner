package services

import (
	"ai-travel-planner/internal/config"
	"ai-travel-planner/internal/models"
)

type TravelService struct {
	config *config.Config
	db     *MemoryDB
}

func NewTravelService(cfg *config.Config) *TravelService {
	return &TravelService{
		config: cfg,
		db:     NewMemoryDB(),
	}
}

// CreateTravelPlan 创建旅行计划
func (s *TravelService) CreateTravelPlan(plan *models.TravelPlan) error {
	return s.db.CreateTravelPlan(plan)
}

// GetTravelPlans 获取用户的旅行计划列表
func (s *TravelService) GetTravelPlans(userID string) ([]*models.TravelPlan, error) {
	return s.db.GetTravelPlans(userID)
}

// GetTravelPlan 获取单个旅行计划
func (s *TravelService) GetTravelPlan(id, userID string) (*models.TravelPlan, error) {
	return s.db.GetTravelPlan(id, userID)
}

// UpdateTravelPlan 更新旅行计划
func (s *TravelService) UpdateTravelPlan(id, userID string, updates map[string]interface{}) error {
	return s.db.UpdateTravelPlan(id, userID, updates)
}

// DeleteTravelPlan 删除旅行计划
func (s *TravelService) DeleteTravelPlan(id, userID string) error {
	return s.db.DeleteTravelPlan(id, userID)
}

// CreateTravelDay 创建旅行日程
func (s *TravelService) CreateTravelDay(day *models.TravelDay) error {
	return s.db.CreateTravelDay(day)
}

// GetTravelDays 获取旅行计划的日程
func (s *TravelService) GetTravelDays(planID string) ([]*models.TravelDay, error) {
	return s.db.GetTravelDays(planID)
}

// CreateActivity 创建活动
func (s *TravelService) CreateActivity(activity *models.Activity) error {
	return s.db.CreateActivity(activity)
}

// GetActivities 获取日程的活动
func (s *TravelService) GetActivities(dayID string) ([]*models.Activity, error) {
	return s.db.GetActivities(dayID)
}

// CreateExpense 创建费用记录
func (s *TravelService) CreateExpense(expense *models.Expense) error {
	return s.db.CreateExpense(expense)
}

// GetExpense 获取单个费用
func (s *TravelService) GetExpense(id string) (*models.Expense, error) {
	return s.db.GetExpense(id)
}

// GetExpenses 获取旅行计划的费用记录
func (s *TravelService) GetExpenses(planID string) ([]*models.Expense, error) {
	return s.db.GetExpenses(planID)
}

// UpdateExpense 更新费用
func (s *TravelService) UpdateExpense(expense *models.Expense) error {
	return s.db.UpdateExpense(expense)
}

// DeleteExpense 删除费用
func (s *TravelService) DeleteExpense(id string) error {
	return s.db.DeleteExpense(id)
}

// GetExpenseSummary 获取费用汇总
func (s *TravelService) GetExpenseSummary(planID string) (map[string]interface{}, error) {
	expenses, err := s.GetExpenses(planID)
	if err != nil {
		return nil, err
	}

	total := 0.0
	categories := make(map[string]float64)

	for _, expense := range expenses {
		total += expense.Amount
		categories[expense.Category] += expense.Amount
	}

	return map[string]interface{}{
		"total":      total,
		"categories": categories,
		"count":      len(expenses),
	}, nil
}
