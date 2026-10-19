package services

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/c2c/api/internal/events"
	"github.com/c2c/api/internal/models"
	"github.com/c2c/api/internal/repositories"
	"github.com/c2c/api/internal/storage"
	"github.com/google/uuid"
)

type PresignedUploadResult struct {
	PhotoID         string `json:"photo_id"`
	UploadTaskID    string `json:"upload_task_id"`
	PresignedURL    string `json:"presigned_url"`
	S3Key           string `json:"s3_key"`
	StorageProvider string `json:"storage_provider"` // "google_drive" or "s3"
	GDriveFolderID  string `json:"gdrive_folder_id,omitempty"`
	AlreadyUploaded bool   `json:"already_uploaded"`
}

type PhotoService struct {
	photoRepo   repositories.PhotoRepository
	storage     *storage.S3Storage
	gdrive      *storage.GDriveStorage
	sessionRepo repositories.SessionRepository
	broker      *events.EventBroker
}

func NewPhotoService(
	photoRepo repositories.PhotoRepository,
	sessionRepo repositories.SessionRepository,
	s3 *storage.S3Storage,
	gdrive *storage.GDriveStorage,
) *PhotoService {
	return &PhotoService{
		photoRepo:   photoRepo,
		sessionRepo: sessionRepo,
		storage:     s3,
		gdrive:      gdrive,
		broker:      events.GetBroker(),
	}
}

func (s *PhotoService) RequestPresignedUpload(
	ctx context.Context,
	sessionID, deviceID, filename, format string,
	sizeBytes int64,
	sha256Hash string,
	storageProvider string,
) (*PresignedUploadResult, error) {
	if storageProvider == "" {
		storageProvider = "google_drive" // Default cloud destination as requested!
	}

	// 1. Deduplication check (same hash in session)
	existing, err := s.photoRepo.FindByHash(ctx, sessionID, sha256Hash)
	if err == nil && existing != nil {
		log.Printf("[PhotoService] Deduplication match: file %s with hash %s already exists in session %s", filename, sha256Hash[:8], sessionID)
		return &PresignedUploadResult{
			PhotoID:         existing.ID,
			UploadTaskID:    uuid.New().String(),
			PresignedURL:    "",
			S3Key:           existing.S3KeyOriginal,
			StorageProvider: existing.StorageProvider,
			AlreadyUploaded: true,
		}, nil
	}

	photoID := uuid.New().String()
	uploadTaskID := uuid.New().String()

	var uploadURL string
	var storageKey string
	var gdriveFolderID string

	if storageProvider == "google_drive" {
		// Resolve session title for folder creation
		sessionTitle := sessionID
		if s.sessionRepo != nil {
			if sess, err := s.sessionRepo.GetByID(ctx, sessionID); err == nil && sess != nil {
				sessionTitle = sess.Title
			}
		}

		// A. Get or create session folder in Google Drive
		folderID, err := s.gdrive.GetOrCreateSessionFolder(ctx, sessionID, sessionTitle)
		if err != nil {
			return nil, fmt.Errorf("failed resolving Google Drive session folder: %w", err)
		}
		gdriveFolderID = folderID

		// B. Initiate Google Drive Resumable Upload session
		resumableURL, err := s.gdrive.InitiateResumableUpload(
			ctx, folderID, filename, format, sizeBytes, sha256Hash, deviceID,
		)
		if err != nil {
			return nil, fmt.Errorf("failed initiating Google Drive upload session: %w", err)
		}

		uploadURL = resumableURL
		storageKey = fmt.Sprintf("google_drive://%s/%s", folderID, filename)
		log.Printf("[PhotoService] Created Google Drive upload session for '%s' in folder '%s'", filename, folderID)
	} else {
		// S3 Presigned PUT URL
		s3Key := fmt.Sprintf("sessions/%s/originals/%s_%s", sessionID, photoID[:8], filename)
		presignedURL, err := s.storage.GeneratePresignedPutURL(s3Key, 30*time.Minute)
		if err != nil {
			return nil, fmt.Errorf("failed generating presigned url: %w", err)
		}
		uploadURL = presignedURL
		storageKey = s3Key
	}

	// 2. Save queued record in database
	photo := &models.Photo{
		ID:               photoID,
		SessionID:        sessionID,
		DeviceID:         &deviceID,
		OriginalFilename: filename,
		FileFormat:       format,
		FileSizeBytes:    sizeBytes,
		SHA256Hash:       sha256Hash,
		S3Bucket:         storageProvider,
		S3KeyOriginal:    storageKey,
		StorageProvider:  storageProvider,
		UploadStatus:     "uploading",
	}

	if err := s.photoRepo.Create(ctx, photo); err != nil {
		return nil, fmt.Errorf("failed storing photo record: %w", err)
	}

	// Broadcast upload started event to connected dashboards
	s.broker.Broadcast(events.EventPhotoUploading, map[string]interface{}{
		"photo_id":          photoID,
		"session_id":        sessionID,
		"original_filename": filename,
		"file_size_bytes":   sizeBytes,
		"format":            format,
		"sha256_hash":       sha256Hash,
		"storage_provider":  storageProvider,
		"status":            "uploading",
		"timestamp":         time.Now(),
	})

	return &PresignedUploadResult{
		PhotoID:         photoID,
		UploadTaskID:    uploadTaskID,
		PresignedURL:    uploadURL,
		S3Key:           storageKey,
		StorageProvider: storageProvider,
		GDriveFolderID:  gdriveFolderID,
		AlreadyUploaded: false,
	}, nil
}

