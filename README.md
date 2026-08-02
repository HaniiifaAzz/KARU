# 🌿 KARU — Sistem Monitoring Ekologi Berbasis AI

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Flutter-3.x-blue?style=for-the-badge&logo=flutter" />
  <img src="https://img.shields.io/badge/PostgreSQL-PostGIS-336791?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel" />
</p>

> **KARU** ("Mata Hijau Cerdas Anda") adalah sistem monitoring ekologi berbasis kecerdasan buatan (AI) yang dirancang untuk membantu petugas lapangan mendeteksi penyakit dan hama tanaman secara real-time melalui kamera smartphone, serta memantau kondisi wilayah kerja secara geospasial dari dasbor admin.

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Teknologi](#-teknologi)
- [Struktur Monorepo](#-struktur-monorepo)
- [Skema Database](#-skema-database)
- [Cara Menjalankan](#-cara-menjalankan)
- [Variabel Lingkungan](#-variabel-lingkungan)
- [Perintah Database](#-perintah-database)
- [API Endpoints](#-api-endpoints)
- [Kontribusi](#-kontribusi)

---

## ✨ Fitur Utama

### 🖥️ Admin Dashboard (Web)
| Fitur | Deskripsi |
|---|---|
| **Data Master** | Manajemen data tanaman, penyakit/hama, dan SOP penanganan |
| **Workspace Geospasial** | Peta interaktif (Leaflet) dengan batas wilayah kerja berbasis geofencing PostGIS |
| **QR Node Management** | Pembuatan batch QR Code untuk penandaan titik pantau lapangan |
| **Laporan AI** | Riwayat hasil diagnosa AI dari seluruh scan lapangan, dilengkapi insight eksekutif |
| **Manajemen Pengguna** | Kontrol akses berbasis peran (admin, petugas, dsb.) |
| **Log Aktivitas** | Audit trail seluruh aksi di sistem |
| **Pengaturan Sistem** | CMS untuk konfigurasi tampilan aplikasi |

### 📱 Mobile App (Flutter)
| Fitur | Deskripsi |
|---|---|
| **Scan Penyakit AI** | Foto tanaman via kamera → analisis Gemini AI → hasil diagnosa + rekomendasi |
| **Validasi Geofencing** | Scan hanya diizinkan di dalam batas wilayah yang telah dikonfigurasi admin |
| **Riwayat Scan** | Daftar lengkap hasil scan sebelumnya per pengguna |
| **Workspace Map** | Peta Google Maps menampilkan wilayah kerja yang ditugaskan |
| **Notifikasi** | Pemberitahuan terkait hasil scan dan info sistem |

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                        KARU Monorepo                         │
├──────────────────────────┬──────────────────────────────────┤
│   📱 Mobile (Flutter)    │    🖥️ Web (Next.js 16)           │
│   Provider + Dio         │    TypeScript + Tailwind v4       │
│   Google Maps            │    Drizzle ORM + BetterAuth       │
│   Camera + QR Scan       │    Leaflet Maps + Server Actions  │
└──────────┬───────────────┴────────────────┬─────────────────┘
           │   REST API (/api/mobile/*)      │
           └────────────────┬───────────────┘
                            │
            ┌───────────────▼───────────────┐
            │   🗄️ PostgreSQL + PostGIS      │
            │   (Supabase Cloud)             │
            │   - Geofencing (geometry)      │
            │   - Scan locations (point)     │
            └───────────────────────────────┘
                            │
            ┌───────────────▼───────────────┐
            │   🤖 Google Gemini AI          │
            │   (Gemini 2.5 Flash)           │
            │   - Plant disease diagnosis    │
            │   - Executive insights         │
            └───────────────────────────────┘
```

---

## 🛠️ Teknologi

### Web Admin Dashboard
| Layer | Teknologi |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS v4 |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) |
| Database | PostgreSQL + PostGIS (via [Supabase](https://supabase.com/)) |
| Auth | [BetterAuth](https://www.better-auth.com/) |
| AI | [Google Gemini 2.5 Flash](https://ai.google.dev/) |
| Maps | [Leaflet](https://leafletjs.com/) + react-leaflet-draw |
| Storage | Supabase Storage / Local |
| Deploy | [Vercel](https://vercel.com/) |

### Mobile App
| Layer | Teknologi |
|---|---|
| Framework | [Flutter](https://flutter.dev/) 3.x |
| State Management | Provider |
| HTTP Client | Dio (JWT interceptor) |
| Maps | Google Maps Flutter |
| Camera | Flutter Camera Plugin |

---

## 📁 Struktur Monorepo

```
PKL-KARU/
├── web/
│   └── apps/
│       └── admin-dashboard/        # Next.js 16 Admin Dashboard
│           ├── app/
│           │   ├── page.tsx                # Halaman login
│           │   ├── dashboard/
│           │   │   ├── data-master/        # CRUD Tanaman, Hama, SOP
│           │   │   ├── workspace/          # Peta geofencing (Leaflet)
│           │   │   ├── qr-node/            # Manajemen QR batch & node
│           │   │   ├── reports-ai/         # Laporan scan AI
│           │   │   ├── users-access/       # Manajemen pengguna
│           │   │   ├── log-aktivitas/      # Audit log
│           │   │   ├── settings/           # CMS pengaturan sistem
│           │   │   └── profile/            # Profil pengguna
│           │   ├── api/
│           │   │   ├── auth/[...all]/      # BetterAuth handler
│           │   │   └── mobile/             # REST API untuk Flutter
│           │   └── actions/                # Next.js Server Actions
│           ├── lib/
│           │   ├── db/
│           │   │   ├── schema.ts           # Drizzle schema (single source of truth)
│           │   │   ├── index.ts            # Koneksi database
│           │   │   └── seed*.ts            # Script seeding data
│           │   ├── auth/                   # BetterAuth config + auth-guard
│           │   ├── repositories/           # Data access layer
│           │   └── services/               # Business logic layer
│           └── components/                 # Komponen UI (peta, dll.)
│
└── mobile/
    └── lib/
        ├── config/         # ApiConfig, Theme
        ├── services/       # ApiService (Dio + JWT)
        ├── screens/        # Auth, Home, Scan, Workspace, History, Profile
        ├── providers/      # AuthProvider
        └── models/         # Data models
```

---

## 🗄️ Skema Database

Database menggunakan **PostgreSQL + PostGIS** dengan 8 domain utama:

| Domain | Tabel | Keterangan |
|---|---|---|
| **Auth** | `user`, `session`, `account`, `verification` | Dikelola BetterAuth |
| **Data Master** | `plants`, `pests_diseases`, `sops` | Master data ekologi |
| **Relasi** | `plant_pest_relations`, `sop_plant_relations`, `sop_pest_relations` | Many-to-many |
| **Workspace** | `workspaces`, `geofences` | Wilayah + batas poligon (PostGIS) |
| **QR Node** | `qr_batches`, `qr_nodes` | Titik pantau lapangan |
| **AI Scan** | `ai_scan_logs` | Hasil diagnosa + lokasi GPS (PostGIS Point) |
| **Audit** | `activity_logs` | Log seluruh aktivitas sistem |
| **CMS** | `system_settings`, `mobile_banners`, `notifications` | Konten dinamis |

---

## 🚀 Cara Menjalankan

### Prasyarat

- **Node.js** >= 18
- **Flutter** >= 3.x + Dart SDK
- **PostgreSQL** dengan ekstensi **PostGIS**
- **Google Gemini API Key**

---

### Web Admin Dashboard

```bash
# 1. Masuk ke direktori dashboard
cd web/apps/admin-dashboard

# 2. Install dependencies
npm install

# 3. Salin dan isi file environment
cp .env.example .env
# (Edit .env dengan kredensial Anda)

# 4. Push schema ke database
npm run db:push

# 5. (Opsional) Seed data awal
npm run db:seed
npm run db:seed-master

# 6. Jalankan dev server
npm run dev
# Buka http://localhost:3000
```

---

### Mobile App

```bash
# 1. Masuk ke direktori mobile
cd mobile

# 2. Install dependencies
flutter pub get

# 3. Sesuaikan base URL di lib/config/api_config.dart
# - Android Emulator : http://10.0.2.2:3000
# - Physical device  : http://<IP_LOKAL>:3000
# - Production       : https://your-domain.vercel.app

# 4. Jalankan aplikasi
flutter run
```

---

## 💾 Perintah Database

Semua dijalankan dari `web/apps/admin-dashboard/`:

```bash
npm run db:generate      # Generate SQL migration dari perubahan schema
npm run db:push          # Push schema langsung ke DB (dev only)
npm run db:seed          # Seed data pengguna & data dasar
npm run db:seed-scans    # Seed data riwayat scan (testing)
npm run db:seed-master   # Seed data master (tanaman, hama, SOP)
```

---

## 🌐 API Endpoints

Semua endpoint mobile tersedia di `/api/mobile/*` dan memerlukan **Bearer Token** (JWT dari BetterAuth).

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/auth/sign-in/email` | Login & mendapatkan token |
| `GET` | `/api/mobile/workspaces` | Daftar workspace yang ditugaskan |
| `POST` | `/api/mobile/scan` | Submit hasil scan AI |
| `GET` | `/api/mobile/scan/history` | Riwayat scan pengguna |
| `GET` | `/api/mobile/profile` | Data profil pengguna |
| `PUT` | `/api/mobile/profile` | Update profil |
| `GET` | `/api/mobile/notifications` | Notifikasi pengguna |

---

## 🤝 Kontribusi

Proyek ini dikembangkan sebagai bagian dari program **Praktik Kerja Lapangan (PKL)**.

1. Fork repository ini
2. Buat branch fitur: `git checkout -b fitur/nama-fitur`
3. Commit perubahan: `git commit -m 'feat: tambah fitur X'`
4. Push ke branch: `git push origin fitur/nama-fitur`
5. Buat Pull Request

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan internal PKL. Hak cipta dilindungi.

---

<p align="center">
  Dibuat dengan ❤️ untuk ekologi yang lebih sehat 🌱
</p>
