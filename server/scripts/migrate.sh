#!/bin/sh
# Apply all pending migrations. prisma migrate deploy is idempotent:
# it checks the _prisma_migrations table and only runs what hasn't run yet.
# Do NOT call "migrate resolve --applied" here — that skips execution on fresh DBs.
npx prisma migrate deploy
