# Allrated

Full-stack movie/TV/anime discovery platform with a 4-tier rating system (Skip / Timepass / Go for it / Perfection), watchlist tracking, Supabase Auth, and an admin panel for importing titles from TMDB.

---

## ⚠️ AGENT: READ THIS FIRST — EVERY TIME

**Replit only runs the frontend.** The backend is permanently deployed on Railway.

| What | Where |
|---|---|
| **Frontend (React + Vite)** | Replit — `cd client && npm run dev` on port 5000 |
| **Backend API (Express + Prisma)** | Railway — `https://netflixallrated.up.railway.app` |
| **Database (PostgreSQL)** | Railway managed — Prisma ORM |
| **Auth** | Supabase Auth (client-side) + token verify (server-side on Railway) |

### Rules for agents
- **NEVER** create or start an `API Server` workflow on Replit. It must not exist.
- **NEVER** run `cd server && npm run dev` locally on Replit.
- **ONLY** workflow needed: `Start application` → `cd client && npm run dev`
- Vite proxy in `client/vite.config.ts` already forwards `/api/*` → `https://netflixallrated.up.railway.app`
- Backend code changes go in `server/` and deploy to Railway automatically via GitHub push.
- Frontend code changes go in `client/` and run live on Replit.

---

## Project structure

```
client/          ← React 18 + Vite + Tailwind (runs on Replit)
  src/
    lib/auth.tsx        ← Supabase Auth context (signIn/signUp/signOut)
    lib/supabase.ts     ← Supabase client (initialized from /api/config)
    lib/api.ts          ← Fetch helpers
    pages/              ← Home, TitleDetail, Watchlist, Admin, Login, etc.
    components/
      layout/           ← TopNav (unified nav bar — replaces SideRail + Navbar + BottomNav)
      sections/         ← HeroSection, ContentRow, TopTenRow
      ui/               ← ContentCard, FilterPill, SkeletonCard
    hooks/              ← useScrollDirection, useMediaQuery, useClickOutside
    styles/             ← design-tokens.css, animations.css

server/          ← Express + Prisma (deploy to Railway via GitHub)
  src/
    server.ts           ← Entry point, Express app, auto-sync on startup
    routes/             ← auth, titles, watchlist, platforms, showbox, netmirror, config, consumet, screenscape
    middleware/auth.ts  ← Supabase token verify → upserts user in DB
    lib/prisma.ts       ← Prisma client singleton
    lib/supabase.ts     ← Server-side Supabase client (token verify only)
    lib/sync.ts         ← TMDB catalog sync logic
  prisma/
    schema.prisma       ← DB schema (User, Title, Rating, WatchlistItem, Platform, KV)

lib/             ← Shared utilities (geo, region config, TMDB helpers)
```

---

## Authentication flow

1. Client fetches `/api/config` → gets `supabaseUrl` + `supabaseAnonKey` from Railway server
2. Client initialises Supabase with those keys
3. User signs in via Supabase Auth → gets a JWT access token
4. All protected API calls send `Authorization: Bearer <token>`
5. Railway server verifies token via `supabase.auth.getUser(token)` → upserts user in DB

**Making an account admin:**
```bash
curl -X POST https://netflixallrated.up.railway.app/api/auth/promote \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","adminPassword":"YOUR_ADMIN_PASSWORD"}'
```
Or set `ADMIN_EMAIL` secret on Railway — that email auto-gets ADMIN on first login.

---

## Key API routes (all served from Railway)

| Route | Auth | Purpose |
|---|---|---|
| `GET /api/config` | public | Returns supabaseUrl + supabaseAnonKey to client |
| `GET /api/health` | public | Health check |
| `GET /api/auth/me` | required | Current user (includes role) |
| `PATCH /api/auth/me` | required | Update display name / avatar |
| `POST /api/auth/promote` | required + ADMIN_PASSWORD | Promote user to ADMIN |
| `GET /api/titles` | public | Browse/search titles |
| `GET /api/titles/:id` | public | Title detail |
| `POST /api/titles/:id/ratings` | required | Rate a title |
| `GET /api/titles/tmdb-search` | admin | Search TMDB |
| `POST /api/titles/import-tmdb` | admin | Import single title from TMDB |
| `POST /api/titles/sync-tmdb` | admin | Bulk import trending |
| `POST /api/titles/backfill-images` | admin | Backfill missing TMDB posters |
| `GET/POST/PATCH/DELETE /api/watchlist` | required | Watchlist CRUD |
| `GET /api/platforms` | public | Streaming platforms |
| `GET /api/showbox/link` | required | Showbox/Febbox stream links |
| `GET /api/netmirror` | required | NetMirror stream proxy |
| `GET /api/consumet/*` | required | Consumet media info (anime/TMDB) |

---

## Secrets / environment variables

Secrets live on **Railway** (server) and **Replit** (homepage uses `VITE_TMDB_API_KEY` directly; other config comes from `/api/config`).

| Key | Where | Purpose |
|---|---|---|
| `VITE_TMDB_API_KEY` | **Replit** | Direct TMDB API calls from the homepage client |
| `SUPABASE_URL` | Railway | Supabase project URL |
| `SUPABASE_ANON_KEY` | Railway | Supabase anon key (served to client via /api/config) |
| `TMDB_API_KEY` | Railway | TMDB catalog sync + search |
| `ADMIN_PASSWORD` | Railway | Self-promote endpoint guard |
| `ADMIN_EMAIL` | Railway | Optional: auto-admin on first login |
| `FEB_BOX_TOKEN` | Railway | Febbox stream token |
| `SHOWBOX_FEB_BOX_API_URL` | Railway | Febbox API base URL |
| `NETMIRROR_API_KEY` | Railway | NetMirror stream provider |
| `ACETERNITY_API_KEY` | Railway | Aceternity UI key (served via /api/config) |
| `SCREENSCAPE_API_KEY` | Railway | Screenscape provider |
| `DATABASE_URL` | Railway | PostgreSQL connection string |
| `PORT` | Railway | 3000 |
| `CLIENT_URL` | Railway | CORS origin (Replit domain) |

---

## User preferences

- Keep existing monorepo structure (`client/` + `server/`)
- Do NOT restructure or migrate the stack
- Supabase Auth — do not replace with Replit Auth
- Backend always on Railway — do not run locally on Replit
- After backend changes: push to GitHub → Railway auto-deploys
