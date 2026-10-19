package api

import (
	"log"
	"net/http"
	"strings"

	"github.com/c2c/api/internal/api/handlers"
	"github.com/c2c/api/internal/auth"
	"github.com/c2c/api/internal/services"
)

type RouterDependencies struct {
	JWTManager     *auth.JWTManager
	SessionService *services.SessionService
	PhotoService   *services.PhotoService
}

func SetupRouter(deps RouterDependencies) http.Handler {
	mux := http.NewServeMux()

	authHandler := handlers.NewAuthHandler(deps.JWTManager)
	sessionHandler := handlers.NewSessionHandler(deps.SessionService)
	photoHandler := handlers.NewPhotoHandler(deps.PhotoService)
	uploadHandler := handlers.NewUploadHandler(deps.PhotoService)
	deviceHandler := handlers.NewDeviceHandler()
	projectHandler := handlers.NewProjectHandler()

	// Base endpoints
	mux.HandleFunc("/api/v1/health", handlers.HealthCheckHandler)
	mux.HandleFunc("/api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("/api/v1/projects", projectHandler.ListProjects)
	mux.HandleFunc("/api/v1/sessions", sessionHandler.HandleSessions)
	mux.HandleFunc("/api/v1/devices/register", deviceHandler.RegisterDevice)
	mux.HandleFunc("/api/v1/uploads/request-presigned-url", uploadHandler.RequestPresignedURL)
	mux.HandleFunc("/api/v1/uploads/confirm", uploadHandler.ConfirmUpload)
	mux.HandleFunc("/api/v1/photos", photoHandler.ListPhotos)

	// Global Middleware: CORS & Logging
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if strings.HasPrefix(r.URL.Path, "/api/") {
			log.Printf("[%s] %s %s", r.RemoteAddr, r.Method, r.URL.Path)
		}

		mux.ServeHTTP(w, r)
	})
}
