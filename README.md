# Camera-to-Cloud (C2C) Platform

Platform otomatis upload foto dari kamera DSLR/Mirrorless atau Smartphone melalui USB tethering langsung ke Cloud Storage (S3-compatible) secara *real-time* saat sesi pemotretan berlangsung.

---

## 🏛️ Struktur Folder Proyek

```
camera-to-cloud/
├── frontend/                          # Client Web Application & Dashboard (Next.js 14, TypeScript, Tailwind CSS)
│   ├── src/
│   │   ├── app/                       # App Router (Landing Page, Layout, Live Dashboard)
│   │   │   ├── dashboard/page.tsx     # Real-time Ingestion & Upload Monitor, Session & Adapter Controls
│   │   │   └── page.tsx               # Product Landing Page
│   │   ├── components/                # Design System & Landing UI
│   │   ├── features/                  # Devices, Sessions, Uploads, Gallery, Auth
│   │   └── lib/                       # API Client (SSE & REST) & Constants
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                           # Server Ecosystem (Go REST API, Desktop Ingestion Agent, Infra)
│   ├── api/                           # Go REST API (Echo/Mux, PostgreSQL, S3 Presigned URL, SSE Stream)
│   │   ├── cmd/server/main.go
│   │   ├── internal/
│   │   │   ├── api/                   # Handlers, Router, Agent Control Proxy
│   │   │   ├── events/                # Server-Sent Events (SSE) Real-Time Broker
│   │   │   ├── repositories/          # PostgreSQL Repo with In-Memory Detached Fallback
│   │   │   ├── services/              # PhotoService (Deduplication, Presigned S3, EXIF) & SessionService
│   │   │   └── storage/               # S3/MinIO Storage Engine & Embedded Mock S3 Handler
│   │   └── go.mod
│   │
│   ├── desktop-agent/                 # Go Desktop Local Sync Agent Daemon
│   │   ├── cmd/agent/main.go          # Main CLI Daemon Entrypoint
│   │   ├── internal/
│   │   │   ├── adapter/               # Pluggable Camera Adapter Architecture:
│   │   │   │   ├── adapter.go         # CameraAdapter interface & DeviceInfo contract
│   │   │   │   ├── hotfolder_adapter.go# USB Tether Hotfolder (Capture One / EOS Utility / Imaging Edge)
│   │   │   │   ├── ptp_adapter.go     # Direct USB PTP/MTP Hardware Protocol
│   │   │   │   ├── sdk_adapter.go     # Vendor Native SDKs (Sony Remote SDK / Canon EDSDK / Nikon SDK)
│   │   │   │   └── registry.go        # Dynamic runtime adapter registry
│   │   │   ├── validator/             # File Write Completion Validator (multi-sample size & lock checks)
│   │   │   ├── queue/                 # Persistent Upload Queue (WAL/JSON state, exponential backoff)
│   │   │   ├── server/                # Embedded Local HTTP Control Server (:8081)
│   │   │   ├── uploader/              # Direct S3 Presigned PUT Streamer (zero file deletion)
│   │   │   └── client/                # API Backend HTTP Client
│   │   ├── test/                      # Automated End-to-End Test Suite (e2e_test.go)
│   │   └── config.example.yaml
│   │
│   └── infrastructure/                # Local Development Docker Stack (PostgreSQL 16, MinIO S3)
│       ├── docker-compose.yml
│       └── postgres/init.sql
│
├── docker-compose.yml                 # Root Docker Compose
├── Makefile                           # Developer convenience tasks
└── README.md
```

---

## ⚡ Fitur Utama yang Diimplementasikan

### 1. Local Sync Agent (Go)
- **Monitoring Hotfolder Tethering**: Memantau direktori foto lokal hasil tethering kamera via USB-C secara real-time.
- **Validasi File Selesai Ditulis (`FileValidator`)**: Melakukan multi-sample size stability check dan pengujian lock handle sebelum file dibaca. Menjamin file RAW/JPEG ukuran besar (40MB–100MB) tidak dibaca setengah jadi saat buffer kamera masih menulis ke disk.
- **Antrean Upload Persisten (`PersistentStateStore`)**: Menyimpan status antrean ke file state (`.c2c_queue_state.json`) sehingga antrean upload tahan terhadap crash atau restart agent.
- **Pencegahan Duplikat (Deduplikasi Ganda)**:
  - *Local deduplication*: Cek SHA-256 pada state store lokal sebelum masuk antrean.
  - *Cloud deduplication*: Cek hash unik per sesi di backend Go (`AlreadyUploaded: true`). Foto yang sama tidak akan diunggah ulang.
- **Retry dengan Exponential Backoff**: Retry otomatis saat koneksi terputus dengan delay eksponensial (`delay * 2^(retry-1) + jitter`), hingga batas `max_retries`.
- **Zero Local File Deletion**: File foto lokal hasil tethering kamera **TIDAK PERNAH DIHAPUS** setelah upload selesai. File tetap aman di laptop fotografer.

### 2. Arsitektur Adapter Kamera Pluggable (`CameraAdapter`)
Kamera tidak diasumsikan hanya dapat diakses melalui USB biasa. Arsitektur adapter modular memungkinkan integrasi SDK kamera langsung di masa depan:
- `HotfolderAdapter`: Mendeteksi file dari software tethering resmi (Sony Imaging Edge, Canon EOS Utility, Nikon NX Tether, Capture One, Lightroom) atau folder DCIM.
- `PTPMTPAdapter`: Protokol Picture Transfer Protocol (PTP/MTP) melalui USB endpoint.
- `CameraSDKAdapter`: Extensibility stub untuk Sony Camera Remote SDK, Canon EDSDK, dan Nikon SDK.
- `AdapterRegistry`: Memungkinkan pemilihan adapter kamera secara dinamis dari dashboard atau file config.

