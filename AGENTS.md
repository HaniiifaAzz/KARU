# AGENTS.md — KARU Monorepo

## Overview

KARU ("Your Intelligent Green Eye") is an ecology monitoring system with AI-powered plant disease diagnosis. Two apps share a PostgreSQL database:

- **`web/apps/admin-dashboard/`** — Next.js 16 admin dashboard (TypeScript, Tailwind v4, Drizzle ORM, PostGIS, BetterAuth, Google Gemini AI, Leaflet maps)
- **`mobile/`** — Flutter mobile client (Provider, Dio, Google Maps, camera-based scan workflow)

Deployed on **Vercel**. Database on **Supabase** (PostgreSQL + PostGIS).

## Commands

### Web (run from `web/apps/admin-dashboard/`)

```bash
npm run dev          # Next.js dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint (next core-web-vitals + typescript)
npm run db:generate  # Drizzle Kit — generate migration SQL
npm run db:push      # Drizzle Kit — push schema directly to DB
npm run db:seed      # Seed master data (tsX)
npm run db:seed-scans # Seed scan history data (tsX)
```

No typecheck or test scripts exist for the web app. `npm run lint` is the only automated check.

### Mobile (run from `mobile/`)

```bash
flutter run
flutter test
flutter pub get       # install dependencies
```

## Architecture

### Web app structure (`web/apps/admin-dashboard/`)

```
app/
  page.tsx              # Login page (root route)
  layout.tsx            # Root layout — fonts, Toaster
  dashboard/
    layout.tsx          # Sidebar shell — must wrap in <Suspense> (usePathname requirement)
    page.tsx            # Dashboard home
    data-master/        # Plants, pests/diseases, SOPs CRUD
    workspace/          # Geofenced workspaces with Leaflet
    qr-node/            # QR batch/node management
    reports-ai/         # AI scan reports & executive insights
    users-access/       # User management
    log-aktivitas/      # Audit logs
    settings/           # System settings CMS
    profile/            # User profile
  api/
    auth/[...all]/      # BetterAuth catch-all handler
    mobile/             # REST API endpoints consumed by Flutter app
    workspaces/         # Workspace API for dashboard maps
  actions/              # Next.js Server Actions (data layer for pages)
lib/
  db/schema.ts          # Drizzle schema — single source of truth for all tables
  db/index.ts           # DB connection (postgres.js, max: 1)
  auth/index.ts         # BetterAuth config with DB hooks (audit logging)
  auth/auth-guard.ts    # Bearer token validation for mobile API routes
  auth-client.ts        # BetterAuth React client
  repositories/         # Data access layer (one per domain)
  services/             # Business logic layer
    storage.factory.ts  # Switches local vs Supabase storage via STORAGE_PROVIDER env
    gemini.service.ts   # Gemini 2.5 Flash for plant diagnosis + executive insights
components/             # Map components (Leaflet + react-leaflet-draw)
```

### Key patterns

- **Server Actions** (`app/actions/`) are the primary data layer for dashboard pages, not API routes.
- **Repository → Service** layering in `lib/`. Repos handle DB queries; services handle business logic.
- **Storage factory**: `STORAGE_PROVIDER` env var selects local (`/public/uploads/`) or Supabase storage.
- **Auth flow**: BetterAuth with email/password. Dashboard pages protected by session cookie check in `proxy.ts`. Mobile API routes use Bearer token via `auth-guard.ts`.

### Mobile app structure (`mobile/lib/`)

```
config/        # ApiConfig (base URL, endpoints), Theme
services/      # ApiService (Dio + JWT interceptor)
screens/       # Auth, Home, Scan, Workspace, History, Profile
providers/     # AuthProvider (ChangeNotifier)
models/        # Data models
```

The mobile app hits the web app's `/api/mobile/*` endpoints. On Android emulator, the base URL is `http://10.0.2.2:3000`.

## Database

- **PostgreSQL with PostGIS** — schema uses `geometry()` columns for geofencing (`geofences.polygon_info`) and scan locations (`aiScanLogs.location`).
- **Drizzle ORM** — schema at `web/apps/admin-dashboard/lib/db/schema.ts`, migrations output to `drizzle/`.
- PostGIS system tables (`spatial_ref_sys`, `geography_columns`, `geometry_columns`) are filtered out in `drizzle.config.ts`.

### After schema changes

```bash
npm run db:generate   # Generate migration SQL
npm run db:push       # Or push directly (dev only)
```

There is also a manual `run-migration.ts` script for ad-hoc ALTER TABLE operations.

## Environment

Required `.env` in `web/apps/admin-dashboard/`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (must have PostGIS) |
| `NEXT_PUBLIC_APP_URL` | Public URL for BetterAuth client (default: `http://localhost:3000`) |
| `GEMINI_API_KEY` | Google Gemini API key for plant diagnosis |
| `STORAGE_PROVIDER` | `local` or `supabase` — selects file storage backend |

## Gotchas

- **Next.js 16 has breaking changes.** The existing `web/apps/admin-dashboard/AGENTS.md` warns: check `node_modules/next/dist/docs/` before assuming Next.js API behavior.
- **Server Actions body limit** is set to 5MB in `next.config.ts` — relevant for image uploads.
- **Dashboard layout requires `<Suspense>`** wrapping `usePathname`/`useSearchParams` consumers (see `app/dashboard/layout.tsx:383`).
- **`proxy.ts` is not wired as Next.js middleware** — it defines a `proxy()` function and `config.matcher` but there is no `middleware.ts` at the project root. Session-based route protection may not be active.
- **`alter.js` contains hardcoded Supabase credentials** — do not commit updated credentials. Use `run-migration.ts` or `npm run db:push` instead.
- **No automated tests** for the web app. The mobile app has `flutter test`.
- **Indonesian language** throughout UI labels, comments, and database content.
