import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import titleRoutes from './routes/titles.js';
import watchlistRoutes from './routes/watchlist.js';
import platformRoutes from './routes/platforms.js';
import netmirrorRoutes from './routes/netmirror.js';
import showboxRoutes from './routes/showbox.js';
import configRoutes from './routes/config.js';
import { prisma } from './lib/prisma.js';
import { getTrendingTmdb, getTmdbDetails } from './lib/tmdb.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5000', credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/titles', titleRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/netmirror', netmirrorRoutes);
app.use('/api/showbox', showboxRoutes);
app.use('/api/config', configRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Auto TMDB sync ────────────────────────────────────────────────────────────
// On startup: if no titles have a tmdbId yet, pull this week's trending from
// TMDB and import them automatically. Runs once, non-blocking.
async function autoSyncTmdb() {
  if (!process.env.TMDB_API_KEY) return; // skip if key not set

  try {
    const withTmdbId = await prisma.title.count({ where: { tmdbId: { not: null } } });
    if (withTmdbId > 0) return; // already have real data

    console.log('[auto-sync] No TMDB titles found — fetching trending now…');
    const trending = await getTrendingTmdb('week');
    const POSTER_PALETTE = [
      { from: '#1a1510', to: '#0a0908' }, { from: '#1c1410', to: '#0a0807' },
      { from: '#1a1018', to: '#0a0708' }, { from: '#101018', to: '#07070a' },
      { from: '#181020', to: '#0a080c' }, { from: '#101820', to: '#080a0c' },
    ];
    const rp = () => POSTER_PALETTE[Math.floor(Math.random() * POSTER_PALETTE.length)];

    let imported = 0, errors = 0;
    for (const result of trending) {
      const exists = await prisma.title.findUnique({ where: { tmdbId: result.tmdbId } });
      if (exists) continue;
      try {
        const d = await getTmdbDetails(result.tmdbId, result.mediaType);
        const p = rp();
        await prisma.title.create({
          data: {
            name: d.name,
            type: result.mediaType === 'movie' ? 'MOVIE' : 'SERIES',
            year: d.year,
            runtimeMinutes: d.runtimeMinutes ?? undefined,
            genres: d.genres,
            synopsis: d.synopsis,
            posterColorFrom: p.from,
            posterColorTo: p.to,
            trailerYoutubeId: d.trailerYoutubeId ?? undefined,
            tmdbId: d.tmdbId,
            posterUrl: d.posterUrl ?? undefined,
            backdropUrl: d.backdropUrl ?? undefined,
            officialWatchLinks: [],
          },
        });
        imported++;
      } catch { errors++; }
    }
    console.log(`[auto-sync] Done — ${imported} imported, ${errors} errors`);
  } catch (err) {
    console.error('[auto-sync] Failed:', (err as Error).message);
  }
}

// Export for Vercel serverless — only bind to a port when running directly
export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    autoSyncTmdb(); // non-blocking — fires in background
  });
}
