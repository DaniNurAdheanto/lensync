# Camera-to-Cloud REST API Service (Go)

Layanan backend REST API utama untuk platform Camera-to-Cloud (C2C). Dibuat menggunakan Go standar dengan arsitektur bersih (Clean/Layered Architecture).

## 🏛️ Struktur Layering
- `cmd/server/`: Entry point daemon HTTP server.
- `config/`: Parser environment variable dan konfigurasi server.
- `internal/api/handlers/`: HTTP request/response controller untuk auth, session, photo, device, dan upload.
- `internal/auth/`: JWT token generator & validation middleware.
- `internal/services/`: Logika bisnis pemotretan, penamaan file S3, deduplikasi hash, validasi EXIF.
- `internal/repositories/`: Akses database PostgreSQL.
- `internal/storage/`: Penghasil presigned PUT URL untuk S3/MinIO.
- `migrations/`: File SQL migrasi skema database.

## 🚀 Menjalankan Service
```bash
# Pastikan PostgreSQL & MinIO berjalan via docker compose
go run cmd/server/main.go
```
Endpoint tersedia di: `http://localhost:8080/api/v1/health`
