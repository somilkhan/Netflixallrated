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
    backfillImages: () => fetcher('/titles/backfill-images', { method: 'POST' }),
    seasons: (id: string) => fetcher(`/titles/${id}/seasons`),
    episodes: (id: string, season: number) => fetcher(`/titles/${id}/episodes?season=${season}`),
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
    link: (tmdbId: string, type: 'movie' | 'tv', season?: number, episode?: number) => {
      const params = new URLSearchParams({ id: tmdbId, type });
      if (season) params.set('season', String(season));
      if (episode) params.set('episode', String(episode));
      return fetcher(`/showbox/link?${params.toString()}`);
    },
  },
};
