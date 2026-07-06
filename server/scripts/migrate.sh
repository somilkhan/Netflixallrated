#!/bin/sh
# Baseline existing migrations (safe to re-run — ignored if already tracked)
npx prisma migrate resolve --applied 20260705163320_init 2>/dev/null || true
npx prisma migrate resolve --applied 20260705_supabase_auth 2>/dev/null || true
# Apply only new/pending migrations
npx prisma migrate deploy
