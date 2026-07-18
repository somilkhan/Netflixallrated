import { Router, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import {
  searchTmdb, getTmdbDetails, getTvSeasons, getTvEpisodes,
  getWatchProviders, getSimilarTmdb, getRecommendationsTmdb, getCreditsTmdb, getTmdbCategory,
  listWatchProviders,
} from '../lib/tmdb.js';
import { syncTmdbCatalog, resetSyncProgress } from '../lib/sync.js';
import { SyncCallerType, sanitizeErrorDetail, recordSyncRun } from '../lib/syncStatus.js';

const router = Router();

// Curated gradient palette matching the app's maroon/amber design language.
const POSTER_PALETTE = [
  { from: '#1a1510', to: '#0a0908' },
  { from: '#1c1410', to: '#0a0807' },
  { from: '#1a1018', to: '#0a0708' },
  { from: '#101018', to: '#07070a' },
  { from: '#181020', to: '#0a080c' },
  { from: '#101820', to: '#080a0c' },
  { from: '#201008', to: '#0c0604' },
];
function randomPalette() { return POSTER_PALETTE[Math.floor(Math.random() * POSTER_PALETTE.length)]; }

/** Attach each title's real most-common rating tier (or null if unrated) —
 * used by rows that show a community-verdict badge, so it's never faked. */
async function attachTopTier<T extends { id: string }>(titles: T[]): Promise<(T & { topTier: string | null })[]> {
  if (titles.length === 0) return [];
  const grouped = await prisma.rating.groupBy({
    by: ['titleId', 'tier'],
    where: { titleId: { in: titles.map(t => t.id) } },
    _count: { tier: true },
  });
  const best: Record<string, { tier: string; count: number }> = {};
  for (const row of grouped) {
    const current = best[row.titleId];
    if (!current || row._count.tier > current.count) {
      best[row.titleId] = { tier: row.tier, count: row._count.tier };
    }
  }
  return titles.map(t => ({ ...t, topTier: best[t.id]?.tier ?? null }));
}

router.get('/', async (req, res) => {
  const { type, genre, platform, search, page = '1', limit = '20', sort } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = Math.min(parseInt(limit as string) || 20, 50);
  const currentYear = new Date().getFullYear();
  const where: any = { year: { lte: currentYear } }; // never serve unreleased titles
  if (type) where.type = type;
  if (genre) where.genres = { has: genre as string };
  if (search) { where.OR = [{ name: { contains: search as string, mode: 'insensitive' } }, { synopsis: { contains: search as string, mode: 'insensitive' } }]; }
  if (platform) {
    const links = await prisma.titlePlatform.findMany({ where: { platform: { abbr: platform as string } }, select: { titleId: true } });
    where.id = { in: links.map(l => l.titleId) };
  }
  // "popular" = most community ratings (real signal, not fake) — used for "Top Rated" rows.
  const orderBy = sort === 'popular'
    ? [{ ratings: { _count: 'desc' as const } }, { year: 'desc' as const }]
    : { createdAt: 'desc' as const };
  const [titles, count] = await Promise.all([
    prisma.title.findMany({ where, skip, take, orderBy, include: { platforms: { include: { platform: true } }, _count: { select: { ratings: true } } } }),
    prisma.title.count({ where }),
  ]);
  res.json({ titles: sort === 'popular' ? await attachTopTier(titles) : titles, total: count, page: parseInt(page as string), pages: Math.ceil(count / take) });
});

router.get('/top10', async (_req, res) => {
  const currentYear = new Date().getFullYear();
  const titles = await prisma.title.findMany({
    take: 10,
    where: { posterUrl: { not: null }, year: { lte: currentYear } },
    orderBy: [{ ratings: { _count: 'desc' } }, { year: 'desc' }],
    include: { platforms: { include: { platform: true } }, _count: { select: { ratings: true } } },
  });
  res.json(await attachTopTier(titles));
});

// Must be defined before /:id to avoid Express treating "seasons"/"episodes" as an ID
router.get('/:id/seasons', async (req, res) => {
  const title = await prisma.title.findUnique({ where: { id: req.params.id }, select: { tmdbId: true, type: true } });
  if (!title || !title.tmdbId || title.type !== 'SERIES') return res.json([]);
  try { res.json(await getTvSeasons(title.tmdbId)); }
  catch (err) { res.status(502).json({ error: 'TMDB seasons failed', detail: sanitizeErrorDetail((err as Error).message) }); }
});

router.get('/:id/episodes', async (req, res) => {
  const title = await prisma.title.findUnique({ where: { id: req.params.id }, select: { tmdbId: true, type: true } });
  if (!title || !title.tmdbId || title.type !== 'SERIES') return res.json([]);
  const season = Math.max(1, parseInt(req.query.season as string) || 1);
  try { res.json(await getTvEpisodes(title.tmdbId, season)); }
  catch (err) { res.status(502).json({ error: 'TMDB episodes failed', detail: sanitizeErrorDetail((err as Error).message) }); }
});

// Returns distinct genres with counts + type counts — used by the Categories page
router.get('/genres', async (_req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const titles = await prisma.title.findMany({
      select: { genres: true, type: true },
      where: { year: { lte: currentYear } },
    });
    // Count genres and types in JS — avoids raw SQL across all DB providers
    const genreMap: Record<string, number> = {};
    const typeMap: Record<string, number> = {};
    for (const t of titles) {
      for (const g of t.genres) genreMap[g] = (genreMap[g] || 0) + 1;
      typeMap[t.type] = (typeMap[t.type] || 0) + 1;
    }
    res.json({
      genres: Object.entries(genreMap)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count),
      types: Object.entries(typeMap).map(([type, count]) => ({ type, count })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

/**
 * POST /api/titles/resolve-tmdb
 * Public, idempotent "get-or-create" for a raw TMDB item (e.g. a geo/discover
 * row card that has no local DB row yet). Returns the local title id so the
 * client can navigate straight to /title/:id — the standard detail/player
 * flow — instead of falling back to search.
 */
const resolveTmdbSchema = z.object({
  // TMDB ids are positive integers well under 1e9 — bounding the input keeps
  // this public endpoint from being used to probe/spam arbitrary values.
  tmdbId: z.number().int().positive().max(1_000_000_000),
  mediaType: z.enum(['movie', 'tv']),
});

// Tighter than the global limiter — this endpoint can create DB rows and
// burn TMDB quota, so it needs its own per-IP ceiling.
const resolveTmdbLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/resolve-tmdb', resolveTmdbLimiter, async (req, res) => {
  const parsed = resolveTmdbSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { tmdbId, mediaType } = parsed.data;

  try {
    const existing = await prisma.title.findUnique({ where: { tmdbId } });
    if (existing) return res.json({ id: existing.id });

    const details = await getTmdbDetails(tmdbId, mediaType);
    const palette = randomPalette();
    try {
      const created = await prisma.title.create({
        data: {
          name: details.name,
          type: mediaType === 'movie' ? 'MOVIE' : 'SERIES',
          year: details.year,
          runtimeMinutes: details.runtimeMinutes ?? undefined,
          genres: details.genres,
          synopsis: details.synopsis,
          posterColorFrom: palette.from,
          posterColorTo: palette.to,
          trailerYoutubeId: details.trailerYoutubeId ?? undefined,
          tmdbId: details.tmdbId,
          posterUrl: details.posterUrl ?? undefined,
          backdropUrl: details.backdropUrl ?? undefined,
          officialWatchLinks: [],
        },
      });
      res.json({ id: created.id });
    } catch (createErr: any) {
      // Concurrent requests for the same tmdbId can race past the initial
      // findUnique — on a unique-constraint violation, just return the row
      // the other request created instead of a spurious 502.
      if (createErr?.code === 'P2002') {
        const race = await prisma.title.findUnique({ where: { tmdbId } });
        if (race) return res.json({ id: race.id });
      }
      throw createErr;
    }
  } catch (err) {
    res.status(502).json({ error: 'Could not resolve title', detail: sanitizeErrorDetail((err as Error).message) });
  }
});

/**
 * POST /api/titles/resolve-anilist
 * Public, idempotent "get-or-create" for a raw AniList anime item (e.g. a
 * card in the Anime section that has no local DB row yet). Returns the local
 * title id so the client can navigate to /title/:id — the same unified
 * detail/player flow used by Movies and TV — instead of a separate page.
 *
 * TMDB remains the primary source for artwork whenever a confident match is
 * found; otherwise we fall back to the AniList assets supplied by the caller.
 */
const resolveAnilistSchema = z.object({
  anilistId: z.number().int().positive().max(1_000_000_000),
  name: z.string().min(1).max(500),
  romaji: z.string().max(500).optional(),
  year: z.number().int().positive().max(3000).optional(),
  genres: z.array(z.string().max(100)).max(20).optional(),
  synopsis: z.string().max(5000).optional(),
  posterUrl: z.string().url().max(2000).optional(),
  backdropUrl: z.string().url().max(2000).optional(),
});

const resolveAnilistLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/resolve-anilist', resolveAnilistLimiter, async (req, res) => {
  const parsed = resolveAnilistSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { anilistId, name, romaji, year, genres, synopsis, posterUrl, backdropUrl } = parsed.data;

  try {
    const existing = await prisma.title.findUnique({ where: { anilistId } });
    if (existing) return res.json({ id: existing.id });

    // Best-effort TMDB match — anime is often catalogued as a TV show on TMDB.
    // If found, TMDB stays the artwork/video/discovery source of truth; if not,
    // we gracefully fall back to the AniList-supplied assets.
    let tmdbMatch: { tmdbId: number; posterUrl?: string | null; backdropUrl?: string | null; trailerYoutubeId?: string | null; runtimeMinutes?: number | null } | null = null;
    try {
      // Try the English title first, then fall back to Romaji — either can
      // be the better TMDB match depending on how the title is catalogued.
      const candidates = [name, romaji].filter((n, i, arr): n is string => !!n && arr.indexOf(n) === i);
      let tvHit: { tmdbId: number; mediaType: 'movie' | 'tv' } | undefined;
      for (const candidate of candidates) {
        const results = await searchTmdb(candidate);
        tvHit = results.find(r => r.mediaType === 'tv') || results[0];
        if (tvHit) break;
      }
      if (tvHit) {
        const alreadyTaken = await prisma.title.findUnique({ where: { tmdbId: tvHit.tmdbId } });
        if (!alreadyTaken) {
          const details = await getTmdbDetails(tvHit.tmdbId, tvHit.mediaType === 'movie' ? 'movie' : 'tv');
          tmdbMatch = {
            tmdbId: details.tmdbId,
            posterUrl: details.posterUrl,
            backdropUrl: details.backdropUrl,
            trailerYoutubeId: details.trailerYoutubeId,
            runtimeMinutes: details.runtimeMinutes,
          };
        }
      }
    } catch { /* TMDB lookup is best-effort — fall back to AniList assets */ }

    const palette = randomPalette();
    try {
      const created = await prisma.title.create({
        data: {
          name,
          type: 'ANIME',
          year: year ?? new Date().getFullYear(),
          genres: genres ?? [],
          synopsis: synopsis || 'No synopsis available.',
          posterColorFrom: palette.from,
          posterColorTo: palette.to,
          anilistId,
          tmdbId: tmdbMatch?.tmdbId ?? undefined,
          trailerYoutubeId: tmdbMatch?.trailerYoutubeId ?? undefined,
          runtimeMinutes: tmdbMatch?.runtimeMinutes ?? undefined,
          posterUrl: tmdbMatch?.posterUrl || posterUrl || undefined,
          backdropUrl: tmdbMatch?.backdropUrl || backdropUrl || undefined,
          officialWatchLinks: [],
        },
      });
      res.json({ id: created.id });
    } catch (createErr: any) {
      // Concurrent requests can race past the earlier findUnique checks —
      // recover on either the anilistId or the matched tmdbId collision.
      if (createErr?.code === 'P2002') {
        const race = await prisma.title.findUnique({ where: { anilistId } })
          ?? (tmdbMatch ? await prisma.title.findUnique({ where: { tmdbId: tmdbMatch.tmdbId } }) : null);
        if (race) return res.json({ id: race.id });
      }
      throw createErr;
    }
  } catch (err) {
    res.status(502).json({ error: 'Could not resolve anime', detail: sanitizeErrorDetail((err as Error).message) });
  }
});

// Region's real streaming-service logos (Netflix, Prime Video, etc.) for the
// Categories page's "Where to Watch" row. Must be declared before the
// `/:id/watch-providers` route below, or Express would match "watch-providers-list"
// as an `:id` and 404 against Prisma instead.
router.get('/watch-providers-list', async (req, res) => {
  const region = (req.query.region as string) || 'US';
  try {
    res.json(await listWatchProviders(region));
  } catch (err) {
    res.status(502).json({ error: 'Watch providers list failed', detail: sanitizeErrorDetail((err as Error).message) });
  }
});

// --- Live TMDB extras (per-title, addressed by our local title id) -------
router.get('/:id/watch-providers', async (req, res) => {
  const title = await prisma.title.findUnique({ where: { id: req.params.id }, select: { tmdbId: true, type: true } });
  if (!title?.tmdbId) return res.json({ link: null, flatrate: [], rent: [], buy: [] });
  const region = (req.query.region as string) || 'US';
  try {
    res.json(await getWatchProviders(title.tmdbId, title.type === 'MOVIE' ? 'movie' : 'tv', region));
  } catch (err) {
    res.status(502).json({ error: 'Watch providers failed', detail: sanitizeErrorDetail((err as Error).message) });
  }
});

router.get('/:id/similar', async (req, res) => {
  const title = await prisma.title.findUnique({ where: { id: req.params.id }, select: { tmdbId: true, type: true } });
  if (!title?.tmdbId) return res.json([]);
  try {
    res.json(await getSimilarTmdb(title.tmdbId, title.type === 'MOVIE' ? 'movie' : 'tv'));
  } catch (err) {
    res.status(502).json({ error: 'Similar titles failed', detail: sanitizeErrorDetail((err as Error).message) });
  }
});

router.get('/:id/recommendations', async (req, res) => {
  const title = await prisma.title.findUnique({ where: { id: req.params.id }, select: { tmdbId: true, type: true } });
  if (!title?.tmdbId) return res.json([]);
  try {
    res.json(await getRecommendationsTmdb(title.tmdbId, title.type === 'MOVIE' ? 'movie' : 'tv'));
  } catch (err) {
    res.status(502).json({ error: 'Recommendations failed', detail: sanitizeErrorDetail((err as Error).message) });
  }
});

router.get('/:id/credits', async (req, res) => {
  const title = await prisma.title.findUnique({ where: { id: req.params.id }, select: { tmdbId: true, type: true } });
  if (!title?.tmdbId) return res.json({ cast: [], crew: [] });
  try {
    res.json(await getCreditsTmdb(title.tmdbId, title.type === 'MOVIE' ? 'movie' : 'tv'));
  } catch (err) {
    res.status(502).json({ error: 'Credits failed', detail: sanitizeErrorDetail((err as Error).message) });
  }
});

// --- TMDB category rows (Top Rated / Now Playing / Upcoming / Airing Today / On The Air) ---
const MOVIE_CATEGORIES = new Set(['top_rated', 'now_playing', 'upcoming', 'popular']);
const TV_CATEGORIES = new Set(['top_rated', 'airing_today', 'on_the_air', 'popular']);
router.get('/tmdb-category', async (req, res) => {
  const mediaType = (req.query.mediaType as string) === 'tv' ? 'tv' : 'movie';
  const category = (req.query.category as string) || 'popular';
  const valid = mediaType === 'tv' ? TV_CATEGORIES : MOVIE_CATEGORIES;
  if (!valid.has(category)) return res.status(400).json({ error: 'Invalid category' });
  try {
    res.json(await getTmdbCategory(mediaType, category, Number(req.query.page) || 1));
  } catch (err) {
    res.status(502).json({ error: 'TMDB category failed', detail: sanitizeErrorDetail((err as Error).message) });
  }
});

router.get('/trending', async (_req, res) => {
  const currentYear = new Date().getFullYear();
  const titles = await prisma.title.findMany({
    take: 14,
    where: { posterUrl: { not: null }, year: { lte: currentYear } },
    orderBy: [{ year: 'desc' }, { ratings: { _count: 'desc' } }],
    include: { platforms: { include: { platform: true } }, _count: { select: { ratings: true } } },
  });
  res.json(await attachTopTier(titles));
});

router.get('/recent', async (_req, res) => {
  const currentYear = new Date().getFullYear();
  const titles = await prisma.title.findMany({
    take: 18,
    where: { posterUrl: { not: null }, year: { lte: currentYear } },
    orderBy: { createdAt: 'desc' },
    include: { platforms: { include: { platform: true } } },
  });
  res.json(await attachTopTier(titles));
});

// --- Public live search (DB + optional TMDB fallback) -------------------
router.get('/live-search', async (req, res) => {
  const q = (req.query.q as string || '').trim();
  if (!q || q.length < 2) return res.json({ local: [], tmdb: [] });

  try {
    // Local DB search
    const dbResults = await prisma.title.findMany({
      where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { synopsis: { contains: q, mode: 'insensitive' } }] },
      take: 20,
      include: { platforms: { include: { platform: true } } },
    });

    // TMDB live search (only if key is configured)
    let tmdbResults: any[] = [];
    if (process.env.TMDB_API_KEY) {
      try {
        const raw = await searchTmdb(q);
        const localTmdbIds = new Set(dbResults.map((t) => t.tmdbId).filter(Boolean));
        tmdbResults = raw
          .filter((r) => !localTmdbIds.has(r.tmdbId))
          .slice(0, 12);
      } catch { /* TMDB unavailable — still return local */ }
    }

    res.json({ local: dbResults, tmdb: tmdbResults });
  } catch (err) {
    res.status(500).json({ error: 'Search failed', detail: sanitizeErrorDetail((err as Error).message) });
  }
});

