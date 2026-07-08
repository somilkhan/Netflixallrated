---
name: Consumet Integration
description: @consumet/extensions setup — which providers exist in the Ronyt99 fork, route structure, and known quirks
---

## Provider availability (ronyt99/consumet.ts fork)

This project uses a **fork** of consumet at `https://github.com/ronyt99/consumet.ts`.
Gogoanime is **removed** from this fork. Available providers:

- `ANIME.Hianime`, `ANIME.AnimeKai`, `ANIME.AnimePahe`, `ANIME.KickAssAnime`, `ANIME.AnimeSaturn`, `ANIME.AnimeUnity`, `ANIME.AnimeSama`
- `MOVIES.FlixHQ`, `MOVIES.DramaCool`, `MOVIES.Goku`, `MOVIES.Turkish`, `MOVIES.SFlix`, `MOVIES.HiMovies`
- `META.Anilist` (wraps Hianime by default in this fork), `META.TMDB` (wraps HiMovies by default), `META.Myanimelist`

**Why:** Gogoanime was removed upstream in this fork. Always use `META.Anilist` for anime (uses Hianime) and `META.TMDB` for movies/TV.

## TypeScript quirks

- `META.TMDB.fetchMediaInfo(mediaId, type)` — `type` is **required** in the TS types even though it has a runtime default. Pass `'movie'` or `'tv'` explicitly.
- `META.Anilist.fetchAnimeInfo(id, dub?, fetchFiller?)` — dub/filler are optional, id alone works fine.

## Route structure

All routes under `/api/consumet/*` in `server/src/routes/consumet.ts`:
- `/anime/search?q=` → META.Anilist.search
- `/anime/info/:anilistId` → META.Anilist.fetchAnimeInfo (returns totalEpisodes + episodes[])
- `/anime/stream/:episodeId` (URL-encoded) → META.Anilist.fetchEpisodeSources
- `/movies/search?q=` → META.TMDB.search
- `/movies/info/:mediaId?type=movie|tv` → META.TMDB.fetchMediaInfo
- `/movies/stream?mediaId=&episodeId=` → META.TMDB.fetchEpisodeSources
- `/movies/auto?title=&type=MOVIE|SERIES&season=&ep=` → all-in-one search→stream→playerUrl
- `/player?src=&ref=` → self-contained HTML page playing HLS via hls.js CDN (for iframe embed)

**Why:** Client iframes `/api/consumet/player` so no hls.js bundle needed client-side; avoids CORS.

## Error handling

All routes log `err.message` server-side only and return generic messages to clients. Never return raw upstream error text.

## TitleDetail integration

- Anime: `animeProvider` state (`'anicrush' | 'gogoanime'`) toggles between Anicrush and Hianime (labelled "GogoAnime" in UI)
- Gogo/Hianime state must be reset at the start of the title useEffect to prevent stale data bleed across navigations
- Movies/TV: FlixHQ is a SERVERS entry; URL is resolved async via `/movies/auto` when serverId === 'flixhq'
- FlixHQ failures surface via `flixhqError` state shown above the video container

## Vercel deployment fix

The repo had `@react-three/fiber@^9.6.1` in client/package.json (requires React 19) but the project uses React 18. This was removed. If peer dep errors appear again in Vercel builds, check client/package.json for three.js-related packages.
