# Camera-to-Cloud (Frontend)

Aplikasi Web Frontend & Landing Page untuk platform **Camera-to-Cloud (C2C)**, dibangun dengan **Next.js 14**, **TypeScript**, **Tailwind CSS**, dan **Untitled UI Design System**.

---

## 📂 Struktur Folder `frontend/`

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Landing Page Utama (Untitled UI)
│   │   ├── layout.tsx                   # Root HTML Layout & Font Setup
│   │   ├── globals.css                  # Tailwind Base Directives
│   │   └── dashboard/
│   │       └── page.tsx                 # Live Photographer Dashboard
│   │
│   ├── components/
│   │   ├── design-system/               # Untitled UI Design Tokens:
│   │   │   ├── Button.tsx               # Primary, Secondary, Tertiary, Outlines
│   │   │   ├── Badge.tsx                # Status Badges with indicator dots
│   │   │   ├── Accordion.tsx            # FAQ Disclosure with smooth toggles
│   │   │   └── Card.tsx                 # Bordered Surface Containers
│   │   │
│   │   └── landing/                     # Modular Landing Page Sections:
│   │       ├── Navbar.tsx               # Header Nav & Hamburger Drawer
│   │       ├── HeroSection.tsx          # Hero Headline, Desk Mockup, & Micro-badges
│   │       ├── HowItWorksSection.tsx    # 4-Step Pipeline (Kamera -> Cloud)
│   │       ├── FeaturesShowcaseSection.tsx # Dark Mode Laptop & Phone Mockups
│   │       ├── CameraCompatibilitySection.tsx # Canon, Sony, Nikon & Models
│   │       ├── PricingSection.tsx       # Starter, Studio Pro, Agency
│   │       ├── FaqSection.tsx           # Accordion FAQ
│   │       ├── CtaBannerSection.tsx     # Scenic Sunset CTA Banner
│   │       ├── Footer.tsx               # Comprehensive Untiled UI Footer
│   │       └── GetStartedModal.tsx      # Onboarding & Session Launch Dialog
│   │
│   ├── features/                        # Domain Features:
│   │   ├── devices/                     # Tethered Cameras (DSLR/Phone/Agent)
│   │   ├── sessions/                    # Active Shoot Sessions & Location
│   │   ├── uploads/                     # Live Upload Queue & Retries
│   │   ├── gallery/                     # Real-time Photo Grid & EXIF
│   │   └── auth/                        # User Roles & Auth State
│   │
│   └── lib/
│       ├── api-client.ts                # Fetch wrapper for Backend REST API
│       └── constants.ts                 # Supported RAW (.CR3, .ARW, .NEF) formats
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
└── .env.example
```

---

## ⚡ Menjalankan Frontend

```bash
# 1. Masuk ke folder frontend
cd frontend

# 2. Install dependensi
npm install

# 3. Jalankan server development
npm run dev
# Buka http://localhost:3001 di browser
```
