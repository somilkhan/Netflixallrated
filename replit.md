# Allrated

Full-stack movie/TV/anime discovery platform with a 4-tier rating system (Skip / Timepass / Go for it / Perfection), watchlist tracking, Supabase Auth, and an admin panel for importing titles from TMDB.

## ⚠️ Replit setup — READ FIRST

**Replit only runs the frontend.** The backend lives on Railway:

> **Railway backend URL: `https://netflixallrated.up.railway.app`**

- Do NOT start or create an API Server workflow on Replit.
- Do NOT run `cd server && npm run dev` locally.
- The Vite proxy in `client/vite.config.ts` forwards `/api/*` to the Railway URL.
- Any backend changes must be made in the `server/` folder and deployed to Railway via GitHub push.

## Architecture

| Layer | Tech | Where |
|---|---|---|
| Frontend | React 18, Vite, Tailwind CSS | Replit (port 5000) |
| Backend API | Express, Prisma ORM | Railway (`https://netflixallrated.up.railway.app`) |
| Database | PostgreSQL via Prisma | Railway (managed) |
| Auth | Supabase Auth (client) + token verify (server) | Supabase + Railway |

## How to run on Replit

One workflow only:
- **Start application** — `cd client && npm run dev`

## Authentication (Supabase Auth)

Sign-in and sign-up are handled entirely by Supabase Auth on the client side. The server verifies Supabase access tokens via `supabase.auth.getUser(token)` and auto-upserts the user into the Neon/Postgres DB on first login.

**To make yourself admin:**
1. Register / sign in via the app (you get `USER` role by default).
2. Call the promote endpoint once — requires your own valid JWT + the admin password:
   ```bash
   curl -X POST https://YOUR-DOMAIN/api/auth/promote \
     -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"email":"you@example.com","adminPassword":"YOUR_ADMIN_PASSWORD"}'
   ```
3. Sign out and sign back in — your session will now reflect `ADMIN` role.

**Alternative:** Set `ADMIN_EMAIL` secret before your first sign-in. Any user with that email is auto-granted `ADMIN` on their first login.

**Supabase email confirmation:** By default Supabase requires email verification. To skip it during dev, go to Supabase Dashboard → Authentication → Providers → Email → disable "Confirm email".

## Database

Prisma manages the schema (`server/prisma/schema.prisma`). To re-seed titles:

```bash
cd server
npm run db:seed   # seeds 63 titles, 10 platforms (no admin user — handled by Supabase Auth now)
```

## API Routes

| Route | Auth | Purpose |
|---|---|---|
| `GET /api/auth/me` | required | Current user (Neon DB, includes role) |
| `PATCH /api/auth/me` | required | Update display name / avatar |
| `POST /api/auth/promote` | required + admin password | Promote user to ADMIN |
| `GET /api/titles` | public | Browse/search titles |
| `GET /api/titles/:id` | public | Title detail |
| `POST /api/titles/:id/ratings` | required | Rate a title |
| `GET /api/titles/tmdb-search` | admin | Search TMDB |
| `POST /api/titles/import-tmdb` | admin | Import single title from TMDB |
| `POST /api/titles/sync-tmdb` | admin | Bulk import this week's trending |
| `GET/POST/PATCH/DELETE /api/watchlist` | required | Watchlist CRUD |
| `GET /api/platforms` | public | Streaming platforms |
| `GET /api/netmirror` | required | NetMirror proxy |
| `GET /api/netmirror/stream?id=` | required | NetMirror stream links |
| `GET /api/showbox/link?type=&id=` | required | Showbox/Febbox download links |
| `GET /api/config` | public | Public client config (Supabase keys, Aceternity key) |
| `GET /api/health` | public | Health check |

## Environment variables / secrets

### Secrets (Replit Secrets panel → Vercel Environment Variables)
| Key | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Supabase public anon key |
| `TMDB_API_KEY` | Admin panel TMDB search, import, and bulk sync |
| `ADMIN_PASSWORD` | Used by `/api/auth/promote` to self-bootstrap an admin |
| `ADMIN_EMAIL` | Optional: auto-grants ADMIN role to this email on first login |
| `FEB_BOX_TOKEN` | Febbox download link token |
| `SHOWBOX_FEB_BOX_API_URL` | Showbox/Febbox API base URL |
| `NETMIRROR_API_KEY` | NetMirror premium stream provider |
| `ACETERNITY_API_KEY` | Aceternity UI (served to client via /api/config) |
| `SESSION_SECRET` | Reserved |

> `JWT_SECRET` is no longer needed — Supabase handles token signing.

### Env vars (shared)
| Key | Value | Purpose |
|---|---|---|
| `PORT` | 3000 | Express server port |
| `CLIENT_URL` | http://localhost:5000 | CORS allowed origin (update in Vercel) |
| `TMDB_API_BASE` | https://api.themoviedb.org/3 | TMDB base URL |
| `TMDB_IMAGE_BASE` | https://image.tmdb.org/t/p | TMDB image CDN |

## Vercel deployment

`vercel.json` is configured at the root. The build command runs automatically:
1. `cd server && npm install && npx prisma generate && npx prisma migrate deploy`
2. `cd client && npm install && npm run build`
3. Express app deploys as a single serverless function (`api/index.ts`)
4. `/api/*` routes to the function; everything else serves the SPA

**Required Vercel environment variables:**
- `DATABASE_URL` → your Neon connection string (pooled URL)
- All secrets from the table above
- `CLIENT_URL` → your Vercel app domain (e.g. `https://allrated.vercel.app`)

**Neon setup:**
1. Create a project at [neon.tech](https://neon.tech)
2. Copy the pooled connection string
3. Add it as `DATABASE_URL` in Vercel environment variables
4. Prisma migrations run automatically on first deploy via `prisma migrate deploy`

## User preferences

- Keep existing project structure (client/ + server/ monorepo)
- Do not restructure or migrate the stack
- Supabase Auth for cross-device login
- Neon DB for production (Vercel)
- After every clean build, commit and push to GitHub automatically
