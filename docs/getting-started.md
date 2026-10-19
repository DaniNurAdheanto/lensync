# Getting Started: Panduan Pengembang

Panduan langkah demi langkah untuk menjalankan lingkungan pengembangan lokal Camera-to-Cloud (C2C).

---

## 📋 Prasyarat Sistem
- **Docker** dan **Docker Compose** (v24+)
- **Go** (v1.22+)
- **Node.js** (v20+) & **pnpm** atau **npm**

---

## 🛠️ Langkah Menjalankan Lingkungan Lokal

### Langkah 1: Kloning & Pengaturan Environment
```bash
cp .env.example .env
```

### Langkah 2: Menyalakan Infrastruktur Dasar (PostgreSQL & MinIO S3)
Jalankan stack infrastruktur lokal menggunakan Docker Compose:
```bash
docker compose up -d
```
Cek status layanan:
- **MinIO Web Console**: Buka `http://localhost:9001` dengan akun:
  - Username: `minioadmin`
  - Password: `minioadmin123`
- **PostgreSQL**: Terbuka pada port `5432` (database: `c2c_db`).

### Langkah 3: Menjalankan Backend REST API (Go)
```bash
cd services/api
cp .env.example .env
go run cmd/server/main.go
```
Verifikasi bahwa API telah aktif:
```bash
curl http://localhost:8080/api/v1/health
# Response: {"service":"c2c-api","status":"healthy",...}
```

### Langkah 4: Menjalankan Desktop Agent (Go)
Di terminal baru:
```bash
cd apps/desktop-agent
cp config.example.yaml config.yaml
go run cmd/agent/main.go --config=config.yaml
```
Desktop agent akan mulai memantau folder `./sample_hotfolder` (atau path kamera tether yang ditentukan).

### Langkah 5: Menjalankan Frontend Web Dashboard (Next.js)
Di terminal baru:
```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```
Buka `http://localhost:3001` untuk melihat web dashboard.
