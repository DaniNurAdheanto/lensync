package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/c2c/api/internal/auth"
)

type AuthHandler struct {
	jwtManager *auth.JWTManager
}

func NewAuthHandler(jwtManager *auth.JWTManager) *AuthHandler {
	return &AuthHandler{jwtManager: jwtManager}
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Foundational mock credential check for demo / initial dev
	token, err := h.jwtManager.GenerateToken("usr_demo_123", req.Email, "photographer")
	if err != nil {
		http.Error(w, "Failed generating auth token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token":      token,
		"expires_in": 259200,
		"user": map[string]string{
			"id":    "usr_demo_123",
			"email": req.Email,
			"role":  "photographer",
		},
	})
}
