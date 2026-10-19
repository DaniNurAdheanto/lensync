package config

import (
	"os"
)

type Config struct {
	Port         string
	Environment  string
	DatabaseURL  string
	JWTSecret    string
	S3Endpoint   string
	S3AccessKey  string
	S3SecretKey  string
	S3BucketName string
	S3UseSSL     bool
}

func LoadConfig() *Config {
	return &Config{
		Port:         getEnv("PORT", "8080"),
		Environment:  getEnv("ENV", "development"),
		DatabaseURL:  getEnv("DATABASE_URL", "postgres://c2c_user:c2c_secret_password@localhost:5432/c2c_db?sslmode=disable"),
		JWTSecret:    getEnv("JWT_SECRET", "super_secret_c2c_jwt_token_key_change_in_production_32bytes"),
		S3Endpoint:   getEnv("S3_ENDPOINT", "localhost:9000"),
		S3AccessKey:  getEnv("S3_ACCESS_KEY", "minioadmin"),
		S3SecretKey:  getEnv("S3_SECRET_KEY", "minioadmin123"),
		S3BucketName: getEnv("S3_BUCKET_NAME", "c2c-photos"),
		S3UseSSL:     getEnv("S3_USE_SSL", "false") == "true",
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
