# @c2c/api-contracts

Paket kontrak API terpadu untuk platform Camera-to-Cloud (C2C).

## 📄 Isi Paket
1. `openapi.yaml`: Spesifikasi OpenAPI 3.1.0 lengkap yang menjadi acuan endpoint REST API.
2. `src/index.ts`: Tipe data TypeScript standar yang di-generate atau dipetakan langsung untuk digunakan oleh frontend `apps/web`.

## 🔄 Workflow
Jika ada perubahan endpoint atau skema data:
1. Perbarui `openapi.yaml`.
2. Sesuaikan tipe TypeScript di `src/index.ts` dan Go models di `services/api/internal/models`.
