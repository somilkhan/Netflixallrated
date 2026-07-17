const API_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const inflight = new Map<string, Promise<any>>();

// Simple TTL cache for hot read-only endpoints (genres, top10, trending, recent, geo)
const cache = new Map<string, { value: any; expires: number }>();
const TTL_MS = 60_000; // 1 minute

function cachedFetcher(cacheKey: string, ttl: number, fetcher: () => Promise<any>): Promise<any> {
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > now) return Promise.resolve(hit.value);

  if (inflight.has(cacheKey)) return inflight.get(cacheKey)!;

  const req = fetcher().then((value: any) => {
    cache.set(cacheKey, { value, expires: Date.now() + ttl });
    return value;
  }).finally(() => inflight.delete(cacheKey));

  inflight.set(cacheKey, req);
  return req;
}

async function fetcher(path: string, options?: RequestInit) {
  const token = localStorage.getItem('token');
  const method = (options?.method || 'GET').toUpperCase();
  const dedupeKey = method === 'GET' ? `${token || 'anon'}::${path}` : null;

  if (dedupeKey && inflight.has(dedupeKey)) {
    return inflight.get(dedupeKey);
  }

  const request = (async () => {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  })();

  if (dedupeKey) {
    inflight.set(dedupeKey, request);
    request.finally(() => inflight.delete(dedupeKey));
  }

  return request;
}

