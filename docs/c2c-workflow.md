# Camera-to-Cloud (C2C) Workflow & Ingestion Pipeline

Dokumen ini menjelaskan alur teknis lengkap bagaimana sebuah foto berpindah dari sensor kamera fotografer hingga muncul di dashboard web dalam hitungan detik.

---

## 📷 1. Metode Tethering Kamera

Camera-to-Cloud mendukung 3 metode tethering utama:

### A. Dedicated Hotfolder Tethering (Paling Stabil)
- Fotografer menggunakan software tethering resmi kamera:
  - **Canon**: EOS Utility / Camera Connect
  - **Sony**: Imaging Edge Remote / Sony USB Tether
  - **Nikon**: NX Tether / Camera Control Pro
  - **Multi-Brand**: Capture One Pro / Lightroom Classic
- Software kamera mengarahkan file hasil jepretan ke sebuah folder lokal (misal `/Pictures/C2C_Hotfolder`).
- `apps/desktop-agent` memantau folder ini secara real-time via `internal/watcher`.

### B. USB PTP (Picture Transfer Protocol) Langsung
- Kamera DSLR/Mirrorless terhubung langsung dengan kabel USB-C ke laptop agent.
- Agent mendeteksi perangkat PTP dan membaca file secara streaming langsung dari kartu memori / sensor buffer.

### C. Smartphone Tethering (Android MTP / iOS DCIM)
- Smartphone terhubung melalui USB dengan mode File Transfer (MTP) atau aplikasi C2C Mobile Companion.

---

## ⚙️ 2. Pipeline File Ingestion

```
[Kamera Jepret Foto]
        |
        v
[File Muncul di Folder Lokal]
        |
        +---> [Min File Age Buffer Check]
        |     (Menunggu kamera selesai flush data ke disk ~500ms)
        v
[Perhitungan Checksum SHA-256]
        |
        +---> [Cek Deduplikasi di Backend API]
        |     (Jika file pernah diunggah, skip upload)
        v
[Enqueue ke UploadQueue Lokal]
        |
        +---> [Worker Pool Mengambil Task]
        |
        +---> [Minta Presigned PUT URL ke services/api]
        |
        +---> [Direct Streaming Upload ke S3 Bucket (MinIO/AWS)]
        |     (Chunk size: 8MB, Concurrency: 3)
        v
[Upload Selesai (HTTP 200)]
        |
        +---> [Confirm Upload ke services/api dengan Metadata EXIF]
        |     (ISO, Shutter, Aperture, Camera Model, Timestamp)
        v
[PostgreSQL Updated -> Real-time Notification ke apps/web]
```

---

## 🔄 3. Toleransi Kesalahan & Retry Strategy

1. **Internet Lambat / Putus Saat Live Shoot**:
   - Foto tetap tersimpan di folder lokal fotografer.
   - UploadQueue menandai status sebagai `retrying` dengan backoff bertingkat (3 detik, 6 detik, 12 detik, dst).
   - Saat koneksi pulih, antrean otomatis melanjutkan pengunggahan tanpa intervensi manual.

2. **Deduplikasi Otomatis**:
   - Jika fotografer memindahkan file atau memicu ulang transfer, checksum SHA-256 mencegah upload ganda dan menghemat kuota cloud storage.
