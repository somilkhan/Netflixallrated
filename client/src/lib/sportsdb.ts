/**
 * Sports API — api.bingr.one proxied via /api/sports/*.
 * No TheSportsDB dead code here — that is removed.
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
 * A match is "live or imminent" if it starts within the next 60 min
 * OR started up to 4 hours ago (covers full match duration + extra time).
 */
export function isLiveOrSoon(dateMs: number): boolean {
  const diff = dateMs - Date.now();
  return diff > -4 * 60 * 60 * 1000 && diff < 60 * 60 * 1000;
}

/** True if the match is scheduled for today (local calendar day). */
export function isToday(dateMs: number): boolean {
  const d = new Date(dateMs);
  const n = new Date();
  return d.getFullYear() === n.getFullYear()
      && d.getMonth()    === n.getMonth()
      && d.getDate()     === n.getDate();
}

export function formatMatchTime(dateMs: number): string {
  if (isLiveOrSoon(dateMs)) return 'Live Now';
  const d    = new Date(dateMs);
  const now  = new Date();
  const diff = dateMs - Date.now();

  // Within 24 h
  if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isToday = d.toDateString() === now.toDateString();
    return isToday ? `Today ${timeStr}` : timeStr;
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
       + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * True if embedUrl is a direct HLS/m3u8 stream.
 * False → show in an iframe.
 */
export function isHlsStream(embedUrl: string): boolean {
  return embedUrl.includes('.m3u8') || embedUrl.includes('proxy/m3u8');
}

/** Remove junk entries: no real title, missing away team, or empty sources. */
export function filterJunkMatches(matches: LiveMatch[]): LiveMatch[] {
  return matches.filter(m => {
    if (!m.sources?.length) return false;
    if (!m.teams?.home?.name || !m.teams?.away?.name) return false;
    // Drop placeholder entries
    if (m.teams.away.name.trim() === '') return false;
    if (/special live|placeholder|test/i.test(m.title)) return false;
    return true;
  });
}

/** Sort matches: live first → today (by time) → future */
export function sortMatches(matches: LiveMatch[]): LiveMatch[] {
  return [...matches].sort((a, b) => {
    const aLive = isLiveOrSoon(a.date) ? 0 : 1;
    const bLive = isLiveOrSoon(b.date) ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return a.date - b.date;
  });
}

// ── API calls ────────────────────────────────────────────────────────────────

export async function getLiveMatches(): Promise<LiveMatch[]> {
  const res = await fetch('/api/sports/matches/all');
  if (!res.ok) throw new Error(`sports/matches ${res.status}`);
  const raw: LiveMatch[] = await res.json();
  return sortMatches(filterJunkMatches(raw));
}

export async function getMatchStreams(source: string, id: string): Promise<MatchStream[]> {
  const res = await fetch(
    `/api/sports/stream/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
  );
  if (!res.ok) throw new Error(`sports/stream ${res.status}`);
  const data = await res.json();
  // API returns array; guard against error objects
  return Array.isArray(data) ? data : [];
}