func (s *PhotoService) ConfirmUpload(ctx context.Context, p *models.Photo) error {
	if err := s.photoRepo.UpdateEXIF(ctx, p); err != nil {
		return err
	}

	// Fetch updated record to broadcast
	updated, err := s.photoRepo.GetByID(ctx, p.ID)
	if err == nil {
		s.broker.Broadcast(events.EventPhotoCompleted, updated)
	}

	log.Printf("[PhotoService] Confirmed upload for photo %s (Provider: %s)", p.ID, p.StorageProvider)
	return nil
}

func (s *PhotoService) ListPhotos(ctx context.Context, sessionID string, limit, offset int) ([]models.Photo, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	return s.photoRepo.ListBySession(ctx, sessionID, limit, offset)
}

func (s *PhotoService) GetStorage() *storage.S3Storage {
	return s.storage
}

func (s *PhotoService) GetGDriveStorage() *storage.GDriveStorage {
	return s.gdrive
}

func (s *PhotoService) UploadFastPreview(
	ctx context.Context,
	sessionID, deviceID, filename, format string,
	sizeBytes int64,
	sha256Hash string,
	previewBytes []byte,
	cameraMake, cameraModel, lensModel, shutter string,
	iso int,
	focalLength, aperture float64,
) (*models.Photo, error) {
	// 1. Ensure preview directory exists
	previewDir := filepath.Join(".c2c_storage", "previews", sessionID)
	if err := os.MkdirAll(previewDir, 0755); err != nil {
		return nil, fmt.Errorf("failed creating preview directory: %w", err)
	}

	// 2. Write preview file
	previewFilename := fmt.Sprintf("%s.jpg", sha256Hash[:16])
	previewPath := filepath.Join(previewDir, previewFilename)
	if err := os.WriteFile(previewPath, previewBytes, 0644); err != nil {
		return nil, fmt.Errorf("failed saving preview image: %w", err)
	}

	previewURL := fmt.Sprintf("/api/v1/previews/%s/%s", sessionID, previewFilename)

	// 3. Check if photo already exists by hash
	existing, err := s.photoRepo.FindByHash(ctx, sessionID, sha256Hash)
	if err == nil && existing != nil {
		_ = s.photoRepo.UpdatePreview(ctx, existing.ID, previewURL)
		updated, _ := s.photoRepo.GetByID(ctx, existing.ID)
		if updated != nil {
			s.broker.Broadcast(events.EventPhotoPreviewReady, updated)
			return updated, nil
		}
		return existing, nil
	}

	// 4. Create new photo record with preview_ready status
	photoID := uuid.New().String()
	if iso <= 0 {
		iso = 100
	}
	if shutter == "" {
		shutter = "1/500s"
	}
	if aperture <= 0 {
		aperture = 2.8
	}

	photo := &models.Photo{
		ID:               photoID,
		SessionID:        sessionID,
		DeviceID:         &deviceID,
		OriginalFilename: filename,
		FileFormat:       format,
		FileSizeBytes:    sizeBytes,
		SHA256Hash:       sha256Hash,
		S3Bucket:         "google_drive",
		S3KeyOriginal:    fmt.Sprintf("google_drive://%s/%s", sessionID, filename),
		StorageProvider:  "google_drive",
		PreviewURL:       &previewURL,
		ThumbnailURL:     &previewURL,
		CameraMake:       &cameraMake,
		CameraModel:      &cameraModel,
		LensModel:        &lensModel,
		FocalLengthMm:    &focalLength,
		ApertureFStop:    &aperture,
		ShutterSpeedStr:  &shutter,
		ISOSpeed:         &iso,
		UploadStatus:     "preview_ready",
	}

	if err := s.photoRepo.Create(ctx, photo); err != nil {
		return nil, fmt.Errorf("failed creating photo for preview: %w", err)
	}

	// 5. Broadcast instant preview ready event to all connected dashboards
	s.broker.Broadcast(events.EventPhotoPreviewReady, photo)
	log.Printf("[PhotoService] Fast preview ready in <1s for '%s' (Preview URL: %s)", filename, previewURL)

	return photo, nil
}

