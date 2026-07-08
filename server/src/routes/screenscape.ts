/**
 * ScreenScape API proxy — 4kHDHub content source.
 *
 * All calls are proxied through the server so the API key is never
 * exposed to the browser. Auth: x-api-key header with SCREENSCAPE_API_KEY.
 *
 * Exposed routes:
 *   GET /api/screenscape/list?page=N           — paginated content list
 *   GET /api/screenscape/search?q=...          — search 4kHDHub
 *   GET /api/screenscape/resolve?title=...&type=movie|tv&season=N&episode=N
 *                                              — find title + return embed/stream URL
 */
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const BASE = 'https://screenscapeapi.dev';

function getKey(): string | undefined {
  return process.env.SCREENSCAPE_API_KEY;
}

function headers(key: string): Record<string, string> {
  return {
    'x-api-key': key,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

async function ssGet(path: string, key: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(key),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ScreenScape API error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// ── GET /api/screenscape/list?page=N ─────────────────────────────────────────

router.get('/list', authenticate, async (req: Request, res: Response) => {
  const key = getKey();
  if (!key) return res.status(503).json({ success: false, error: 'SCREENSCAPE_API_KEY is not configured.' });

  const page = req.query.page || '1';
  try {
    const data = await ssGet(`/api/4khdhub?page=${page}`, key);
    return res.json({ success: true, ...data });
  } catch (err: any) {
    console.error('[screenscape] list error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/screenscape/search?q=... ────────────────────────────────────────

router.get('/search', authenticate, async (req: Request, res: Response) => {
  const key = getKey();
  if (!key) return res.status(503).json({ success: false, error: 'SCREENSCAPE_API_KEY is not configured.' });

  const q = req.query.q as string;
  if (!q) return res.status(400).json({ success: false, error: 'Missing ?q= query param.' });

  try {
    const data = await ssGet(`/api/4khdhub?search=${encodeURIComponent(q)}`, key);
    return res.json({ success: true, ...data });
  } catch (err: any) {
    console.error('[screenscape] search error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/screenscape/stream?id=... ───────────────────────────────────────
// Fetch direct stream info for a given 4kHDHub content ID.

router.get('/stream', authenticate, async (req: Request, res: Response) => {
  const key = getKey();
  if (!key) return res.status(503).json({ success: false, error: 'SCREENSCAPE_API_KEY is not configured.' });

  const id = req.query.id as string;
  if (!id) return res.status(400).json({ success: false, error: 'Missing ?id= param.' });

  try {
    const data = await ssGet(`/api/4khdhub/stream?id=${encodeURIComponent(id)}`, key);
    return res.json({ success: true, ...data });
  } catch (err: any) {
    console.error('[screenscape] stream error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/screenscape/resolve?title=...&type=movie|tv&season=N&episode=N ──
// Convenience endpoint: search 4kHDHub by title, then resolve an embed/stream
// URL. Returns { success, embedUrl, streamUrl, id, title }.

router.get('/resolve', authenticate, async (req: Request, res: Response) => {
  const key = getKey();
  if (!key) return res.status(503).json({ success: false, error: 'SCREENSCAPE_API_KEY is not configured.' });

  const titleParam = req.query.title as string;
  const type = (req.query.type as string) || 'movie';
  const season = parseInt(String(req.query.season || '1'), 10) || 1;
  const episode = parseInt(String(req.query.episode || '1'), 10) || 1;

  if (!titleParam) return res.status(400).json({ success: false, error: 'Missing ?title= param.' });

  try {
    // 1. Search
    const searchData = await ssGet(`/api/4khdhub?search=${encodeURIComponent(titleParam)}`, key);

    // Support both { results: [] } and { data: [] } shapes
    const results: any[] = searchData?.results ?? searchData?.data ?? searchData?.items ?? [];
    if (!results.length) {
      return res.status(404).json({ success: false, error: `"${titleParam}" not found on 4kHDHub` });
    }

    // Pick best match — prefer exact title match, fall back to first result
    const normalise = (s: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, '');
    const needle = normalise(titleParam);
    const match =
      results.find((r: any) => normalise(r.title ?? r.name ?? '') === needle) ??
      results[0];

    const contentId = match.id ?? match.slug ?? match.tmdb_id;
    const matchTitle = match.title ?? match.name ?? titleParam;

    // 2. Attempt to get stream info
    let embedUrl: string | null = match.embed ?? match.embedUrl ?? match.iframe ?? null;
    let streamUrl: string | null = match.stream ?? match.streamUrl ?? match.url ?? null;

    if (!embedUrl && !streamUrl && contentId) {
      try {
        // Try /stream endpoint
        const streamData = await ssGet(`/api/4khdhub/stream?id=${encodeURIComponent(String(contentId))}`, key);
        embedUrl = streamData?.embedUrl ?? streamData?.embed ?? streamData?.iframe ?? null;
        streamUrl = streamData?.streamUrl ?? streamData?.stream ?? streamData?.url ?? null;

        // For TV: also try episode-specific endpoint
        if (!embedUrl && !streamUrl && type === 'tv') {
          const epData = await ssGet(
            `/api/4khdhub/stream?id=${encodeURIComponent(String(contentId))}&season=${season}&episode=${episode}`,
            key,
          ).catch(() => null);
          if (epData) {
            embedUrl = epData?.embedUrl ?? epData?.embed ?? epData?.iframe ?? null;
            streamUrl = epData?.streamUrl ?? epData?.stream ?? epData?.url ?? null;
          }
        }
      } catch (_) {
        // Stream lookup failed — surface what we have from search result
      }
    }

    if (!embedUrl && !streamUrl) {
      return res.status(404).json({
        success: false,
        error: `Stream not available for "${matchTitle}" on 4kHDHub`,
      });
    }

    return res.json({ success: true, id: contentId, title: matchTitle, embedUrl, streamUrl });
  } catch (err: any) {
    console.error('[screenscape] resolve error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/screenscape/hdhub4u?page=N ──────────────────────────────────────

router.get('/hdhub4u', authenticate, async (req: Request, res: Response) => {
  const key = getKey();
  if (!key) return res.status(503).json({ success: false, error: 'SCREENSCAPE_API_KEY is not configured.' });

  const page = req.query.page || '1';
  try {
    const data = await ssGet(`/api/hdhub4u?page=${page}`, key);
    return res.json({ success: true, ...data });
  } catch (err: any) {
    console.error('[screenscape] hdhub4u list error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/screenscape/hdhub4u/resolve?title=...&type=...&season=N&episode=N
// Searches HDHub4u listing for a matching title and returns its URL.

router.get('/hdhub4u/resolve', authenticate, async (req: Request, res: Response) => {
  const key = getKey();
  if (!key) return res.status(503).json({ success: false, error: 'SCREENSCAPE_API_KEY is not configured.' });

  const titleParam = req.query.title as string;
  if (!titleParam) return res.status(400).json({ success: false, error: 'Missing ?title= param.' });

  try {
    // Fetch multiple pages and match by title (API doesn't support real search)
    const normalise = (s: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, '');
    const needle = normalise(titleParam);

    // Scan up to 3 pages; collect an exact match first, then a partial match,
    // and keep the very first item as a last-resort fallback — but only after
    // all pages are scanned so we don't short-circuit early.
    let exactMatch: any = null;
    let partialMatch: any = null;
    let firstItem: any = null;

    for (let page = 1; page <= 3; page++) {
      const data = await ssGet(`/api/hdhub4u?page=${page}`, key);
      const items: any[] = data?.data?.recentMovies ?? data?.data ?? [];
      if (!items.length) break;

      if (page === 1) firstItem = items[0];

      for (const r of items) {
        const norm = normalise(r.title ?? '');
        if (!exactMatch && norm === needle) { exactMatch = r; break; }
        if (!partialMatch && norm.includes(needle)) partialMatch = r;
      }

      if (exactMatch) break; // no need to continue scanning
    }

    const match = exactMatch ?? partialMatch ?? firstItem;

    if (!match) {
      return res.status(404).json({ success: false, error: `"${titleParam}" not found on HDHub4u` });
    }

    const url: string | null = match.url ?? null;
    if (!url) {
      return res.status(404).json({ success: false, error: 'No URL found for this title on HDHub4u' });
    }

    return res.json({ success: true, id: match.id, title: match.title ?? titleParam, streamUrl: url });
  } catch (err: any) {
    console.error('[screenscape] hdhub4u resolve error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
