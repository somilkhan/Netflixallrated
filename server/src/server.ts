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
import geoRoutes from './routes/geo.js';
import anicrushRoutes from './routes/anicrush.js';
import { prisma } from './lib/prisma.js';
import { syncTmdbCatalog } from './lib/sync.js';

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
app.use('/api/geo', geoRoutes);
app.use('/api/anicrush', anicrushRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Auto TMDB sync ─────────────────────────────────────────────────────────
// On startup: if catalog is empty, seed with 5 pages (~100 movies) so the
// UI isn't blank. The full catalog is populated incrementally via
// POST /api/titles/sync-tmdb or the Vercel daily cron (/api/titles/sync-batch).
async function autoSyncTmdb() {
  if (!process.env.TMDB_API_KEY) return;

  try {
    const withTmdbId = await prisma.title.count({ where: { tmdbId: { not: null } } });
    if (withTmdbId > 0) {
      console.log(`[auto-sync] Catalog already has ${withTmdbId} TMDB titles — skipping seed.`);
      return;
    }

    console.log('[auto-sync] Empty catalog — seeding first 5 pages from TMDb…');
    const result = await syncTmdbCatalog({ startPage: 0, maxPages: 5 });
    console.log(
      `[auto-sync] Seed done — inserted: ${result.totalInserted}, updated: ${result.totalSkipped}, failed: ${result.totalFailed}. ` +
      `TMDb has ${result.totalResults.toLocaleString()} total movies across ${result.totalPages} pages. ` +
      `Run POST /api/titles/sync-tmdb to continue.`,
    );
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
