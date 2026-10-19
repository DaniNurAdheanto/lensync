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

	// 1. Connect to PostgreSQL
	var db *sql.DB
	var err error
	db, err = sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Printf("Warning: Failed opening DB connection: %v. Running in detached mode.", err)
	} else if err := db.Ping(); err != nil {
		log.Printf("Notice: DB not reachable (%v). Using detached mode for local development.", err)
	} else {
		log.Println("Successfully connected to PostgreSQL database.")
	}

	// 2. Initialize Infrastructure & Repositories
	jwtManager := auth.NewJWTManager(cfg.JWTSecret, 72)
	s3Client := storage.NewS3Storage(cfg.S3Endpoint, cfg.S3AccessKey, cfg.S3SecretKey, cfg.S3BucketName, cfg.S3UseSSL)

	photoRepo := repositories.NewPostgresPhotoRepo(db)
	sessionRepo := repositories.NewPostgresSessionRepo(db)

	// 3. Initialize Domain Services
	photoService := services.NewPhotoService(photoRepo, s3Client)
	sessionService := services.NewSessionService(sessionRepo)

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
