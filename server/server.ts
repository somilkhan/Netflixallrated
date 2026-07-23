import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(express.json());

// ============================================================================
// Environment Variable Validation
// ============================================================================

function validateEnv(): void {
  const requiredKeys = ['TMDB_API_KEY'];
  const missing = requiredKeys.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn('   Set TMDB_API_KEY in .env to enable TMDB features');
  }
}

validateEnv();

// ============================================================================
// Configuration
// ============================================================================

function getTMDBApiKey(): string {
  const key = process.env.TMDB_API_KEY?.trim();
  if (!key) {
    throw new Error('TMDB_API_KEY is not configured. Please set it in your .env file.');
  }
  return key;
}

const SHOWBOX_API_BASE = process.env.SHOWBOX_API_BASE || 'https://api.showbox.media';
const FEBBOX_API_BASE = process.env.FEBBOX_API_BASE || 'https://www.febbox.com';
const SHOWBOX_API_KEY = process.env.SHOWBOX_API_KEY || '';
const FEBBOX_API_KEY = process.env.FEBBOX_API_KEY || '';

// ============================================================================
// Rate Limiting
// ============================================================================

const tmdbLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 40, // 40 requests per minute per IP
  message: 'Too many TMDB requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 100 requests per minute per IP
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// Request Logging Middleware
// ============================================================================

const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusColor = statusCode >= 400 ? '❌' : '✅';
    console.log(`${statusColor} [${new Date().toISOString()}] ${req.method} ${req.path} ${statusCode} (${duration}ms)`);
  });
  next();
};

app.use(requestLogger);

// ============================================================================
// CORS Middleware for Streaming
// ============================================================================

const corsHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
};

app.use(corsHeaders);

// ============================================================================
// Health & Status Routes
// ============================================================================

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    tmdbConfigured: !!process.env.TMDB_API_KEY,
    showboxConfigured: !!SHOWBOX_API_KEY,
    febboxConfigured: !!FEBBOX_API_KEY,
  });
});

app.get('/api/servers', (_req: Request, res: Response) => {
  res.json({
    servers: [
      { id: 'vidsrc_to', label: 'VidSrc.to', priority: 1 },
      { id: 'vidsrc_me', label: 'VidSrc.me', priority: 2 },
      { id: 'vidsrc_cc', label: 'VidSrc.cc', priority: 3 },
      { id: 'vidsrc_pro', label: 'VidSrc.pro', priority: 4 },
      { id: 'superembed', label: 'SuperEmbed', priority: 5 },
      { id: 'embed_su', label: 'Embed.su', priority: 6 },
      { id: 'smashystream', label: 'SmashyStream', priority: 7 },
      { id: 'showbox_native', label: 'Showbox Native (High-Speed)', priority: 8, isNative: true },
      { id: 'streamrip', label: 'Streamrip', priority: 9 },
      { id: 'vidzen', label: 'Vidzen', priority: 10 },
      { id: 'vidcore', label: 'VidCore', priority: 11 },
      { id: 'filmu', label: 'Filmu.in', priority: 12 },
    ],
  });
});

// ============================================================================
// Showbox Streaming Route
// ============================================================================

interface ShowboxRequest {
  id?: string;
  type?: string;
  season?: string | number;
  episode?: string | number;
  lang?: string;
}

