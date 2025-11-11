package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	// 服务器配置
	Server ServerConfig `yaml:"server"`

	// 数据库配置
	Database DatabaseConfig `yaml:"database"`

	// 外部API配置
	APIs APIConfig `yaml:"apis"`

	// JWT配置
	JWT JWTConfig `yaml:"jwt"`
}

type ServerConfig struct {
	Port string `yaml:"port"`
	Mode string `yaml:"mode"`
}

type DatabaseConfig struct {
	SupabaseURL    string `yaml:"supabase_url"`
	SupabaseKey    string `yaml:"supabase_key"`
	SupabaseSecret string `yaml:"supabase_secret"`
}

type APIConfig struct {
	// 科大讯飞语音API
	Xunfei XunfeiConfig `yaml:"xunfei"`

	// LLM API (OpenAI/Claude等)
	OpenAI OpenAIConfig `yaml:"openai"`

	// 高德地图API
	Amap AmapConfig `yaml:"amap"`
}

type XunfeiConfig struct {
	AppID     string `yaml:"app_id"`
	APIKey    string `yaml:"api_key"`
	APISecret string `yaml:"api_secret"`
}

type OpenAIConfig struct {
	APIKey         string `yaml:"api_key"`
	BaseURL        string `yaml:"base_url"`
	Model          string `yaml:"model"`
	TimeoutSeconds int    `yaml:"timeout_seconds"`
}

type AmapConfig struct {
	APIKey string `yaml:"api_key"`
}

type JWTConfig struct {
	Secret     string `yaml:"secret"`
	ExpireTime int    `yaml:"expire_time"` // 小时
}

var globalConfig *Config

// Load 从 YAML 文件加载配置
func Load() (*Config, error) {
	if globalConfig != nil {
		return globalConfig, nil
	}

	configPath := getConfigPath()
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("读取配置文件失败: %w", err)
	}

	cfg := &Config{}
	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("解析配置文件失败: %w", err)
	}

	// 设置默认值
	setDefaults(cfg)

	// 验证必需配置
	if err := validateConfig(cfg); err != nil {
		return nil, fmt.Errorf("配置验证失败: %w", err)
	}

	globalConfig = cfg
	return cfg, nil
}

// getConfigPath 获取配置文件路径
func getConfigPath() string {
	// 优先使用环境变量 CONFIG_PATH（如果设置了）
	if path := os.Getenv("CONFIG_PATH"); path != "" {
		return path
	}

	// 尝试多个可能的配置文件路径
	possiblePaths := []string{
		"config.yaml",
		"config.yml",
		"./config.yaml",
		"./config.yml",
	}

	for _, path := range possiblePaths {
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}

	// 如果都不存在，返回默认路径（让调用方处理错误）
	return "config.yaml"
}

// setDefaults 设置默认值
func setDefaults(cfg *Config) {
	// 服务器配置默认值
	if cfg.Server.Port == "" {
		cfg.Server.Port = "9090"
	}
	if cfg.Server.Mode == "" {
		cfg.Server.Mode = "debug"
	}

	// OpenAI 配置默认值
	if cfg.APIs.OpenAI.BaseURL == "" {
		cfg.APIs.OpenAI.BaseURL = "https://api.openai.com/v1"
	}
	if cfg.APIs.OpenAI.Model == "" {
		cfg.APIs.OpenAI.Model = "gpt-4o-mini"
	}
	if cfg.APIs.OpenAI.TimeoutSeconds == 0 {
		cfg.APIs.OpenAI.TimeoutSeconds = 120
	}

	// JWT 配置默认值
	if cfg.JWT.Secret == "" {
		cfg.JWT.Secret = getDefaultJWTSecret()
	}
	if cfg.JWT.ExpireTime == 0 {
		cfg.JWT.ExpireTime = 24 // 24小时
	}
}

// validateConfig 验证配置
func validateConfig(cfg *Config) error {
	if cfg.Database.SupabaseURL == "" {
		return fmt.Errorf("数据库配置错误: supabase_url 不能为空")
	}
	if cfg.Database.SupabaseKey == "" {
		return fmt.Errorf("数据库配置错误: supabase_key 不能为空")
	}
	if cfg.Database.SupabaseSecret == "" {
		return fmt.Errorf("数据库配置错误: supabase_secret 不能为空")
	}
	if cfg.APIs.OpenAI.APIKey == "" {
		return fmt.Errorf("OpenAI API 配置错误: api_key 不能为空")
	}
	return nil
}

// getDefaultJWTSecret 生成默认的JWT密钥
func getDefaultJWTSecret() string {
	return "ai-travel-planner-default-jwt-secret-key-2024-secure-random-string-for-production-use"
}

// GetPort 获取服务器端口
func (c *Config) GetPort() string {
	return c.Server.Port
}

// GetMode 获取运行模式
func (c *Config) GetMode() string {
	return c.Server.Mode
}
