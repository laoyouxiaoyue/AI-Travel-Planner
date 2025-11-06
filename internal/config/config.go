package config

import (
    "os"
    "strconv"
)

type Config struct {
	// 服务器配置
	Port string
	Mode string

	// 数据库配置
	Database DatabaseConfig

	// 外部API配置
	APIs APIConfig

	// JWT配置
	JWT JWTConfig
}

type DatabaseConfig struct {
	SupabaseURL    string
	SupabaseKey    string
	SupabaseSecret string
}

type APIConfig struct {
	// 科大讯飞语音API
	XunfeiAppID     string
	XunfeiAPIKey    string
	XunfeiAPISecret string

	// 高德地图API
	AmapAPIKey string

	// LLM API (OpenAI/Claude等)
    OpenAIAPIKey        string
    OpenAIBaseURL       string
    OpenAIModel         string
    OpenAITimeoutSeconds int
}

type JWTConfig struct {
	Secret     string
	ExpireTime int // 小时
}

func Load() *Config {
	return &Config{
		Port: getEnv("PORT", "9090"),
		Mode: getEnv("GIN_MODE", "debug"),

		Database: DatabaseConfig{
			SupabaseURL:    getEnv("SUPABASE_URL", ""),
			SupabaseKey:    getEnv("SUPABASE_ANON_KEY", ""),
			SupabaseSecret: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
		},

        APIs: APIConfig{
			XunfeiAppID:     getEnv("XUNFEI_APP_ID", ""),
			XunfeiAPIKey:    getEnv("XUNFEI_API_KEY", ""),
			XunfeiAPISecret: getEnv("XUNFEI_API_SECRET", ""),
			AmapAPIKey:      getEnv("AMAP_API_KEY", ""),
			OpenAIAPIKey:    getEnv("OPENAI_API_KEY", ""),
			OpenAIBaseURL:   getEnv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
            OpenAIModel:     getEnv("OPENAI_MODEL", "gpt-4o-mini"),
            OpenAITimeoutSeconds: getEnvInt("OPENAI_TIMEOUT", 120),
		},

		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "your-secret-key"),
			ExpireTime: 24, // 24小时
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
    if value := os.Getenv(key); value != "" {
        if n, err := strconv.Atoi(value); err == nil {
            return n
        }
    }
    return defaultValue
}
