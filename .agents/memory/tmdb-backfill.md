---
name: TMDB Backfill Endpoint
description: How the backfill-images admin endpoint works and its constraints
---

## Rule
POST /api/titles/backfill-images requires TMDB_API_KEY in Replit Secrets. Updates posterUrl/backdropUrl/trailerYoutubeId for every title where posterUrl IS NULL.

## How it works
- Has tmdbId → getTmdbDetails(tmdbId) directly (300ms delay)
- No tmdbId → searchTmdb(name), pick year-match or first result, getTmdbDetails (600ms delay — 2 requests)
- Before writing tmdbId, checks uniqueness conflict; skips tmdbId write if conflict (still writes poster/backdrop)

**Why:** 63 seeded titles have NULL posterUrl. Backfill triggered from Admin page once key is configured.

## Seed data
All 63 seed titles now have tmdbId in seed.ts EXCEPT "Demon Slayer: Hashira Training Arc" (shares tmdbId 85937 with Demon Slayer — set null, backfill resolves via name search).

## Deployment
GitHub remote: https://github.com/somilkhan/Netflixallrated — Vercel auto-deploys from main. Push here to update deployed site.
