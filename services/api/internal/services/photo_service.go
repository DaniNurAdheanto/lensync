package services

import (
	"context"
	"fmt"
	"time"

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
	AlreadyUploaded bool   `json:"already_uploaded"`
}

type PhotoService struct {
	photoRepo repositories.PhotoRepository
	storage   *storage.S3Storage
}

func NewPhotoService(repo repositories.PhotoRepository, s3 *storage.S3Storage) *PhotoService {
	return &PhotoService{
		photoRepo: repo,
		storage:   s3,
	}
}

func (s *PhotoService) RequestPresignedUpload(ctx context.Context, sessionID, deviceID, filename, format string, sizeBytes int64, sha256Hash string) (*PresignedUploadResult, error) {
	// 1. Check for deduplication (same hash in session)
	existing, err := s.photoRepo.FindByHash(ctx, sessionID, sha256Hash)
	if err == nil && existing != nil {
		return &PresignedUploadResult{
			PhotoID:         existing.ID,
			UploadTaskID:    uuid.New().String(),
			PresignedURL:    "",
			S3Key:           existing.S3KeyOriginal,
			AlreadyUploaded: true,
		}, nil
	}

	photoID := uuid.New().String()
	uploadTaskID := uuid.New().String()

	// 2. Generate S3 storage path: sessions/<sessionID>/originals/<photoID>_<filename>
	s3Key := fmt.Sprintf("sessions/%s/originals/%s_%s", sessionID, photoID[:8], filename)

	// 3. Generate presigned PUT URL valid for 30 minutes
	presignedURL, err := s.storage.GeneratePresignedPutURL(s3Key, 30*time.Minute)
	if err != nil {
		return nil, fmt.Errorf("failed generating presigned url: %w", err)
	}

	// 4. Save queued record in database
	photo := &models.Photo{
		ID:               photoID,
		SessionID:        sessionID,
		DeviceID:         &deviceID,
		OriginalFilename: filename,
		FileFormat:       format,
		FileSizeBytes:    sizeBytes,
		SHA256Hash:       sha256Hash,
		S3Bucket:         s.storage.GetBucketName(),
		S3KeyOriginal:    s3Key,
		UploadStatus:     "queued",
	}

	if err := s.photoRepo.Create(ctx, photo); err != nil {
		return nil, fmt.Errorf("failed storing photo record: %w", err)
	}

	return &PresignedUploadResult{
		PhotoID:         photoID,
		UploadTaskID:    uploadTaskID,
		PresignedURL:    presignedURL,
		S3Key:           s3Key,
		AlreadyUploaded: false,
	}, nil
}

func (s *PhotoService) ConfirmUpload(ctx context.Context, p *models.Photo) error {
	return s.photoRepo.UpdateEXIF(ctx, p)
}

func (s *PhotoService) ListPhotos(ctx context.Context, sessionID string, limit, offset int) ([]models.Photo, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	return s.photoRepo.ListBySession(ctx, sessionID, limit, offset)
}
