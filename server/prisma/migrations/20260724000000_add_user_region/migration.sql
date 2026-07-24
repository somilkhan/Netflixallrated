-- AlterTable: add region and language preference columns to User
ALTER TABLE "User" ADD COLUMN "region"   TEXT;
ALTER TABLE "User" ADD COLUMN "language" TEXT;
