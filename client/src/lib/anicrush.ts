/**
 * Direct browser-side calls to api.anicrush.to.
 * Bypasses the server proxy because Cloudflare blocks datacenter IPs (521).
 * Browsers use residential IPs and are not blocked.
 */

const BASE = 'https://api.anicrush.to';

function headers(): Record<string, string> {
  return {
    Accept: 'application/json, text/plain, */*',
    'x-site': 'anicrush',
    Referer: 'https://anicrush.to/',
  };
}

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(`Anicrush ${res.status}`);
  return res.json() as Promise<T>;
}

export interface AnicrushMovie {
  id: string;
  name: string;
  totalEpisodes: number;
  [key: string]: unknown;
}

export async function searchAnime(
  keyword: string,
  page = 1,
  limit = 10,
): Promise<AnicrushMovie[]> {
  const data = await get<any>('/shared/v2/movie/list', {
    keyword,
    page: String(page),
    limit: String(limit),
  });
  return data?.result?.movies ?? [];
}

export async function getEpisodeCount(movieId: string): Promise<number> {
  try {
    const data = await get<any>('/shared/v2/episode/list', { _movieId: movieId });
    return (
      data?.result?.totalItems ??
      data?.result?.items?.length ??
      0
    );
  } catch {
    return 0;
  }
}

export async function getEmbedUrl(
  movieId: string,
  episode: number,
  serverIndex = 1,
): Promise<{ embedUrl: string; serverName: string; serverCount: number }> {
  const data = await get<any>('/shared/v2/episode/servers', {
    _movieId: movieId,
    ep: String(episode),
  });

  const servers: any[] = data?.result?.servers ?? [];
  if (!servers.length) throw new Error('No servers available for this episode');

  const idx = Math.min(Math.max(serverIndex - 1, 0), servers.length - 1);
  const entry = servers[idx] || servers[0];
  let embedUrl: string = entry?.link ?? '';
  embedUrl = embedUrl.replace(/\.blog\b/g, '.tv');
  if (!embedUrl) throw new Error('Server link missing');

  return {
    embedUrl,
    serverName: entry?.name ?? `Server ${idx + 1}`,
    serverCount: servers.length,
  };
}
