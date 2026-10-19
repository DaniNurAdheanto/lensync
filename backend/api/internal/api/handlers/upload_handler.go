package handlers

import (
	"encoding/json"
	"net/http"

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
}

type ConfirmUploadInput struct {
	PhotoID         string   `json:"photo_id"`
	UploadTaskID    string   `json:"upload_task_id"`
	Success         bool     `json:"success"`
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

	result, err := h.photoService.RequestPresignedUpload(
		r.Context(),
		input.SessionID,
		input.DeviceID,
		input.OriginalFilename,
		input.FileFormat,
		input.FileSizeBytes,
		input.SHA256Hash,
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
	}

	if err := h.photoService.ConfirmUpload(r.Context(), photo); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":   "confirmed",
		"photo_id": input.PhotoID,
	})
}
