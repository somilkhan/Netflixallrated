import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { searchTmdb, getTmdbDetails, getTrendingTmdb } from '../lib/tmdb.js';

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
  const where: any = {};
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

router.get('/top10', async (_req, res) => { const titles = await prisma.title.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { platforms: { include: { platform: true } } } }); res.json(titles); });
router.get('/trending', async (_req, res) => { const titles = await prisma.title.findMany({ take: 14, orderBy: { year: 'desc' }, include: { platforms: { include: { platform: true } } } }); res.json(titles); });
router.get('/recent', async (_req, res) => { const titles = await prisma.title.findMany({ take: 18, orderBy: { createdAt: 'desc' }, include: { platforms: { include: { platform: true } } } }); res.json(titles); });

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
 * Fetches the week's trending titles from TMDB and imports any that aren't
 * already in the catalog. Safe to run multiple times (skips existing).
 */
router.post('/sync-tmdb', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const trending = await getTrendingTmdb('week');
    let imported = 0, skipped = 0, errors = 0;

    for (const result of trending) {
      const existing = await prisma.title.findUnique({ where: { tmdbId: result.tmdbId } });
      if (existing) { skipped++; continue; }

      try {
        const details = await getTmdbDetails(result.tmdbId, result.mediaType);
        const palette = randomPalette();
        await prisma.title.create({
          data: {
            name: details.name,
            type: result.mediaType === 'movie' ? 'MOVIE' : 'SERIES',
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
        imported++;
      } catch { errors++; }
    }

    res.json({ imported, skipped, errors, total: trending.length });
  } catch (err) {
    res.status(502).json({ error: 'TMDB sync failed', detail: (err as Error).message });
  }
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