### 3. Integrasi Cloud Storage: Google Drive & S3 Compatible
- **Direct Ingestion ke Google Drive**: Sistem terintegrasi penuh dengan **Google Drive v3 API** menggunakan *Resumable Upload Protocol*.
  - **Otomatis Pembuatan Folder Sesi**: Saat sesi pemotretan dimulai atau foto pertama masuk, backend membuat atau mencari folder khusus sesi di Google Drive (misal `Shoot - Paris Fashion Week Runway Shoot`) di bawah master folder Lensync.
  - **Zero Backend Memory Overhead (Direct Stream)**: Agent meminta upload session ke backend, lalu mengunggah file byte stream langsung ke URL Resumable Google Drive (atau presigned URL S3). RAM backend tetap hemat dan scalable untuk ribuan fotografer.
  - **Google Drive File ID & Direct Web View Link**: Setiap foto yang berhasil diunggah langsung mendapatkan `gdrive_file_id` dan `gdrive_view_link` (`https://drive.google.com/file/d/.../view`), memungkinkan fotografer atau klien langsung membuka dan berbagi hasil foto dari dashboard.
  - **Dual-Mode / Dev Emulator**: Jika kredensial OAuth2 produksi belum disetel, sistem secara cerdas menggunakan Google Drive Storage Emulator lokal (`backend/api/.c2c_storage/google_drive/`) sehingga pengujian dan alur kerja offline berjalan 100% mulus.
- **Database PostgreSQL & Detached Fallback**: Mendukung PostgreSQL aktif (`DATABASE_URL`), dan menyediakan in-memory repository fallback saat berjalan di lingkungan dev tanpa container database.
- **Real-Time Server-Sent Events (SSE)**: Endpoint `/api/v1/events` menyiarkan upload status, kuota antrean, dan foto masuk secara instan ke dashboard.

### 4. Dashboard Next.js Interaktif
- **Pemilihan Proyek & Sesi Aktif**: Dropdown live shoot session dan project.
- **Konfigurasi Folder Sumber**: Mengatur dan memperbarui hotfolder lokal langsung dari dashboard.
- **Kontrol Start/Stop Sync**: Tombol kendali sinkronisasi dengan status visual real-time (`LIVE TETHER SYNCING`, `SYNC PAUSED`, `AGENT OFFLINE`).
- **Live Antrean Upload**: Menampilkan progress upload, status task (`Queued`, `Uploading`, `Completed`, `Retrying`, `Deduplicated`), serta penanganan error.
- **Live Ingestion Gallery**: Menampilkan foto yang berhasil diunggah secara instan, lengkap dengan drawer EXIF telemetry (Kamera, Lensa, Aperture, Shutter, ISO, SHA-256).

---

## 🚀 Panduan Menjalankan Layanan

### 1. Menjalankan Backend REST API (Go)
```bash
cd backend/api
go run cmd/server/main.go
# Aktif di http://localhost:8080 (Health: http://localhost:8080/api/v1/health)
```

### 2. Menjalankan Local Sync Agent (Go)
```bash
cd backend/desktop-agent
go run cmd/agent/main.go --config=config.example.yaml
# Control API aktif di http://localhost:8081
```

Opsi Environment Variables untuk Agent:
- `C2C_WATCH_PATH`: Direktori hotfolder tethering (default: `./sample_hotfolder`)
- `C2C_SESSION_ID`: ID sesi foto aktif (default: `session-pfw-2026`)
- `C2C_PROJECT_ID`: ID proyek foto (default: `proj-pfw-2026`)
- `C2C_STORAGE_PROVIDER`: Provider cloud storage (`google_drive` atau `s3`, default: `google_drive`)
- `C2C_API_BASE_URL`: URL Backend API (default: `http://localhost:8080/api/v1`)
- `C2C_AGENT_PORT`: Port HTTP control server agent (default: `:8081`)

Opsi Environment Variables untuk Backend (Google Drive Production OAuth2):
- `GDRIVE_CLIENT_ID`: Google Cloud OAuth2 Client ID
- `GDRIVE_CLIENT_SECRET`: Google Cloud OAuth2 Client Secret
- `GDRIVE_REFRESH_TOKEN`: OAuth2 Refresh Token fotografer / studio
- `GDRIVE_ROOT_FOLDER_ID`: ID Folder Induk master di Google Drive
*(Catatan: Jika variabel di atas tidak diisi, backend otomatis menggunakan Storage Emulator lokal berkinerja tinggi sehingga aplikasi dapat langsung diuji tanpa setup cloud eksternal).*

### 3. Menjalankan Dashboard Next.js
```bash
cd frontend
npm run dev
# Dashboard aktif di http://localhost:3001/dashboard
```

### 4. Menjalankan Automated End-to-End Tests
```bash
cd backend/desktop-agent
go test -v ./test/...
```
Menjalankan pengujian otomatis untuk:
- Validasi kestabilan penulisan file
- Deteksi file dan kalkulasi hash SHA-256
- Request presigned URL dan stream PUT ke S3
- Pencegahan duplikasi file
- Pemulihan antrean persisten
- Verifikasi proteksi file lokal (tidak terhapus)
