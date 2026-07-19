/**
 * Sports API — api.bingr.one proxied via /api/sports/*.
 *
 * Stream resolution strategy:
 * 1. Try GET /api/sports/stream/{source}/{id} with a 6 s timeout.
 *    On success, use the returned streams (they include gid tokens + HLS URLs).
 * 2. On timeout or error, fall back to direct embedindia.st embed URLs
 *    constructed from the source ID — these work without a token.
 */

export interface LiveMatch {
  id: string;
  title: string;
  category: string;   // "football" | "basketball" | "baseball" | …
  date: number;       // unix ms
  poster: string | null;
  popular: boolean;
  teams: {
    home: { name: string; badge: string };
    away: { name: string; badge: string };
  };
  sources: { source: string; id: string }[];
}

export interface MatchStream {
  id: string;
  streamNo: number;
  language: string;
  hd: boolean;
  embedUrl: string;
  source: string;
  isFallback?: boolean;  // true = constructed without API token
}

export const CATEGORY_META: Record<string, { emoji: string; label: string; order: number }> = {
  'football':          { emoji: '⚽', label: 'Football',   order: 0 },
  'cricket':           { emoji: '🏏', label: 'Cricket',    order: 1 },
  'basketball':        { emoji: '🏀', label: 'Basketball', order: 2 },
  'baseball':          { emoji: '⚾', label: 'Baseball',   order: 3 },
  'american-football': { emoji: '🏈', label: 'NFL',        order: 4 },
  'volleyball':        { emoji: '🏐', label: 'Volleyball', order: 5 },
  'darts':             { emoji: '🎯', label: 'Darts',      order: 6 },
  'golf':              { emoji: '⛳', label: 'Golf',        order: 7 },
  '24/7-streams':      { emoji: '📡', label: '24/7',       order: 8 },
};

export function categoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { emoji: '🎮', label: cat.replace(/-/g, ' '), order: 99 };
}

/**
 * A match is "live or imminent" if it started up to 4 hours ago
 * OR starts within the next 60 minutes.
 */
export function isLiveOrSoon(dateMs: number): boolean {
  const diff = dateMs - Date.now();
  return diff > -4 * 60 * 60 * 1000 && diff < 60 * 60 * 1000;
}

export function isToday(dateMs: number): boolean {
  const d = new Date(dateMs);
  const n = new Date();
  return d.getFullYear() === n.getFullYear()
      && d.getMonth()    === n.getMonth()
      && d.getDate()     === n.getDate();
}

export function formatMatchTime(dateMs: number): string {
  if (isLiveOrSoon(dateMs)) return 'Live Now';
  const d   = new Date(dateMs);
  const now = new Date();
  const diff = dateMs - Date.now();
  if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toDateString() === now.toDateString() ? `Today ${time}` : time;
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
       + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** True if embedUrl is a raw HLS/m3u8 stream (play via hls.js). */
export function isHlsStream(embedUrl: string): boolean {
  return embedUrl.includes('.m3u8') || embedUrl.includes('proxy/m3u8');
}

/** Build a direct embed URL from a source ID — works without the bingr stream API token. */
export function buildDirectEmbedUrl(sourceId: string): string {
  return `https://embedindia.st/embed/${sourceId}`;
}

/** Build fallback MatchStream objects from match sources when the API times out. */
export function buildFallbackStreams(match: LiveMatch): MatchStream[] {
  return match.sources.map((s, i) => ({
    id:         `fallback-${s.source}-${i}`,
    streamNo:   i + 1,
    language:   'Stream ' + (i + 1),
    hd:         false,
    embedUrl:   buildDirectEmbedUrl(s.id),
    source:     s.source,
    isFallback: true,
  }));
}

/** Remove junk entries: empty away team, no sources, placeholder names. */
export function filterJunkMatches(matches: LiveMatch[]): LiveMatch[] {
  return matches.filter(m => {
    if (!m.sources?.length) return false;
    if (!m.teams?.home?.name) return false;
    if (!m.teams?.away?.name?.trim()) return false;
    if (/special live|placeholder|\btest\b/i.test(m.title)) return false;
    return true;
  });
}

export function sortMatches(matches: LiveMatch[]): LiveMatch[] {
  return [...matches].sort((a, b) => {
    const aLive = isLiveOrSoon(a.date) ? 0 : 1;
    const bLive = isLiveOrSoon(b.date) ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return a.date - b.date;
  });
}

// ── API ──────────────────────────────────────────────────────────────────────

export async function getLiveMatches(): Promise<LiveMatch[]> {
  const res = await fetch('/api/sports/matches/all');
  if (!res.ok) throw new Error(`sports/matches ${res.status}`);
  const raw: LiveMatch[] = await res.json();
  return sortMatches(filterJunkMatches(raw));
}

/**
 * Fetch streams from bingr.one with a 6 s timeout.
 * Returns [] on timeout or any error — caller must handle fallback.
 */
export async function getMatchStreams(source: string, id: string): Promise<MatchStream[]> {
  try {
    const res = await fetch(
      `/api/sports/stream/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
      { signal: AbortSignal.timeout(6_000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    // Timeout (AbortError) or network failure — return empty so caller falls back
    return [];
  }
}
