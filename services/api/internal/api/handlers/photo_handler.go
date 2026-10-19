package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/c2c/api/internal/services"
)

type PhotoHandler struct {
	photoService *services.PhotoService
}

func NewPhotoHandler(s *services.PhotoService) *PhotoHandler {
	return &PhotoHandler{photoService: s}
}

func (h *PhotoHandler) ListPhotos(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := r.URL.Query().Get("session_id")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	photos, err := h.photoService.ListPhotos(r.Context(), sessionID, limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(photos)
}
