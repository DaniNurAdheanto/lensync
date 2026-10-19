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
			PreviewURL:       stringPtr("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=85"),
			ThumbnailURL:     stringPtr("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80"),
			UploadStatus:     "completed",
			CameraMake:       stringPtr("Sony"),
			CameraModel:      stringPtr("ILCE-7M4 (α7 IV)"),
			LensModel:        stringPtr("FE 24-70mm F2.8 GM II"),
			FocalLengthMm:    float64Ptr(50.0),
			ApertureFStop:    float64Ptr(2.8),
			ShutterSpeedStr:  stringPtr("1/500s"),
			ISOSpeed:         intPtr(100),
			Rating:           0,
			IsPicked:         false,
			ClientFeedback:   "",
			CreatedAt:        time.Now().Add(-15 * time.Minute),
			UpdatedAt:        time.Now().Add(-15 * time.Minute),
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
			PreviewURL:       stringPtr("https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=85"),
			ThumbnailURL:     stringPtr("https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80"),
			UploadStatus:     "completed",
			CameraMake:       stringPtr("Sony"),
			CameraModel:      stringPtr("ILCE-7M4 (α7 IV)"),
			LensModel:        stringPtr("FE 24-70mm F2.8 GM II"),
			FocalLengthMm:    float64Ptr(70.0),
			ApertureFStop:    float64Ptr(2.8),
			ShutterSpeedStr:  stringPtr("1/500s"),
			ISOSpeed:         intPtr(100),
			Rating:           5,
			IsPicked:         true,
			ClientFeedback:   "Sangat tajam, warna kulit natural. Kandidat utama cover look.",
			CreatedAt:        time.Now().Add(-12 * time.Minute),
			UpdatedAt:        time.Now().Add(-5 * time.Minute),
		},
		{
			ID:               "ph-sample-003",
			SessionID:        "session-pfw-2026",
			OriginalFilename: "DSC_0014.ARW",
			FileFormat:       "RAW_ARW",
			FileSizeBytes:    48234496,
			SHA256Hash:       "b2c3d4e5f6a10718293a4b5c6d7e8f90123456789abcdef0123456789abcdef1",
			S3Bucket:         "c2c-photos",
			S3KeyOriginal:    "sessions/session-pfw-2026/originals/ph-sample-003_DSC_0014.ARW",
			PreviewURL:       stringPtr("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=85"),
			ThumbnailURL:     stringPtr("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80"),
			UploadStatus:     "completed",
			CameraMake:       stringPtr("Sony"),
			CameraModel:      stringPtr("ILCE-7M4 (α7 IV)"),
			LensModel:        stringPtr("FE 35mm F1.4 GM"),
			FocalLengthMm:    float64Ptr(35.0),
			ApertureFStop:    float64Ptr(1.8),
			ShutterSpeedStr:  stringPtr("1/800s"),
			ISOSpeed:         intPtr(125),
			Rating:           4,
			IsPicked:         true,
			ClientFeedback:   "Siluet pakaian tampak elegan dan dramatis saat model bergerak.",
			CreatedAt:        time.Now().Add(-9 * time.Minute),
			UpdatedAt:        time.Now().Add(-4 * time.Minute),
		},
		{
			ID:               "ph-sample-004",
			SessionID:        "session-pfw-2026",
			OriginalFilename: "DSC_0015.ARW",
			FileFormat:       "RAW_ARW",
			FileSizeBytes:    52841024,
			SHA256Hash:       "c3d4e5f6a1b20718293a4b5c6d7e8f90123456789abcdef0123456789abcdef2",
			S3Bucket:         "c2c-photos",
			S3KeyOriginal:    "sessions/session-pfw-2026/originals/ph-sample-004_DSC_0015.ARW",
			PreviewURL:       stringPtr("https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=85"),
			ThumbnailURL:     stringPtr("https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=600&q=80"),
			UploadStatus:     "completed",
			CameraMake:       stringPtr("Sony"),
			CameraModel:      stringPtr("ILCE-7M4 (α7 IV)"),
			LensModel:        stringPtr("FE 85mm F1.4 GM"),
			FocalLengthMm:    float64Ptr(85.0),
			ApertureFStop:    float64Ptr(1.4),
			ShutterSpeedStr:  stringPtr("1/1000s"),
			ISOSpeed:         intPtr(100),
			Rating:           5,
			IsPicked:         false,
			ClientFeedback:   "Bokeh dan kontras pencahayaan luar biasa!",
			CreatedAt:        time.Now().Add(-6 * time.Minute),
			UpdatedAt:        time.Now().Add(-2 * time.Minute),
		},
		{
			ID:               "ph-sample-005",
			SessionID:        "session-pfw-2026",
			OriginalFilename: "DSC_0016.JPG",
			FileFormat:       "JPEG",
			FileSizeBytes:    14520980,
			SHA256Hash:       "d4e5f6a1b2c30718293a4b5c6d7e8f90123456789abcdef0123456789abcdef3",
			S3Bucket:         "c2c-photos",
			S3KeyOriginal:    "sessions/session-pfw-2026/originals/ph-sample-005_DSC_0016.JPG",
			PreviewURL:       stringPtr("https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=85"),
			ThumbnailURL:     stringPtr("https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80"),
			UploadStatus:     "completed",
			CameraMake:       stringPtr("Sony"),
			CameraModel:      stringPtr("ILCE-7M4 (α7 IV)"),
			LensModel:        stringPtr("FE 24-70mm F2.8 GM II"),
			FocalLengthMm:    float64Ptr(24.0),
			ApertureFStop:    float64Ptr(2.8),
			ShutterSpeedStr:  stringPtr("1/400s"),
			ISOSpeed:         intPtr(200),
			Rating:           0,
			IsPicked:         false,
			ClientFeedback:   "",
			CreatedAt:        time.Now().Add(-3 * time.Minute),
			UpdatedAt:        time.Now().Add(-3 * time.Minute),
		},
		{
			ID:               "ph-sample-006",
			SessionID:        "session-pfw-2026",
			OriginalFilename: "DSC_0017.ARW",
			FileFormat:       "RAW_ARW",
			FileSizeBytes:    51120400,
			SHA256Hash:       "e5f6a1b2c3d40718293a4b5c6d7e8f90123456789abcdef0123456789abcdef4",
			S3Bucket:         "c2c-photos",
			S3KeyOriginal:    "sessions/session-pfw-2026/originals/ph-sample-006_DSC_0017.ARW",
			PreviewURL:       stringPtr("https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1600&q=85"),
			ThumbnailURL:     stringPtr("https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=600&q=80"),
			UploadStatus:     "completed",
			CameraMake:       stringPtr("Sony"),
			CameraModel:      stringPtr("ILCE-7M4 (α7 IV)"),
			LensModel:        stringPtr("FE 50mm F1.2 GM"),
			FocalLengthMm:    float64Ptr(50.0),
			ApertureFStop:    float64Ptr(1.4),
			ShutterSpeedStr:  stringPtr("1/640s"),
			ISOSpeed:         intPtr(100),
			Rating:           4,
			IsPicked:         false,
			ClientFeedback:   "",
			CreatedAt:        time.Now().Add(-1 * time.Minute),
			UpdatedAt:        time.Now().Add(-1 * time.Minute),
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

func (r *MemoryPhotoRepo) UpdateRating(ctx context.Context, photoID string, rating int, isPicked bool, feedback string) (*models.Photo, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	p, exists := r.photos[photoID]
	if !exists {
		return nil, fmt.Errorf("photo %s not found", photoID)
	}

	now := time.Now()
	p.Rating = rating
	p.IsPicked = isPicked
	p.ClientFeedback = feedback
	p.RatedAt = &now
	p.UpdatedAt = now

	cp := *p
	return &cp, nil
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
		ID:           "session-pfw-2026",
		ProjectID:    "proj-pfw-2026",
		Title:        "Paris Fashion Week Runway Shoot",
		SessionDate:  "2026-10-19",
		Location:     "Grand Palais Éphémère, Paris",
		IsLive:       true,
		ShareToken:   "proof-pfw2026-live",
		ClientName:   "Maison Haute Couture / Vogue Paris",
		Photographer: "Dani Nur Adheanto",
		CreatedAt:    time.Now().Add(-1 * time.Hour),
		UpdatedAt:    time.Now(),
	}
	s2 := &models.ShootSession{
		ID:           "session-studio-portrait",
		ProjectID:    "proj-vogue-editorial",
		Title:        "Vogue Cover Editorial Studio A",
		SessionDate:  "2026-10-18",
		Location:     "Studio 4B, Milan",
		IsLive:       false,
		ShareToken:   "proof-vogue-milan",
		ClientName:   "Vogue Italia Editorial",
		Photographer: "Alexander Wright",
		CreatedAt:    time.Now().Add(-24 * time.Hour),
		UpdatedAt:    time.Now().Add(-20 * time.Hour),
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
