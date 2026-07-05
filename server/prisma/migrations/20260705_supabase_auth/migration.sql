-- Migration: supabase_auth
-- Removes passwordHash (Supabase Auth handles passwords now).
-- Drops the DB-level default on User.id (UUID is now provided by Supabase).

ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordHash";
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;
