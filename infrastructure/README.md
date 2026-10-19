# Infrastructure: Local Development Services

Stack infrastruktur lokal untuk proyek Camera-to-Cloud (C2C) yang mencakup:

1. **PostgreSQL 16**: Menyimpan skema relasional, metadata EXIF kamera, sesi pemotretan, akun pengguna, dan antrean status upload.
2. **MinIO (S3-Compatible Object Storage)**: Menyimpan file asli foto RAW (CR3, ARW, NEF, DNG) dan JPEG kualitas penuh serta thumbnail web.
3. **MinIO Init Container**: Secara otomatis membuat bucket `c2c-photos` saat booting pertama kali.
4. **Redis 7**: Opsional untuk caching status upload dan event streaming.

## 🚀 Menjalankan Service

```bash
docker compose up -d
```

### Akses Port Lokal:
- **PostgreSQL**: `localhost:5432`
- **MinIO S3 API Endpoint**: `http://localhost:9000`
- **MinIO Web Console**: `http://localhost:9001` (Username: `minioadmin`, Password: `minioadmin123`)
- **Redis**: `localhost:6379`

## 🧹 Menghentikan & Membersihkan Volume

```bash
# Matikan container
docker compose down

# Matikan dan hapus volume data
docker compose down -v
```
