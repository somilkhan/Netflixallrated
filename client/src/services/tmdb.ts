/**
 * Direct TMDB API service.
 * Requires VITE_TMDB_API_KEY environment variable.
 * Base: https://api.themoviedb.org/3
 * Images: https://image.tmdb.org/t/p/
 */

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/';

// 5-minute TTL cache
const _cache = new Map<string, { value: any; expires: number }>();
const TTL_MS = 5 * 60 * 1000;

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = (import.meta as any).env?.VITE_TMDB_API_KEY;
  if (!key) throw new Error('VITE_TMDB_API_KEY is not configured');

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', key);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const cacheKey = url.toString();
  const cached = _cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.value as T;

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${res.statusText}`);
  const data = await res.json();
  _cache.set(cacheKey, { value: data, expires: Date.now() + TTL_MS });
  return data as T;
}

// ── Region params ──────────────────────────────────────────────────────────
export interface RegionParams {
  /** ISO 3166-1 alpha-2 country code, e.g. 'IN', 'US', 'KR' */
  region?: string;
  /** BCP 47 language tag, e.g. 'hi-IN', 'en-US', 'ko-KR' */
  language?: string;
}

function applyRegion(params: Record<string, string>, rp: RegionParams): void {
  if (rp.region)   params['region']   = rp.region;
  if (rp.language) params['language'] = rp.language;
  params['include_adult'] = 'false';
}

// ── Genre maps ────────────────────────────────────────────────────────────
const MOVIE_GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
  10752: 'War', 37: 'Western', 10770: 'TV Movie',
};

const TV_GENRE_MAP: Record<number, string> = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 10762: 'Kids',
  9648: 'Mystery', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
  10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics', 37: 'Western',
};

export function resolveGenreIds(ids: number[], mediaType: 'movie' | 'tv'): string[] {
  const map = mediaType === 'movie' ? MOVIE_GENRE_MAP : TV_GENRE_MAP;
  return (ids ?? []).map(id => map[id]).filter(Boolean);
}

// ── Image helpers ─────────────────────────────────────────────────────────
export function getImageUrl(path: string | null | undefined, size = 'w500'): string | null {
  return path ? `${IMAGE_BASE}${size}${path}` : null;
}

export function getBackdropUrl(path: string | null | undefined, size = 'w1280'): string | null {
  return path ? `${IMAGE_BASE}${size}${path}` : null;
}

// ── Normalized item shape ─────────────────────────────────────────────────
// Shaped to be compatible with ContentCard's expected props.
export interface TmdbNormalized {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  /** Placeholder ID — use tmdbId + mediaType for backend resolution */
  id: string;
  name: string;
  year: number | null;
  /** Maps to ContentCard's type badge */
  type: 'MOVIE' | 'SERIES';
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number | null;
  genres: string[];
  synopsis: string;
  trailerYoutubeId?: string;
  /** ISO 639-1 original language code, e.g. "hi", "ta", "te" */
  originalLanguage?: string;
}

function normalize(item: any, overrideMediaType?: 'movie' | 'tv'): TmdbNormalized {
  const mediaType: 'movie' | 'tv' =
    overrideMediaType ?? item.media_type ?? (item.title ? 'movie' : 'tv');
  const dateStr = item.release_date || item.first_air_date || '';
  const year = dateStr ? new Date(dateStr).getFullYear() : null;
  return {
    tmdbId: item.id,
    mediaType,
    id: `tmdb-${item.id}`,
    name: item.title || item.name || '',
    year: Number.isNaN(year) ? null : year,
    type: mediaType === 'movie' ? 'MOVIE' : 'SERIES',
    posterUrl: getImageUrl(item.poster_path, 'w500'),
    backdropUrl: getBackdropUrl(item.backdrop_path, 'w1280'),
    rating: item.vote_average ?? null,
    genres: resolveGenreIds(item.genre_ids ?? [], mediaType),
    synopsis: item.overview || '',
    originalLanguage: item.original_language ?? undefined,
  };
}

// ── API functions ─────────────────────────────────────────────────────────

export async function getTrending(
  type: 'all' | 'movie' | 'tv' = 'all',
  timeWindow: 'day' | 'week' = 'day',
  page = 1,
  rp: RegionParams = {},
): Promise<TmdbNormalized[]> {
  const params: Record<string, string> = { page: String(page) };
  applyRegion(params, rp);
  const data = await tmdbFetch<{ results: any[] }>(`/trending/${type}/${timeWindow}`, params);
  return data.results.map(item => normalize(item));
}

export async function getPopularMovies(page = 1, rp: RegionParams = {}): Promise<TmdbNormalized[]> {
  const params: Record<string, string> = { page: String(page) };
  applyRegion(params, rp);
  const data = await tmdbFetch<{ results: any[] }>('/movie/popular', params);
  return data.results.map(item => normalize(item, 'movie'));
}

export async function getPopularTVShows(page = 1, rp: RegionParams = {}): Promise<TmdbNormalized[]> {
  const params: Record<string, string> = { page: String(page) };
  applyRegion(params, rp);
  const data = await tmdbFetch<{ results: any[] }>('/tv/popular', params);
  return data.results.map(item => normalize(item, 'tv'));
}

export async function getTopRatedMovies(page = 1, rp: RegionParams = {}): Promise<TmdbNormalized[]> {
  const params: Record<string, string> = { page: String(page) };
  applyRegion(params, rp);
  const data = await tmdbFetch<{ results: any[] }>('/movie/top_rated', params);
  return data.results.map(item => normalize(item, 'movie'));
}

export async function getTopRatedTVShows(page = 1, rp: RegionParams = {}): Promise<TmdbNormalized[]> {
  const params: Record<string, string> = { page: String(page) };
  applyRegion(params, rp);
  const data = await tmdbFetch<{ results: any[] }>('/tv/top_rated', params);
  return data.results.map(item => normalize(item, 'tv'));
}

export async function getNowPlayingMovies(page = 1, rp: RegionParams = {}): Promise<TmdbNormalized[]> {
  const params: Record<string, string> = { page: String(page) };
  applyRegion(params, rp);
  const data = await tmdbFetch<{ results: any[] }>('/movie/now_playing', params);
  return data.results.map(item => normalize(item, 'movie'));
}

export async function getUpcomingMovies(page = 1, rp: RegionParams = {}): Promise<TmdbNormalized[]> {
  const params: Record<string, string> = { page: String(page) };
  applyRegion(params, rp);
  const data = await tmdbFetch<{ results: any[] }>('/movie/upcoming', params);
  return data.results.map(item => normalize(item, 'movie'));
}

export async function getMoviesByGenre(genreId: number, page = 1): Promise<TmdbNormalized[]> {
  const data = await tmdbFetch<{ results: any[] }>('/discover/movie', {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
    page: String(page),
  });
  return data.results.map(item => normalize(item, 'movie'));
}

export async function getTVByGenre(genreId: number, page = 1): Promise<TmdbNormalized[]> {
  const data = await tmdbFetch<{ results: any[] }>('/discover/tv', {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
    page: String(page),
  });
  return data.results.map(item => normalize(item, 'tv'));
}

// ── Indian regional content ────────────────────────────────────────────────

/** Bollywood — Hindi movies sorted by popularity */
export async function getBollywoodMovies(page = 1): Promise<TmdbNormalized[]> {
  const data = await tmdbFetch<{ results: any[] }>('/discover/movie', {
    with_original_language: 'hi',
    sort_by: 'popularity.desc',
    'vote_count.gte': '50',
    page: String(page),
  });
  return data.results.map(item => normalize(item, 'movie'));
}

/** South Indian cinema — Tamil + Telugu combined, sorted by popularity */
export async function getSouthIndianMovies(page = 1): Promise<TmdbNormalized[]> {
  const [tamilData, teluguData] = await Promise.all([
    tmdbFetch<{ results: any[] }>('/discover/movie', {
      with_original_language: 'ta',
      sort_by: 'popularity.desc',
      page: String(page),
    }),
    tmdbFetch<{ results: any[] }>('/discover/movie', {
      with_original_language: 'te',
      sort_by: 'popularity.desc',
      page: String(page),
    }),
  ]);
  const seen = new Set<number>();
  const merged: TmdbNormalized[] = [];
  for (const item of [...tamilData.results, ...teluguData.results]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(normalize(item, 'movie'));
  }
  return merged.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
}

/** Hindi web series / OTT shows */
export async function getHindiWebSeries(page = 1): Promise<TmdbNormalized[]> {
  const data = await tmdbFetch<{ results: any[] }>('/discover/tv', {
    with_original_language: 'hi',
    sort_by: 'popularity.desc',
    page: String(page),
  });
  return data.results.map(item => normalize(item, 'tv'));
}

/** Malayalam movies */
export async function getMalayalamMovies(page = 1): Promise<TmdbNormalized[]> {
  const data = await tmdbFetch<{ results: any[] }>('/discover/movie', {
    with_original_language: 'ml',
    sort_by: 'popularity.desc',
    page: String(page),
  });
  return data.results.map(item => normalize(item, 'movie'));
}

/** Kannada movies */
export async function getKannadaMovies(page = 1): Promise<TmdbNormalized[]> {
  const data = await tmdbFetch<{ results: any[] }>('/discover/movie', {
    with_original_language: 'kn',
    sort_by: 'popularity.desc',
    page: String(page),
  });
  return data.results.map(item => normalize(item, 'movie'));
}

/** Generic Indian-language discover — used by Browse language filter */
export async function getIndianByLanguage(
  langCode: string,
  mediaType: 'movie' | 'tv' = 'movie',
  page = 1,
): Promise<TmdbNormalized[]> {
  const data = await tmdbFetch<{ results: any[] }>(`/discover/${mediaType}`, {
    with_original_language: langCode,
    sort_by: 'popularity.desc',
    page: String(page),
  });
  return data.results.map(item => normalize(item, mediaType));
}

export async function searchMulti(query: string, page = 1): Promise<TmdbNormalized[]> {
  // Fan out to all three endpoints in parallel so regional / less-popular titles
  // (e.g. Tamil "Master" tmdbId 626392) that rank low in /search/multi still surface.
  const [multiData, movieData, tvData] = await Promise.allSettled([
    tmdbFetch<{ results: any[] }>('/search/multi', { query, page: String(page) }),
    tmdbFetch<{ results: any[] }>('/search/movie', { query, page: String(page) }),
    tmdbFetch<{ results: any[] }>('/search/tv',    { query, page: String(page) }),
  ]);

  const seen = new Set<string>();
  const merged: TmdbNormalized[] = [];

  // Helper: push unique items (deduplicated by mediaType+tmdbId)
  const push = (items: any[], overrideMediaType?: 'movie' | 'tv') => {
    for (const item of items) {
      const mt: 'movie' | 'tv' =
        overrideMediaType ?? item.media_type ?? (item.title ? 'movie' : 'tv');
      if (mt !== 'movie' && mt !== 'tv') continue; // skip 'person' etc.
      const key = `${mt}-${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(normalize({ ...item, media_type: mt }));
    }
  };

  // /search/multi results first (ranked by TMDB relevance)
  if (multiData.status === 'fulfilled') push(multiData.value.results ?? []);
  // Then fill in from /search/movie and /search/tv (catches regional titles)
  if (movieData.status === 'fulfilled') push(movieData.value.results ?? [], 'movie');
  if (tvData.status   === 'fulfilled') push(tvData.value.results   ?? [], 'tv');

  return merged;
}

