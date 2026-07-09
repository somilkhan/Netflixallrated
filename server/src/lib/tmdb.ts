// Thin wrapper around the TMDB API. Used only by admin-facing routes to pull
// catalog metadata (name, synopsis, images, trailer) — ratings/watchlist stay
// entirely in our own Prisma DB, TMDB never sees or stores those.

const TMDB_BASE = process.env.TMDB_API_BASE || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

function assertConfigured() {
  if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY is not set in the environment');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Core fetch with automatic 429 retry + exponential backoff.
 * TMDB allows ~40 req/10 s; a 250 ms inter-request delay (enforced by
 * callers) keeps us well under that ceiling in normal use.
 */
async function tmdbFetch(
  path: string,
  params: Record<string, string> = {},
  retries = 4,
): Promise<any> {
  assertConfigured();
  const qs = new URLSearchParams({ api_key: TMDB_API_KEY!, ...params });
  const url = `${TMDB_BASE}${path}?${qs.toString()}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url);

    if (res.status === 429) {
      // Respect Retry-After header if present, otherwise back off exponentially
      const retryAfter = parseInt(res.headers.get('retry-after') || '0', 10) || 0;
      const delay = Math.max(retryAfter * 1000, (attempt + 1) * 2000); // min 2 s, doubles each attempt
      console.warn(`[tmdb] 429 rate-limit on ${path} (attempt ${attempt + 1}/${retries + 1}). Waiting ${delay}ms…`);
      await sleep(delay);
      continue;
    }

    if (!res.ok) throw new Error(`TMDB request failed: ${res.status} ${res.statusText} — ${url}`);
    return res.json();
  }

  throw new Error(`TMDB request failed after ${retries + 1} retries (persistent 429): ${url}`);
}

export function tmdbImageUrl(path: string | null, size: 'w92' | 'w342' | 'w500' | 'w780' | 'original' = 'w500') {
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

export interface TvSeason {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string;
}

export interface TvEpisode {
  episodeNumber: number;
  name: string;
  airDate: string;
  overview: string;
  stillUrl: string | null;
}

export async function getTvSeasons(tmdbId: number): Promise<TvSeason[]> {
  const data = await tmdbFetch(`/tv/${tmdbId}`);
  return (data.seasons || [])
    .filter((s: any) => s.season_number > 0)
    .map((s: any) => ({
      seasonNumber: s.season_number,
      name: s.name,
      episodeCount: s.episode_count,
      airDate: s.air_date || '',
    }));
}

export async function getTvEpisodes(tmdbId: number, seasonNumber: number): Promise<TvEpisode[]> {
  const data = await tmdbFetch(`/tv/${tmdbId}/season/${seasonNumber}`);
  return (data.episodes || []).map((e: any) => ({
    episodeNumber: e.episode_number,
    name: e.name,
    airDate: e.air_date || '',
    overview: e.overview || '',
    stillUrl: tmdbImageUrl(e.still_path, 'w342'),
  }));
}

// ── Discover + genre helpers (used by sync engine) ───────────────────────────

/** Cached genre id→name map. Populated on first call, reused thereafter. */
let _genreCache: Map<number, string> | null = null;

export async function getMovieGenreMap(): Promise<Map<number, string>> {
  if (_genreCache) return _genreCache;
  const data = await tmdbFetch('/genre/movie/list');
  _genreCache = new Map<number, string>(
    (data.genres || []).map((g: { id: number; name: string }) => [g.id, g.name]),
  );
  return _genreCache;
}

export interface DiscoverPage {
  page: number;
  /** Capped at 500 by TMDB regardless of total_results */
  totalPages: number;
  totalResults: number;
  results: any[]; // raw TMDB movie objects
}

/**
 * Fetch a single page of /discover/movie.
 * Callers are responsible for honouring the 250 ms inter-request delay.
 */
export async function discoverMoviesPage(
  page: number,
  extraParams: Record<string, string> = {},
): Promise<DiscoverPage> {
  const today = new Date().toISOString().slice(0, 10);
  const data = await tmdbFetch('/discover/movie', {
    sort_by: 'popularity.desc',
    include_adult: 'false',
    'primary_release_date.lte': today,  // exclude unreleased / announced films
    'vote_count.gte': '50',             // exclude low-signal / placeholder entries
    page: String(page),
    ...extraParams,                     // callers can still override any of the above
  });
  return {
    page: data.page ?? page,
    totalPages: Math.min(data.total_pages ?? 1, 500), // TMDB hard-caps at 500
    totalResults: data.total_results ?? 0,
    results: (data.results || []).filter((r: any) => r.poster_path), // drop posterless junk
  };
}

// ── Region-aware helpers (used by /api/geo) ───────────────────────────────

export interface TmdbRegionItem {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  name: string;
  year: number | null;
  posterUrl: string | null;
  overview: string;
  genres: number[]; // raw genre IDs — no extra round-trip needed for display
}

/** Returns null for items without a poster (caller must filter). */
function normRegionItem(r: any, mediaType: 'movie' | 'tv'): TmdbRegionItem | null {
  if (!r.poster_path) return null;
  return {
    tmdbId: r.id,
    mediaType,
    name: r.title || r.name || '',
    year: (r.release_date || r.first_air_date)
      ? Number((r.release_date || r.first_air_date).slice(0, 4))
      : null,
    posterUrl: tmdbImageUrl(r.poster_path, 'w342'),
    overview: r.overview || '',
    genres: r.genre_ids || [],
  };
}

/** Fetch multiple pages in parallel, flatten, and drop posterless entries. */
async function fetchMultiPage(
  path: string,
  extraParams: Record<string, string> = {},
  pages = 3,
): Promise<any[]> {
  assertConfigured();
  const today = new Date().toISOString().slice(0, 10);
  const defaultParams: Record<string, string> = {
    'primary_release_date.lte': today,
    'vote_count.gte': '50',
  };
  const requests = Array.from({ length: pages }, (_, i) => {
    const qs = new URLSearchParams({
      api_key: TMDB_API_KEY!,
      page: String(i + 1),
      ...defaultParams,
      ...extraParams,
    });
    return fetch(`${TMDB_BASE}${path}?${qs.toString()}`).then(res => {
      if (!res.ok) throw new Error(`TMDb error ${res.status}`);
      return res.json();
    });
  });
  const pages_data = await Promise.all(requests);
  const seen = new Set<number>();
  return pages_data
    .flatMap(p => p.results || [])
    .filter((r: any) => {
      if (!r.poster_path) return false;
      if ((r.vote_count ?? 0) < 50) return false;
      // Exclude unreleased entries regardless of endpoint support for date params
      const releaseDate = r.release_date || r.first_air_date;
      if (!releaseDate || releaseDate > today) return false;
      // TMDB can return the same title on multiple pages when popularity
      // ties shift between concurrent page requests — dedupe by id so
      // callers (and their React list keys) never see the same item twice.
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
}

/**
 * Regional popularity — uses /movie/popular?region=X which TMDB does filter by
 * theatrical availability per country. (The trending endpoint ignores region.)
 */
export async function trendingInRegion(region = 'IN'): Promise<TmdbRegionItem[]> {
  const results = await fetchMultiPage('/movie/popular', { region });
  return results
    .map(r => normRegionItem(r, 'movie'))
    .filter((r): r is TmdbRegionItem => r !== null);
}

export async function popularOnOTT(region = 'IN'): Promise<TmdbRegionItem[]> {
  const results = await fetchMultiPage('/discover/movie', {
    region,
    watch_region: region,
    with_watch_monetization_types: 'flatrate',
    sort_by: 'popularity.desc',
  });
  return results
    .map(r => normRegionItem(r, 'movie'))
    .filter((r): r is TmdbRegionItem => r !== null);
}

export async function discoverByLanguage(language: string, region = 'IN'): Promise<TmdbRegionItem[]> {
  const results = await fetchMultiPage('/discover/movie', {
    with_original_language: language,
    region,
    sort_by: 'popularity.desc',
  });
  return results
    .map(r => normRegionItem(r, 'movie'))
    .filter((r): r is TmdbRegionItem => r !== null);
}

// ── Full details (admin import) ───────────────────────────────────────────

export interface WatchProvider {
  providerId: number;
  name: string;
  logoUrl: string | null;
}

export interface WatchProviders {
  link: string | null;
  flatrate: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

function mapProviders(list: any[] = []): WatchProvider[] {
  return list.map((p: any) => ({
    providerId: p.provider_id,
    name: p.provider_name,
    logoUrl: tmdbImageUrl(p.logo_path, 'w92'),
  }));
}

/** Watch providers (Netflix, Prime Video, Disney+, etc.) for a title in a given region. */
export async function getWatchProviders(tmdbId: number, mediaType: 'movie' | 'tv', region = 'US'): Promise<WatchProviders> {
  const path = mediaType === 'movie' ? `/movie/${tmdbId}/watch/providers` : `/tv/${tmdbId}/watch/providers`;
  const data = await tmdbFetch(path);
  const forRegion = data.results?.[region] || data.results?.US || {};
  return {
    link: forRegion.link || null,
    flatrate: mapProviders(forRegion.flatrate),
    rent: mapProviders(forRegion.rent),
    buy: mapProviders(forRegion.buy),
  };
}

/** Similar titles from TMDB. */
export async function getSimilarTmdb(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<TmdbSearchResult[]> {
  const path = mediaType === 'movie' ? `/movie/${tmdbId}/similar` : `/tv/${tmdbId}/similar`;
  const data = await tmdbFetch(path);
  return (data.results || []).map((r: any) => ({
    tmdbId: r.id,
    mediaType,
    name: r.title || r.name,
    year: (r.release_date || r.first_air_date) ? Number((r.release_date || r.first_air_date).slice(0, 4)) : null,
    posterUrl: tmdbImageUrl(r.poster_path),
    overview: r.overview || '',
  }));
}

/** Recommended titles from TMDB. */
export async function getRecommendationsTmdb(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<TmdbSearchResult[]> {
  const path = mediaType === 'movie' ? `/movie/${tmdbId}/recommendations` : `/tv/${tmdbId}/recommendations`;
  const data = await tmdbFetch(path);
  return (data.results || []).map((r: any) => ({
    tmdbId: r.id,
    mediaType,
    name: r.title || r.name,
    year: (r.release_date || r.first_air_date) ? Number((r.release_date || r.first_air_date).slice(0, 4)) : null,
    posterUrl: tmdbImageUrl(r.poster_path),
    overview: r.overview || '',
  }));
}

export interface CastMember { id: number; name: string; character: string; profileUrl: string | null; }
export interface CrewMember { id: number; name: string; job: string; profileUrl: string | null; }

/** Cast & crew for a title. */
export async function getCreditsTmdb(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<{ cast: CastMember[]; crew: CrewMember[] }> {
  const path = mediaType === 'movie' ? `/movie/${tmdbId}/credits` : `/tv/${tmdbId}/credits`;
  const data = await tmdbFetch(path);
  return {
    cast: (data.cast || []).slice(0, 20).map((c: any) => ({
      id: c.id, name: c.name, character: c.character, profileUrl: tmdbImageUrl(c.profile_path, 'w342'),
    })),
    crew: (data.crew || []).slice(0, 10).map((c: any) => ({
      id: c.id, name: c.name, job: c.job, profileUrl: tmdbImageUrl(c.profile_path, 'w342'),
    })),
  };
}

/** Simple category rows: top_rated / now_playing / upcoming (movie) and top_rated / airing_today / on_the_air (tv). */
export async function getTmdbCategory(mediaType: 'movie' | 'tv', category: string, page = 1): Promise<TmdbSearchResult[]> {
  const data = await tmdbFetch(`/${mediaType}/${category}`, { page: String(page) });
  return (data.results || [])
    .filter((r: any) => r.poster_path)
    .map((r: any) => ({
      tmdbId: r.id,
      mediaType,
      name: r.title || r.name,
      year: (r.release_date || r.first_air_date) ? Number((r.release_date || r.first_air_date).slice(0, 4)) : null,
      posterUrl: tmdbImageUrl(r.poster_path),
      overview: r.overview || '',
    }));
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
