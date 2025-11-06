package models

import (
	"time"
)

// User 用户模型
type User struct {
	ID        string    `json:"id" db:"id"`
	Email     string    `json:"email" db:"email"`
	Username  string    `json:"username" db:"username"`
	Password  string    `json:"-" db:"password"` // 不返回给前端
	Avatar    string    `json:"avatar" db:"avatar"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// UserProfile 用户资料
type UserProfile struct {
	ID          string    `json:"id" db:"id"`
	UserID      string    `json:"user_id" db:"user_id"`
	FirstName   string    `json:"first_name" db:"first_name"`
	LastName    string    `json:"last_name" db:"last_name"`
	Phone       string    `json:"phone" db:"phone"`
	Preferences string    `json:"preferences" db:"preferences"` // JSON字符串存储偏好设置
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Username string `json:"username" binding:"required,min=3,max=20"`
	Password string `json:"password" binding:"required,min=6"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse 认证响应
type AuthResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	User         User   `json:"user"`
}


