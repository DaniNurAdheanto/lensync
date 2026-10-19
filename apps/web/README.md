# Camera-to-Cloud Frontend Web Dashboard

Dashboard real-time untuk memantau sesi pemotretan langsung (*live tethering shoot*), status perangkat kamera yang terhubung, antrean upload, dan galeri preview foto langsung dari cloud.

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 📂 Struktur Modular
- `src/app/`: App Router layout, root page, dan routing.
- `src/components/ui/`: Desain sistem dasar (Button, Card, Badge).
- `src/components/layout/`: Header, Navigation Sidebar, Status Bar.
- `src/features/devices/`: Komponen list kamera yang terhubung dan status tethering.
- `src/features/sessions/`: Pemilihan sesi pemotretan aktif, lokasi, dan metadata fotografer.
- `src/features/uploads/`: Progress bar real-time, statistik antrean, dan kecepatan upload.
- `src/features/gallery/`: Grid foto real-time, metadata EXIF inspector (ISO, Shutter, Aperture), dan preview RAW/JPEG.
- `src/features/auth/`: Type dan hooks otentikasi tim fotografer/klien.
- `src/lib/`: API client fetcher dan konstanta global.

## 🚀 Menjalankan Frontend
```bash
npm install
npm run dev
```
Akses di browser: `http://localhost:3001`
