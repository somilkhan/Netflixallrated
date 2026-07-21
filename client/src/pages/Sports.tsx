/**
 * Sports — live & scheduled matches, streams from api.bingr.one.
 *
 * Stream playback strategy:
 *  1. Fetch all sources for the match.
 *  2. Try the first one. If HLS fires a fatal error → auto-advance to next.
 *  3. Embed iframes can't be error-detected cross-origin → show "Not working?
 *     Try next source" bar that the user can tap to advance.
 *  4. After all sources exhausted → show clear "No stream" message.
 *
 * Live sync: hls.js configured for low-latency live, seeks to live edge on load.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Hls from 'hls.js';
import {
  Play, X, WifiOff, Loader,
  RefreshCw, ChevronRight, Radio,
} from 'lucide-react';
import {
  getLiveMatches, getMatchStreams, buildFallbackStreams,
  isHlsStream, isLiveOrSoon, formatMatchTime,
  categoryMeta,
  type LiveMatch, type MatchStream,
} from '../lib/sportsdb';

// ─────────────────────────────────────────────────────────────────────────────
// HLS player — low-latency, live-edge, auto-reports fatal errors
// ─────────────────────────────────────────────────────────────────────────────

interface HlsPlayerProps {
  src: string;
  onFatalError: () => void;
}

function HlsPlayer({ src, onFatalError }: HlsPlayerProps) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const hlsRef     = useRef<Hls | null>(null);
  const onFatalRef = useRef(onFatalError);
  onFatalRef.current = onFatalError;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Tear down previous instance
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker:               true,
        // Low-latency live settings
        lowLatencyMode:             true,
        liveSyncDurationCount:      2,
        liveMaxLatencyDurationCount: 5,
        liveBackBufferLength:       30,
        maxBufferLength:            10,
        maxMaxBufferLength:         20,
        liveDurationInfinity:       true,
        // Faster recovery
        fragLoadingMaxRetry:        4,
        manifestLoadingMaxRetry:    3,
        levelLoadingMaxRetry:       4,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      // Seek to live edge the moment manifest is loaded
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (hls.liveSyncPosition != null) {
          video.currentTime = hls.liveSyncPosition;
        }
        video.play().catch(() => {});
      });

      // Also snap to live edge if user scrubs back and pauses
      hls.on(Hls.Events.LEVEL_UPDATED, (_e, data) => {
        if (data.details?.live && hls.liveSyncPosition != null) {
          const drift = hls.liveSyncPosition - video.currentTime;
          // If more than 8 s behind live, resync
          if (drift > 8) video.currentTime = hls.liveSyncPosition;
        }
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          hls.destroy();
          hlsRef.current = null;
          onFatalRef.current();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = src;
      video.play().catch(() => {});
    } else {
      onFatalRef.current();
    }

    return () => { hlsRef.current?.destroy(); hlsRef.current = null; };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full bg-black"
      style={{ maxHeight: 'calc(100vh - 120px)' }}
      controls
      playsInline
      autoPlay
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stream modal
// ─────────────────────────────────────────────────────────────────────────────

function StreamModal({ match, onClose }: { match: LiveMatch; onClose: () => void }) {
  const [streams,  setStreams]  = useState<MatchStream[]>([]);
  const [idx,      setIdx]      = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  // Tracks which stream ids definitively failed (HLS fatal error)
  const failedRef = useRef<Set<string>>(new Set());

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // Load streams: try bingr API (6 s timeout) → fall back to direct embed URLs
  useEffect(() => {
    failedRef.current = new Set();
    setIdx(0);
    setLoading(true);
    setFetchErr(null);

    let cancelled = false;

    ;(async () => {
      // Phase 1 — try the bingr.one stream API (has gid tokens + HLS options)
      const apiStreams: MatchStream[] = [];
      await Promise.all(
        match.sources.map(async src => {
          const s = await getMatchStreams(src.source, src.id); // never throws, returns []
          apiStreams.push(...s);
        })
      );

      if (cancelled) return;

      if (apiStreams.length > 0) {
        // API worked — use rich streams
        setStreams(apiStreams);
        setLoading(false);
        return;
      }

      // Phase 2 — API timed out or returned nothing → use direct embed URLs
      // embedindia.st/embed/{id} works without the gid token
      const fallback = buildFallbackStreams(match);
      setStreams(fallback);
      setLoading(false);
      // Don't set fetchErr — fallback streams are valid, just let the player try
    })();

    return () => { cancelled = true; };
  }, [match]);

  const active = streams[idx] ?? null;
  const isHls  = active ? isHlsStream(active.embedUrl) : false;

  // Auto-advance to next working stream
  const advanceStream = useCallback(() => {
    setStreams(prev => {
      // Mark current as failed
      const cur = prev[idx];
      if (cur) failedRef.current.add(cur.id);

      // Find next non-failed
      const next = prev.findIndex((s, i) => i > idx && !failedRef.current.has(s.id));
      if (next !== -1) {
        setIdx(next);
      } else {
        // All ahead are failed — try wrapping to any non-failed from start
        const first = prev.findIndex(s => !failedRef.current.has(s.id));
        if (first !== -1 && first !== idx) setIdx(first);
        // else: all exhausted, keep on current (will show error)
      }
      return prev;
    });
  }, [idx]);

  const allExhausted = streams.length > 0 && !loading
    && streams.every(s => failedRef.current.has(s.id));

  const live = isLiveOrSoon(match.date);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full h-full max-w-5xl mx-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Top bar ── */}
        <div
          className="shrink-0 flex items-center gap-3 px-4 py-2.5"
          style={{ background: '#0d0e11', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.teams.home.badge && (
              <img src={match.teams.home.badge} alt="" className="w-6 h-6 object-contain shrink-0" />
            )}
            <span className="font-sans text-[13px] font-semibold text-white truncate">
              {match.title}
            </span>
            {match.teams.away.badge && (
              <img src={match.teams.away.badge} alt="" className="w-6 h-6 object-contain shrink-0" />
            )}
            {live && (
              <span className="shrink-0 flex items-center gap-1 bg-red-600 rounded-full px-2 py-0.5 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="font-mono text-[9px] font-bold text-white">LIVE</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
        </div>

        {/* ── Player area ── */}
        <div className="flex-1 min-h-0 bg-black relative flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader size={24} className="text-white/30 animate-spin" />
              <span className="font-sans text-sm text-white/40">Finding streams…</span>
            </div>
          ) : fetchErr || allExhausted ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <WifiOff size={36} className="text-white/20" />
              <p className="font-sans text-[15px] font-semibold text-white/70">
                {allExhausted ? 'All streams unavailable' : fetchErr}
              </p>
              <p className="font-mono text-[11px] text-white/30 max-w-xs">
                Streams go live at kickoff. If the match is in progress, try again in a moment.
              </p>
              {allExhausted && (
                <button
                  onClick={() => { failedRef.current = new Set(); setIdx(0); }}
                  className="flex items-center gap-2 font-sans text-sm text-white/50 border border-white/20 rounded-full px-4 py-2 hover:border-white/40 hover:text-white/70 transition-colors"
                >
                  <RefreshCw size={13} /> Retry all sources
                </button>
              )}
            </div>
          ) : active && isHls ? (
            <HlsPlayer key={active.id} src={active.embedUrl} onFatalError={advanceStream} />
          ) : active ? (
            <iframe
              key={active.id}
              src={active.embedUrl}
              className="flex-1 w-full border-0"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              /* referrerPolicy left at default ("strict-origin-when-cross-origin")
                 so the embed host sees the referer it expects */
            />
          ) : null}

          {/* Iframe "not working?" nudge */}
          {active && !isHls && !loading && !fetchErr && !allExhausted && streams.length > 1 && (
            <div
              className="absolute bottom-0 inset-x-0 flex items-center justify-between px-4 py-2.5"
              style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}
            >
              <span className="font-sans text-[11px] text-white/40">Stream not loading?</span>
              <button
                onClick={advanceStream}
                className="flex items-center gap-1.5 font-sans text-[11px] text-white/70 bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5 transition-colors"
              >
                Try next source <ChevronRight size={11} />
              </button>
            </div>
          )}
        </div>

        {/* ── Source picker ── */}
        {streams.length > 0 && !loading && (
          <div
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide"
            style={{ background: '#0d0e11', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Radio size={11} className="text-white/25 shrink-0" />
            <span className="font-mono text-[9px] text-white/25 shrink-0 mr-1">SOURCES</span>
            {streams.map((s, i) => {
              const isCurrent = i === idx;
              const isFailed  = failedRef.current.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => setIdx(i)}
                  disabled={isFailed}
                  className={`
                    shrink-0 flex items-center gap-1.5
                    font-sans text-[11px] px-3 py-1.5 rounded-full border
                    transition-colors duration-150
                    ${isCurrent && !isFailed
                      ? 'bg-white text-black border-white'
                      : isFailed
                        ? 'bg-transparent border-white/10 text-white/20 line-through cursor-not-allowed'
                        : 'bg-transparent border-white/20 text-white/50 hover:border-white/40 hover:text-white/80 cursor-pointer'
                    }
                  `}
                >
                  {s.hd && (
                    <span className={`font-mono text-[8px] font-bold ${isCurrent ? 'text-black' : 'text-green-400'}`}>
                      HD
                    </span>
                  )}
                  {s.language || `Server ${s.streamNo}`}
                  {isCurrent && !isFailed && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Match card
// ─────────────────────────────────────────────────────────────────────────────

function MatchCard({ match, onWatch }: { match: LiveMatch; onWatch: () => void }) {
  const live    = isLiveOrSoon(match.date);
  const timeStr = formatMatchTime(match.date);
  const cat     = categoryMeta(match.category);

  return (
    <button
      onClick={onWatch}
      className={`
        group relative flex flex-col w-full text-left
        bg-[#0f1012] border rounded-2xl overflow-hidden
        transition-all duration-200 cursor-pointer
        hover:bg-[#141618] hover:scale-[1.02] hover:shadow-2xl
        active:scale-[0.99]
        ${live ? 'border-red-500/40 shadow-[0_0_0_1px_rgba(239,68,68,0.1)]' : 'border-white/[0.07]'}
      `}
    >
      {/* Poster / Team visual */}
      <div className="relative w-full aspect-video overflow-hidden bg-[#0a0a0c]">
        {match.poster ? (
          <>
            <img
              src={match.poster}
              alt={match.title}
              className="w-full h-full object-cover opacity-75 group-hover:opacity-95 group-hover:scale-105 transition-all duration-300"
              loading="lazy"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1012] via-[#0f1012]/20 to-transparent" />
          </>
        ) : (
          /* No poster → elegant team badge display */
          <div className="absolute inset-0 flex items-center justify-around px-4 py-3">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              {match.teams.home.badge
                ? <img src={match.teams.home.badge} alt={match.teams.home.name} className="w-12 h-12 object-contain drop-shadow-lg" loading="lazy" />
                : <span className="text-3xl">{cat.emoji}</span>
              }
              <span className="font-sans text-[9px] text-white/60 text-center leading-tight line-clamp-2">{match.teams.home.name}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 shrink-0 px-2">
              {live
                ? <span className="font-mono text-[10px] font-bold text-red-400 animate-pulse">LIVE</span>
                : <span className="font-sans text-xs text-white/20">vs</span>
              }
            </div>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              {match.teams.away.badge
                ? <img src={match.teams.away.badge} alt={match.teams.away.name} className="w-12 h-12 object-contain drop-shadow-lg" loading="lazy" />
                : <span className="text-3xl">{cat.emoji}</span>
              }
              <span className="font-sans text-[9px] text-white/60 text-center leading-tight line-clamp-2">{match.teams.away.name}</span>
            </div>
          </div>
        )}

        {/* Live / Popular badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {live && (
            <span className="flex items-center gap-1 bg-red-600 rounded-full px-2 py-0.5 shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="font-mono text-[9px] font-bold text-white">LIVE</span>
            </span>
          )}
          {match.popular && (
            <span className="bg-amber-500 rounded-full px-2 py-0.5">
              <span className="font-mono text-[9px] font-bold text-black">HOT</span>
            </span>
          )}
        </div>

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Play size={18} className="text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-3 pt-2.5 pb-3 flex flex-col gap-1.5">
        <p className="font-sans text-[12.5px] font-semibold text-white leading-snug line-clamp-2">
          {match.title}
        </p>
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono text-[9px] text-white/30 uppercase tracking-wide truncate">
            {cat.emoji} {cat.label}
          </span>
          <span className={`font-mono text-[9px] shrink-0 ${live ? 'text-red-400' : 'text-white/25'}`}>
            {timeStr}
          </span>
        </div>
        {/* Watch CTA */}
        <div
          className={`
            mt-0.5 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border
            transition-colors duration-150
            group-hover:bg-white/[0.10]
            ${live
              ? 'bg-red-500/10 border-red-500/25 group-hover:border-red-500/40'
              : 'bg-white/[0.04] border-white/[0.07]'
            }
          `}
        >
          <Play size={10} className={`fill-current ${live ? 'text-red-400' : 'text-white/50'}`} />
          <span className={`font-sans text-[11px] font-medium ${live ? 'text-red-300' : 'text-white/50'}`}>
            {live ? 'Watch Live' : 'Watch'}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.04] bg-[#0f1012] animate-pulse">
      <div className="w-full aspect-video bg-white/[0.04]" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-3/4 rounded bg-white/[0.05]" />
        <div className="h-2 w-1/2 rounded bg-white/[0.03]" />
        <div className="h-7 rounded-xl bg-white/[0.04]" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const ALL = 'all';

export default function Sports() {
  const [matches,     setMatches]     = useState<LiveMatch[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [activeCat,   setActiveCat]   = useState(ALL);
  const [watchMatch,  setWatchMatch]  = useState<LiveMatch | null>(null);

  const fetchMatches = useCallback(() => {
    setLoading(true);
    setError(null);
    getLiveMatches()
      .then(setMatches)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  // Build category pill list: All first, then sorted by CATEGORY_META order
  const categories = useMemo(() => {
    const seen = Array.from(new Set(matches.map(m => m.category)));
    seen.sort((a, b) => (categoryMeta(a).order) - (categoryMeta(b).order));
    return [ALL, ...seen];
  }, [matches]);

  const filtered = useMemo(() =>
    activeCat === ALL ? matches : matches.filter(m => m.category === activeCat),
    [matches, activeCat],
  );

  const liveCount = useMemo(() =>
    matches.filter(m => isLiveOrSoon(m.date)).length,
    [matches],
  );

  return (
    <>
      {watchMatch && (
        <StreamModal match={watchMatch} onClose={() => setWatchMatch(null)} />
      )}

      <div className="min-h-screen pb-28">
        {/* Header */}
        <div
          className="relative overflow-hidden border-b border-[#181818]"
          style={{ background: 'linear-gradient(160deg,#090f09 0%,#0b170b 45%,#0f1014 100%)' }}
        >
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `
                repeating-linear-gradient(90deg,#4ade80 0,#4ade80 1px,transparent 1px,transparent 52px),
                repeating-linear-gradient(0deg,  #4ade80 0,#4ade80 1px,transparent 1px,transparent 52px)
              `,
            }}
          />
          <div className="relative px-5 pt-10 pb-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl leading-none select-none">⚽</span>
              <h1 className="font-sans text-[28px] font-bold tracking-tight text-white leading-none">Sports</h1>
              {liveCount > 0 && (
                <span className="flex items-center gap-1.5 bg-red-600/90 rounded-full px-2.5 py-0.5 ml-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="font-mono text-[9px] font-bold text-white tracking-wider">
                    {liveCount} LIVE
                  </span>
                </span>
              )}
            </div>
            <p className="font-sans text-[13px] text-[#4a4a4a] ml-[39px]">
              Live matches &amp; streams · {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Category pills */}
        {!loading && !error && categories.length > 1 && (
          <div className="px-5 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-b border-[#181818]">
            {categories.map(cat => {
              const isActive = cat === activeCat;
              const meta = cat === ALL ? { label: 'All Sports' } : categoryMeta(cat);
              const catLiveCount = cat === ALL ? liveCount : matches.filter(m => m.category === cat && isLiveOrSoon(m.date)).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`
                    shrink-0 flex items-center gap-1.5
                    font-sans text-[12px] px-4 py-1.5 rounded-full border
                    transition-[background-color,border-color,color] duration-150
                    ${isActive
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent border-[#2a2a2a] text-[#777] hover:text-white hover:border-[#444]'
                    }
                  `}
                >
                  {meta.label}
                  {catLiveCount > 0 && (
                    <span className={`
                      font-mono text-[8px] font-bold px-1 rounded
                      ${isActive ? 'bg-black/20 text-black' : 'bg-red-600/80 text-white'}
                    `}>
                      {catLiveCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        <div className="px-5 pt-5">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="py-24 text-center">
              <WifiOff size={36} className="mx-auto text-white/15 mb-4" />
              <p className="font-sans text-lg font-semibold text-white mb-2">Couldn't load matches</p>
              <p className="font-sans text-sm text-white/35 max-w-xs mx-auto mb-6">{error}</p>
              <button
                onClick={fetchMatches}
                className="inline-flex items-center gap-2 font-sans text-sm text-white/60 border border-white/20 rounded-full px-5 py-2 hover:border-white/40 hover:text-white/80 transition-colors"
              >
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <span className="text-5xl block mb-4 select-none">📅</span>
              <p className="font-sans text-lg font-semibold text-white mb-2">No {activeCat === ALL ? '' : categoryMeta(activeCat).label + ' '}matches today</p>
              <p className="font-sans text-sm text-white/35 max-w-xs mx-auto mb-4">
                Check back later — matches appear as they go live.
              </p>
              {activeCat !== ALL && (
                <button
                  onClick={() => setActiveCat(ALL)}
                  className="inline-flex items-center gap-1.5 font-sans text-sm text-white/50 border border-white/20 rounded-full px-4 py-1.5 hover:border-white/40 hover:text-white/70 transition-colors"
                >
                  Show all sports
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(m => (
                <MatchCard key={m.id} match={m} onWatch={() => setWatchMatch(m)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
