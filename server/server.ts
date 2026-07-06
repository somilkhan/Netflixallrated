import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

const DEFAULT_TMDB_KEY = '844dba0bfd8f3a281a1a20db7893d040';

function getTMDBApiKey(): string {
  const key = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY;
  if (key && key.trim() !== '') {
    return key.trim();
  }
  return DEFAULT_TMDB_KEY;
}

const SHOWBOX_API_BASE = process.env.SHOWBOX_API_BASE || 'https://api.showbox.media';
const FEBBOX_API_BASE = process.env.FEBBOX_API_BASE || 'https://www.febbox.com';
const SHOWBOX_API_KEY = process.env.SHOWBOX_API_KEY || '';
const FEBBOX_API_KEY = process.env.FEBBOX_API_KEY || '';

app.use((req, res, next) => {
  console.log(`[server] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    tmdbKeyConfigured: !!(process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY),
    showboxConfigured: !!SHOWBOX_API_KEY,
    febboxConfigured: !!FEBBOX_API_KEY
  });
});

app.get('/api/servers', (req, res) => {
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
    ]
  });
});

app.get('/api/showbox/link', async (req, res) => {
  try {
    const { id, type = 'movie', season, episode, lang = 'en' } = req.query;
    if (!id) {
      res.status(400).json({ error: 'TMDB ID (id) is required' });
      return;
    }
    const tmdbId = id as string;
    const mediaType = type as string;
    const seasonNum = season ? parseInt(season as string, 10) : 1;
    const episodeNum = episode ? parseInt(episode as string, 10) : 1;

    console.log(`[Showbox] Resolving stream for TMDB:${tmdbId} | Type:${mediaType} | S${seasonNum}E${episodeNum} | Lang:${lang}`);

    const searchUrl = `${SHOWBOX_API_BASE}/search?tmdb=${tmdbId}&type=${mediaType}&api_key=${SHOWBOX_API_KEY}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    if (!searchRes.ok) {
      throw new Error(`Showbox search failed: ${searchRes.status}`);
    }
    const searchData = await searchRes.json();
    const showboxId = searchData?.id || searchData?.data?.id;
    if (!showboxId) {
      res.status(404).json({ error: 'Media not found on Showbox' });
      return;
    }

    const shareKeyUrl = `${FEBBOX_API_BASE}/api/share?showbox_id=${showboxId}&api_key=${FEBBOX_API_KEY}`;
    const shareRes = await fetch(shareKeyUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    if (!shareRes.ok) {
      throw new Error(`Febbox share key retrieval failed: ${shareRes.status}`);
    }
    const shareData = await shareRes.json();
    const shareKey = shareData?.share_key || shareData?.data?.share_key;
    if (!shareKey) {
      res.status(404).json({ error: 'Failed to retrieve share key from Febbox' });
      return;
    }

    let targetFid: string | null = null;

    if (mediaType === 'movie') {
      const treeUrl = `${FEBBOX_API_BASE}/api/files?share_key=${shareKey}&api_key=${FEBBOX_API_KEY}`;
      const treeRes = await fetch(treeUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000)
      });
      if (!treeRes.ok) {
        throw new Error(`Febbox file tree failed: ${treeRes.status}`);
      }
      const treeData = await treeRes.json();
      const files = treeData?.files || treeData?.data || [];
      const videoFile = files.find((f: any) =>
        f.type === 'video' ||
        /\.(mp4|mkv|avi|mov|webm)$/i.test(f.name || '')
      );
      targetFid = videoFile?.fid || videoFile?.id || null;
    } else {
      const treeUrl = `${FEBBOX_API_BASE}/api/files?share_key=${shareKey}&api_key=${FEBBOX_API_KEY}`;
      const treeRes = await fetch(treeUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000)
      });
      if (!treeRes.ok) {
        throw new Error(`Febbox file tree failed: ${treeRes.status}`);
      }
      const treeData = await treeRes.json();
      const rootItems = treeData?.files || treeData?.data || [];

      const seasonFolder = rootItems.find((item: any) => {
        const name = (item.name || '').toLowerCase();
        return name.includes(`season ${seasonNum}`) ||
               name.includes(`season${seasonNum}`) ||
               name.includes(`s${seasonNum.toString().padStart(2, '0')}`) ||
               name.includes(`s${seasonNum}`);
      });

      if (!seasonFolder) {
        res.status(404).json({ error: `Season ${seasonNum} not found in file tree` });
        return;
      }

      const seasonUrl = `${FEBBOX_API_BASE}/api/files?share_key=${shareKey}&folder_id=${seasonFolder.id}&api_key=${FEBBOX_API_KEY}`;
      const seasonRes = await fetch(seasonUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000)
      });
      const seasonData = await seasonRes.json();
      const episodes = seasonData?.files || seasonData?.data || [];

      const targetEpisode = episodes.find((ep: any, idx: number) => {
        const epName = (ep.name || '').toLowerCase();
        return epName.includes(`e${episodeNum.toString().padStart(2, '0')}`) ||
               epName.includes(`episode ${episodeNum}`) ||
               epName.includes(`ep${episodeNum}`) ||
               idx === (episodeNum - 1);
      });

      targetFid = targetEpisode?.fid || targetEpisode?.id || null;
    }

    if (!targetFid) {
      res.status(404).json({ error: 'Target video file not found in file tree' });
      return;
    }

    const downloadUrl = `${FEBBOX_API_BASE}/api/download?fid=${targetFid}&share_key=${shareKey}&api_key=${FEBBOX_API_KEY}&lang=${lang}`;
    const downloadRes = await fetch(downloadUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    if (!downloadRes.ok) {
      throw new Error(`Febbox download resolution failed: ${downloadRes.status}`);
    }
    const downloadData = await downloadRes.json();
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
      directUrl: downloadData?.url || downloadData?.direct_url || downloadData?.data?.url || null
    });

  } catch (error: any) {
    console.error('[Showbox Resolver Error]:', error);
    res.status(500).json({
      error: error.message || 'Internal Server Error',
      note: 'Ensure SHOWBOX_API_BASE, FEBBOX_API_BASE, SHOWBOX_API_KEY, and FEBBOX_API_KEY are configured in your .env'
    });
  }
});

