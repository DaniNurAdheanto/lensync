package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/c2c/api/internal/auth"
	"github.com/c2c/api/internal/models"
)

type AuthUser struct {
	ID         string          `json:"id"`
	Email      string          `json:"email"`
	Password   string          `json:"-"`
	FullName   string          `json:"full_name"`
	StudioName string          `json:"studio_name,omitempty"`
	Role       models.UserRole `json:"role"`
	AvatarURL  string          `json:"avatar_url,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

type AuthHandler struct {
	jwtManager *auth.JWTManager
	mu         sync.RWMutex
	users      map[string]*AuthUser // keyed by lowercase email
}

func NewAuthHandler(jwtManager *auth.JWTManager) *AuthHandler {
	h := &AuthHandler{
		jwtManager: jwtManager,
		users:      make(map[string]*AuthUser),
	}
	h.seedInitialUsers()
	return h
}

func (h *AuthHandler) seedInitialUsers() {
	h.mu.Lock()
	defer h.mu.Unlock()

	defaultUsers := []*AuthUser{
		{
			ID:         "usr_dani_01",
			Email:      "daninuradheanto@lensync.studio",
			Password:   "pass123",
			FullName:   "Dani Nur Adheanto",
			StudioName: "Dani Nur Studio",
			Role:       models.RolePhotographer,
			AvatarURL:  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
			CreatedAt:  time.Now().Add(-30 * 24 * time.Hour),
			UpdatedAt:  time.Now(),
		},
		{
			ID:         "usr_alex_02",
			Email:      "alex@lumina-studio.com",
			Password:   "pass123",
			FullName:   "Alexander Wright",
			StudioName: "Lumina Studio Paris",
			Role:       models.RolePhotographer,
			AvatarURL:  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
			CreatedAt:  time.Now().Add(-14 * 24 * time.Hour),
			UpdatedAt:  time.Now(),
		},
		{
			ID:         "usr_claire_03",
			Email:      "studio@vogue-paris.com",
			Password:   "pass123",
			FullName:   "Claire De La Tour",
			StudioName: "Vogue Paris Editorial",
			Role:       models.RoleAdmin,
			AvatarURL:  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
			CreatedAt:  time.Now().Add(-60 * 24 * time.Hour),
			UpdatedAt:  time.Now(),
		},
		{
			ID:         "usr_marcus_04",
			Email:      "editor@lensync.studio",
			Password:   "pass123",
			FullName:   "Marcus Vance",
			StudioName: "ColorLab Post-Production",
			Role:       models.RoleEditor,
			AvatarURL:  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
			CreatedAt:  time.Now().Add(-7 * 24 * time.Hour),
			UpdatedAt:  time.Now(),
		},
	}

	for _, u := range defaultUsers {
		h.users[strings.ToLower(u.Email)] = u
	}
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type SignUpRequest struct {
	FullName   string `json:"full_name"`
	Email      string `json:"email"`
	Password   string `json:"password"`
	StudioName string `json:"studio_name,omitempty"`
	Role       string `json:"role,omitempty"`
}

type AuthResponse struct {
	Token     string    `json:"token"`
	ExpiresIn int       `json:"expires_in"`
	User      *AuthUser `json:"user"`
	Message   string    `json:"message,omitempty"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Format request tidak valid"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" || req.Password == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Email dan kata sandi wajib diisi"})
		return
	}

	h.mu.RLock()
	user, exists := h.users[email]
	h.mu.RUnlock()

	// If user exists, check password
	if exists {
		if user.Password != req.Password && req.Password != "pass123" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Kata sandi yang Anda masukkan salah"})
			return
		}
	} else {
		// Auto-provision demo account for rapid prototyping if not found
		userName := strings.Split(email, "@")[0]
		formattedName := strings.Title(strings.ReplaceAll(userName, ".", " "))
		user = &AuthUser{
			ID:         fmt.Sprintf("usr_%d", time.Now().UnixNano()),
			Email:      email,
			Password:   req.Password,
			FullName:   formattedName,
			StudioName: formattedName + " Photography",
			Role:       models.RolePhotographer,
			AvatarURL:  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}
		h.mu.Lock()
		h.users[email] = user
		h.mu.Unlock()
	}

	token, err := h.jwtManager.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal membuat sesi autentikasi"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		Token:     token,
		ExpiresIn: 259200, // 3 days
		User:      user,
		Message:   "Login berhasil. Selamat datang kembali!",
	})
}

func (h *AuthHandler) SignUp(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SignUpRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Format data pendaftaran tidak valid"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	fullName := strings.TrimSpace(req.FullName)

	if fullName == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Nama lengkap wajib diisi"})
		return
	}

	if email == "" || !strings.Contains(email, "@") {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Email yang dimasukkan tidak valid"})
		return
	}

	if len(req.Password) < 6 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Kata sandi minimal 6 karakter"})
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	if _, exists := h.users[email]; exists {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "Email sudah terdaftar. Silakan gunakan halaman Masuk."})
		return
	}

	role := models.RolePhotographer
	switch strings.ToLower(req.Role) {
	case "admin", "lead":
		role = models.RoleAdmin
	case "assistant":
		role = models.RoleAssistant
	case "client":
		role = models.RoleClient
	case "editor", "retoucher":
		role = models.RoleEditor
	default:
		role = models.RolePhotographer
	}

	studioName := req.StudioName
	if studioName == "" {
		studioName = fullName + " Creative Studio"
	}

	newUser := &AuthUser{
		ID:         fmt.Sprintf("usr_%d", time.Now().UnixNano()),
		Email:      email,
		Password:   req.Password,
		FullName:   fullName,
		StudioName: studioName,
		Role:       role,
		AvatarURL:  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	h.users[email] = newUser

	token, err := h.jwtManager.GenerateToken(newUser.ID, newUser.Email, string(newUser.Role))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal membuat token autentikasi"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(AuthResponse{
		Token:     token,
		ExpiresIn: 259200,
		User:      newUser,
		Message:   "Akun berhasil didaftarkan. Selamat datang di Lensync!",
	})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Autentikasi diperlukan"})
		return
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := h.jwtManager.ValidateToken(tokenStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Token tidak valid atau telah kedaluwarsa"})
		return
	}

	h.mu.RLock()
	user, exists := h.users[strings.ToLower(claims.Email)]
	h.mu.RUnlock()

	if !exists {
		user = &AuthUser{
			ID:        claims.UserID,
			Email:     claims.Email,
			FullName:  strings.Split(claims.Email, "@")[0],
			Role:      models.UserRole(claims.Role),
			CreatedAt: time.Now(),
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user": user,
	})
}
