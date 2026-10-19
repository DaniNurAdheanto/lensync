# Camera-to-Cloud Desktop Agent (Go)

Desktop Daemon berkinerja tinggi yang ditulis dalam Go untuk memantau folder tethering foto secara lokal, mendeteksi kedatangan file baru (RAW / JPEG), mengelola antrean upload, retry, dan sinkronisasi ke cloud storage.

## 🚀 Fitur Utama
- **Local File Watcher**: Memantau direktori hotfolder lokal dengan perlindungan *file write buffer* (memastikan kamera telah selesai menulis file sebelum diunggah).
- **Format Support**: Mendeteksi RAW Canon (`.CR2`, `.CR3`), Sony (`.ARW`), Nikon (`.NEF`), Adobe (`.DNG`), JPEG, dan HEIC.
- **SHA-256 Deduplication**: Mencegah pengunggahan ganda untuk file identik dalam satu sesi pemotretan.
- **Concurrent Upload Queue**: Worker pool paralel dengan mekanisme retry otomatis dan exponential backoff jika koneksi internet terputus.
- **Direct S3 Upload**: Mengunggah langsung ke S3/MinIO via HTTP PUT presigned URL sehingga tidak membebani server API backend.
- **USB Tether Detection**: Mendeteksi perangkat kamera atau smartphone yang terhubung melalui USB.

## ⚙️ Konfigurasi (`config.yaml`)
Salin `config.example.yaml` menjadi `config.yaml`:
```bash
cp config.example.yaml config.yaml
```

## 🛠️ Menjalankan Agent
```bash
go run cmd/agent/main.go --config=config.yaml
```
