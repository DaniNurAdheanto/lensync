package config

import (
	"fmt"
	"os"
	"strconv"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Agent struct {
		ID       string `yaml:"id"`
		Name     string `yaml:"name"`
		Version  string `yaml:"version"`
		LogLevel string `yaml:"log_level"`
		Port     string `yaml:"port"`
	} `yaml:"agent"`

	Session struct {
		ActiveSessionID string `yaml:"active_session_id"`
		ActiveProjectID string `yaml:"active_project_id"`
	} `yaml:"session"`

	API struct {
		BaseURL              string `yaml:"base_url"`
		APIKey               string `yaml:"api_key"`
		HeartbeatIntervalSec int    `yaml:"heartbeat_interval_sec"`
	} `yaml:"api"`

	Watcher struct {
		WatchPath         string   `yaml:"watch_path"`
		Recursive         bool     `yaml:"recursive"`
		PollIntervalMs    int      `yaml:"poll_interval_ms"`
		AllowedExtensions []string `yaml:"allowed_extensions"`
		MinFileAgeMs      int      `yaml:"min_file_age_ms"`
	} `yaml:"watcher"`

	Queue struct {
		Concurrency   int    `yaml:"concurrency"`
		MaxRetries    int    `yaml:"max_retries"`
		RetryDelaySec int    `yaml:"retry_delay_sec"`
		DBCachePath   string `yaml:"db_cache_path"`
	} `yaml:"queue"`

	Storage struct {
		Provider       string `yaml:"provider"` // "google_drive" or "s3"
		S3DirectUpload bool   `yaml:"s3_direct_upload"`
		ChunkSizeMB    int    `yaml:"chunk_size_mb"`
	} `yaml:"storage"`
}

// LoadConfig reads YAML configuration and merges environment variables
func LoadConfig(path string) (*Config, error) {
	cfg := &Config{}

	// Sensible defaults
	cfg.Agent.ID = "c2c-agent-mac-studio"
	cfg.Agent.Name = "Studio MacBook Pro (USB-C Tether)"
	cfg.Agent.Version = "0.2.0"
	cfg.Agent.LogLevel = "info"
	cfg.Agent.Port = ":8081"

	cfg.Session.ActiveSessionID = "session-pfw-2026"
	cfg.Session.ActiveProjectID = "proj-pfw-2026"

	cfg.API.BaseURL = "http://localhost:8080/api/v1"
	cfg.API.APIKey = "c2c_agent_test_api_key_12345"
	cfg.API.HeartbeatIntervalSec = 15

	cfg.Watcher.WatchPath = "./sample_hotfolder"
	cfg.Watcher.PollIntervalMs = 1000
	cfg.Watcher.AllowedExtensions = []string{".cr3", ".cr2", ".nef", ".arw", ".dng", ".jpg", ".jpeg", ".heic"}
	cfg.Watcher.MinFileAgeMs = 500

	cfg.Queue.Concurrency = 2
	cfg.Queue.MaxRetries = 5
	cfg.Queue.RetryDelaySec = 2
	cfg.Queue.DBCachePath = "./.c2c_queue_state.json"

	cfg.Storage.Provider = "google_drive"
	cfg.Storage.S3DirectUpload = true
	cfg.Storage.ChunkSizeMB = 8

	// Read YAML if exists
	data, err := os.ReadFile(path)
	if err == nil {
		_ = yaml.Unmarshal(data, cfg)
	}

	// Environment variable overrides
	if val := os.Getenv("C2C_AGENT_ID"); val != "" {
		cfg.Agent.ID = val
	}
	if val := os.Getenv("C2C_AGENT_NAME"); val != "" {
		cfg.Agent.Name = val
	}
	if val := os.Getenv("C2C_AGENT_PORT"); val != "" {
		cfg.Agent.Port = val
	}
	if val := os.Getenv("C2C_SESSION_ID"); val != "" {
		cfg.Session.ActiveSessionID = val
	}
	if val := os.Getenv("C2C_PROJECT_ID"); val != "" {
		cfg.Session.ActiveProjectID = val
	}
	if val := os.Getenv("C2C_API_BASE_URL"); val != "" {
		cfg.API.BaseURL = val
	}
	if val := os.Getenv("C2C_API_KEY"); val != "" {
		cfg.API.APIKey = val
	}
	if val := os.Getenv("C2C_WATCH_PATH"); val != "" {
		cfg.Watcher.WatchPath = val
	}
	if val := os.Getenv("C2C_QUEUE_DB"); val != "" {
		cfg.Queue.DBCachePath = val
	}
	if val := os.Getenv("C2C_STORAGE_PROVIDER"); val != "" {
		cfg.Storage.Provider = val
	}
	if val := os.Getenv("C2C_MAX_RETRIES"); val != "" {
		if i, err := strconv.Atoi(val); err == nil {
			cfg.Queue.MaxRetries = i
		}
	}

	fmt.Printf("[Config] Loaded configuration: Agent ID=%s, WatchPath=%s, SessionID=%s, API=%s\n",
		cfg.Agent.ID, cfg.Watcher.WatchPath, cfg.Session.ActiveSessionID, cfg.API.BaseURL)

	return cfg, nil
}
