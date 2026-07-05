-- CreateEnum
CREATE TYPE "TitleType" AS ENUM ('MOVIE', 'SERIES', 'ANIME');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('SKIP', 'TIMEPASS', 'GOFORIT', 'PERFECTION');

-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('PLAN_TO_WATCH', 'WATCHING', 'COMPLETED', 'DROPPED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Title" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TitleType" NOT NULL,
    "year" INTEGER NOT NULL,
    "runtimeMinutes" INTEGER,
    "genres" TEXT[],
    "synopsis" TEXT NOT NULL,
    "posterColorFrom" TEXT NOT NULL,
    "posterColorTo" TEXT NOT NULL,
    "trailerYoutubeId" TEXT,
    "officialWatchLinks" JSON,
    "tmdbId" INTEGER,
    "posterUrl" TEXT,
    "backdropUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Title_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "tier" "Tier" NOT NULL,
    "reviewText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "status" "WatchStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbr" TEXT NOT NULL,
    "iconUrl" TEXT,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitlePlatform" (
    "titleId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,

    CONSTRAINT "TitlePlatform_pkey" PRIMARY KEY ("titleId","platformId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Title_tmdbId_key" ON "Title"("tmdbId");

-- CreateIndex
CREATE INDEX "Rating_titleId_idx" ON "Rating"("titleId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_titleId_key" ON "Rating"("userId", "titleId");

-- CreateIndex
CREATE INDEX "WatchlistItem_userId_idx" ON "WatchlistItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_userId_titleId_key" ON "WatchlistItem"("userId", "titleId");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_abbr_key" ON "Platform"("abbr");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitlePlatform" ADD CONSTRAINT "TitlePlatform_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitlePlatform" ADD CONSTRAINT "TitlePlatform_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;
