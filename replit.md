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

## Environment variables / secrets

### Secrets (Replit Secrets panel)
| Key | Purpose |
|---|---|
| `JWT_SECRET` | Signs login tokens — keep private |
| `DATABASE_URL` | Auto-provided by Replit's managed PostgreSQL |

### Env vars (shared)
| Key | Value | Purpose |
|---|---|---|
| `PORT` | 3000 | Express server port |
| `CLIENT_URL` | http://localhost:5000 | CORS allowed origin |
| `TMDB_API_BASE` | https://api.themoviedb.org/3 | TMDB base URL |
| `TMDB_IMAGE_BASE` | https://image.tmdb.org/t/p | TMDB image CDN |

### Optional secrets
| Key | Purpose |
|---|---|
| `TMDB_API_KEY` | Enables Admin panel TMDB search & title import (free key at themoviedb.org) |

## User preferences

- Keep existing project structure (client/ + server/ monorepo)
- Do not restructure or migrate the stack
