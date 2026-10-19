package handlers

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/c2c/api/internal/models"
	"github.com/c2c/api/internal/services"
)

type UploadHandler struct {
	photoService *services.PhotoService
}

func NewUploadHandler(s *services.PhotoService) *UploadHandler {
	return &UploadHandler{photoService: s}
}

type RequestPresignedInput struct {
	SessionID        string `json:"session_id"`
	DeviceID         string `json:"device_id"`
	OriginalFilename string `json:"original_filename"`
	FileSizeBytes    int64  `json:"file_size_bytes"`
	SHA256Hash       string `json:"sha256_hash"`
	FileFormat       string `json:"file_format"`
	StorageProvider  string `json:"storage_provider"` // "google_drive" or "s3"
}

type ConfirmUploadInput struct {
	PhotoID         string   `json:"photo_id"`
	UploadTaskID    string   `json:"upload_task_id"`
	Success         bool     `json:"success"`
	StorageProvider string   `json:"storage_provider,omitempty"`
	GDriveFileID    string   `json:"gdrive_file_id,omitempty"`
	GDriveViewLink  string   `json:"gdrive_view_link,omitempty"`
	CameraMake      string   `json:"camera_make"`
	CameraModel     string   `json:"camera_model"`
	LensModel       string   `json:"lens_model"`
	FocalLengthMm   float64  `json:"focal_length_mm"`
	ApertureFStop   float64  `json:"aperture_f_stop"`
	ShutterSpeedStr string   `json:"shutter_speed_str"`
	ISOSpeed        int      `json:"iso_speed"`
}

func (h *UploadHandler) RequestPresignedURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input RequestPresignedInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid upload request", http.StatusBadRequest)
		return
	}

	if input.StorageProvider == "" {
		input.StorageProvider = "google_drive"
	}

	result, err := h.photoService.RequestPresignedUpload(
		r.Context(),
		input.SessionID,
		input.DeviceID,
		input.OriginalFilename,
		input.FileFormat,
		input.FileSizeBytes,
		input.SHA256Hash,
		input.StorageProvider,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *UploadHandler) ConfirmUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input ConfirmUploadInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid confirm payload", http.StatusBadRequest)
		return
	}

	photo := &models.Photo{
		ID:              input.PhotoID,
		CameraMake:      &input.CameraMake,
		CameraModel:     &input.CameraModel,
		LensModel:       &input.LensModel,
		FocalLengthMm:   &input.FocalLengthMm,
		ApertureFStop:   &input.ApertureFStop,
		ShutterSpeedStr: &input.ShutterSpeedStr,
		ISOSpeed:        &input.ISOSpeed,
		StorageProvider: input.StorageProvider,
	}

	if input.GDriveFileID != "" {
		photo.GDriveFileID = &input.GDriveFileID
	}
	if input.GDriveViewLink != "" {
		photo.GDriveViewLink = &input.GDriveViewLink
	}

	if err := h.photoService.ConfirmUpload(r.Context(), photo); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":           "confirmed",
		"photo_id":         input.PhotoID,
		"storage_provider": input.StorageProvider,
	})
}

type FastPreviewInput struct {
	SessionID        string  `json:"session_id"`
	DeviceID         string  `json:"device_id"`
	OriginalFilename string  `json:"original_filename"`
	FileSizeBytes    int64   `json:"file_size_bytes"`
	SHA256Hash       string  `json:"sha256_hash"`
	FileFormat       string  `json:"file_format"`
	PreviewBase64    string  `json:"preview_base64"`
	CameraMake       string  `json:"camera_make"`
	CameraModel      string  `json:"camera_model"`
	LensModel        string  `json:"lens_model"`
	FocalLengthMm    float64 `json:"focal_length_mm"`
	ApertureFStop    float64 `json:"aperture_f_stop"`
	ShutterSpeedStr  string  `json:"shutter_speed_str"`
	ISOSpeed         int     `json:"iso_speed"`
}

func (h *UploadHandler) UploadFastPreview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input FastPreviewInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid preview payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	previewBytes, err := base64.StdEncoding.DecodeString(input.PreviewBase64)
	if err != nil {
		http.Error(w, "Invalid preview base64: "+err.Error(), http.StatusBadRequest)
		return
	}

	photo, err := h.photoService.UploadFastPreview(
		r.Context(),
		input.SessionID,
		input.DeviceID,
		input.OriginalFilename,
		input.FileFormat,
		input.FileSizeBytes,
		input.SHA256Hash,
		previewBytes,
		input.CameraMake,
		input.CameraModel,
		input.LensModel,
		input.ShutterSpeedStr,
		input.ISOSpeed,
		input.FocalLengthMm,
		input.ApertureFStop,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "preview_ready",
		"photo_id":    photo.ID,
		"preview_url": photo.PreviewURL,
	})
}

func (h *UploadHandler) ServePreview(w http.ResponseWriter, r *http.Request) {
	relPath := strings.TrimPrefix(r.URL.Path, "/api/v1/previews/")
	filePath := filepath.Join(".c2c_storage", "previews", filepath.Clean(relPath))

	data, err := os.ReadFile(filePath)
	if err != nil {
		http.Error(w, "Preview not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "image/jpeg")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	w.Write(data)
}

