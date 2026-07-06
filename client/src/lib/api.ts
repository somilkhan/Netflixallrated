const API_BASE = '';

export async function fetchShowboxStream(
  tmdbId: string,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number,
  lang = 'en'
) {
  const params = new URLSearchParams({ id: tmdbId, type });
  if (season) params.set('season', String(season));
  if (episode) params.set('episode', String(episode));
  params.set('lang', lang);

  const res = await fetch(`${API_BASE}/api/showbox/link?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Showbox fetch failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchEmbedServers() {
  const res = await fetch(`${API_BASE}/api/servers`);
  if (!res.ok) throw new Error('Failed to fetch server list');
  return res.json();
}

export async function fetchTMDBSearch(query: string) {
  const res = await fetch(`${API_BASE}/api/tmdb/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('TMDB search failed');
  return res.json();
}

export async function fetchTMDBMovieDetails(id: string) {
  const res = await fetch(`${API_BASE}/api/tmdb/movie/${id}`);
  if (!res.ok) throw new Error('TMDB movie details failed');
  return res.json();
}

export async function fetchTMDBTVDetails(id: string) {
  const res = await fetch(`${API_BASE}/api/tmdb/tv/${id}`);
  if (!res.ok) throw new Error('TMDB TV details failed');
  return res.json();
}

export async function fetchTMDBTVSeasonEpisodes(id: string, seasonNumber: number) {
  const res = await fetch(`${API_BASE}/api/tmdb/tv/${id}/season/${seasonNumber}`);
  if (!res.ok) throw new Error('TMDB season episodes failed');
  return res.json();
}

export async function fetchAniList(query: string, variables: Record<string, any>) {
  const res = await fetch(`${API_BASE}/api/anilist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) throw new Error('AniList request failed');
  return res.json();
}

export async function fetchTVShowDetails(id: string) {
  const data = await fetchTMDBTVDetails(id);
  return {
    seasons: (data.seasons || []).map((s: any) => ({
      seasonNumber: s.season_number,
      name: s.name,
      episodeCount: s.episode_count
    }))
  };
}

export async function fetchTVSeasonEpisodes(id: string, seasonNumber: number) {
  const data = await fetchTMDBTVSeasonEpisodes(id, seasonNumber);
  return (data.episodes || []).map((ep: any) => ({
    number: ep.episode_number,
    title: ep.name || `Episode ${ep.episode_number}`,
    duration: ep.runtime ? `${ep.runtime}m` : '24m',
    thumbnail: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : '',
    videoUrl: '',
    airDate: ep.air_date || 'TBA'
  }));
}
