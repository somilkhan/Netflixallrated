/**
 * Sports — live & upcoming football / FIFA page.
 *
 * Data: TheSportsDB (free, no API key) — league schedules, results, YouTube highlights.
 * Watch: YouTube embed modal for matches that have highlight videos.
 */
import { useState, useEffect, useCallback } from 'react';
import { Trophy, Play, X, Calendar, Clock, ChevronRight } from 'lucide-react';
import {
  LEAGUES, SportsMatch, SportsLeague,
  getUpcomingMatches, getPastMatches,
  extractYouTubeId, formatMatchTime, getMatchStatus,
} from '../lib/sportsdb';

// ---------------------------------------------------------------------------
// YouTube embed modal
// ---------------------------------------------------------------------------
function VideoModal({ videoId, title, onClose }: { videoId: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#111]">
          <span className="font-sans text-[13px] text-white/80 truncate pr-4">{title}</span>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
        </div>
        {/* 16:9 iframe */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match card
// ---------------------------------------------------------------------------
function MatchCard({ match, onWatch }: { match: SportsMatch; onWatch: (match: SportsMatch) => void }) {
  const status   = getMatchStatus(match);
  const timeStr  = formatMatchTime(match);
  const hasVideo = !!extractYouTubeId(match.strVideo);
  const finished = status === 'finished';

  return (
    <div className="relative flex flex-col bg-[#111214] border border-white/[0.06] rounded-2xl overflow-hidden transition-colors hover:border-white/[0.12] hover:bg-[#141618]">
      {/* Status badge */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <span className="font-mono text-[9.5px] uppercase tracking-wider text-white/30 truncate">
          {match.strLeague}
        </span>
        {status === 'live' && (
          <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Live
          </span>
        )}
        {status === 'upcoming' && (
          <span className="flex items-center gap-1 font-mono text-[9px] text-white/30">
            <Clock size={9} />
            {timeStr}
          </span>
        )}
        {status === 'finished' && (
          <span className="font-mono text-[9px] text-white/25">{match.dateEvent}</span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-2 px-3.5 pb-3.5">
        {/* Home */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          {match.strHomeTeamBadge ? (
            <img
              src={match.strHomeTeamBadge}
              alt={match.strHomeTeam}
              className="w-10 h-10 object-contain"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Trophy size={16} className="text-white/30" />
            </div>
          )}
          <span className="font-sans text-[11px] font-medium text-white text-center leading-tight truncate w-full text-center">
            {match.strHomeTeam}
          </span>
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center shrink-0 min-w-[44px]">
          {finished ? (
            <span className="font-sans text-[22px] font-bold text-white tabular-nums leading-none">
              {match.intHomeScore} – {match.intAwayScore}
            </span>
          ) : status === 'live' ? (
            <span className="font-sans text-[20px] font-bold text-red-400 tabular-nums leading-none animate-pulse">
              {match.intHomeScore ?? 0} – {match.intAwayScore ?? 0}
            </span>
          ) : (
            <span className="font-sans text-[15px] font-light text-white/30">vs</span>
          )}
          {status === 'upcoming' && match.strVenue && (
            <span className="font-mono text-[8px] text-white/20 mt-1 text-center leading-tight max-w-[80px] truncate">
              {match.strVenue}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          {match.strAwayTeamBadge ? (
            <img
              src={match.strAwayTeamBadge}
              alt={match.strAwayTeam}
              className="w-10 h-10 object-contain"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Trophy size={16} className="text-white/30" />
            </div>
          )}
          <span className="font-sans text-[11px] font-medium text-white text-center leading-tight truncate w-full text-center">
            {match.strAwayTeam}
          </span>
        </div>
      </div>

      {/* Watch / Highlights button */}
      {(hasVideo || status === 'live') && (
        <button
          onClick={() => onWatch(match)}
          className="flex items-center justify-center gap-2 mx-3.5 mb-3.5 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.08] transition-colors"
        >
          <Play size={12} className="text-white/70 fill-white/70" />
          <span className="font-sans text-[12px] text-white/70">
            {status === 'live' ? 'Watch Live' : 'Watch Highlights'}
          </span>
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section row
// ---------------------------------------------------------------------------
function MatchSection({ title, matches, onWatch, icon }: {
  title: string;
  matches: SportsMatch[];
  onWatch: (m: SportsMatch) => void;
  icon?: React.ReactNode;
}) {
  if (matches.length === 0) return null;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 px-5 mb-3.5">
        {icon}
        <h2 className="font-sans text-[17px] font-semibold text-white">{title}</h2>
        <span className="font-mono text-[10px] text-white/25 ml-1">{matches.length}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
        {matches.map(m => (
          <div key={m.idEvent} className="shrink-0 w-[200px]">
            <MatchCard match={m} onWatch={onWatch} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function MatchSkeleton() {
  return (
    <div className="shrink-0 w-[200px] h-[168px] rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.04]" />
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function Sports() {
  const [selectedLeague, setSelectedLeague] = useState<SportsLeague>(LEAGUES[0]);
  const [upcoming,  setUpcoming]  = useState<SportsMatch[]>([]);
  const [results,   setResults]   = useState<SportsMatch[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [videoMatch, setVideoMatch] = useState<SportsMatch | null>(null);

  const loadLeague = useCallback(async (league: SportsLeague) => {
    setLoading(true);
    setUpcoming([]);
    setResults([]);
    try {
      const [up, past] = await Promise.all([
        getUpcomingMatches(league.id),
        getPastMatches(league.id),
      ]);
      setUpcoming(up);
      setResults(past.reverse()); // most recent first
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeague(selectedLeague);
  }, [selectedLeague, loadLeague]);

  const handleWatch = useCallback((match: SportsMatch) => {
    setVideoMatch(match);
  }, []);

  const liveMatches    = upcoming.filter(m => getMatchStatus(m) === 'live');
  const upcomingOnly   = upcoming.filter(m => getMatchStatus(m) === 'upcoming');
  const withHighlights = results.filter(m => extractYouTubeId(m.strVideo));
  const allResults     = results;

  const videoId = videoMatch ? extractYouTubeId(videoMatch.strVideo) : null;

  return (
    <>
      {/* Video modal */}
      {videoMatch && videoId && (
        <VideoModal
          videoId={videoId}
          title={videoMatch.strEvent}
          onClose={() => setVideoMatch(null)}
        />
      )}

      <div className="min-h-screen pb-28">
        {/* ── Hero header ── */}
        <div
          className="relative overflow-hidden border-b border-[#1a1a1a]"
          style={{
            background: 'linear-gradient(135deg, #0a0f0a 0%, #0d1a0d 40%, #0f1014 100%)',
          }}
        >
          {/* Decorative pitch lines */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `
                repeating-linear-gradient(90deg, #4ade80 0, #4ade80 1px, transparent 1px, transparent 40px),
                repeating-linear-gradient(0deg, #4ade80 0, #4ade80 1px, transparent 1px, transparent 40px)
              `,
            }}
          />
          <div className="relative px-5 pt-10 pb-7">
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-2xl leading-none">⚽</span>
              <h1 className="font-sans text-[28px] font-bold tracking-tight text-white leading-none">
                Sports
              </h1>
            </div>
            <p className="font-sans text-[13.5px] text-[#666] ml-[39px]">
              Live matches, results &amp; highlights
            </p>
          </div>
        </div>

        {/* ── League filter pills ── */}
        <div className="px-5 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-b border-[#1a1a1a]">
          {LEAGUES.map(league => {
            const active = league.id === selectedLeague.id;
            return (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league)}
                className={`shrink-0 flex items-center gap-1.5 font-sans text-[12px] px-4 py-1.5 rounded-full border transition-[background-color,border-color,color] duration-200 ${
                  active
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent border-[#333] text-[#888] hover:text-white hover:border-[#555]'
                }`}
              >
                <span>{league.emoji}</span>
                {league.label}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        <div className="pt-6">
          {loading ? (
            <>
              <div className="px-5 mb-3">
                <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
              </div>
              <div className="flex gap-3 overflow-x-hidden px-5 mb-8">
                {Array.from({ length: 5 }).map((_, i) => <MatchSkeleton key={i} />)}
              </div>
              <div className="px-5 mb-3">
                <div className="h-4 w-28 rounded bg-white/[0.06] animate-pulse" />
              </div>
              <div className="flex gap-3 overflow-x-hidden px-5">
                {Array.from({ length: 5 }).map((_, i) => <MatchSkeleton key={i} />)}
              </div>
            </>
          ) : (
            <>
              {/* Live now */}
              <MatchSection
                title="Live Now"
                matches={liveMatches}
                onWatch={handleWatch}
                icon={<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              />

              {/* Upcoming */}
              {upcomingOnly.length > 0 && (
                <MatchSection
                  title="Upcoming Fixtures"
                  matches={upcomingOnly}
                  onWatch={handleWatch}
                  icon={<Calendar size={16} className="text-white/50" />}
                />
              )}

              {/* Highlights with video */}
              {withHighlights.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 px-5 mb-3.5">
                    <Play size={16} className="text-green-400 fill-green-400" />
                    <h2 className="font-sans text-[17px] font-semibold text-white">Highlights</h2>
                    <span className="font-mono text-[10px] text-white/25 ml-1">{withHighlights.length}</span>
                  </div>

                  {/* Highlight cards — wider to show thumbnail */}
                  <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
                    {withHighlights.map(m => {
                      const ytId = extractYouTubeId(m.strVideo)!;
                      return (
                        <button
                          key={m.idEvent}
                          onClick={() => setVideoMatch(m)}
                          className="shrink-0 w-[240px] rounded-xl overflow-hidden border border-white/[0.07] hover:border-white/[0.14] bg-[#111214] transition-colors text-left"
                        >
                          {/* Thumbnail */}
                          <div className="relative w-full aspect-video bg-black">
                            <img
                              src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                              alt={m.strEvent}
                              className="w-full h-full object-cover opacity-80"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                <Play size={16} className="text-white fill-white ml-0.5" />
                              </div>
                            </div>
                          </div>
                          <div className="px-3 py-2.5">
                            <p className="font-sans text-[12px] font-medium text-white leading-snug line-clamp-2">
                              {m.strEvent}
                            </p>
                            {m.intHomeScore !== null && (
                              <p className="font-sans text-[11px] text-white/40 mt-0.5">
                                {m.intHomeScore} – {m.intAwayScore}
                              </p>
                            )}
                            <p className="font-mono text-[9.5px] text-white/25 mt-0.5">{m.dateEvent}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Results */}
              {allResults.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between px-5 mb-3.5">
                    <div className="flex items-center gap-2">
                      <ChevronRight size={16} className="text-white/30" />
                      <h2 className="font-sans text-[17px] font-semibold text-white">Recent Results</h2>
                      <span className="font-mono text-[10px] text-white/25 ml-1">{allResults.length}</span>
                    </div>
                  </div>

                  {/* Table-style list */}
                  <div className="mx-5 rounded-xl border border-white/[0.06] overflow-hidden">
                    {allResults.slice(0, 10).map((m, i) => (
                      <div
                        key={m.idEvent}
                        className={`flex items-center gap-3 px-4 py-3 ${
                          i !== 0 ? 'border-t border-white/[0.04]' : ''
                        } ${extractYouTubeId(m.strVideo) ? 'hover:bg-white/[0.03] cursor-pointer' : ''}`}
                        onClick={() => extractYouTubeId(m.strVideo) && setVideoMatch(m)}
                      >
                        {/* Home team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {m.strHomeTeamBadge && (
                            <img src={m.strHomeTeamBadge} alt={m.strHomeTeam} className="w-5 h-5 object-contain shrink-0" loading="lazy" />
                          )}
                          <span className="font-sans text-[12.5px] text-white truncate">{m.strHomeTeam}</span>
                        </div>

                        {/* Score */}
                        <div className="font-sans text-[14px] font-bold text-white tabular-nums shrink-0 min-w-[52px] text-center">
                          {m.intHomeScore ?? '?'} – {m.intAwayScore ?? '?'}
                        </div>

                        {/* Away team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className="font-sans text-[12.5px] text-white truncate text-right">{m.strAwayTeam}</span>
                          {m.strAwayTeamBadge && (
                            <img src={m.strAwayTeamBadge} alt={m.strAwayTeam} className="w-5 h-5 object-contain shrink-0" loading="lazy" />
                          )}
                        </div>

                        {/* Watch icon */}
                        {extractYouTubeId(m.strVideo) && (
                          <Play size={12} className="text-green-400 fill-green-400 shrink-0 ml-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty */}
              {!loading && upcomingOnly.length === 0 && liveMatches.length === 0 && allResults.length === 0 && (
                <div className="py-24 text-center px-5">
                  <span className="text-5xl block mb-5">⚽</span>
                  <p className="font-sans text-xl font-semibold text-white mb-2">
                    No matches found
                  </p>
                  <p className="font-sans text-sm text-white/40 max-w-xs mx-auto">
                    Try a different league — schedules update as fixtures are announced.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
