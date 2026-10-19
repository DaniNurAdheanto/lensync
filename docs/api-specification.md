# C2C REST API Specification

Dokumentasi endpoint REST API utama untuk platform Camera-to-Cloud (`services/api`).

Base URL: `http://localhost:8080/api/v1`

---

## 1. System & Health
### `GET /health`
Mengecek status kesehatan server API backend.
- **Response 200 OK**:
```json
{
  "service": "c2c-api",
  "status": "healthy",
  "timestamp": "2026-10-18T20:25:00Z",
  "version": "0.1.0"
}
```

---

## 2. Authentication
### `POST /auth/login`
Autentikasi pengguna fotografer, asisten, atau klien.
- **Request Body**:
```json
{
  "email": "photographer@c2c.studio",
  "password": "mypassword123"
}
```
- **Response 200 OK**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "expires_in": 259200,
  "user": {
    "id": "usr_demo_123",
    "email": "photographer@c2c.studio",
    "role": "photographer"
  }
}
```

---

## 3. Device Registration & Heartbeat
### `POST /devices/register`
Mendaftarkan laptop desktop agent atau kamera yang terhubung.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "device_uid": "CANON-EOS-R5-SN98271",
  "name": "Primary Camera (A-Cam)",
  "device_type": "mirrorless_camera",
  "model_name": "Canon EOS R5 Mark II",
  "serial_number": "SN98271",
  "agent_version": "0.1.0"
}
```

---

## 4. Sessions
### `GET /sessions?project_id=<UUID>`
Mengambil daftar sesi pemotretan aktif maupun arsip.

### `POST /sessions`
Membuat sesi pemotretan baru.
- **Request Body**:
```json
{
  "project_id": "proj_fashion_week_2026",
  "title": "Paris Fashion Week - Runway 1",
  "location": "Grand Palais, Paris"
}
```

---

## 5. Upload Pipeline (Presigned URL & Confirmation)
### `POST /uploads/request-presigned-url`
Dipanggil oleh `apps/desktop-agent` saat file foto baru terdeteksi.
- **Request Body**:
```json
{
  "session_id": "ses_paris_fw_01",
  "device_id": "CANON-EOS-R5-SN98271",
  "original_filename": "IMG_4892.CR3",
  "file_size_bytes": 47185920,
  "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "file_format": ".CR3"
}
```
- **Response 200 OK**:
```json
{
  "photo_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "upload_task_id": "7b13a778-9844-4638-b7eb-62a221f576b2",
  "presigned_url": "http://localhost:9000/c2c-photos/sessions/ses_paris_fw_01/originals/3fa85f64_IMG_4892.CR3?AWSAccessKeyId=...",
  "s3_key": "sessions/ses_paris_fw_01/originals/3fa85f64_IMG_4892.CR3",
  "already_uploaded": false
}
```

### `POST /uploads/confirm`
Dipanggil setelah file sukses di-stream ke S3/MinIO.
- **Request Body**:
```json
{
  "photo_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "upload_task_id": "7b13a778-9844-4638-b7eb-62a221f576b2",
  "success": true,
  "camera_make": "Canon",
  "camera_model": "EOS R5 Mark II",
  "lens_model": "RF 28-70mm F2 L USM",
  "focal_length_mm": 50.0,
  "aperture_f_stop": 2.0,
  "shutter_speed_str": "1/500s",
  "iso_speed": 100
}
```

---

## 6. Photos
### `GET /photos?session_id=<UUID>&limit=50&offset=0`
Mengambil metadata daftar foto dalam sesi tertentu.
