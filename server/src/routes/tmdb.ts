import { Router } from 'express';

const router = Router();
const TMDB_BASE = process.env.TMDB_API_BASE || 'https://api.themoviedb.org/3';

/**
 * Only expose the read-only TMDB resources used by the client. Keeping the
 * path allowlist here prevents this proxy from becoming a general-purpose
 * outbound request endpoint.
 */
const ALLOWED_PATHS = [
  /^\/trending\/(?:all|movie|tv)\/(?:day|week)$/,
  /^\/(?:movie|tv)\/(?:popular|top_rated|now_playing|upcoming|on_the_air)$/,
  /^\/(?:movie|tv)\/\d+(?:\/(?:videos|credits))?$/,
  /^\/discover\/(?:movie|tv)$/,
  /^\/search\/(?:multi|movie|tv)$/,
  /^\/genre\/(?:movie|tv)\/list$/,
];

const ALLOWED_QUERY_KEYS = new Set([
  'append_to_response',
  'include_adult',
  'language',
  'page',
  'query',
  'region',
  'sort_by',
  'vote_count.gte',
  'with_genres',
  'with_original_language',
]);

function isAllowedPath(path: string): boolean {
  return ALLOWED_PATHS.some(pattern => pattern.test(path));
}

/**
 * GET /api/tmdb/*
 * Server-side TMDB fallback for production builds that were not given a
 * VITE_TMDB_API_KEY at frontend build time.
 */
router.get('/*', async (req, res) => {
  const wildcard = (req.params as Record<string, string>)[0] || '';
  const path = `/${wildcard}`;
  const apiKey = process.env.TMDB_API_KEY?.trim();

  if (!apiKey) {
    res.status(503).json({ error: 'TMDB service is not configured' });
    return;
  }

  if (!isAllowedPath(path)) {
    res.status(404).json({ error: 'TMDB resource is not available' });
    return;
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', apiKey);

  for (const [key, rawValue] of Object.entries(req.query)) {
    if (!ALLOWED_QUERY_KEYS.has(key) || typeof rawValue !== 'string') continue;
    if (rawValue.length > 200) {
      res.status(400).json({ error: `TMDB query parameter "${key}" is too long` });
      return;
    }
    url.searchParams.set(key, rawValue);
  }

  try {
    const response = await fetch(url);
    const body = await response.json() as unknown;

    if (!response.ok) {
      console.error(`[tmdb-proxy] TMDB returned ${response.status} for ${path}`);
      res.status(response.status).json({ error: 'TMDB request failed' });
      return;
    }

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.json(body);
  } catch (error) {
    console.error(`[tmdb-proxy] Request failed for ${path}:`, error);
    res.status(502).json({ error: 'TMDB service unavailable' });
  }
});

export default router;