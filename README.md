# Camera-to-Cloud (C2C) Platform

Platform otomatis upload foto dari kamera DSLR/Mirrorless atau Smartphone melalui USB tethering langsung ke Cloud Storage (S3-compatible) secara *real-time* saat sesi pemotretan berlangsung.

---

## 🏛️ Struktur Folder Proyek

Proyek ini dipisahkan secara rapi dan mandiri menjadi folder **frontend** dan **backend**:

```
camera-to-cloud/
├── frontend/                          # Client Web Application & Landing Page (Next.js 14, TypeScript, Tailwind CSS, Untitled UI)
│   ├── src/
│   │   ├── app/                       # App Router (Landing Page, Layout, Live Dashboard)
│   │   ├── components/
│   │   │   ├── design-system/         # Untitled UI Components (Button, Badge, Accordion, Card)
│   │   │   └── landing/               # Navbar, Hero, Features, Pricing, FAQ, Footer, Modal
│   │   ├── features/                  # Devices, Sessions, Uploads, Gallery, Auth
│   │   └── lib/                       # API Fetcher & Format Constants
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                           # Server Ecosystem (Go REST API, Desktop Ingestion Agent, Infra)
│   ├── api/                           # Go REST API (Echo/Chi, PostgreSQL, S3 Presigned URL, JWT Auth)
│   │   ├── cmd/server/main.go
│   │   ├── internal/ (handlers, services, repositories, models, storage)
│   │   ├── migrations/ (PostgreSQL DDL)
│   │   └── go.mod
│   │
│   ├── desktop-agent/                 # Go Desktop Daemon (USB Tethering, FSWatcher, Upload Queue)
│   │   ├── cmd/agent/main.go
│   │   ├── internal/ (watcher, queue, uploader, tether, client)
│   │   └── config.example.yaml
│   │
│   ├── infrastructure/                # Local Development Docker Stack
│   │   ├── docker-compose.yml         # PostgreSQL 16, MinIO S3, Bucket Init, Redis
│   │   ├── postgres/init.sql
│   │   └── minio/init-buckets.sh
│   │
│   └── contracts/                     # Shared OpenAPI 3.1 & TypeScript Types
│       ├── openapi.yaml
│       └── src/index.ts
│
├── docker-compose.yml                 # Root Docker Compose (PostgreSQL & MinIO S3)
├── Makefile                           # Developer convenience tasks
├── .env.example                       # Unified environment template
└── README.md
```

---

## 🚀 Alur Kerja Camera-to-Cloud (C2C Workflow)

1. **Koneksi Kamera**: Fotografer menghubungkan kamera DSLR/Mirrorless (Sony, Canon, Nikon, Fujifilm) atau Smartphone (Android MTP / iOS DCIM) ke laptop via USB-C.
2. **Detection & Watcher**: `backend/desktop-agent` mendeteksi mounting folder atau tether directory via FSNotify.
3. **Queue & Deduplication**: File RAW (`.CR3`, `.ARW`, `.NEF`, `.DNG`) atau JPEG di-hash (SHA-256) untuk mencegah duplikasi dan dimasukkan ke antrean upload lokal.
4. **Cloud Upload**: Agent meminta upload presigned URL ke `backend/api` dan melakukan multipart streaming langsung ke MinIO / AWS S3.
5. **Metadata Sync**: Metadata EXIF (ISO, Shutter, Aperture, Camera Model, GPS) disimpan ke PostgreSQL.
6. **Live Preview**: Tim klien, art director, atau editor melihat foto secara instan di `frontend`.

---

## ⚡ Panduan Menjalankan Proyek Secara Terpisah

### 1. Jalankan Infrastruktur Lokal (PostgreSQL + MinIO S3)
```bash
docker compose up -d
```
- **PostgreSQL**: `localhost:5432` (db: `c2c_db`, user: `c2c_user`)
- **MinIO S3 API**: `http://localhost:9000`
- **MinIO Web Console**: `http://localhost:9001` (user: `minioadmin`, pass: `minioadmin123`)

### 2. Jalankan Backend REST API (Go)
```bash
cd backend/api
cp .env.example .env
go run cmd/server/main.go
# API aktif di http://localhost:8080/api/v1/health
```

### 3. Jalankan Desktop Ingestion Agent (Go)
```bash
cd backend/desktop-agent
cp config.example.yaml config.yaml
go run cmd/agent/main.go --config=config.yaml
```

### 4. Jalankan Frontend Web Application (Next.js)
```bash
cd frontend
npm install
npm run dev
# Dashboard & Landing Page aktif di http://localhost:3001
```
