import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { searchTmdb, getTmdbDetails, getTvSeasons, getTvEpisodes } from '../lib/tmdb.js';
import { syncTmdbCatalog, resetSyncProgress } from '../lib/sync.js';

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

router.get('/', async (req, res) => {
  const { type, genre, platform, search, page = '1', limit = '20' } = req.query;
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
  const [titles, count] = await Promise.all([
    prisma.title.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { platforms: { include: { platform: true } }, _count: { select: { ratings: true } } } }),
    prisma.title.count({ where }),
  ]);
  res.json({ titles, total: count, page: parseInt(page as string), pages: Math.ceil(count / take) });
});

router.get('/top10', async (_req, res) => {
  const currentYear = new Date().getFullYear();
  const titles = await prisma.title.findMany({
    take: 10,
    where: { posterUrl: { not: null }, year: { lte: currentYear } },
    orderBy: [{ ratings: { _count: 'desc' } }, { year: 'desc' }],
    include: { platforms: { include: { platform: true } }, _count: { select: { ratings: true } } },
  });
  res.json(titles);
});

// Must be defined before /:id to avoid Express treating "seasons"/"episodes" as an ID
router.get('/:id/seasons', async (req, res) => {
  const title = await prisma.title.findUnique({ where: { id: req.params.id }, select: { tmdbId: true, type: true } });
  if (!title || !title.tmdbId || title.type !== 'SERIES') return res.json([]);
  try { res.json(await getTvSeasons(title.tmdbId)); }
  catch (err) { res.status(502).json({ error: 'TMDB seasons failed', detail: (err as Error).message }); }
});

router.get('/:id/episodes', async (req, res) => {
  const title = await prisma.title.findUnique({ where: { id: req.params.id }, select: { tmdbId: true, type: true } });
  if (!title || !title.tmdbId || title.type !== 'SERIES') return res.json([]);
  const season = Math.max(1, parseInt(req.query.season as string) || 1);
  try { res.json(await getTvEpisodes(title.tmdbId, season)); }
  catch (err) { res.status(502).json({ error: 'TMDB episodes failed', detail: (err as Error).message }); }
});
router.get('/trending', async (_req, res) => {
  const currentYear = new Date().getFullYear();
  const titles = await prisma.title.findMany({
    take: 14,
    where: { posterUrl: { not: null }, year: { lte: currentYear } },
    orderBy: [{ year: 'desc' }, { ratings: { _count: 'desc' } }],
    include: { platforms: { include: { platform: true } }, _count: { select: { ratings: true } } },
  });
  res.json(titles);
});

router.get('/recent', async (_req, res) => {
  const currentYear = new Date().getFullYear();
  const titles = await prisma.title.findMany({
    take: 18,
    where: { posterUrl: { not: null }, year: { lte: currentYear } },
    orderBy: { createdAt: 'desc' },
    include: { platforms: { include: { platform: true } } },
  });
  res.json(titles);
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
    res.status(500).json({ error: 'Search failed', detail: (err as Error).message });
  }
});

// --- TMDB catalog lookup (admin only) -----------------------------------
router.get('/tmdb-search', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const q = (req.query.q as string || '').trim();
  if (!q) return res.json([]);
  try {
    const results = await searchTmdb(q);
    res.json(results);
  } catch (err) {
    res.status(502).json({ error: 'TMDB lookup failed', detail: (err as Error).message });
  }
});