app.get('/api/showbox/link', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { id, type = 'movie', season, episode, lang = 'en' } = req.query as unknown as ShowboxRequest;

    if (!id) {
      res.status(400).json({ error: 'TMDB ID (id) parameter is required' });
      return;
    }

    const tmdbId = String(id);
    const mediaType = String(type);
    const seasonNum = season ? parseInt(String(season), 10) : 1;
    const episodeNum = episode ? parseInt(String(episode), 10) : 1;

    // Validate numeric parameters
    if (isNaN(seasonNum) || isNaN(episodeNum)) {
      res.status(400).json({ error: 'Season and episode must be valid numbers' });
      return;
    }

    console.log(`[Showbox] Resolving stream: TMDB:${tmdbId} | Type:${mediaType} | S${seasonNum}E${episodeNum}`);

    // Search on Showbox
    const searchUrl = `${SHOWBOX_API_BASE}/search?tmdb=${tmdbId}&type=${mediaType}&api_key=${SHOWBOX_API_KEY}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!searchRes.ok) {
      throw new Error(`Showbox search failed with status ${searchRes.status}`);
    }

    const searchData = await searchRes.json() as Record<string, any>;
    const showboxId = searchData?.id || searchData?.data?.id;

    if (!showboxId) {
      res.status(404).json({ error: 'Media not found on Showbox' });
      return;
    }

    // Get share key from Febbox
    const shareKeyUrl = `${FEBBOX_API_BASE}/api/share?showbox_id=${showboxId}&api_key=${FEBBOX_API_KEY}`;
    const shareRes = await fetch(shareKeyUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!shareRes.ok) {
      throw new Error(`Febbox share key retrieval failed with status ${shareRes.status}`);
    }

    const shareData = await shareRes.json() as Record<string, any>;
    const shareKey = shareData?.share_key || shareData?.data?.share_key;

    if (!shareKey) {
      res.status(404).json({ error: 'Failed to retrieve share key from Febbox' });
      return;
    }

    // Get file tree
    const treeUrl = `${FEBBOX_API_BASE}/api/files?share_key=${shareKey}&api_key=${FEBBOX_API_KEY}`;
    const treeRes = await fetch(treeUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!treeRes.ok) {
      throw new Error(`Febbox file tree failed with status ${treeRes.status}`);
    }

    const treeData = await treeRes.json() as Record<string, any>;
    let targetFid: string | null = null;

    if (mediaType === 'movie') {
      // For movies, find first video file
      const files = treeData?.files || treeData?.data || [];
      const videoFile = files.find((f: any) =>
        f.type === 'video' || /\.(mp4|mkv|avi|mov|webm)$/i.test(f.name || '')
      );
      targetFid = videoFile?.fid || videoFile?.id || null;
    } else {
      // For TV, find season folder then episode
      const rootItems = treeData?.files || treeData?.data || [];
      const seasonFolder = rootItems.find((item: any) => {
        const name = (item.name || '').toLowerCase();
        return (
          name.includes(`season ${seasonNum}`) ||
          name.includes(`season${seasonNum}`) ||
          name.includes(`s${seasonNum.toString().padStart(2, '0')}`) ||
          name.includes(`s${seasonNum}`)
        );
      });

      if (!seasonFolder) {
        res.status(404).json({ error: `Season ${seasonNum} not found in file tree` });
        return;
      }

      const seasonUrl = `${FEBBOX_API_BASE}/api/files?share_key=${shareKey}&folder_id=${seasonFolder.id}&api_key=${FEBBOX_API_KEY}`;
      const seasonFetchRes = await fetch(seasonUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });

      const seasonFetchData = await seasonFetchRes.json() as Record<string, any>;
      const episodes = seasonFetchData?.files || seasonFetchData?.data || [];

      const targetEpisode = episodes.find((ep: any, idx: number) => {
        const epName = (ep.name || '').toLowerCase();
        return (
          epName.includes(`e${episodeNum.toString().padStart(2, '0')}`) ||
          epName.includes(`episode ${episodeNum}`) ||
          epName.includes(`ep${episodeNum}`) ||
          idx === episodeNum - 1
        );
      });

      targetFid = targetEpisode?.fid || targetEpisode?.id || null;
    }

    if (!targetFid) {
      res.status(404).json({ error: 'Target video file not found in file tree' });
      return;
    }

    // Get download/stream link
    const downloadUrl = `${FEBBOX_API_BASE}/api/download?fid=${targetFid}&share_key=${shareKey}&api_key=${FEBBOX_API_KEY}&lang=${lang}`;
    const downloadRes = await fetch(downloadUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!downloadRes.ok) {
      throw new Error(`Febbox download resolution failed with status ${downloadRes.status}`);
    }

    const downloadData = await downloadRes.json() as Record<string, any>;
    const streams = downloadData?.streams || downloadData?.data?.streams || downloadData?.links || [];

    res.json({
      success: true,
      tmdbId,
      type: mediaType,
      season: seasonNum,
      episode: episodeNum,
      showboxId,
      shareKey,
      fid: targetFid,
      streams: Array.isArray(streams) ? streams : [streams],
      directUrl: downloadData?.url || downloadData?.direct_url || downloadData?.data?.url || null,
    });
  } catch (error: any) {
    console.error('[Showbox Resolver Error]:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to resolve stream',
      note: 'Ensure SHOWBOX_API_BASE, FEBBOX_API_BASE, SHOWBOX_API_KEY, and FEBBOX_API_KEY are configured',
    });
  }
});

// ============================================================================
// TMDB Proxy Routes
// ============================================================================

app.get('/api/tmdb/search', tmdbLimiter, async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }

    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(String(query))}&page=1`;
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) throw new Error(`TMDB search failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('TMDB Search Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/movie/now_playing', tmdbLimiter, async (req: Request, res: Response) => {
  try {
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`;
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) throw new Error(`TMDB now_playing failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('TMDB Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/tv/on_the_air', tmdbLimiter, async (req: Request, res: Response) => {
  try {
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/tv/on_the_air?api_key=${apiKey}&language=en-US&page=1`;
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) throw new Error(`TMDB on_the_air failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('TMDB Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/movie/indian', tmdbLimiter, async (req: Request, res: Response) => {
  try {
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_original_language=hi|te|ta|ml|kn&sort_by=popularity.desc&page=1`;
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) throw new Error(`TMDB Indian movies failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('TMDB Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/tv/indian', tmdbLimiter, async (req: Request, res: Response) => {
  try {
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_original_language=hi|te|ta|ml|kn&sort_by=popularity.desc&page=1`;
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) throw new Error(`TMDB Indian TV failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('TMDB Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/movie/trending', tmdbLimiter, async (req: Request, res: Response) => {
  try {
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=en-US`;
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) throw new Error(`TMDB trending failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('TMDB Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ FIXED: Corrected typo in URL (themoviedoviedb.org → themoviedb.org)
app.get('/api/tmdb/movie/:id', tmdbLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=credits,videos`;
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) throw new Error(`TMDB movie details failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('TMDB Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/tv/:id', tmdbLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&append_to_response=credits,videos`;
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) throw new Error(`TMDB TV details failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('TMDB Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/tv/:id/season/:seasonNumber', tmdbLimiter, async (req: Request, res: Response) => {
  try {
    const { id, seasonNumber } = req.params;
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${apiKey}`;
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) throw new Error(`TMDB season details failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('TMDB Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AniList GraphQL Proxy Route
// ============================================================================

app.post('/api/anilist', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { query, variables } = req.body;

    if (!query) {
      res.status(400).json({ error: 'GraphQL query is required' });
      return;
    }

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Allrated/1.0',
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`AniList failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('AniList Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Error Handler for Missing TMDB Key
// ============================================================================

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message?.includes('TMDB_API_KEY is not configured')) {
    res.status(503).json({
      error: 'TMDB service is not configured',
      message: 'Contact administrator to configure TMDB_API_KEY',
    });
    return;
  }

  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ============================================================================
// Server Initialization
// ============================================================================

async function startServer(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Allrated Cinema running on http://localhost:${PORT}`);
    console.log(`📍 Available Endpoints:`);
    console.log(`   - GET /api/health - Server status`);
    console.log(`   - GET /api/servers - Available streaming servers`);
    console.log(`   - GET /api/showbox/link - Resolve Showbox streams`);
    console.log(`   - GET /api/tmdb/* - TMDB metadata proxy`);
    console.log(`   - POST /api/anilist - AniList GraphQL proxy\n`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
