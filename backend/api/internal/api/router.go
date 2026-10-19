package api

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/c2c/api/internal/api/handlers"
	"github.com/c2c/api/internal/auth"
	"github.com/c2c/api/internal/events"
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
	agentHandler := handlers.NewAgentHandler()
	proofingHandler := handlers.NewProofingHandler(deps.PhotoService)
	broker := events.GetBroker()

	// Base endpoints
	mux.HandleFunc("/api/v1/health", handlers.HealthCheckHandler)
	mux.HandleFunc("/api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("/api/v1/auth/signup", authHandler.SignUp)
	mux.HandleFunc("/api/v1/auth/me", authHandler.Me)
	mux.HandleFunc("/api/v1/projects", projectHandler.ListProjects)
	mux.HandleFunc("/api/v1/sessions", sessionHandler.HandleSessions)
	mux.HandleFunc("/api/v1/devices/register", deviceHandler.RegisterDevice)
	mux.HandleFunc("/api/v1/uploads/request-presigned-url", uploadHandler.RequestPresignedURL)
	mux.HandleFunc("/api/v1/uploads/confirm", uploadHandler.ConfirmUpload)
	mux.HandleFunc("/api/v1/photos/fast-preview", uploadHandler.UploadFastPreview)
	mux.HandleFunc("/api/v1/previews/", uploadHandler.ServePreview)
	mux.HandleFunc("/api/v1/photos", photoHandler.ListPhotos)

	// Client Live Proofing endpoints
	mux.HandleFunc("/api/v1/proofing/", proofingHandler.GetProofingSession)
	mux.HandleFunc("/api/v1/proofing", proofingHandler.GetProofingSession)
	mux.HandleFunc("/api/v1/photos/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/rating") {
			proofingHandler.UpdateRating(w, r)
			return
		}
		http.NotFound(w, r)
	})
	mux.HandleFunc("/api/v1/sessions/share", proofingHandler.ShareSession)

	// Real-Time SSE Stream for Next.js Dashboard
	mux.HandleFunc("/api/v1/events", broker.SSEHandler)
	mux.HandleFunc("/api/v1/live/stream", broker.SSEHandler)

	// Local Sync Agent control endpoints
	mux.HandleFunc("/api/v1/agent/status", agentHandler.GetStatus)
	mux.HandleFunc("/api/v1/agent/start", agentHandler.StartSync)
	mux.HandleFunc("/api/v1/agent/stop", agentHandler.StopSync)
	mux.HandleFunc("/api/v1/agent/config", agentHandler.UpdateConfig)
	mux.HandleFunc("/api/v1/agent/queue", agentHandler.GetQueue)

	// S3 mock storage endpoints (for direct PUT upload when MinIO is in mock/detached mode)
	storage := deps.PhotoService.GetStorage()
	mux.HandleFunc("/api/v1/storage/upload/", storage.HandleMockUpload)
	mux.HandleFunc("/api/v1/storage/file/", storage.HandleMockDownload)

	// Google Drive storage endpoints
	gdrive := deps.PhotoService.GetGDriveStorage()
	mux.HandleFunc("/api/v1/storage/gdrive/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(gdrive.GetStatus())
	})
	mux.HandleFunc("/api/v1/storage/gdrive/upload", gdrive.HandleLocalUpload)

	// Global Middleware: CORS & Logging
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, ETag")

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