router.post('/import-tmdb', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const schema = z.object({ tmdbId: z.number(), mediaType: z.enum(['movie', 'tv']), type: z.enum(['MOVIE', 'SERIES', 'ANIME']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.title.findUnique({ where: { tmdbId: parsed.data.tmdbId } });
  if (existing) return res.status(409).json({ error: 'Already imported', title: existing });

  try {
    const details = await getTmdbDetails(parsed.data.tmdbId, parsed.data.mediaType);
    const palette = randomPalette();
    const title = await prisma.title.create({
      data: {
        name: details.name,
        type: parsed.data.type,
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
    res.status(201).json(title);
  } catch (err) {
    res.status(502).json({ error: 'TMDB import failed', detail: (err as Error).message });
  }
});

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
    res.status(502).json({ error: 'TMDB sync failed', detail: (err as Error).message });
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
type SyncCallerType = 'cron' | 'admin';
interface SyncRequest extends AuthRequest {
  syncCallerType?: SyncCallerType;
}

/** Strip query strings and anything that looks like a key/token/secret from an error message before it's persisted or shown to admins. */
function sanitizeErrorDetail(message: string): string {
  return message
    .replace(/([?&])(api_key|key|token|secret|password)=[^&\s"']*/gi, '$1$2=[redacted]')
    .replace(/https?:\/\/\S+/g, (url) => url.split('?')[0]) // drop query strings from any embedded URLs
    .slice(0, 300);
}

function cronOrAdmin(req: SyncRequest, res: Response, next: NextFunction) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'] ?? '';
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    req.syncCallerType = 'cron';
    return next(); // cron secret matches — bypass user JWT
  }
  if (!cronSecret) {
    // No CRON_SECRET configured — Vercel Cron can never authenticate against
    // this route, so its daily invocation will always 401 downstream. Log
    // loudly so this is visible in server/deployment logs, not just a silent
    // failure the admin never notices.
    console.warn('[sync-batch] CRON_SECRET is not set — the Vercel cron job cannot authenticate and will fail every run.');
  }
  // Fall through to standard admin middleware chain
  authenticate(req, res, (err?: any) => {
    if (err) return next(err);
    req.syncCallerType = 'admin';
    requireAdmin(req, res, next);
  });
}

/**
 * Record the outcome of a sync-batch run so /sync-status can report health.
 * Cron and admin runs are tracked under separate KV keys so a manual admin
 * sync never overwrites (or fakes) the daily cron's own health signal.
 */
async function recordSyncRun(via: SyncCallerType, ok: boolean, detail?: string) {
  const prefix = via === 'cron' ? 'sync:last_cron' : 'sync:last_admin';
  const entries: [string, string][] = [
    [`${prefix}_run_at`, new Date().toISOString()],
    [`${prefix}_run_ok`, String(ok)],
    [`${prefix}_run_detail`, detail ? sanitizeErrorDetail(detail) : ''],
  ];
  await Promise.all(
    entries.map(([key, value]) =>
      prisma.kV.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  ).catch((err) => console.warn('[sync-batch] failed to record run status:', (err as Error).message));
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
 * daily Vercel cron is actually configured and has run recently — so an
 * admin doesn't have to guess whether CRON_SECRET is set correctly.
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
        secretConfigured: !!process.env.CRON_SECRET,
        lastRunAt: lastCronRunAt,
        lastRunOk: lastCronRunAt ? lastCronRunOk : null,
        lastRunDetail: kv['sync:last_cron_run_detail'] || null,
        lastManualRunAt: lastAdminRunAt,
        // Vercel cron runs daily — flag as unhealthy if it's been >26h since
        // a successful cron-triggered run (26h gives slack for scheduling jitter).
        healthy:
          !!process.env.CRON_SECRET &&
          lastCronRunOk &&
          hoursSinceLastCronRun !== null &&
          hoursSinceLastCronRun < 26,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Status check failed', detail: (err as Error).message });
  }
});

/**
 * POST /api/titles/backfill-images
 * For every title missing a posterUrl:
 *  - Has tmdbId → fetch details directly by ID
 *  - No tmdbId  → search TMDB by name + year, take best match
 * Requires TMDB_API_KEY. Admin-only.
 */
router.post('/backfill-images', authenticate, requireAdmin, async (_req: AuthRequest, res) => {
  if (!process.env.TMDB_API_KEY) {
    return res.status(503).json({ error: 'TMDB_API_KEY is not configured — add it in Replit Secrets.' });
  }

  const missing = await prisma.title.findMany({
    where: { posterUrl: null },
    select: { id: true, name: true, tmdbId: true, type: true, year: true },
  });

  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const title of missing) {
    try {
      let details = null;

      if (title.tmdbId) {
        const mediaType = title.type === 'MOVIE' ? 'movie' : 'tv';
        details = await getTmdbDetails(title.tmdbId, mediaType);
      } else {
        const results = await searchTmdb(title.name);
        // Helper: try fetching details, trying both media types on 404
        const tryFetch = async (tmdbId: number, preferredType: 'movie' | 'tv') => {
          try {
            return await getTmdbDetails(tmdbId, preferredType);
          } catch {
            return await getTmdbDetails(tmdbId, preferredType === 'movie' ? 'tv' : 'movie');
          }
        };

        if (results.length > 0) {
          // Prefer exact year match, otherwise take first result
          const match = results.find(r => r.year === title.year) ?? results[0];
          // Use TMDB's own mediaType — don't override with our internal type
          try {
            details = await tryFetch(match.tmdbId, match.mediaType);
          } catch {
            // Full-name search failed — try stripping subtitle (e.g. "Show: Arc Name" → "Show")
            const baseName = title.name.includes(': ') ? title.name.split(': ')[0].trim() : null;
            if (baseName && baseName !== title.name) {
              const baseResults = await searchTmdb(baseName);
              if (baseResults.length > 0) {
                const baseMatch = baseResults.find(r => r.year === title.year) ?? baseResults[0];
                details = await tryFetch(baseMatch.tmdbId, baseMatch.mediaType);
              }
            }
          }
        }
      }

      if (details && (details.posterUrl || details.backdropUrl)) {
        // Determine whether we can safely write the tmdbId (guard against unique constraint)
        const newTmdbId = title.tmdbId ?? details.tmdbId;
        let safeToWriteTmdbId = true;
        if (!title.tmdbId && newTmdbId) {
          const existing = await prisma.title.findUnique({ where: { tmdbId: newTmdbId }, select: { id: true } });
          if (existing && existing.id !== title.id) safeToWriteTmdbId = false;
        }
        await prisma.title.update({
          where: { id: title.id },
          data: {
            posterUrl: details.posterUrl ?? undefined,
            backdropUrl: details.backdropUrl ?? undefined,
            trailerYoutubeId: details.trailerYoutubeId ?? undefined,
            ...(safeToWriteTmdbId ? { tmdbId: newTmdbId } : {}),
          },
        });
        updated++;
      } else {
        failed++;
        errors.push(`No match: "${title.name}"`);
      }

      // Respect TMDB rate limit (~40 req/10 s):
      // name-search path makes 2 requests (search + details) so wait 600 ms;
      // direct tmdbId path makes 1 request so wait 300 ms.
      await new Promise(r => setTimeout(r, title.tmdbId ? 300 : 600));
    } catch (err) {
      failed++;
      errors.push(`Error: "${title.name}" — ${(err as Error).message}`);
    }
  }

  res.json({ total: missing.length, updated, failed, errors: errors.slice(0, 30) });
});

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
