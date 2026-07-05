# Allrated

Full-stack movie/TV/anime discovery platform with a 4-tier rating system (Skip / Timepass / Go for it / Perfection), watchlist tracking, JWT auth, and an admin panel for importing titles from TMDB.

## Architecture

| Layer | Tech | Port |
|---|---|---|
| Frontend | React 18, Vite, Tailwind CSS | 5000 (webview) |
| Backend API | Express, Prisma ORM | 3000 |
| Database | Replit PostgreSQL | managed |

The client Vite dev server proxies `/api/*` to the Express server, so the browser always talks to a single origin.

## How to run

Two workflows run automatically:
- **API Server** — `cd server && npm run dev`
- **Start application** — `cd client && npm run dev`

## Database

Prisma manages the schema (`server/prisma/schema.prisma`). To reset and re-seed:

```bash
cd server
npx prisma migrate dev
npm run db:seed   # seeds 63 titles, 10 platforms, admin account
```

The seed script requires an `ADMIN_PASSWORD` secret to be set before running — it will exit with an error if missing. Set `ADMIN_EMAIL` to override the default address (`admin@allrated.local`).

## API Routes

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/auth/register` | public | Create account |
| `POST /api/auth/login` | public | Login, returns JWT |
| `GET /api/auth/me` | required | Current user |
| `GET /api/titles` | public | Browse/search titles |
| `GET /api/titles/:id` | public | Title detail |
| `POST /api/titles/:id/ratings` | required | Rate a title |
| `GET/POST/PATCH/DELETE /api/watchlist` | required | Watchlist CRUD |
| `GET /api/platforms` | public | Streaming platforms |
| `GET /api/netmirror` | required | NetMirror proxy |
| `GET /api/netmirror/stream?id=` | required | NetMirror stream links |
| `GET /api/showbox/link?type=&id=` | required | Showbox/Febbox download links |
| `GET /api/config` | public | Public client config (Supabase keys, Aceternity key) |

## Environment variables / secrets

### Secrets (Replit Secrets panel)
| Key | Purpose |
|---|---|
| `JWT_SECRET` | Signs login tokens — keep private |
| `DATABASE_URL` | Auto-provided by Replit's managed PostgreSQL |
| `TMDB_API_KEY` | Admin panel TMDB search & import |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase public anon key |
| `ACETERNITY_API_KEY` | Aceternity UI (served to client via /api/config) |
| `FEB_BOX_TOKEN` | Febbox download link token |
| `SHOWBOX_FEB_BOX_API_URL` | Showbox/Febbox API base URL |
| `NETMIRROR_API_KEY` | NetMirror premium stream provider |
| `ADMIN_PASSWORD` | Used to seed the admin account |
| `ADMIN_EMAIL` | Admin email (default: admin@allrated.local) |

### Env vars (shared)
| Key | Value | Purpose |
|---|---|---|
| `PORT` | 3000 | Express server port |
| `CLIENT_URL` | http://localhost:5000 | CORS allowed origin |
| `TMDB_API_BASE` | https://api.themoviedb.org/3 | TMDB base URL |
| `TMDB_IMAGE_BASE` | https://image.tmdb.org/t/p | TMDB image CDN |

## Vercel deployment

`vercel.json` is configured at the root. When you push to Vercel:
1. It builds the client (`client/npm run build` → `client/dist`)
2. The Express server is deployed as a single serverless function (`api/index.ts`)
3. `/api/*` requests route to the serverless function; everything else serves the SPA

**Before deploying to Vercel**, add all secrets from the table above to your Vercel project's Environment Variables. The `DATABASE_URL` must point to an external PostgreSQL instance (not Replit's — Vercel can't reach it). Options: Supabase Postgres, Neon, Railway, PlanetScale.

## User preferences

- Keep existing project structure (client/ + server/ monorepo)
- Do not restructure or migrate the stack
