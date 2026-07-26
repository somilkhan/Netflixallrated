import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
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
import consumetRoutes from './routes/consumet.js';
import screenscapeRoutes from './routes/screenscape.js';
import historyRoutes from './routes/history.js';
import sportsRoutes from './routes/sports.js';
import tmdbRoutes from './routes/tmdb.js';
import { prisma } from './lib/prisma.js';
import { syncTmdbCatalog } from './lib/sync.js';

dotenv.config();

const app = express();
app.set('trust proxy', 'loopback, linklocal, uniquelocal');
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://image.tmdb.org", "https://img.youtube.com", "https://i.ytimg.com", "https://cdn.myanimelist.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.youtube-nocookie.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://www.youtube-nocookie.com", "https://www.youtube.com", "https://player.vimeo.com"],
      connectSrc: ["'self'", "https://api.themoviedb.org", "https://ipapi.co", "https://graphql.anilist.co"],
      mediaSrc: ["'self'", "https:", "blob:"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
].filter((o): o is string => !!o);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false,
}));
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
app.use('/api/consumet', consumetRoutes);
app.use('/api/screenscape', screenscapeRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/tmdb', tmdbRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Auto junk cleanup ──────────────────────────────────────────────────────
// On every startup: delete unrated future-dated or posterless titles that
// slipped in before the discover filters were tightened. Rated titles are
// never touched. Runs silently in the background — non-blocking.
async function autoCleanupJunk() {
  try {
    const currentYear = new Date().getFullYear();
    const result = await prisma.title.deleteMany({
      where: {
        OR: [{ posterUrl: null }, { year: { gt: currentYear } }],
        ratings: { none: {} },
      },
    });
    if (result.count > 0) {
      console.log(`[auto-cleanup] Removed ${result.count} unreleased/posterless titles with no ratings.`);
    }
  } catch (err) {
    console.warn('[auto-cleanup] Failed (non-fatal):', (err as Error).message);
  }
}

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

// ── Serve built client in production ──────────────────────────────────────
// When deployed as a single Railway service the client is built into
// ../client/dist (relative to this file's compiled location at dist/server.js).
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const clientDist = join(__dirname, '../../client/dist');

if (process.env.NODE_ENV === 'production' && existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback — let React Router handle all non-API routes
  app.get('*', (_req, res) => res.sendFile(join(clientDist, 'index.html')));
  console.log(`[static] Serving client from ${clientDist}`);
}

// Centralized error handler — catches anything passed to next(err)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[unhandled]', err);
  res.status(err?.status || 500).json({ error: 'Internal server error' });
});

export default app;

// REMOVED from startup — run manually via a cron job or script if needed.
// Never block app.listen() with database mutations.

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  autoSyncTmdb(); // non-blocking — fires in background
});
