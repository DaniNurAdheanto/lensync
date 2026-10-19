package main

import (
	"context"
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/c2c/desktop-agent/internal/client"
	"github.com/c2c/desktop-agent/internal/config"
	"github.com/c2c/desktop-agent/internal/queue"
	"github.com/c2c/desktop-agent/internal/tether"
	"github.com/c2c/desktop-agent/internal/uploader"
	"github.com/c2c/desktop-agent/internal/watcher"
)

func main() {
	configPath := flag.String("config", "config.yaml", "Path to YAML configuration file")
	flag.Parse()

	log.Println("==================================================")
	log.Println("📷 Camera-to-Cloud (C2C) Desktop Agent Daemon")
	log.Println("==================================================")

	cfg, err := config.LoadConfig(*configPath)
	if err != nil {
		log.Fatalf("Fatal: could not load config: %v", err)
	}

	log.Printf("Agent ID: %s (%s)", cfg.Agent.ID, cfg.Agent.Name)
	log.Printf("Monitoring Hotfolder: %s", cfg.Watcher.WatchPath)
	log.Printf("API Target: %s", cfg.API.BaseURL)

	// Initialize Tether Detector
	detector := tether.NewTetherDetector()
	connectedDevices := detector.ScanConnectedDevices()
	log.Printf("Initial tether scan found %d cameras.", len(connectedDevices))

	// Initialize API Client & S3 Uploader
	apiClient := client.NewAPIClient(cfg.API.BaseURL, cfg.API.APIKey)
	s3Uploader := uploader.NewS3Uploader(cfg.Storage.ChunkSizeMB)

	// Wire upload execution handler
	uploadHandler := func(ctx context.Context, task *queue.UploadTask) error {
		// 1. Request presigned URL from API backend
		presignedRes, err := apiClient.RequestPresignedURL(ctx, client.PresignedURLRequest{
			SessionID:        "active-session-placeholder",
			DeviceID:         cfg.Agent.ID,
			OriginalFilename: task.Photo.FileName,
			FileSizeBytes:    task.Photo.SizeBytes,
			SHA256Hash:       task.Photo.SHA256Hash,
			FileFormat:       task.Photo.Extension,
		})
		if err != nil {
			return err
		}

		if presignedRes.AlreadyUploaded {
			log.Printf("[Agent] File %s already uploaded to cloud. Skipping upload.", task.Photo.FileName)
			return nil
		}

		// 2. Upload file directly to S3
		if err := s3Uploader.UploadViaPresignedURL(ctx, task, presignedRes.PresignedURL); err != nil {
			return err
		}

		// 3. Confirm upload status and save photo record
		return apiClient.ConfirmUpload(ctx, client.ConfirmUploadRequest{
			PhotoID:      presignedRes.PhotoID,
			UploadTaskID: presignedRes.UploadTaskID,
			Success:      true,
		})
	}

	// Initialize and start upload queue
	uploadQueue := queue.NewUploadQueue(
		cfg.Queue.Concurrency,
		cfg.Queue.MaxRetries,
		cfg.Queue.RetryDelaySec,
		uploadHandler,
	)
	uploadQueue.Start()

	// Initialize and start file watcher
	photoChan := make(chan watcher.DetectedPhoto, 100)
	fileWatcher := watcher.NewFileWatcher(
		cfg.Watcher.WatchPath,
		cfg.Watcher.AllowedExtensions,
		cfg.Watcher.PollIntervalMs,
		cfg.Watcher.MinFileAgeMs,
	)
	go fileWatcher.Start(photoChan)

	// Pipe discovered photos into upload queue
	go func() {
		for photo := range photoChan {
			uploadQueue.Enqueue(photo)
		}
	}()

	// Graceful shutdown handling
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	<-sigChan
	log.Println("\n[Agent] Interrupted. Shutting down gracefully...")

	fileWatcher.Stop()
	uploadQueue.Stop()

	log.Println("[Agent] Shutdown complete. Goodbye.")
}
