# Camera-to-Cloud (C2C) System Architecture

Platform Camera-to-Cloud dirancang untuk mengotomatiskan proses transfer foto dari kamera profesional (DSLR / Mirrorless / Smartphone) langsung ke cloud storage secara *near-instantaneous* saat pemotretan berlangsung.

---

## 🏛️ Arsitektur Monorepo Tingkat Tinggi

```
                       +-------------------------------+
                       |  DSLR / Mirrorless Camera     |
                       |  (Canon / Sony / Nikon / Fuji)|
                       +---------------+---------------+
                                       |
                                       | USB-C Tethering (PTP/MTP/Hotfolder)
                                       v
                       +-------------------------------+
                       |      apps/desktop-agent       |
                       |  - FSWatcher & Debounce Buffer|
                       |  - SHA-256 Deduplication      |
                       |  - Parallel Upload Worker Pool|
                       +-------+---------------+-------+
                               |               |
              1. Presigned URL |               | 2. Direct S3 Stream (Multipart PUT)
                 & Status Sync |               |
                               v               v
               +-------------------+   +--------------------+
               |   services/api    |   |  S3 / MinIO Storage|
               | (Go REST API)     |   |  (Object Storage)  |
               +---------+---------+   +---------+----------+
                         |                       |
                         | Read / Write          | Read Thumbnail/Preview
                         v                       v
               +-------------------+   +--------------------+
               |    PostgreSQL     |   |     apps/web       |
               | (Metadata & State)|   |  (Next.js Client)  |
               +-------------------+   +--------------------+
```

---

## 🧩 Komponen Sistem

### 1. `apps/desktop-agent` (Go Daemon)
- **Tujuan**: Berjalan pada laptop tether fotografer di lokasi pemotretan.
- **Karakteristik**:
  - Mengawasi folder tethering kamera menggunakan FSNotify.
  - Memiliki fitur *write-stability buffer* (memastikan buffer kamera selesai menulis file ke disk sebelum diproses).
  - Menghitung checksum SHA-256 lokal untuk deduplikasi cepat.
  - Worker pool konkurensi dengan backoff retry otomatis jika tether atau internet tidak stabil.
  - Melakukan upload langsung ke MinIO / S3 via HTTP PUT Presigned URL tanpa membebani bandwidth backend API.

### 2. `services/api` (Go REST API)
- **Tujuan**: Otentikasi, orkestrasi sesi pemotretan, penamaan bucket object S3, pemberian presigned URL, dan penyimpanan metadata EXIF.
- **Karakteristik**:
  - Stateless REST API dengan otentikasi JWT.
  - Database PostgreSQL dengan penanganan relasional (Users, Projects, ShootSessions, Devices, Photos, UploadTasks).
  - Skema partisi/index berbasis `session_id` dan `created_at` untuk ingestion throughput tinggi.

### 3. `apps/web` (Next.js 14, TypeScript, Tailwind CSS)
- **Tujuan**: Antarmuka bagi fotografer, art director, klien, dan tim editor untuk melihat hasil foto secara langsung saat pemotretan berlangsung.
- **Fitur**:
  - Live session header dengan counter foto.
  - Device health monitor (status baterai, koneksi tethering).
  - Upload queue monitor untuk melacak kecepatan upload dan retry.
  - High-res preview grid dengan EXIF telemetri (ISO, Aperture, Shutter Speed).

### 4. `packages/api-contracts`
- **Tujuan**: Single source of truth untuk spesifikasi OpenAPI 3.1 dan tipe data TypeScript/Go antar service.

### 5. `infrastructure`
- **Tujuan**: Containerized local development stack menggunakan Docker Compose (PostgreSQL 16, MinIO S3, MinIO Bucket Auto-Provisioner, Redis).
