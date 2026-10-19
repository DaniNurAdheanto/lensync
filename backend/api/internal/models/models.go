package models

import (
	"time"
)

type UserRole string

const (
	RoleAdmin        UserRole = "admin"
	RolePhotographer UserRole = "photographer"
	RoleAssistant    UserRole = "assistant"
	RoleClient       UserRole = "client"
	RoleEditor       UserRole = "editor"
)

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FullName     string    `json:"full_name"`
	Role         UserRole  `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Project struct {
	ID                  string    `json:"id"`
	Name                string    `json:"name"`
	ClientName          string    `json:"client_name,omitempty"`
	Description         string    `json:"description,omitempty"`
	OwnerID             string    `json:"owner_id"`
	StorageFolderPrefix string    `json:"storage_folder_prefix"`
	IsActive            bool      `json:"is_active"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

type ShootSession struct {
	ID          string    `json:"id"`
	ProjectID   string    `json:"project_id"`
	Title       string    `json:"title"`
	SessionDate string    `json:"session_date"`
	Location    string    `json:"location,omitempty"`
	IsLive      bool      `json:"is_live"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Device struct {
	ID               string     `json:"id"`
	DeviceUID        string     `json:"device_uid"`
	Name             string     `json:"name"`
	DeviceType       string     `json:"device_type"`
	ModelName        string     `json:"model_name,omitempty"`
	SerialNumber     string     `json:"serial_number,omitempty"`
	Status           string     `json:"status"`
	AgentVersion     string     `json:"agent_version,omitempty"`
	LastHeartbeat    *time.Time `json:"last_heartbeat,omitempty"`
	CurrentSessionID *string    `json:"current_session_id,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type Photo struct {
	ID               string     `json:"id"`
	SessionID        string     `json:"session_id"`
	DeviceID         *string    `json:"device_id,omitempty"`
	OriginalFilename string     `json:"original_filename"`
	FileFormat       string     `json:"file_format"`
	FileSizeBytes    int64      `json:"file_size_bytes"`
	SHA256Hash       string     `json:"sha256_hash"`
	S3Bucket         string     `json:"s3_bucket"`
	S3KeyOriginal    string     `json:"s3_key_original"`
	S3KeyPreview     *string    `json:"s3_key_preview,omitempty"`
	S3KeyThumbnail   *string    `json:"s3_key_thumbnail,omitempty"`
	CameraMake       *string    `json:"camera_make,omitempty"`
	CameraModel      *string    `json:"camera_model,omitempty"`
	LensModel        *string    `json:"lens_model,omitempty"`
	FocalLengthMm    *float64   `json:"focal_length_mm,omitempty"`
	ApertureFStop    *float64   `json:"aperture_f_stop,omitempty"`
	ShutterSpeedStr  *string    `json:"shutter_speed_str,omitempty"`
	ISOSpeed         *int       `json:"iso_speed,omitempty"`
	CapturedAt       *time.Time `json:"captured_at,omitempty"`
	UploadStatus     string     `json:"upload_status"`
	UploadedAt       *time.Time `json:"uploaded_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type UploadTask struct {
	ID               string     `json:"id"`
	PhotoID          string     `json:"photo_id"`
	DeviceID         string     `json:"device_id"`
	AgentID          string     `json:"agent_id"`
	Status           string     `json:"status"`
	BytesUploaded    int64      `json:"bytes_uploaded"`
	TotalBytes       int64      `json:"total_bytes"`
	RetryCount       int        `json:"retry_count"`
	MaxRetries       int        `json:"max_retries"`
	LastErrorMessage *string    `json:"last_error_message,omitempty"`
	StartedAt        *time.Time `json:"started_at,omitempty"`
	CompletedAt      *time.Time `json:"completed_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}
