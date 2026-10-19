package repositories

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/c2c/api/internal/models"
)

// MemoryPhotoRepo provides an in-memory thread-safe implementation of PhotoRepository.
// Used for local development and detached mode when PostgreSQL is not running.
type MemoryPhotoRepo struct {
	mu     sync.RWMutex
	photos map[string]*models.Photo
}

func NewMemoryPhotoRepo() *MemoryPhotoRepo {
	repo := &MemoryPhotoRepo{
		photos: make(map[string]*models.Photo),
	}
	repo.seedInitialPhotos()
	return repo
}

func (r *MemoryPhotoRepo) seedInitialPhotos() {
	samplePhotos := []models.Photo{
		{
			ID:               "ph-sample-001",
			SessionID:        "session-pfw-2026",
			OriginalFilename: "DSC_0012.ARW",
			FileFormat:       "RAW_ARW",
			FileSizeBytes:    50541312,
			SHA256Hash:       "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			S3Bucket:         "c2c-photos",
			S3KeyOriginal:    "sessions/session-pfw-2026/originals/ph-sample-001_DSC_0012.ARW",
			UploadStatus:     "completed",
			CameraMake:       stringPtr("Sony"),
			CameraModel:      stringPtr("ILCE-7M4 (α7 IV)"),
			LensModel:        stringPtr("FE 24-70mm F2.8 GM II"),
			FocalLengthMm:    float64Ptr(50.0),
			ApertureFStop:    float64Ptr(2.8),
			ShutterSpeedStr:  stringPtr("1/500s"),
			ISOSpeed:         intPtr(100),
			CreatedAt:        time.Now().Add(-10 * time.Minute),
			UpdatedAt:        time.Now().Add(-10 * time.Minute),
		},
		{
			ID:               "ph-sample-002",
			SessionID:        "session-pfw-2026",
			OriginalFilename: "DSC_0013.JPG",
			FileFormat:       "JPEG",
			FileSizeBytes:    13002340,
			SHA256Hash:       "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
			S3Bucket:         "c2c-photos",
			S3KeyOriginal:    "sessions/session-pfw-2026/originals/ph-sample-002_DSC_0013.JPG",
			UploadStatus:     "completed",
			CameraMake:       stringPtr("Sony"),
			CameraModel:      stringPtr("ILCE-7M4 (α7 IV)"),
			LensModel:        stringPtr("FE 24-70mm F2.8 GM II"),
			FocalLengthMm:    float64Ptr(70.0),
			ApertureFStop:    float64Ptr(2.8),
			ShutterSpeedStr:  stringPtr("1/500s"),
			ISOSpeed:         intPtr(100),
			CreatedAt:        time.Now().Add(-9 * time.Minute),
			UpdatedAt:        time.Now().Add(-9 * time.Minute),
		},
	}

	for _, p := range samplePhotos {
		cp := p
		r.photos[cp.ID] = &cp
	}
}

func (r *MemoryPhotoRepo) Create(ctx context.Context, p *models.Photo) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	cp := *p
	r.photos[p.ID] = &cp
	return nil
}

func (r *MemoryPhotoRepo) GetByID(ctx context.Context, id string) (*models.Photo, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	p, exists := r.photos[id]
	if !exists {
		return nil, fmt.Errorf("photo with id %s not found", id)
	}
	cp := *p
	return &cp, nil
}

func (r *MemoryPhotoRepo) FindByHash(ctx context.Context, sessionID, hash string) (*models.Photo, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, p := range r.photos {
		if p.SessionID == sessionID && p.SHA256Hash == hash {
			cp := *p
			return &cp, nil
		}
	}
	return nil, fmt.Errorf("photo with hash %s not found in session %s", hash, sessionID)
}

func (r *MemoryPhotoRepo) ListBySession(ctx context.Context, sessionID string, limit, offset int) ([]models.Photo, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.Photo
	for _, p := range r.photos {
		if sessionID == "" || p.SessionID == sessionID {
			result = append(result, *p)
		}
	}

	// Sort newest first
	for i := 0; i < len(result)-1; i++ {
		for j := i + 1; j < len(result); j++ {
			if result[j].CreatedAt.After(result[i].CreatedAt) {
				result[i], result[j] = result[j], result[i]
			}
		}
	}

	if offset >= len(result) {
		return []models.Photo{}, nil
	}
	end := offset + limit
	if end > len(result) {
		end = len(result)
	}

	return result[offset:end], nil
}

func (r *MemoryPhotoRepo) UpdateStatus(ctx context.Context, photoID, status string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	p, exists := r.photos[photoID]
	if !exists {
		return fmt.Errorf("photo %s not found", photoID)
	}
	p.UploadStatus = status
	p.UpdatedAt = time.Now()
	return nil
}

