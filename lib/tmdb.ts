/**
 * TMDb utility functions for Luma's Cinema section.
 * Supports dynamic region so responses stay relevant to the viewer's country.
 *
 * Docs: https://developer.themoviedb.org/docs
 */

const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

// ── Runtime guard ────────────────────────────────────────────────────────────
if (!API_KEY) {
  console.error(
    '[tmdb] FATAL: TMDB_API_KEY is not set in the environment. ' +
      'All TMDb requests will fail. ' +
      'Add it via Replit Secrets (key: TMDB_API_KEY).'
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function tmdbFetch(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDb error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Weekly trending movies filtered to the viewer's region.
 */
export async function trendingInRegion(region: string = 'IN'): Promise<unknown> {
  const url = `${TMDB_BASE}/trending/movie/week?api_key=${API_KEY}&region=${region}`;
  return tmdbFetch(url);
}

/**
 * Movies available on subscription streaming services in the viewer's region.
 */
export async function popularOnOTT(region: string = 'IN'): Promise<unknown> {
  const url =
    `${TMDB_BASE}/discover/movie` +
    `?api_key=${API_KEY}` +
    `&region=${region}` +
    `&watch_region=${region}` +
    `&with_watch_monetization_types=flatrate` +
    `&sort_by=popularity.desc`;
  return tmdbFetch(url);
}

/**
 * Discover movies by original language, sorted by popularity in the region.
 */
export async function discoverByLanguage(
  language: string,
  region: string
): Promise<unknown> {
  const url =
    `${TMDB_BASE}/discover/movie` +
    `?api_key=${API_KEY}` +
    `&with_original_language=${language}` +
    `&region=${region}` +
    `&sort_by=popularity.desc`;
  return tmdbFetch(url);
}