app.get('/api/tmdb/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query as string)}&page=1`;
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`TMDB search failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Proxy TMDB Search Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/movie/now_playing', async (req, res) => {
  try {
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`;
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`TMDB now playing failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Proxy TMDB Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/tv/on_the_air', async (req, res) => {
  try {
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/tv/on_the_air?api_key=${apiKey}&language=en-US&page=1`;
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`TMDB on the air failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Proxy TMDB Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/movie/indian', async (req, res) => {
  try {
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_original_language=hi|te|ta|ml|kn&sort_by=popularity.desc&page=1`;
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`TMDB Indian movies failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Proxy TMDB Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/tv/indian', async (req, res) => {
  try {
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_original_language=hi|te|ta|ml|kn&sort_by=popularity.desc&page=1`;
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`TMDB Indian TV failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Proxy TMDB Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/movie/trending', async (req, res) => {
  try {
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=en-US`;
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`TMDB trending failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Proxy TMDB Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=credits,videos`;
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`TMDB movie details failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Proxy TMDB Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/tv/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&append_to_response=credits,videos`;
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`TMDB TV details failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Proxy TMDB Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tmdb/tv/:id/season/:seasonNumber', async (req, res) => {
  try {
    const { id, seasonNumber } = req.params;
    const apiKey = getTMDBApiKey();
    const targetUrl = `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${apiKey}`;
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`TMDB season failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Proxy TMDB Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/anilist', async (req, res) => {
  try {
    const { query, variables } = req.body;
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables })
    });
    if (!response.ok) throw new Error(`AniList failed: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Proxy AniList Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] Allrated Cinema running on http://localhost:${PORT}`);
    console.log(`[server] Showbox resolver: /api/showbox/link`);
    console.log(`[server] Embed servers: /api/servers`);
  });
}

startServer();
