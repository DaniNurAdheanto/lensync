package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Agent struct {
		ID       string `yaml:"id"`
		Name     string `yaml:"name"`
		Version  string `yaml:"version"`
		LogLevel string `yaml:"log_level"`
	} `yaml:"agent"`

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
		S3DirectUpload bool `yaml:"s3_direct_upload"`
		ChunkSizeMB    int  `yaml:"chunk_size_mb"`
	} `yaml:"storage"`
}

// LoadConfig reads YAML configuration or falls back to sensible defaults
func LoadConfig(path string) (*Config, error) {
	cfg := &Config{}
	
	// Default configuration values
	cfg.Agent.ID = "c2c-default-agent"
	cfg.Agent.Name = "Default Tether Agent"
	cfg.Agent.Version = "0.1.0"
	cfg.Agent.LogLevel = "info"
	cfg.API.BaseURL = "http://localhost:8080/api/v1"
	cfg.API.HeartbeatIntervalSec = 15
	cfg.Watcher.WatchPath = "./hotfolder"
	cfg.Watcher.PollIntervalMs = 1000
	cfg.Watcher.AllowedExtensions = []string{".cr3", ".cr2", ".nef", ".arw", ".dng", ".jpg", ".jpeg"}
	cfg.Watcher.MinFileAgeMs = 500
	cfg.Queue.Concurrency = 3
	cfg.Queue.MaxRetries = 5
	cfg.Queue.RetryDelaySec = 3
	cfg.Storage.S3DirectUpload = true
	cfg.Storage.ChunkSizeMB = 8

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return cfg, nil // return defaults if file not found
		}
		return nil, fmt.Errorf("failed to read config file %s: %w", path, err)
	}

	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("failed to parse yaml config: %w", err)
	}

	return cfg, nil
}
