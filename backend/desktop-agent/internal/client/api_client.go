package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type APIClient struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

type PresignedURLRequest struct {
	SessionID        string `json:"session_id"`
	DeviceID         string `json:"device_id,omitempty"`
	OriginalFilename string `json:"original_filename"`
	FileSizeBytes    int64  `json:"file_size_bytes"`
	SHA256Hash       string `json:"sha256_hash"`
	FileFormat       string `json:"file_format"`
	StorageProvider  string `json:"storage_provider,omitempty"` // "google_drive" or "s3"
}

type PresignedURLResponse struct {
	PhotoID         string `json:"photo_id"`
	UploadTaskID    string `json:"upload_task_id"`
	PresignedURL    string `json:"presigned_url"`
	S3Key           string `json:"s3_key"`
	StorageProvider string `json:"storage_provider,omitempty"`
	GDriveFolderID  string `json:"gdrive_folder_id,omitempty"`
	AlreadyUploaded bool   `json:"already_uploaded"`
}

type ConfirmUploadRequest struct {
	PhotoID         string  `json:"photo_id"`
	UploadTaskID    string  `json:"upload_task_id"`
	Success         bool    `json:"success"`
	StorageProvider string  `json:"storage_provider,omitempty"`
	GDriveFileID    string  `json:"gdrive_file_id,omitempty"`
	GDriveViewLink  string  `json:"gdrive_view_link,omitempty"`
	CameraMake      string  `json:"camera_make,omitempty"`
	CameraModel     string  `json:"camera_model,omitempty"`
	LensModel       string  `json:"lens_model,omitempty"`
	FocalLengthMm   float64 `json:"focal_length_mm,omitempty"`
	ApertureFStop   float64 `json:"aperture_f_stop,omitempty"`
	ShutterSpeedStr string  `json:"shutter_speed_str,omitempty"`
	ISOSpeed        int     `json:"iso_speed,omitempty"`
}

func NewAPIClient(baseURL string, apiKey string) *APIClient {
	return &APIClient{
		baseURL: baseURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// RequestPresignedURL asks services/api for a direct S3 PUT URL
func (c *APIClient) RequestPresignedURL(ctx context.Context, req PresignedURLRequest) (*PresignedURLResponse, error) {
	data, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/uploads/request-presigned-url", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("api request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("api returned status: %d", resp.StatusCode)
	}

	var res PresignedURLResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	return &res, nil
}

// ConfirmUpload notifies the backend that S3 stream succeeded
func (c *APIClient) ConfirmUpload(ctx context.Context, req ConfirmUploadRequest) error {
	data, err := json.Marshal(req)
	if err != nil {
		return err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/uploads/confirm", bytes.NewReader(data))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("confirm api returned status: %d", resp.StatusCode)
	}

	return nil
}

// SendHeartbeat keeps agent status marked as 'online' in PostgreSQL
func (c *APIClient) SendHeartbeat(ctx context.Context, deviceUID string, agentVersion string) error {
	payload := map[string]string{
		"device_uid":    deviceUID,
		"agent_version": agentVersion,
		"status":        "online",
	}
	data, _ := json.Marshal(payload)

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/devices/register", bytes.NewReader(data))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

type FastPreviewUploadRequest struct {
	SessionID        string  `json:"session_id"`
	DeviceID         string  `json:"device_id"`
	OriginalFilename string  `json:"original_filename"`
	FileSizeBytes    int64   `json:"file_size_bytes"`
	SHA256Hash       string  `json:"sha256_hash"`
	FileFormat       string  `json:"file_format"`
	PreviewBase64    string  `json:"preview_base64"`
	CameraMake       string  `json:"camera_make,omitempty"`
	CameraModel      string  `json:"camera_model,omitempty"`
	LensModel        string  `json:"lens_model,omitempty"`
	FocalLengthMm    float64 `json:"focal_length_mm,omitempty"`
	ApertureFStop    float64 `json:"aperture_f_stop,omitempty"`
	ShutterSpeedStr  string  `json:"shutter_speed_str,omitempty"`
	ISOSpeed         int     `json:"iso_speed,omitempty"`
}

type FastPreviewUploadResponse struct {
	Status     string `json:"status"`
	PhotoID    string `json:"photo_id"`
	PreviewURL string `json:"preview_url"`
}

func (c *APIClient) UploadFastPreview(ctx context.Context, req FastPreviewUploadRequest) (*FastPreviewUploadResponse, error) {
	data, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/photos/fast-preview", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("fast preview api returned status %d", resp.StatusCode)
	}

	var res FastPreviewUploadResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}
	return &res, nil
}