export const api = {
  auth: {
    me: () => fetcher('/auth/me'),
    updateMe: (data: { displayName?: string; avatarUrl?: string }) =>
      fetcher('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
    promote: (email: string, adminPassword: string) =>
      fetcher('/auth/promote', { method: 'POST', body: JSON.stringify({ email, adminPassword }) }),
  },
  titles: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetcher(`/titles${qs}`);
    },
    get: (id: string) => fetcher(`/titles/${id}`),
    // Hot endpoints — TTL-cached so Ticker + Home don't each fire separate requests
    top10: () => cachedFetcher('top10', TTL_MS, () => fetcher('/titles/top10')),
    trending: () => cachedFetcher('trending', TTL_MS, () => fetcher('/titles/trending')),
    recent: () => cachedFetcher('recent', TTL_MS, () => fetcher('/titles/recent')),
    genres: () => cachedFetcher('genres', TTL_MS * 5, () => fetcher('/titles/genres')),
    rate: (id: string, data: { tier: string; reviewText?: string }) =>
      fetcher(`/titles/${id}/ratings`, { method: 'POST', body: JSON.stringify(data) }),
    ratings: (id: string) => fetcher(`/titles/${id}/ratings`),
    liveSearch: (q: string, signal?: AbortSignal) =>
      fetcher(`/titles/live-search?q=${encodeURIComponent(q)}`, signal ? { signal } : undefined),
    tmdbSearch: (q: string) => fetcher(`/titles/tmdb-search?q=${encodeURIComponent(q)}`),
    importTmdb: (data: { tmdbId: number; mediaType: 'movie' | 'tv'; type: string }) =>
      fetcher('/titles/import-tmdb', { method: 'POST', body: JSON.stringify(data) }),
    syncTmdb: () => fetcher('/titles/sync-tmdb', { method: 'POST' }),
    syncStatus: () => fetcher('/titles/sync-status'),
 
    seasons: (id: string) => fetcher(`/titles/${id}/seasons`),
    episodes: (id: string, season: number) => fetcher(`/titles/${id}/episodes?season=${season}`),
    resolveTmdb: (tmdbId: number, mediaType: 'movie' | 'tv') =>
      fetcher('/titles/resolve-tmdb', { method: 'POST', body: JSON.stringify({ tmdbId, mediaType }) }),
    resolveAnilist: (data: {
      anilistId: number; name: string; romaji?: string; year?: number;
      genres?: string[]; synopsis?: string; posterUrl?: string; backdropUrl?: string;
    }) => fetcher('/titles/resolve-anilist', { method: 'POST', body: JSON.stringify(data) }),
    watchProviders: (id: string, region = 'US') => fetcher(`/titles/${id}/watch-providers?region=${region}`),
    watchProvidersList: (region = 'US') => fetcher(`/titles/watch-providers-list?region=${region}`),
    similar: (id: string) => fetcher(`/titles/${id}/similar`),
    recommendations: (id: string) => fetcher(`/titles/${id}/recommendations`),
    credits: (id: string) => fetcher(`/titles/${id}/credits`),
    category: (mediaType: 'movie' | 'tv', category: string) =>
      fetcher(`/titles/tmdb-category?mediaType=${mediaType}&category=${category}`),
  },
  watchlist: {
    add: (data: { titleId: string; status: string }) =>
      fetcher('/watchlist', { method: 'POST', body: JSON.stringify(data) }),
    mine: () => fetcher('/watchlist/me'),
    update: (id: string, data: { status: string }) =>
      fetcher(`/watchlist/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetcher(`/watchlist/${id}`, { method: 'DELETE' }),
  },
  platforms: { list: () => fetcher('/platforms') },
  geo: {
    detect: () => fetcher('/geo/detect'),
    content: (region: string) =>
      cachedFetcher(`geo:${region}`, TTL_MS * 2, () =>
        fetcher(`/geo/content?region=${encodeURIComponent(region)}`)),
  },
  showbox: {
    /**
     * Resolve a FebBox embed URL for a given TMDB title.
     * Returns { success, embedUrl, shareKey, fid, streams[] }.
     * Pass titleName to skip the server-side TMDB lookup (saves a round-trip).
     */
    link: (
      tmdbId: string,
      type: 'movie' | 'tv',
      season?: number,
      episode?: number,
      titleName?: string,
    ) => {
      const params = new URLSearchParams({ id: tmdbId, type });
      if (season) params.set('season', String(season));
      if (episode) params.set('episode', String(episode));
      if (titleName) params.set('title', titleName);
      return fetcher(`/showbox/link?${params.toString()}`);
    },
  },
  screenscape: {
    /**
     * Search 4kHDHub for a title and resolve an embed/stream URL in one call.
     * Returns { success, id, title, embedUrl, streamUrl }.
     */
    resolve: (titleName: string, type: 'movie' | 'tv', season = 1, episode = 1) => {
      const params = new URLSearchParams({
        title: titleName,
        type,
        season: String(season),
        episode: String(episode),
      });
      return fetcher(`/screenscape/resolve?${params.toString()}`);
    },
    list: (page = 1) => fetcher(`/screenscape/list?page=${page}`),
    search: (q: string) => fetcher(`/screenscape/search?q=${encodeURIComponent(q)}`),
    /** Resolve an HDHub4u download page URL for a title. Returns { success, id, title, streamUrl }. */
    hdhub4uResolve: (titleName: string) =>
      fetcher(`/screenscape/hdhub4u/resolve?title=${encodeURIComponent(titleName)}`),
    hdhub4uList: (page = 1) => fetcher(`/screenscape/hdhub4u?page=${page}`),
  },
  history: {
    /** Full watch history, most-recent first. Requires auth. */
    mine: () => fetcher('/history/me'),
    /** Progress record for a single title. Requires auth. */
    get: (titleId: string) => fetcher(`/history/me/${encodeURIComponent(titleId)}`),
    /** Upsert progress (call on play-start, periodically, and on stop). */
    save: (data: {
      titleId: string;
      positionSeconds: number;
      durationSeconds?: number;
      seasonNumber?: number | null;
      episodeNumber?: number | null;
      episodeTitle?: string | null;
      completed?: boolean;
    }) => fetcher('/history', { method: 'POST', body: JSON.stringify(data) }),
    /** Remove one title from history. */
    remove: (titleId: string) =>
      fetcher(`/history/${encodeURIComponent(titleId)}`, { method: 'DELETE' }),
    /** Wipe the user's entire history. */
    clear: () => fetcher('/history', { method: 'DELETE' }),
  },
  consumet: {
    animeSearch: (q: string) => fetcher(`/consumet/anime/search?q=${encodeURIComponent(q)}`),
    animeInfo: (animeId: string) => fetcher(`/consumet/anime/info/${encodeURIComponent(animeId)}`),
    animeStream: (episodeId: string) => fetcher(`/consumet/anime/stream/${encodeURIComponent(episodeId)}`),
    moviesAuto: (title: string, type: string, season = 1, ep = 1) =>
      fetcher(`/consumet/movies/auto?title=${encodeURIComponent(title)}&type=${encodeURIComponent(type)}&season=${season}&ep=${ep}`),
    /** Returns a full URL for the embedded HLS player page (for use as iframe src) */
    playerUrl: (src: string, referer = '') =>
      `${API_URL}/consumet/player?src=${encodeURIComponent(src)}&ref=${encodeURIComponent(referer)}`,
  },
};
