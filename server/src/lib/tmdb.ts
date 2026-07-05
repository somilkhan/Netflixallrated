// Thin wrapper around the TMDB API. Used only by admin-facing routes to pull
// catalog metadata (name, synopsis, images, trailer) — ratings/watchlist stay
// entirely in our own Prisma DB, TMDB never sees or stores those.

const TMDB_BASE = process.env.TMDB_API_BASE || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

function assertConfigured() {
  if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY is not set in the environment');
}

async function tmdbFetch(path: string, params: Record<string, string> = {}) {
  assertConfigured();
  const qs = new URLSearchParams({ api_key: TMDB_API_KEY!, ...params });
  const res = await fetch(`${TMDB_BASE}${path}?${qs.toString()}`);
  if (!res.ok) throw new Error(`TMDB request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export function tmdbImageUrl(path: string | null, size: 'w342' | 'w500' | 'w780' | 'original' = 'w500') {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

export interface TmdbSearchResult {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  name: string;
  year: number | null;
  posterUrl: string | null;
  overview: string;
}

export async function searchTmdb(query: string): Promise<TmdbSearchResult[]> {
  const data = await tmdbFetch('/search/multi', { query, include_adult: 'false' });
  return (data.results || [])
    .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
    .map((r: any) => ({
      tmdbId: r.id,
      mediaType: r.media_type,
      name: r.title || r.name,
      year: (r.release_date || r.first_air_date) ? Number((r.release_date || r.first_air_date).slice(0, 4)) : null,
      posterUrl: tmdbImageUrl(r.poster_path),
      overview: r.overview || '',
    }));
}

/**
 * Fetch trending titles from TMDB (movies + TV combined).
 * @param timeWindow 'day' or 'week' — weekly gives more stable results
 */
export async function getTrendingTmdb(timeWindow: 'day' | 'week' = 'week'): Promise<TmdbSearchResult[]> {
  const data = await tmdbFetch(`/trending/all/${timeWindow}`);
  return (data.results || [])
    .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 50)
    .map((r: any) => ({
      tmdbId: r.id,
      mediaType: r.media_type as 'movie' | 'tv',
      name: r.title || r.name,
      year: (r.release_date || r.first_air_date)
        ? Number((r.release_date || r.first_air_date).slice(0, 4))
        : null,
      posterUrl: tmdbImageUrl(r.poster_path),
      overview: r.overview || '',
    }));
}

export interface TmdbDetails {
  tmdbId: number;
  name: string;
  year: number;
  runtimeMinutes: number | null;
  genres: string[];
  synopsis: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerYoutubeId: string | null;
}

export async function getTmdbDetails(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<TmdbDetails> {
  const path = mediaType === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
  const detail = await tmdbFetch(path, { append_to_response: 'videos' });
  const dateStr: string = detail.release_date || detail.first_air_date || '';
  const trailer = (detail.videos?.results || []).find(
    (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  );
  return {
    tmdbId,
    name: detail.title || detail.name,
    year: dateStr ? Number(dateStr.slice(0, 4)) : new Date().getFullYear(),
    runtimeMinutes: detail.runtime || (Array.isArray(detail.episode_run_time) ? detail.episode_run_time[0] : null) || null,
    genres: (detail.genres || []).map((g: any) => g.name),
    synopsis: detail.overview || '',
    posterUrl: tmdbImageUrl(detail.poster_path),
    backdropUrl: tmdbImageUrl(detail.backdrop_path, 'w780'),
    trailerYoutubeId: trailer?.key || null,
  };
}
