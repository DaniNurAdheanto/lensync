package main

import (
	"database/sql"
	"log"
	"net/http"

	_ "github.com/lib/pq"

	"github.com/c2c/api/config"
	"github.com/c2c/api/internal/api"
	"github.com/c2c/api/internal/auth"
	"github.com/c2c/api/internal/repositories"
	"github.com/c2c/api/internal/services"
	"github.com/c2c/api/internal/storage"
)

func main() {
	log.Println("==================================================")
	log.Println("⚡ Camera-to-Cloud (C2C) REST API Service")
	log.Println("==================================================")

	cfg := config.LoadConfig()
	log.Printf("Environment: %s", cfg.Environment)
	log.Printf("Port: %s", cfg.Port)

	// 1. Initialize Repositories (Postgres with fallback to in-memory)
	var photoRepo repositories.PhotoRepository
	var sessionRepo repositories.SessionRepository

	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err == nil && db.Ping() == nil {
		log.Println("Successfully connected to PostgreSQL database.")
		photoRepo = repositories.NewPostgresPhotoRepo(db)
		sessionRepo = repositories.NewPostgresSessionRepo(db)
	} else {
		log.Printf("Notice: PostgreSQL not reachable at %s. Initializing in-memory repository for seamless local development.", cfg.DatabaseURL)
		photoRepo = repositories.NewMemoryPhotoRepo()
		sessionRepo = repositories.NewMemorySessionRepo()
	}

	// 2. Initialize Infrastructure & Cloud Storages (S3 + Google Drive)
	jwtManager := auth.NewJWTManager(cfg.JWTSecret, 72)
	s3Client := storage.NewS3Storage(cfg.S3Endpoint, cfg.S3AccessKey, cfg.S3SecretKey, cfg.S3BucketName, cfg.S3UseSSL)
	gdriveClient := storage.NewGDriveStorage()

	// 3. Initialize Domain Services
	sessionService := services.NewSessionService(sessionRepo)
	photoService := services.NewPhotoService(photoRepo, sessionRepo, s3Client, gdriveClient)

	// 4. Mount API Routes
	handler := api.SetupRouter(api.RouterDependencies{
		JWTManager:     jwtManager,
		SessionService: sessionService,
		PhotoService:   photoService,
	})

	addr := ":" + cfg.Port
	log.Printf("C2C API Server listening on http://localhost%s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("Server stopped with error: %v", err)
	}
}
