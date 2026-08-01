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
      imgSrc: ["'self'", "data:", "https://image.tmdb.org", "https://img.youtube.com", "https://i.ytimg.com", "https://cdn.myanimelist.net", "https://s4.anilist.co"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.youtube-nocookie.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https:"],
      connectSrc: ["'self'", "https://api.themoviedb.org", "https://ipapi.co", "https://graphql.anilist.co", "https:"],
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

// ── Proxy AniList images to bypass browser referrer/CORS issues ───────────
app.get('/api/proxy-image', async (req: express.Request, res: express.Response) => {
  const url = req.query.url as string;
  if (!url || !url.startsWith('https://')) {
    return res.status(400).send('Invalid URL');
  }
  try {
    const response = await fetch(url, {
      headers: { 'Referer': 'https://anilist.co', 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('Image proxy error:', err.message);
    res.status(502).send('Image fetch failed');
  }
});

// ── Auto TMDB sync ─────────────────────────────────────────────────────────
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
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const clientDist = join(__dirname, '../../client/dist');

if (process.env.NODE_ENV === 'production' && existsSync(clientDist)) {
  // Hashed assets can be cached forever
  app.use(express.static(clientDist, { maxAge: '1y', immutable: true }));
  // SPA fallback — never cache index.html so users always get latest deploy
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(join(clientDist, 'index.html'));
  });
  console.log(`[static] Serving client from ${clientDist}`);
}

// Centralized error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.Next) => {
  console.error('[unhandled]', err);
  res.status(err?.status || 500).json({ error: 'Internal server error' });
});

export default app;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  autoSyncTmdb();
});
