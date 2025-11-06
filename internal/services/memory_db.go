package services

import (
	"ai-travel-planner/internal/models"
	"sync"
	"time"
)

// MemoryDB 内存数据库实现
type MemoryDB struct {
	users       map[string]*models.User
	profiles    map[string]*models.UserProfile
	travelPlans map[string]*models.TravelPlan
	travelDays  map[string]*models.TravelDay
	activities  map[string]*models.Activity
	expenses    map[string]*models.Expense
	mutex       sync.RWMutex
}

// NewMemoryDB 创建内存数据库实例
func NewMemoryDB() *MemoryDB {
	return &MemoryDB{
		users:       make(map[string]*models.User),
		profiles:    make(map[string]*models.UserProfile),
		travelPlans: make(map[string]*models.TravelPlan),
		travelDays:  make(map[string]*models.TravelDay),
		activities:  make(map[string]*models.Activity),
		expenses:    make(map[string]*models.Expense),
	}
}

// User operations
func (db *MemoryDB) CreateUser(user *models.User) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	db.users[user.ID] = user
	return nil
}

func (db *MemoryDB) GetUserByEmail(email string) (*models.User, error) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	for _, user := range db.users {
		if user.Email == email {
			return user, nil
		}
	}
	return nil, nil
}

func (db *MemoryDB) GetUserByID(id string) (*models.User, error) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	user, exists := db.users[id]
	if !exists {
		return nil, nil
	}
	return user, nil
}

func (db *MemoryDB) UpdateUser(id string, updates map[string]interface{}) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	user, exists := db.users[id]
	if !exists {
		return nil
	}

	// 应用更新
	if email, ok := updates["email"].(string); ok {
		user.Email = email
	}
	if username, ok := updates["username"].(string); ok {
		user.Username = username
	}
	if avatar, ok := updates["avatar"].(string); ok {
		user.Avatar = avatar
	}
	user.UpdatedAt = time.Now()

	return nil
}

// Profile operations
func (db *MemoryDB) CreateUserProfile(profile *models.UserProfile) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	db.profiles[profile.UserID] = profile
	return nil
}

func (db *MemoryDB) GetUserProfile(userID string) (*models.UserProfile, error) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	profile, exists := db.profiles[userID]
	if !exists {
		return nil, nil
	}
	return profile, nil
}

func (db *MemoryDB) UpdateUserProfile(userID string, updates map[string]interface{}) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	profile, exists := db.profiles[userID]
	if !exists {
		return nil
	}

	// 应用更新
	if firstName, ok := updates["first_name"].(string); ok {
		profile.FirstName = firstName
	}
	if lastName, ok := updates["last_name"].(string); ok {
		profile.LastName = lastName
	}
	if phone, ok := updates["phone"].(string); ok {
		profile.Phone = phone
	}
	profile.UpdatedAt = time.Now()

	return nil
}

// Travel plan operations
func (db *MemoryDB) CreateTravelPlan(plan *models.TravelPlan) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	db.travelPlans[plan.ID] = plan
	return nil
}

func (db *MemoryDB) GetTravelPlans(userID string) ([]*models.TravelPlan, error) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	var plans []*models.TravelPlan
	for _, plan := range db.travelPlans {
		if plan.UserID == userID {
			plans = append(plans, plan)
		}
	}
	return plans, nil
}

func (db *MemoryDB) GetTravelPlan(id, userID string) (*models.TravelPlan, error) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	plan, exists := db.travelPlans[id]
	if !exists || plan.UserID != userID {
		return nil, nil
	}
	return plan, nil
}

func (db *MemoryDB) UpdateTravelPlan(id, userID string, updates map[string]interface{}) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	plan, exists := db.travelPlans[id]
	if !exists || plan.UserID != userID {
		return nil
	}

	// 应用更新
	if title, ok := updates["title"].(string); ok {
		plan.Title = title
	}
	if destination, ok := updates["destination"].(string); ok {
		plan.Destination = destination
	}
	if status, ok := updates["status"].(string); ok {
		plan.Status = status
	}
	plan.UpdatedAt = time.Now()

	return nil
}

func (db *MemoryDB) DeleteTravelPlan(id, userID string) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	plan, exists := db.travelPlans[id]
	if !exists || plan.UserID != userID {
		return nil
	}

	delete(db.travelPlans, id)
	return nil
}

// Travel day operations
func (db *MemoryDB) CreateTravelDay(day *models.TravelDay) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	db.travelDays[day.ID] = day
	return nil
}

func (db *MemoryDB) GetTravelDays(planID string) ([]*models.TravelDay, error) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	var days []*models.TravelDay
	for _, day := range db.travelDays {
		if day.PlanID == planID {
			days = append(days, day)
		}
	}
	return days, nil
}

// Activity operations
func (db *MemoryDB) CreateActivity(activity *models.Activity) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	db.activities[activity.ID] = activity
	return nil
}

func (db *MemoryDB) GetActivities(dayID string) ([]*models.Activity, error) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	var activities []*models.Activity
	for _, activity := range db.activities {
		if activity.DayID == dayID {
			activities = append(activities, activity)
		}
	}
	return activities, nil
}

// Expense operations
func (db *MemoryDB) CreateExpense(expense *models.Expense) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	db.expenses[expense.ID] = expense
	return nil
}

func (db *MemoryDB) GetExpenses(planID string) ([]*models.Expense, error) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	var expenses []*models.Expense
	for _, expense := range db.expenses {
		if expense.PlanID == planID {
			expenses = append(expenses, expense)
		}
	}
	return expenses, nil
}





