---
name: Neon DB strategy
description: Two-database strategy — Replit managed PG for dev, Neon for Vercel production.
---

## Rule
Dev (Replit): `DATABASE_URL` is runtime-managed by Replit and points to the local managed PostgreSQL. Do NOT try to override it — Replit rejects manual updates to runtime-managed keys.

Production (Vercel): `DATABASE_URL` must be set manually in Vercel's environment variables and should point to a Neon pooled connection string.

**Why:** Replit's managed PG is not reachable from Vercel serverless functions. Neon is publicly accessible and works well with Prisma + serverless.

## How to apply
- `server/prisma/schema.prisma` — `binaryTargets = ["native", "rhel-openssl-1.0.x"]` for Vercel
- `vercel.json` buildCommand includes `npx prisma migrate deploy` so schema is applied on first deploy
- Neon connection string goes in Vercel env vars as `DATABASE_URL`
- For Neon, optionally add `DIRECT_URL` (non-pooled) if Prisma migration introspection is needed
