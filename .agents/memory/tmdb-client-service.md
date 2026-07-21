---
name: TMDB client-side service
description: Homepage calls TMDB API directly from the browser using VITE_TMDB_API_KEY; service lives at client/src/services/tmdb.ts
---

# TMDB client-side service

## Rule
The homepage (`client/src/pages/Home.tsx`) fetches all content rows directly from `api.themoviedb.org/3` using the browser-side `VITE_TMDB_API_KEY` secret (set in Replit Secrets). No backend relay for homepage data.

**Why:** User explicitly rebuilt the homepage to call TMDB directly rather than through the Railway backend, so all sections show live real-time data without requiring the backend to have a seeded database.

## How to apply
- TMDB service: `client/src/services/tmdb.ts` — exports `getTrending`, `getPopularMovies`, `getPopularTVShows`, `getTopRatedMovies`, `getTopRatedTVShows`, `getNowPlayingMovies`, `getGenres`, `getMovieVideos`, `getTVVideos`, `hasTmdbKey()`, `type TmdbNormalized`
- Key check: call `hasTmdbKey()` before rendering — returns false if env var missing, Home shows `NoKeyBanner`
- TMDB items navigated via `TmdbContentCard` (`client/src/components/TmdbContentCard.tsx`) which calls `api.titles.resolveTmdb(tmdbId, mediaType)` → backend get-or-create → navigate to `/title/:id`
- Hero uses `onAction` prop added to `HeroSection` for the same resolve-then-navigate flow
- ContentCard has optional `onNavigate?: (play?: boolean) => void` prop to override default navigation
- TopTenRow has optional `renderCard?: (item, index) => ReactNode` prop for custom card rendering
- 5-minute client-side TTL cache built into the service (no network lib dependency — uses fetch)
