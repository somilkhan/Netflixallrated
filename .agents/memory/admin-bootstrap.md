---
name: Admin bootstrap flow
description: How to grant the first admin user ADMIN role after switching to Supabase Auth.
---

## Rule
There are no `/api/auth/register` or `/api/auth/login` server routes — Supabase handles those. To get admin:

**Option A (before first login):** Set `ADMIN_EMAIL` env var. Any user with that email gets `ADMIN` role on first login.

**Option B (after first login):** Call `POST /api/auth/promote` with a valid Bearer token + `adminPassword` matching `ADMIN_PASSWORD` secret.

**Why:** Removing register/login simplifies the server. The promote endpoint requires authentication (valid Supabase JWT) + the admin password — double gating prevents unauthenticated escalation.

## How to apply
- `server/src/routes/auth.ts` — `promote` route uses `authenticate` middleware + checks `ADMIN_PASSWORD`
- `server/src/middleware/auth.ts` — on create, checks `process.env.ADMIN_EMAIL` and assigns ADMIN if matched