func (r *MemoryPhotoRepo) UpdateEXIF(ctx context.Context, p *models.Photo) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	existing, exists := r.photos[p.ID]
	if !exists {
		return fmt.Errorf("photo %s not found", p.ID)
	}

	if p.CameraMake != nil {
		existing.CameraMake = p.CameraMake
	}
	if p.CameraModel != nil {
		existing.CameraModel = p.CameraModel
	}
	if p.LensModel != nil {
		existing.LensModel = p.LensModel
	}
	if p.FocalLengthMm != nil {
		existing.FocalLengthMm = p.FocalLengthMm
	}
	if p.ApertureFStop != nil {
		existing.ApertureFStop = p.ApertureFStop
	}
	if p.ShutterSpeedStr != nil {
		existing.ShutterSpeedStr = p.ShutterSpeedStr
	}
	if p.ISOSpeed != nil {
		existing.ISOSpeed = p.ISOSpeed
	}
	if p.StorageProvider != "" {
		existing.StorageProvider = p.StorageProvider
	}
	if p.GDriveFileID != nil {
		existing.GDriveFileID = p.GDriveFileID
	}
	if p.GDriveViewLink != nil {
		existing.GDriveViewLink = p.GDriveViewLink
	}
	if p.PreviewURL != nil {
		existing.PreviewURL = p.PreviewURL
	}
	existing.UploadStatus = "completed"
	existing.UpdatedAt = time.Now()
	return nil
}

func (r *MemoryPhotoRepo) UpdatePreview(ctx context.Context, photoID, previewURL string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	p, exists := r.photos[photoID]
	if !exists {
		return fmt.Errorf("photo %s not found", photoID)
	}
	p.PreviewURL = &previewURL
	if p.UploadStatus != "completed" {
		p.UploadStatus = "preview_ready"
	}
	p.UpdatedAt = time.Now()
	return nil
}


// MemorySessionRepo provides an in-memory thread-safe implementation of SessionRepository.
type MemorySessionRepo struct {
	mu       sync.RWMutex
	sessions map[string]*models.ShootSession
}

func NewMemorySessionRepo() *MemorySessionRepo {
	repo := &MemorySessionRepo{
		sessions: make(map[string]*models.ShootSession),
	}
	repo.seedInitialSessions()
	return repo
}

func (r *MemorySessionRepo) seedInitialSessions() {
	s1 := &models.ShootSession{
		ID:          "session-pfw-2026",
		ProjectID:   "proj-pfw-2026",
		Title:       "Paris Fashion Week Runway Shoot",
		SessionDate: "2026-10-19",
		Location:    "Grand Palais Éphémère, Paris",
		IsLive:      true,
		CreatedAt:   time.Now().Add(-1 * time.Hour),
		UpdatedAt:   time.Now(),
	}
	s2 := &models.ShootSession{
		ID:          "session-studio-portrait",
		ProjectID:   "proj-vogue-editorial",
		Title:       "Vogue Cover Editorial Studio A",
		SessionDate: "2026-10-18",
		Location:    "Studio 4B, Milan",
		IsLive:      false,
		CreatedAt:   time.Now().Add(-24 * time.Hour),
		UpdatedAt:   time.Now().Add(-20 * time.Hour),
	}

	r.sessions[s1.ID] = s1
	r.sessions[s2.ID] = s2
}

func (r *MemorySessionRepo) Create(ctx context.Context, s *models.ShootSession) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	s.CreatedAt = time.Now()
	s.UpdatedAt = time.Now()
	cp := *s
	r.sessions[s.ID] = &cp
	return nil
}

func (r *MemorySessionRepo) GetByID(ctx context.Context, id string) (*models.ShootSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	s, exists := r.sessions[id]
	if !exists {
		return nil, fmt.Errorf("session %s not found", id)
	}
	cp := *s
	return &cp, nil
}

func (r *MemorySessionRepo) List(ctx context.Context, projectID string) ([]models.ShootSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.ShootSession
	for _, s := range r.sessions {
		if projectID == "" || s.ProjectID == projectID {
			result = append(result, *s)
		}
	}

	// Sort newest first
	for i := 0; i < len(result)-1; i++ {
		for j := i + 1; j < len(result); j++ {
			if result[j].CreatedAt.After(result[i].CreatedAt) {
				result[i], result[j] = result[j], result[i]
			}
		}
	}

	return result, nil
}

func stringPtr(s string) *string       { return &s }
func float64Ptr(f float64) *float64   { return &f }
func intPtr(i int) *int               { return &i }
