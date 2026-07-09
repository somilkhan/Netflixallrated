const API_URL = (import.meta as any).env?.VITE_API_URL || '/api';

async function fetcher(path: string, options?: RequestInit) {
  const token = localStorage.getItem('token');
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
    top10: () => fetcher('/titles/top10'),
    trending: () => fetcher('/titles/trending'),
    recent: () => fetcher('/titles/recent'),
    rate: (id: string, data: { tier: string; reviewText?: string }) =>
      fetcher(`/titles/${id}/ratings`, { method: 'POST', body: JSON.stringify(data) }),
    ratings: (id: string) => fetcher(`/titles/${id}/ratings`),
    liveSearch: (q: string) => fetcher(`/titles/live-search?q=${encodeURIComponent(q)}`),
    tmdbSearch: (q: string) => fetcher(`/titles/tmdb-search?q=${encodeURIComponent(q)}`),
    importTmdb: (data: { tmdbId: number; mediaType: 'movie' | 'tv'; type: string }) =>
      fetcher('/titles/import-tmdb', { method: 'POST', body: JSON.stringify(data) }),
    syncTmdb: () => fetcher('/titles/sync-tmdb', { method: 'POST' }),
    syncStatus: () => fetcher('/titles/sync-status'),
    backfillImages: () => fetcher('/titles/backfill-images', { method: 'POST' }),
    genres: () => fetcher('/titles/genres'),
    seasons: (id: string) => fetcher(`/titles/${id}/seasons`),
    episodes: (id: string, season: number) => fetcher(`/titles/${id}/episodes?season=${season}`),
    resolveTmdb: (tmdbId: number, mediaType: 'movie' | 'tv') =>
      fetcher('/titles/resolve-tmdb', { method: 'POST', body: JSON.stringify({ tmdbId, mediaType }) }),
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
    content: (region: string) => fetcher(`/geo/content?region=${encodeURIComponent(region)}`),
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
