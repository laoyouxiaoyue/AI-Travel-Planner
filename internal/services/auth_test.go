package services

import (
	"ai-travel-planner/internal/config"
	"testing"
)

func TestAuthService_HashPassword(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:     "test-secret",
			ExpireTime: 24,
		},
	}

	authService := NewAuthService(cfg)
	password := "testpassword123"

	hashed, err := authService.HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	if hashed == password {
		t.Error("Hashed password should not equal original password")
	}

	if len(hashed) == 0 {
		t.Error("Hashed password should not be empty")
	}
}

func TestAuthService_CheckPassword(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:     "test-secret",
			ExpireTime: 24,
		},
	}

	authService := NewAuthService(cfg)
	password := "testpassword123"

	hashed, err := authService.HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	// 测试正确密码
	if !authService.CheckPassword(password, hashed) {
		t.Error("CheckPassword should return true for correct password")
	}

	// 测试错误密码
	if authService.CheckPassword("wrongpassword", hashed) {
		t.Error("CheckPassword should return false for wrong password")
	}
}

func TestAuthService_GenerateToken(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:     "test-secret-key-for-jwt",
			ExpireTime: 24,
		},
	}

	authService := NewAuthService(cfg)
	userID := "test-user-id"
	email := "test@example.com"

	token, err := authService.GenerateToken(userID, email)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	if len(token) == 0 {
		t.Error("Generated token should not be empty")
	}
}

func TestAuthService_ValidateToken(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:     "test-secret-key-for-jwt",
			ExpireTime: 24,
		},
	}

	authService := NewAuthService(cfg)
	userID := "test-user-id"
	email := "test@example.com"

	// 生成token
	token, err := authService.GenerateToken(userID, email)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	// 验证token
	claims, err := authService.ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("Expected UserID %s, got %s", userID, claims.UserID)
	}

	if claims.Email != email {
		t.Errorf("Expected Email %s, got %s", email, claims.Email)
	}
}