// Manual title search and import removed — catalog is fully managed by the
// automatic TMDB sync (daily Railway cron + POST /sync-tmdb for manual triggers).

/**
 * POST /api/titles/sync-tmdb
 * Full paginated sync of TMDb discover/movie.
 * Accepts optional body: { startPage?: number; maxPages?: number; reset?: boolean }
 * - Vercel callers: set maxPages ≤ 3 per invocation (fits in 60 s timeout).
 * - Local / long-running: omit maxPages or pass Infinity equivalent ("all").
 * Uses upsert — safe to run multiple times. Logs per-page progress to stdout.
 */
router.post('/sync-tmdb', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { startPage, maxPages, reset } = req.body ?? {};

  try {
    if (reset) await resetSyncProgress();

    const result = await syncTmdbCatalog({
      startPage: typeof startPage === 'number' ? startPage : undefined,
      maxPages: typeof maxPages === 'number' ? maxPages : undefined,
    });

    res.json(result);
  } catch (err) {
    res.status(502).json({ error: 'TMDB sync failed', detail: sanitizeErrorDetail((err as Error).message) });
  }
});

/**
 * POST /api/titles/sync-batch
 * Processes one small batch (3 pages ≈ 60 movies) per call.
 * Called by the Vercel daily cron (vercel.json) and safe to invoke manually.
 *
 * Auth strategy (fail-closed — always requires valid credentials):
 *   1. Cron / automated callers: set CRON_SECRET env var and send
 *      `Authorization: Bearer <CRON_SECRET>` — bypasses user JWT.
 *   2. Manual admin callers: send a valid admin JWT (same as other admin routes).
 *   If neither matches, the request is rejected with 401/403.
 */
