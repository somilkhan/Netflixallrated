import { Router, Request, Response } from 'express';

const router = Router();

const ANICRUSH_API = 'https://api.anicrush.to';

function anicrushHeaders(): Record<string, string> {
  return {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'x-site': 'anicrush',
    'Referer': 'https://anicrush.to/',
    'Origin': 'https://anicrush.to',
    'sec-fetch-site': 'same-site',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
  };
}

async function upstream(url: string): Promise<any> {
  const res = await fetch(url, { headers: anicrushHeaders() });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  return res.json();
}

// GET /api/anicrush/search?keyword=...
router.get('/search', async (req: Request, res: Response) => {
  const { keyword, page = '1', limit = '10' } = req.query;
  if (!keyword) return res.status(400).json({ error: 'keyword required' });

  try {
    const url = new URL(`${ANICRUSH_API}/shared/v2/movie/list`);
    url.searchParams.set('keyword', String(keyword));
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));
    return res.json(await upstream(url.toString()));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/anicrush/episodes?movieId=...
router.get('/episodes', async (req: Request, res: Response) => {
  const { movieId } = req.query;
  if (!movieId) return res.status(400).json({ error: 'movieId required' });

  try {
    const url = new URL(`${ANICRUSH_API}/shared/v2/episode/list`);
    url.searchParams.set('_movieId', String(movieId));
    return res.json(await upstream(url.toString()));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/anicrush/embed?movieId=...&episode=1&server=4&subOrDub=sub
// Returns the embed URL for the given episode.
router.get('/embed', async (req: Request, res: Response) => {
  const { movieId, episode = '1', server = '4' } = req.query;
  if (!movieId) return res.status(400).json({ error: 'movieId required' });

  try {
    // 1. Get available servers for this episode
    const serversUrl = new URL(`${ANICRUSH_API}/shared/v2/episode/servers`);
    serversUrl.searchParams.set('_movieId', String(movieId));
    serversUrl.searchParams.set('ep', String(episode));
    const serversData = await upstream(serversUrl.toString());

    const servers: any[] = serversData?.result?.servers ?? [];
    if (!servers.length) {
      return res.status(404).json({ error: 'No servers available for this episode' });
    }

    // Pick requested server index (1-based), fall back to first
    const idx = Math.min(Math.max(parseInt(String(server)) - 1, 0), servers.length - 1);
    const entry = servers[idx] || servers[0];
    let embedUrl: string = entry?.link ?? '';

    // Normalise domain (.blog → .tv)
    embedUrl = embedUrl.replace(/\.blog\b/g, '.tv');

    if (!embedUrl) {
      return res.status(404).json({ error: 'Server link missing' });
    }

    return res.json({
      embedUrl,
      serverName: entry?.name ?? `Server ${idx + 1}`,
      serverCount: servers.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