type ProofingStats struct {
	TotalCount    int     `json:"total_count"`
	PickedCount   int     `json:"picked_count"`
	RatedCount    int     `json:"rated_count"`
	AverageRating float64 `json:"average_rating"`
}

type ProofingSessionData struct {
	Session *models.ShootSession `json:"session"`
	Photos  []models.Photo       `json:"photos"`
	Stats   ProofingStats        `json:"stats"`
}

func (s *PhotoService) UpdateRating(ctx context.Context, photoID string, rating int, isPicked bool, feedback string) (*models.Photo, error) {
	if rating < 0 {
		rating = 0
	}
	if rating > 5 {
		rating = 5
	}

	updated, err := s.photoRepo.UpdateRating(ctx, photoID, rating, isPicked, feedback)
	if err != nil {
		return nil, err
	}

	// Broadcast live rating update to all connected dashboards and client proofing viewers
	s.broker.Broadcast(events.EventPhotoRatingUpdated, updated)
	log.Printf("[PhotoService] Rating updated for photo %s (Rating: %d, Picked: %v)", photoID, rating, isPicked)

	return updated, nil
}

func (s *PhotoService) GetProofingData(ctx context.Context, sessionIDOrToken string) (*ProofingSessionData, error) {
	var session *models.ShootSession

	// 1. Resolve session by ID
	if s.sessionRepo != nil {
		sess, err := s.sessionRepo.GetByID(ctx, sessionIDOrToken)
		if err == nil && sess != nil {
			session = sess
		} else {
			// Try by share token or scan list
			sessions, _ := s.sessionRepo.List(ctx, "")
			for _, item := range sessions {
				if item.ShareToken == sessionIDOrToken || item.ID == sessionIDOrToken {
					cp := item
					session = &cp
					break
				}
			}
		}
	}

	if session == nil {
		// Fallback session object
		session = &models.ShootSession{
			ID:           sessionIDOrToken,
			ProjectID:    "proj-default",
			Title:        "Client Proofing Session",
			SessionDate:  time.Now().Format("2006-01-02"),
			Location:     "Studio Set",
			IsLive:       true,
			ClientName:   "Client / Art Director",
			Photographer: "Lead Photographer",
		}
	}

	// 2. Fetch photos for this session
	photos, err := s.photoRepo.ListBySession(ctx, session.ID, 200, 0)
	if err != nil {
		photos = []models.Photo{}
	}

	// 3. Compute proofing stats
	stats := ProofingStats{
		TotalCount: len(photos),
	}
	var totalRatingSum int
	for _, p := range photos {
		if p.IsPicked {
			stats.PickedCount++
		}
		if p.Rating > 0 {
			stats.RatedCount++
			totalRatingSum += p.Rating
		}
	}
	if stats.RatedCount > 0 {
		stats.AverageRating = float64(totalRatingSum) / float64(stats.RatedCount)
	}

	return &ProofingSessionData{
		Session: session,
		Photos:  photos,
		Stats:   stats,
	}, nil
}