interface SyncRequest extends AuthRequest {
  syncCallerType?: SyncCallerType;
}

function cronOrAdmin(req: SyncRequest, res: Response, next: NextFunction) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'] ?? '';
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    req.syncCallerType = 'cron';
    return next(); // cron secret matches — bypass user JWT
  }
  // Fall through to standard admin middleware chain. Note: the primary
  // scheduled sync now runs as a standalone Railway cron service
  // (server/src/scripts/syncBatchCron.ts) which calls syncTmdbCatalog
  // directly — this HTTP route remains for manual/admin-triggered runs
  // and for an optional external scheduler hitting it with CRON_SECRET.
  authenticate(req, res, (err?: any) => {
    if (err) return next(err);
    req.syncCallerType = 'admin';
    requireAdmin(req, res, next);
  });
}

router.post('/sync-batch', cronOrAdmin, async (req: SyncRequest, res) => {
  const via: SyncCallerType = req.syncCallerType ?? 'admin';
  try {
    const result = await syncTmdbCatalog({ maxPages: 3 });
    await recordSyncRun(via, true);
    res.json(result);
  } catch (err) {
    await recordSyncRun(via, false, (err as Error).message);
    res.status(502).json({ error: 'Batch sync failed', detail: sanitizeErrorDetail((err as Error).message) });
  }
});

