---
name: Supabase Auth integration
description: How Supabase Auth replaces bcrypt/JWT in Allrated; server-side verification pattern and user sync.
---

## Rule
Client authenticates via Supabase JS (`signInWithPassword`/`signUp`). Server verifies tokens by calling `supabase.auth.getUser(token)` using the anon key client. On every authenticated request, the server upserts the user in Neon DB using the Supabase UUID as the primary key.

**Why:** Supabase Auth provides cross-device sessions, password reset emails, and token refresh out of the box. The anon key is sufficient for `auth.getUser` — no service role key needed.

## How to apply
- `server/src/lib/supabase.ts` — singleton Supabase client (anon key, no session persistence)
- `server/src/middleware/auth.ts` — `_authenticate` calls `auth.getUser`, upserts Neon user, sets `req.user`
- `client/src/lib/auth.tsx` — `AuthProvider` fetches config from `/api/config`, inits Supabase, listens on `onAuthStateChange`, syncs token to `localStorage.token` for the api fetcher
- `client/src/lib/api.ts` — reads `localStorage.token`; Supabase auth listener keeps it fresh

## SUPABASE_URL quirk
The stored `SUPABASE_URL` secret may have `/rest/v1/` appended. Both server (`lib/supabase.ts`) and client (`lib/supabase.ts`) normalize by stripping `/rest|auth|storage|realtime` path prefixes before passing to `createClient`.

## Legacy migration
If a user signed up pre-Supabase (old UUID in Neon), first Supabase login triggers a transactional migration: creates new row with Supabase UUID, re-links ratings+watchlist via `updateMany`, deletes old row. Role is preserved.
