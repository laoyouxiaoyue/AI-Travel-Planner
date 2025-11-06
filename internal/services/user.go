package services

import (
	"ai-travel-planner/internal/config"
	"ai-travel-planner/internal/models"
	"errors"
)

type UserService struct {
	config *config.Config
	db     *MemoryDB
}

func NewUserService(cfg *config.Config) *UserService {
	return &UserService{
		config: cfg,
		db:     NewMemoryDB(),
	}
}

// CreateUser 创建用户
func (s *UserService) CreateUser(user *models.User) error {
	// 检查邮箱是否已存在
	existingUser, err := s.GetUserByEmail(user.Email)
	if err == nil && existingUser != nil {
		return errors.New("email already exists")
	}

	// 插入用户到数据库
	return s.db.CreateUser(user)
}

// GetUserByEmail 根据邮箱获取用户
func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	return s.db.GetUserByEmail(email)
}

// GetUserByID 根据ID获取用户
func (s *UserService) GetUserByID(id string) (*models.User, error) {
	return s.db.GetUserByID(id)
}

// UpdateUser 更新用户信息
func (s *UserService) UpdateUser(id string, updates map[string]interface{}) error {
	return s.db.UpdateUser(id, updates)
}

// CreateUserProfile 创建用户资料
func (s *UserService) CreateUserProfile(profile *models.UserProfile) error {
	return s.db.CreateUserProfile(profile)
}

// GetUserProfile 获取用户资料
func (s *UserService) GetUserProfile(userID string) (*models.UserProfile, error) {
	return s.db.GetUserProfile(userID)
}

// UpdateUserProfile 更新用户资料
func (s *UserService) UpdateUserProfile(userID string, updates map[string]interface{}) error {
	return s.db.UpdateUserProfile(userID, updates)
}
