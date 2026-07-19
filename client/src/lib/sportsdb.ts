/**
 * Sports API — two data sources:
 *
 * 1. api.bingr.one (proxied via /api/sports/*) — live match listings + real HLS/embed streams.
 * 2. TheSportsDB (direct, free) — match results with YouTube highlights as fallback.
 */

// ── Bingr / live stream types ───────────────────────────────────────────────

export interface LiveMatch {
  id: string;            // e.g. "wc/2026-07-19/esp-arg"
  title: string;
  category: string;      // "football", "basketball", "baseball", …
  date: number;          // unix ms
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

export const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  'football':          { emoji: '⚽', label: 'Football' },
  'basketball':        { emoji: '🏀', label: 'Basketball' },
  'baseball':          { emoji: '⚾', label: 'Baseball' },
  'american-football': { emoji: '🏈', label: 'NFL' },
  'cricket':           { emoji: '🏏', label: 'Cricket' },
  'volleyball':        { emoji: '🏐', label: 'Volleyball' },
  'darts':             { emoji: '🎯', label: 'Darts' },
  'golf':              { emoji: '⛳', label: 'Golf' },
  '24/7-streams':      { emoji: '📡', label: '24/7 Streams' },
};

/** Fetch all today's live / upcoming matches from our Railway proxy. */
export async function getLiveMatches(): Promise<LiveMatch[]> {
  const res = await fetch('/api/sports/matches');
  if (!res.ok) throw new Error(`sports/matches ${res.status}`);
  return res.json();
}

/** Fetch stream options for a specific match source+id. */
export async function getMatchStreams(source: string, id: string): Promise<MatchStream[]> {
  const res = await fetch(
    `/api/sports/stream/${encodeURIComponent(source)}/${encodeURIComponent(id)}`
  );
  if (!res.ok) throw new Error(`sports/stream ${res.status}`);
  return res.json();
}

/**
 * Classify an embedUrl:
 *  - "hls"   → m3u8 URL, play with hls.js
 *  - "embed" → iframe page, show in <iframe>
 */
export function classifyStream(embedUrl: string): 'hls' | 'embed' {
  if (embedUrl.includes('.m3u8') || embedUrl.includes('proxy/m3u8')) return 'hls';
  return 'embed';
}

/** Format a unix-ms timestamp for display. */
export function formatLiveMatchTime(dateMs: number): string {
  const date = new Date(dateMs);
  const now  = new Date();
  const diff = date.getTime() - now.getTime();

  // Within 3 h of start → could be live
  if (Math.abs(diff) < 3 * 60 * 60 * 1000) return 'Live Now';

  const today    = now.toDateString();
  const tomorrow = new Date(now.getTime() + 86_400_000).toDateString();
  let dayStr = date.toDateString();
  if (dayStr === today)    dayStr = 'Today';
  if (dayStr === tomorrow) dayStr = 'Tomorrow';

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${dayStr} · ${timeStr}`;
}

export function isLiveOrSoon(dateMs: number): boolean {
  const diff = dateMs - Date.now();
  return diff > -3 * 60 * 60 * 1000 && diff < 3 * 60 * 60 * 1000;
}

// ── TheSportsDB (YouTube highlights fallback) ────────────────────────────────

const TSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

export interface TSDBMatch {
  idEvent: string;
  strEvent: string;
  strLeague: string;
  dateEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge: string;
  strAwayTeamBadge: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strVideo: string | null;
}

export async function getPastMatches(leagueId: string): Promise<TSDBMatch[]> {
  try {
    const res = await fetch(`${TSDB_BASE}/eventspastleague.php?id=${leagueId}`);
    const data = await res.json();
    return (data.events ?? []).reverse();
  } catch { return []; }
}

export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
