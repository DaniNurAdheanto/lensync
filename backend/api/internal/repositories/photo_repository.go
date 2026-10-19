package repositories

import (
	"context"
	"database/sql"

	"github.com/c2c/api/internal/models"
)

type PhotoRepository interface {
	Create(ctx context.Context, p *models.Photo) error
	GetByID(ctx context.Context, id string) (*models.Photo, error)
	FindByHash(ctx context.Context, sessionID, hash string) (*models.Photo, error)
	ListBySession(ctx context.Context, sessionID string, limit, offset int) ([]models.Photo, error)
	UpdateStatus(ctx context.Context, photoID, status string) error
	UpdateEXIF(ctx context.Context, p *models.Photo) error
	UpdatePreview(ctx context.Context, photoID, previewURL string) error
	UpdateRating(ctx context.Context, photoID string, rating int, isPicked bool, feedback string) (*models.Photo, error)
}

type PostgresPhotoRepo struct {
	db *sql.DB
}

func NewPostgresPhotoRepo(db *sql.DB) *PostgresPhotoRepo {
	return &PostgresPhotoRepo{db: db}
}

func (r *PostgresPhotoRepo) Create(ctx context.Context, p *models.Photo) error {
	query := `
		INSERT INTO photos (
			id, session_id, device_id, original_filename, file_format,
			file_size_bytes, sha256_hash, s3_bucket, s3_key_original,
			upload_status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
		RETURNING id;
	`
	return r.db.QueryRowContext(
		ctx, query,
		p.ID, p.SessionID, p.DeviceID, p.OriginalFilename, p.FileFormat,
		p.FileSizeBytes, p.SHA256Hash, p.S3Bucket, p.S3KeyOriginal,
		p.UploadStatus,
	).Scan(&p.ID)
}

func (r *PostgresPhotoRepo) FindByHash(ctx context.Context, sessionID, hash string) (*models.Photo, error) {
	query := `
		SELECT id, session_id, original_filename, file_format, file_size_bytes,
		       sha256_hash, s3_bucket, s3_key_original, upload_status, created_at
		FROM photos
		WHERE session_id = $1 AND sha256_hash = $2
		LIMIT 1;
	`
	var p models.Photo
	err := r.db.QueryRowContext(ctx, query, sessionID, hash).Scan(
		&p.ID, &p.SessionID, &p.OriginalFilename, &p.FileFormat, &p.FileSizeBytes,
		&p.SHA256Hash, &p.S3Bucket, &p.S3KeyOriginal, &p.UploadStatus, &p.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PostgresPhotoRepo) GetByID(ctx context.Context, id string) (*models.Photo, error) {
	query := `
		SELECT id, session_id, original_filename, file_format, file_size_bytes,
		       sha256_hash, s3_bucket, s3_key_original, upload_status, created_at
		FROM photos WHERE id = $1;
	`
	var p models.Photo
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&p.ID, &p.SessionID, &p.OriginalFilename, &p.FileFormat, &p.FileSizeBytes,
		&p.SHA256Hash, &p.S3Bucket, &p.S3KeyOriginal, &p.UploadStatus, &p.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PostgresPhotoRepo) ListBySession(ctx context.Context, sessionID string, limit, offset int) ([]models.Photo, error) {
	query := `
		SELECT id, session_id, original_filename, file_format, file_size_bytes,
		       sha256_hash, s3_bucket, s3_key_original, upload_status, created_at
		FROM photos
		WHERE ($1 = '' OR session_id::text = $1)
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3;
	`
	rows, err := r.db.QueryContext(ctx, query, sessionID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var photos []models.Photo
	for rows.Next() {
		var p models.Photo
		if err := rows.Scan(
			&p.ID, &p.SessionID, &p.OriginalFilename, &p.FileFormat, &p.FileSizeBytes,
			&p.SHA256Hash, &p.S3Bucket, &p.S3KeyOriginal, &p.UploadStatus, &p.CreatedAt,
		); err != nil {
			return nil, err
		}
		photos = append(photos, p)
	}
	return photos, nil
}

func (r *PostgresPhotoRepo) UpdateStatus(ctx context.Context, photoID, status string) error {
	query := `UPDATE photos SET upload_status = $1, updated_at = NOW() WHERE id = $2;`
	_, err := r.db.ExecContext(ctx, query, status, photoID)
	return err
}

func (r *PostgresPhotoRepo) UpdateEXIF(ctx context.Context, p *models.Photo) error {
	query := `
		UPDATE photos
		SET camera_make = $1, camera_model = $2, lens_model = $3,
		    iso_speed = $4, shutter_speed_str = $5, aperture_f_stop = $6,
		    upload_status = 'completed', uploaded_at = NOW(), updated_at = NOW()
		WHERE id = $7;
	`
	_, err := r.db.ExecContext(
		ctx, query,
		p.CameraMake, p.CameraModel, p.LensModel,
		p.ISOSpeed, p.ShutterSpeedStr, p.ApertureFStop,
		p.ID,
	)
	return err
}

func (r *PostgresPhotoRepo) UpdatePreview(ctx context.Context, photoID, previewURL string) error {
	query := `UPDATE photos SET preview_url = $1, upload_status = 'preview_ready', updated_at = NOW() WHERE id = $2;`
	_, err := r.db.ExecContext(ctx, query, previewURL, photoID)
	return err
}

func (r *PostgresPhotoRepo) UpdateRating(ctx context.Context, photoID string, rating int, isPicked bool, feedback string) (*models.Photo, error) {
	query := `UPDATE photos SET rating = $1, is_picked = $2, client_feedback = $3, rated_at = NOW(), updated_at = NOW() WHERE id = $4 RETURNING id;`
	var id string
	err := r.db.QueryRowContext(ctx, query, rating, isPicked, feedback, photoID).Scan(&id)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, photoID)
}


