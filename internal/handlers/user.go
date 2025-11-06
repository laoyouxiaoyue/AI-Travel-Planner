package handlers

import (
	"ai-travel-planner/internal/models"
	"ai-travel-planner/internal/services"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {
	userService *services.UserService
	authService *services.AuthService
}

func NewUserHandler(userService *services.UserService, authService *services.AuthService) *UserHandler {
	return &UserHandler{
		userService: userService,
		authService: authService,
	}
}

// Register 用户注册
func (h *UserHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查邮箱是否已存在
	existingUser, _ := h.userService.GetUserByEmail(req.Email)
	if existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
		return
	}

	// 加密密码
	hashedPassword, err := h.authService.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// 创建用户
	user := &models.User{
		ID:        uuid.New().String(),
		Email:     req.Email,
		Username:  req.Username,
		Password:  hashedPassword,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.userService.CreateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// 生成token
	token, err := h.authService.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	refreshToken, err := h.authService.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	c.JSON(http.StatusCreated, models.AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         *user,
	})
}

// Login 用户登录
func (h *UserHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取用户
	user, err := h.userService.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// 验证密码
	if !h.authService.CheckPassword(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// 生成token
	token, err := h.authService.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	refreshToken, err := h.authService.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         *user,
	})
}

// RefreshToken 刷新token
func (h *UserHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 验证refresh token
	claims, err := h.authService.ValidateToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	// 生成新的access token
	token, err := h.authService.GenerateToken(claims.UserID, claims.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

// GetProfile 获取用户资料
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")

	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	profile, err := h.userService.GetUserProfile(userID)
	if err != nil {
		// 如果没有资料，返回用户基本信息
		c.JSON(http.StatusOK, gin.H{"user": user})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":    user,
		"profile": profile,
	})
}

// UpdateProfile 更新用户资料
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 更新用户信息
	if err := h.userService.UpdateUser(userID, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}