/**
 * GET /api/titles/sync-status
 * Returns current DB title count vs last known TMDb total, plus whether the
 * daily scheduled sync (Railway cron service) has actually run recently — so
 * an admin doesn't have to guess whether it's working.
 */
router.get('/sync-status', authenticate, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const [dbCount, kvRows] = await Promise.all([
      prisma.title.count({ where: { tmdbId: { not: null } } }),
      prisma.kV.findMany({ where: { key: { startsWith: 'sync:' } } }),
    ]);
    const kv = Object.fromEntries(kvRows.map(r => [r.key, r.value]));

    const lastCronRunAt = kv['sync:last_cron_run_at'] ?? null;
    const lastCronRunOk = kv['sync:last_cron_run_ok'] === 'true';
    const lastAdminRunAt = kv['sync:last_admin_run_at'] ?? null;
    const hoursSinceLastCronRun = lastCronRunAt
      ? (Date.now() - new Date(lastCronRunAt).getTime()) / 3_600_000
      : null;

    res.json({
      dbCount,
      lastCompletedPage: parseInt(kv['sync:last_completed_page'] ?? '0', 10),
      totalPages:        parseInt(kv['sync:total_pages'] ?? '0', 10),
      totalResults:      parseInt(kv['sync:total_results'] ?? '0', 10),
      cron: {
        // CRON_SECRET is only needed for the optional HTTP fallback path
        // (an external scheduler hitting /sync-batch). The primary path —
        // the Railway scheduled service running syncBatchCron.ts directly —
        // doesn't use it at all, so it's informational, not a health gate.
        secretConfigured: !!process.env.CRON_SECRET,
        lastRunAt: lastCronRunAt,
        lastRunOk: lastCronRunAt ? lastCronRunOk : null,
        lastRunDetail: kv['sync:last_cron_run_detail'] || null,
        lastManualRunAt: lastAdminRunAt,
        // The scheduled job runs daily — flag as unhealthy if it's been >26h
        // since a successful cron-triggered run (26h gives slack for scheduling jitter).
        healthy:
          lastCronRunOk &&
          hoursSinceLastCronRun !== null &&
          hoursSinceLastCronRun < 26,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Status check failed', detail: sanitizeErrorDetail((err as Error).message) });
  }
});

// POST /api/titles/backfill-images removed.
// Images are now fetched at original HD quality directly on import and catalog sync.

/**
 * POST /api/titles/cleanup-junk
 * Deletes unreleased/posterless titles that have no ratings (protects real user data).
 * Run once after deploying the discover-filter fix to clear out stale junk.
 * Admin only.
 */
router.post('/cleanup-junk', authenticate, requireAdmin, async (_req: AuthRequest, res) => {
  const currentYear = new Date().getFullYear();
  const junk = await prisma.title.findMany({
    where: {
      OR: [{ posterUrl: null }, { year: { gt: currentYear } }],
      ratings: { none: {} },
    },
    select: { id: true, name: true, year: true },
  });
  const result = await prisma.title.deleteMany({
    where: { id: { in: junk.map(j => j.id) } },
  });
  res.json({
    deletedCount: result.count,
    deletedTitles: junk.map(j => `${j.name} (${j.year})`),
  });
});

router.get('/:id', async (req, res) => {
  const title = await prisma.title.findUnique({ where: { id: req.params.id }, include: { platforms: { include: { platform: true } }, ratings: { include: { user: { select: { displayName: true } } }, orderBy: { createdAt: 'desc' } }, _count: { select: { ratings: true } } } });
  if (!title) return res.status(404).json({ error: 'Not found' });
  res.json(title);
});

router.post('/:id/ratings', authenticate, async (req: AuthRequest, res) => {
  const schema = z.object({ tier: z.enum(['SKIP','TIMEPASS','GOFORIT','PERFECTION']), reviewText: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const rating = await prisma.rating.upsert({
    where: { userId_titleId: { userId: req.user!.id, titleId: req.params.id } },
    update: { tier: parsed.data.tier, reviewText: parsed.data.reviewText || null },
    create: { userId: req.user!.id, titleId: req.params.id, tier: parsed.data.tier, reviewText: parsed.data.reviewText || null },
  });
  res.json(rating);
});

router.get('/:id/ratings', async (req, res) => { const ratings = await prisma.rating.findMany({ where: { titleId: req.params.id }, include: { user: { select: { displayName: true } } }, orderBy: { createdAt: 'desc' } }); res.json(ratings); });

// --- Manual title CRUD (admin only) ------------------------------------
const titleCreateSchema = z.object({ name: z.string(), type: z.enum(['MOVIE','SERIES','ANIME']), year: z.number(), runtimeMinutes: z.number().optional(), genres: z.array(z.string()), synopsis: z.string(), posterColorFrom: z.string(), posterColorTo: z.string(), trailerYoutubeId: z.string().optional(), officialWatchLinks: z.array(z.object({ platform: z.string(), url: z.string() })).optional(), platformIds: z.array(z.string()).optional() });
const titleUpdateSchema = titleCreateSchema.partial();

router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const parsed = titleCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { platformIds, ...data } = parsed.data;
  const title = await prisma.title.create({ data: { ...data, officialWatchLinks: data.officialWatchLinks || [] } });
  if (platformIds?.length) await prisma.titlePlatform.createMany({ data: platformIds.map(pid => ({ titleId: title.id, platformId: pid })) });
  res.status(201).json(title);
});

router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const parsed = titleUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { platformIds, ...data } = parsed.data;
  const title = await prisma.title.update({ where: { id: req.params.id }, data });
  res.json(title);
});

router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => { await prisma.title.delete({ where: { id: req.params.id } }); res.status(204).send(); });

export default router;
