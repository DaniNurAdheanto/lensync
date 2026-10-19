package main

import (
	"context"
	"encoding/base64"
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/c2c/desktop-agent/internal/adapter"
	"github.com/c2c/desktop-agent/internal/client"
	"github.com/c2c/desktop-agent/internal/config"
	"github.com/c2c/desktop-agent/internal/preview"
	"github.com/c2c/desktop-agent/internal/queue"
	"github.com/c2c/desktop-agent/internal/server"
	"github.com/c2c/desktop-agent/internal/uploader"
)

func main() {
	configPath := flag.String("config", "config.yaml", "Path to YAML configuration file")
	flagWatchPath := flag.String("watch-path", "", "Override source photo watch path")
	flagSessionID := flag.String("session-id", "", "Override active shoot session ID")
	flagProjectID := flag.String("project-id", "", "Override active project ID")
	flagAPIURL := flag.String("api-url", "", "Override backend API base URL")
	flagAutoStart := flag.Bool("auto-start", true, "Auto-start syncing immediately")
	flag.Parse()

	log.Println("==================================================")
	log.Println("📷 Camera-to-Cloud (C2C) Local Sync Agent Daemon")
	log.Println("==================================================")

	cfg, err := config.LoadConfig(*configPath)
	if err != nil {
		log.Fatalf("Fatal: could not load config: %v", err)
	}

	// Apply CLI flag overrides if provided
	if *flagWatchPath != "" {
		cfg.Watcher.WatchPath = *flagWatchPath
	}
	if *flagSessionID != "" {
		cfg.Session.ActiveSessionID = *flagSessionID
	}
	if *flagProjectID != "" {
		cfg.Session.ActiveProjectID = *flagProjectID
	}
	if *flagAPIURL != "" {
		cfg.API.BaseURL = *flagAPIURL
	}

	log.Printf("Agent ID: %s (%s)", cfg.Agent.ID, cfg.Agent.Name)
	log.Printf("Active Session: %s | Active Project: %s", cfg.Session.ActiveSessionID, cfg.Session.ActiveProjectID)
	log.Printf("Source Hotfolder: %s", cfg.Watcher.WatchPath)
	log.Printf("Target Cloud API: %s", cfg.API.BaseURL)

	// 1. Initialize Persistent State Store (ensures queue survives restarts)
	stateStore, err := queue.NewPersistentStateStore(cfg.Queue.DBCachePath)
	if err != nil {
		log.Fatalf("Fatal: could not initialize persistent queue store: %v", err)
	}

	// 2. Initialize API Client & S3 Uploader
	apiClient := client.NewAPIClient(cfg.API.BaseURL, cfg.API.APIKey)
	s3Uploader := uploader.NewS3Uploader(cfg.Storage.ChunkSizeMB)

	var uploadQueueRef *queue.UploadQueue

	// 3. Define Upload Execution Handler
	uploadHandler := func(ctx context.Context, task *queue.UploadTask) error {
		// A. Request direct Google Drive / S3 upload session URL from API backend
		presignedRes, err := apiClient.RequestPresignedURL(ctx, client.PresignedURLRequest{
			SessionID:        task.SessionID,
			DeviceID:         cfg.Agent.ID,
			OriginalFilename: task.Photo.FileName,
			FileSizeBytes:    task.Photo.SizeBytes,
			SHA256Hash:       task.Photo.SHA256Hash,
			FileFormat:       task.Photo.Extension,
			StorageProvider:  cfg.Storage.Provider,
		})
		if err != nil {
			return err
		}

		// B. Handle Cloud Deduplication (same hash already uploaded by any agent in session)
		if presignedRes.AlreadyUploaded {
			log.Printf("[Agent] Deduplication: File %s already uploaded in session %s. Skipping upload.", task.Photo.FileName, task.SessionID)
			if uploadQueueRef != nil {
				uploadQueueRef.MarkSkippedDuplicate(task)
			}
			return nil
		}

		// C. Upload file directly to Cloud Storage (Google Drive / S3) via PUT stream
		uploadRes, err := s3Uploader.UploadViaPresignedURL(ctx, task, presignedRes.PresignedURL)
		if err != nil {
			return err
		}

		// D. Confirm upload status and save photo record with Google Drive & EXIF telemetry in backend
		confirmReq := client.ConfirmUploadRequest{
			PhotoID:         presignedRes.PhotoID,
			UploadTaskID:    presignedRes.UploadTaskID,
			Success:         true,
			StorageProvider: presignedRes.StorageProvider,
			GDriveFileID:    uploadRes.GDriveFileID,
			GDriveViewLink:  uploadRes.GDriveViewLink,
		}

		if task.Photo.EXIF != nil {
			confirmReq.CameraMake = task.Photo.EXIF.CameraMake
			confirmReq.CameraModel = task.Photo.EXIF.CameraModel
			confirmReq.LensModel = task.Photo.EXIF.LensModel
			confirmReq.FocalLengthMm = task.Photo.EXIF.FocalLengthMm
			confirmReq.ApertureFStop = task.Photo.EXIF.ApertureFStop
			confirmReq.ShutterSpeedStr = task.Photo.EXIF.ShutterSpeedStr
			confirmReq.ISOSpeed = task.Photo.EXIF.ISOSpeed
		}

		// Local file is NOT deleted!
		return apiClient.ConfirmUpload(ctx, confirmReq)
	}

	// 4. Initialize Upload Queue
	uploadQueue := queue.NewUploadQueue(
		cfg.Queue.Concurrency,
		cfg.Queue.MaxRetries,
		cfg.Queue.RetryDelaySec,
		stateStore,
		uploadHandler,
	)
	uploadQueueRef = uploadQueue
	uploadQueue.Start()

	// 5. Initialize Pluggable Camera Adapter Architecture
	registry := adapter.NewAdapterRegistry()

	// Adapter 1: Hotfolder Tether Watcher (Default)
	hotfolderAdapter := adapter.NewHotfolderAdapter(
		cfg.Watcher.WatchPath,
		cfg.Watcher.AllowedExtensions,
		cfg.Watcher.PollIntervalMs,
		cfg.Watcher.MinFileAgeMs,
	)
	registry.Register(hotfolderAdapter)

	// Adapter 2: Direct USB PTP/MTP Protocol
	ptpAdapter := adapter.NewPTPMTPAdapter()
	registry.Register(ptpAdapter)

	// Adapter 3: Vendor SDKs (Sony, Canon, Nikon)
	registry.Register(adapter.NewCameraSDKAdapter(adapter.AdapterTypeSonySDK))
	registry.Register(adapter.NewCameraSDKAdapter(adapter.AdapterTypeCanonSDK))
	registry.Register(adapter.NewCameraSDKAdapter(adapter.AdapterTypeNikonSDK))

	// 6. Photo ingestion channel
	photoChan := make(chan adapter.DetectedPhoto, 500)

	// 7. Embedded Local Control Server (Allows Dashboard & CLI to control Start/Stop/Config)
	controlServer := server.NewControlServer(
		cfg.Agent.Port,
		cfg.Agent.ID,
		cfg.Agent.Name,
		cfg.Session.ActiveSessionID,
		cfg.Session.ActiveProjectID,
		registry,
		uploadQueue,
		photoChan,
	)
	if err := controlServer.Start(); err != nil {
		log.Printf("[Agent] Warning starting control server: %v", err)
	}

	previewExtractor := preview.NewExtractor()

	// Pipe incoming discovered photos: Dual Stream Upload Architecture
	// Stream 1 (Fast Preview): Extract & upload embedded JPEG in < 1s
	// Stream 2 (Cloud Backup): Enqueue heavy RAW for direct Google Drive stream
	go func() {
		for photo := range photoChan {
			activeSession := controlServer.GetActiveSessionID()
			if activeSession == "" {
				activeSession = cfg.Session.ActiveSessionID
			}

			// Stream 1: Fast RAW Preview Generator (< 1 sec instant display)
			go func(p adapter.DetectedPhoto, sessID string) {
				previewBytes, _, err := previewExtractor.ExtractOrGeneratePreview(p.FilePath, p)
				if err != nil {
					log.Printf("[Agent FastPreview] Warning extracting preview for %s: %v", p.FileName, err)
					return
				}

				req := client.FastPreviewUploadRequest{
					SessionID:        sessID,
					DeviceID:         cfg.Agent.ID,
					OriginalFilename: p.FileName,
					FileSizeBytes:    p.SizeBytes,
					SHA256Hash:       p.SHA256Hash,
					FileFormat:       p.Extension,
					PreviewBase64:    base64.StdEncoding.EncodeToString(previewBytes),
				}
				if p.EXIF != nil {
					req.CameraMake = p.EXIF.CameraMake
					req.CameraModel = p.EXIF.CameraModel
					req.LensModel = p.EXIF.LensModel
					req.FocalLengthMm = p.EXIF.FocalLengthMm
					req.ApertureFStop = p.EXIF.ApertureFStop
					req.ShutterSpeedStr = p.EXIF.ShutterSpeedStr
					req.ISOSpeed = p.EXIF.ISOSpeed
				}

				res, err := apiClient.UploadFastPreview(context.Background(), req)
				if err != nil {
					log.Printf("[Agent FastPreview] Error uploading fast preview for %s: %v", p.FileName, err)
				} else {
					log.Printf("[Agent FastPreview] ⚡ Instant preview ready (<1s) for %s (URL: %s)", p.FileName, res.PreviewURL)
				}
			}(photo, activeSession)

			// Stream 2: Heavy RAW Direct Cloud Backup Queue
			uploadQueue.Enqueue(photo, activeSession)
		}
	}()

	// Periodic Heartbeat to backend
	go func() {
		ticker := time.NewTicker(time.Duration(cfg.API.HeartbeatIntervalSec) * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			_ = apiClient.SendHeartbeat(context.Background(), cfg.Agent.ID, cfg.Agent.Version)
		}
	}()

	// Auto-start sync if requested
	if *flagAutoStart {
		log.Printf("[Agent] Auto-starting sync adapter...")
		syncCtx := context.Background()
		if err := hotfolderAdapter.Start(syncCtx, photoChan); err != nil {
			log.Printf("[Agent] Could not auto-start hotfolder sync: %v", err)
		} else {
			controlServer.SetSyncing(true)
		}
	}

	// 8. Graceful shutdown handling
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	<-sigChan
	log.Println("\n[Agent] Interrupted. Shutting down gracefully...")

	controlServer.Stop()
	_ = hotfolderAdapter.Stop()
	uploadQueue.Stop()

	log.Println("[Agent] Local files preserved intact. Shutdown complete.")
}
