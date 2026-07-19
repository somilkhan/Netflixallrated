/**
 * TheSportsDB — free public API (no key required, tier 3).
 * Docs: https://www.thesportsdb.com/api.php
 */

const BASE = 'https://www.thesportsdb.com/api/v1/json/3';

export interface SportsMatch {
  idEvent: string;
  strEvent: string;
  strLeague: string;
  idLeague: string;
  dateEvent: string;
  strTime: string;
  strTimestamp: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge: string;
  strAwayTeamBadge: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;
  strPostponed: string;
  strVenue: string;
  strThumb: string;
  strVideo: string | null;
  strResult: string | null;
  strCountry: string;
}

export interface SportsLeague {
  id: string;
  label: string;
  color: string;
  emoji: string;
}

export const LEAGUES: SportsLeague[] = [
  { id: '4328', label: 'Premier League', color: '#3d195b', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: '4335', label: 'La Liga',        color: '#ee8700', emoji: '🇪🇸' },
  { id: '4332', label: 'Serie A',        color: '#024494', emoji: '🇮🇹' },
  { id: '4331', label: 'Bundesliga',     color: '#d20515', emoji: '🇩🇪' },
  { id: '4334', label: 'Ligue 1',        color: '#1a1f7d', emoji: '🇫🇷' },
  { id: '4480', label: 'Champions',      color: '#001a5e', emoji: '🏆' },
];

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`TheSportsDB ${res.status}`);
  return res.json();
}

export async function getUpcomingMatches(leagueId: string): Promise<SportsMatch[]> {
  try {
    const data = await get<{ events: SportsMatch[] | null }>(
      `/eventsnextleague.php?id=${leagueId}`
    );
    return data.events ?? [];
  } catch {
    return [];
  }
}

export async function getPastMatches(leagueId: string): Promise<SportsMatch[]> {
  try {
    const data = await get<{ events: SportsMatch[] | null }>(
      `/eventspastleague.php?id=${leagueId}`
    );
    return data.events ?? [];
  } catch {
    return [];
  }
}

/** Extract a YouTube video ID from a thesportsdb strVideo URL */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/** Format a match date/time nicely */
export function formatMatchTime(match: SportsMatch): string {
  if (!match.dateEvent) return '';
  const date = new Date(`${match.dateEvent}T${match.strTime || '00:00:00'}`);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (Math.abs(diff) < 3 * 60 * 60 * 1000 && match.strStatus?.toLowerCase() === 'live') {
    return 'LIVE';
  }

  const today    = now.toDateString();
  const tomorrow = new Date(now.getTime() + 86400000).toDateString();

  let dayStr = date.toDateString();
  if (dayStr === today)    dayStr = 'Today';
  if (dayStr === tomorrow) dayStr = 'Tomorrow';

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${dayStr} · ${timeStr}`;
}

export function getMatchStatus(match: SportsMatch): 'live' | 'upcoming' | 'finished' {
  const s = (match.strStatus ?? '').toLowerCase();
  if (s === 'live' || s === 'match finished' && !match.intHomeScore) return 'live';
  if (match.intHomeScore !== null && match.intAwayScore !== null) return 'finished';
  return 'upcoming';
}
