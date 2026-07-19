/**
 * /api/sports/* — server-side proxy to api.bingr.one
 *
 * Bingr's sports API requires Origin: https://bingr.one, which we can only
 * send from a server context. The frontend calls /api/sports/* and we forward
 * to upstream with the correct headers.
 */
import { Router } from 'express';

const router = Router();

const UPSTREAM = 'https://api.bingr.one/api/sports';
const PROXY_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Origin':          'https://bingr.one',
  'Referer':         'https://bingr.one/',
  'Accept':          'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function proxyGet(url: string) {
  const res = await fetch(url, {
    headers: PROXY_HEADERS,
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw Object.assign(new Error(`upstream ${res.status}`), { status: res.status });
  return res.json();
}

// ── GET /api/sports/matches ──────────────────────────────────────────────────
// Returns all today's live / scheduled matches from bingr's feed.
router.get('/matches', async (_req, res) => {
  try {
    const data = await proxyGet(`${UPSTREAM}/matches/all`);
    res.json(data);
  } catch (err: any) {
    const status = err.status ?? 502;
    res.status(status).json({ error: err.message ?? 'upstream error' });
  }
});

// ── GET /api/sports/stream/:source/:id ──────────────────────────────────────
// Returns array of stream options: { id, streamNo, language, hd, embedUrl, source }
// :id is URL-encoded (e.g. wc%2F2026-07-19%2Fesp-arg)
router.get('/stream/:source/:id', async (req, res) => {
  const { source, id } = req.params;
  try {
    const url = `${UPSTREAM}/stream/${encodeURIComponent(source)}/${encodeURIComponent(id)}`;
    const data = await proxyGet(url);
    res.json(data);
  } catch (err: any) {
    const status = err.status ?? 502;
    res.status(status).json({ error: err.message ?? 'upstream error' });
  }
});

export default router;
