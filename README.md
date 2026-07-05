# Allrated

Full-stack movie/TV/anime discovery platform.

## Quick Start

### 1. Database
```bash
createdb allrated
```

### 2. Server
```bash
cd server
cp .env.example .env  # Edit DATABASE_URL, and set TMDB_API_KEY (free key at themoviedb.org)
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Seeding creates an admin login: `admin@allrated.local` / `admin123` (change this password before deploying). Only ADMIN-role users can add/edit/delete titles or import from TMDB — the `/admin` page checks this server-side, not just in the UI.

### 3. Client
```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Features
- JWT auth (register/login), with role-based ADMIN access
- Browse titles by type (Movies/Series/Anime)
- 4-tier rating system (Skip/Timepass/Go for it/Perfection) — our own data, not from TMDB
- Watchlist with status tracking
- YouTube trailer embeds
- Admin panel: search TMDB and import real titles (poster, synopsis, genres, runtime, trailer) instead of typing every field by hand
- Responsive dark cinematic UI (maroon/amber palette, Fraunces + IBM Plex Mono)

## Architecture
Hybrid backend: TMDB supplies title/catalog metadata (search, import), everything else — accounts, the 4-tier ratings, watchlist — lives in our own Postgres DB via Prisma. TMDB never sees ratings or user data.
