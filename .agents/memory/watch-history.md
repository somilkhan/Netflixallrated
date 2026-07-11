---
name: Watch History feature
description: Architecture and gotchas for the Continue Watching / Watch History system added in July 2026.
---

## Rule
Watch progress is tracked server-side via the `WatchProgress` Prisma model. The frontend tracks wall-clock elapsed time (not iframe `currentTime`, which is cross-origin blocked) and saves to `/api/history` every 30 s while playing, plus on stop and unmount.

**Why:** iframes from third-party embed providers (vidsrc, febbox, anicrush, etc.) are cross-origin — `contentWindow.currentTime` throws. Wall-clock seconds since play-start is the only reliable signal.

**How to apply:**
- `progressBaseRef` accumulates saved position across sessions; `playStartRef` holds `Date.now()` when play starts; `currentPositionSeconds()` = base + elapsed.
- On back-navigation to a title, the saved `positionSeconds` is fetched from `/api/history/me/:titleId` and loaded into `progressBaseRef`, and `seasonNumber`/`episodeNumber` are restored to state.
- `selectedSeason` and `selectedEp` must be declared BEFORE the `saveProgress` useCallback in TitleDetail.tsx — they were moved to ~line 101 for this reason.
- The `WatchProgress` migration (`20260711013926_add_watch_progress`) was applied directly to Railway's production DB via `./node_modules/.bin/prisma migrate dev` (DATABASE_URL env var is present in the Replit environment).
- Backend code (new route + schema) must be pushed to GitHub (`gitPush({})` via CodeExecution) for Railway to auto-deploy. Direct `git push` via shell fails — no token in shell env; use the `gitPush` callback instead.
- Continue Watching row in Home only shows items with `positionSeconds > 10` and `completed === false`.
- `fetchpriority` on `<img>` must use spread `{...{ fetchpriority: '...' }}` to bypass React 18 TS type check (React 18 doesn't recognise the camelCase `fetchPriority` prop).
