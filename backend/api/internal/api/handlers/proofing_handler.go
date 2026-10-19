package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/c2c/api/internal/services"
)

type ProofingHandler struct {
	photoService *services.PhotoService
}

func NewProofingHandler(s *services.PhotoService) *ProofingHandler {
	return &ProofingHandler{photoService: s}
}

type UpdateRatingRequest struct {
	Rating         int    `json:"rating"`
	IsPicked       bool   `json:"is_picked"`
	ClientFeedback string `json:"client_feedback"`
}

// GetProofingSession returns session details and photo list for public client proofing
func (h *ProofingHandler) GetProofingSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract session ID or share token from path or query
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/proofing/")
	path = strings.TrimPrefix(path, "/api/v1/proofing")
	sessionID := strings.Trim(path, "/")

	if sessionID == "" {
		sessionID = r.URL.Query().Get("session_id")
	}
	if sessionID == "" {
		sessionID = "session-pfw-2026" // Default demo session
	}

	data, err := h.photoService.GetProofingData(r.Context(), sessionID)
	if err != nil {
		http.Error(w, "Failed retrieving proofing session: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(data)
}

// UpdateRating updates a photo's star rating (1-5), pick status, and client feedback note
func (h *ProofingHandler) UpdateRating(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// URL format: /api/v1/photos/{id}/rating
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/photos/")
	parts := strings.Split(path, "/")
	if len(parts) == 0 || parts[0] == "" {
		http.Error(w, "Missing photo ID in path", http.StatusBadRequest)
		return
	}
	photoID := parts[0]

	var req UpdateRatingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	updated, err := h.photoService.UpdateRating(r.Context(), photoID, req.Rating, req.IsPicked, req.ClientFeedback)
	if err != nil {
		http.Error(w, "Failed updating rating: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

// ShareSession returns the shareable link for a given session
func (h *ProofingHandler) ShareSession(w http.ResponseWriter, r *http.Request) {
	sessionID := r.URL.Query().Get("session_id")
	if sessionID == "" {
		sessionID = "session-pfw-2026"
	}

	shareURL := "http://localhost:3001/proof/" + sessionID
	res := map[string]interface{}{
		"session_id": sessionID,
		"share_url":  shareURL,
		"public":     true,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}
