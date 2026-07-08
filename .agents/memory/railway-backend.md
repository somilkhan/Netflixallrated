---
name: Railway backend setup
description: Backend runs exclusively on Railway, not Replit. Critical rules for any agent working on this project.
---

## Rule
The Express + Prisma backend lives permanently on Railway at `https://netflixallrated.up.railway.app`. Replit only runs the React frontend.

**Why:** User deliberately split the stack — Railway for backend/DB, Replit for frontend dev. Running a local API server on Replit is wrong and will break things.

**How to apply:**
- NEVER create or run an `API Server` workflow on Replit
- NEVER run `cd server && npm run dev` on Replit
- The only Replit workflow is `Start application` → `cd client && npm run dev` (port 5000)
- `client/vite.config.ts` proxy: `/api` → `https://netflixallrated.up.railway.app`
- Frontend changes: edit `client/`, visible instantly on Replit
- Backend changes: edit `server/`, then push to GitHub → Railway auto-deploys
- Database is PostgreSQL managed by Railway (Prisma ORM, schema at `server/prisma/schema.prisma`)
- All secrets (SUPABASE_URL, SUPABASE_ANON_KEY, TMDB_API_KEY, etc.) live on Railway, not Replit