export async function getMovieDetails(id: number): Promise<any> {
  return tmdbFetch(`/movie/${id}`);
}

export async function getTVDetails(id: number): Promise<any> {
  return tmdbFetch(`/tv/${id}`);
}

/** Returns the YouTube trailer key for a movie, or null if not found. */
export async function getMovieVideos(id: number): Promise<string | null> {
  try {
    const data = await tmdbFetch<{ results: any[] }>(`/movie/${id}/videos`);
    const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')
      ?? data.results.find(v => v.site === 'YouTube');
    return trailer?.key ?? null;
  } catch {
    return null;
  }
}

/** Returns the YouTube trailer key for a TV show, or null if not found. */
export async function getTVVideos(id: number): Promise<string | null> {
  try {
    const data = await tmdbFetch<{ results: any[] }>(`/tv/${id}/videos`);
    const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')
      ?? data.results.find(v => v.site === 'YouTube');
    return trailer?.key ?? null;
  } catch {
    return null;
  }
}

export async function getMovieCredits(id: number): Promise<any> {
  return tmdbFetch(`/movie/${id}/credits`);
}

/** Returns deduplicated genre list from both movie and TV genres. */
export async function getGenres(): Promise<{ id: number; name: string }[]> {
  const [moviesData, tvData] = await Promise.all([
    tmdbFetch<{ genres: any[] }>('/genre/movie/list'),
    tmdbFetch<{ genres: any[] }>('/genre/tv/list'),
  ]);
  const seen = new Set<number>();
  return [...moviesData.genres, ...tvData.genres].filter(g => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });
}

export function hasTmdbKey(): boolean {
  return !!(import.meta as any).env?.VITE_TMDB_API_KEY;
}
