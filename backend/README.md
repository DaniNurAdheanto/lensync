# Camera-to-Cloud (Backend Ecosystem)

Struktur backend terpadu untuk platform Camera-to-Cloud yang mencakup REST API, Desktop Ingestion Agent (Go Daemon), skema database PostgreSQL, MinIO S3 object storage, dan OpenAPI contracts.

---

## 📂 Struktur Folder `backend/`

```
backend/
├── api/                               # Go REST API Server
│   ├── cmd/server/main.go             # Entry point daemon HTTP server
│   ├── config/config.go               # Environment loader & database configuration
│   ├── internal/
│   │   ├── api/
│   │   │   ├── handlers/              # Controllers: health, auth, session, photo, device, upload
│   │   │   └── router.go              # HTTP Multiplexer, CORS, Request Logger
│   │   ├── auth/jwt.go                # JWT Manager & Claims validation
│   │   ├── models/models.go           # Domain Entities: User, Project, Session, Device, Photo
│   │   ├── repositories/              # PostgreSQL Query layer (photos, sessions)
│   │   ├── services/                  # Business logic (hash deduplication, presigned S3 URLs)
│   │   └── storage/s3.go              # HMAC-SHA1 presigned URL generator for MinIO / S3
│   ├── migrations/                    # DDL Migrations (000001_init_schema.up.sql)
│   ├── go.mod
│   └── .env.example
│
├── desktop-agent/                     # Go Desktop Daemon (Local Watcher & Ingestion)
│   ├── cmd/agent/main.go              # Agent main loop & graceful shutdown
│   ├── internal/
│   │   ├── watcher/watcher.go         # Hotfolder monitoring with write stability debounce
│   │   ├── queue/queue.go             # Concurrent upload queue worker pool & retry backoff
│   │   ├── uploader/uploader.go       # Direct streaming S3 multipart uploader
│   │   ├── tether/tether.go           # USB PTP/MTP camera & smartphone detector
│   │   ├── client/api_client.go       # Communication client with backend API
│   │   └── config/config.go           # YAML configuration loader
│   ├── config.example.yaml            # Hotfolder path, worker concurrency, API keys
│   └── go.mod
│
├── infrastructure/                    # Local Development Docker Stack
│   ├── docker-compose.yml             # PostgreSQL 16, MinIO S3, MinIO Init, Redis
│   ├── postgres/init.sql              # Database initializer & schema
│   └── minio/init-buckets.sh          # Auto-create 'c2c-photos' S3 bucket
│
└── contracts/                         # Shared OpenAPI & TypeScript Contracts
    ├── openapi.yaml                   # OpenAPI 3.1.0 specifications
    └── src/index.ts                   # Exported TypeScript types
```

---

## ⚡ Menjalankan Backend Secara Terpisah

### 1. Jalankan Infrastruktur Lokal (PostgreSQL + MinIO S3)
```bash
cd backend/infrastructure
docker compose up -d
```

### 2. Jalankan Backend REST API (Go)
```bash
cd backend/api
cp .env.example .env
go run cmd/server/main.go
# API aktif di http://localhost:8080/api/v1/health
```

### 3. Jalankan Desktop Agent (Go)
```bash
cd backend/desktop-agent
cp config.example.yaml config.yaml
go run cmd/agent/main.go --config=config.yaml
```
