/**
 * Sports — live & scheduled matches from api.bingr.one (via Railway proxy).
 *
 * Streams come in two flavours returned by /api/sports/stream:
 *   • "hls"   → m3u8 URL played via hls.js
 *   • "embed" → iframe page embedded directly
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import Hls from 'hls.js';
import { Play, X, Wifi, WifiOff, ChevronDown, Loader } from 'lucide-react';
import {
  getLiveMatches, getMatchStreams,
  classifyStream, formatLiveMatchTime, isLiveOrSoon,
  extractYouTubeId,
  CATEGORY_META,
  type LiveMatch, type MatchStream,
} from '../lib/sportsdb';

// ── Helpers ─────────────────────────────────────────────────────────────────

function categoryOf(cat: string) {
  return CATEGORY_META[cat] ?? { emoji: '🎮', label: cat };
}

// ── HLS player ───────────────────────────────────────────────────────────────

function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef   = useRef<Hls | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setErr(null);

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, xhrSetup: (xhr) => {
        xhr.setRequestHeader('Accept', '*/*');
      }});
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setErr('Stream error — try another source.');
      });
      video.play().catch(() => {});
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.play().catch(() => {});
    } else {
      setErr('Your browser does not support HLS streaming.');
    }

    return () => { hlsRef.current?.destroy(); hlsRef.current = null; };
  }, [src]);

  if (err) {
    return (
      <div className="w-full aspect-video bg-black flex flex-col items-center justify-center gap-2">
        <WifiOff size={28} className="text-red-400" />
        <p className="font-sans text-sm text-white/60 text-center px-4">{err}</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className="w-full aspect-video bg-black"
      controls
      playsInline
      autoPlay
    />
  );
}

// ── Stream player modal ──────────────────────────────────────────────────────

function StreamModal({ match, onClose }: { match: LiveMatch; onClose: () => void }) {
  const [streams, setStreams]   = useState<MatchStream[]>([]);
  const [active,  setActive]   = useState<MatchStream | null>(null);
  const [loading, setLoading]  = useState(true);
  const [error,   setError]    = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      // Try all sources in the match (usually just one "solaris")
      const results: MatchStream[] = [];
      for (const src of match.sources) {
        try {
          const s = await getMatchStreams(src.source, src.id);
          if (Array.isArray(s)) results.push(...s);
        } catch { /* ignore individual source failures */ }
      }
      if (!controller.signal.aborted) {
        if (results.length === 0) setError('No streams available for this match right now.');
        setStreams(results);
        setActive(results[0] ?? null);
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [match]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const streamType = active ? classifyStream(active.embedUrl) : null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full max-w-5xl mx-auto h-full max-h-screen"
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: '#0d0e11', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Badges */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {match.teams.home.badge && (
              <img src={match.teams.home.badge} alt={match.teams.home.name} className="w-6 h-6 object-contain" />
            )}
            <span className="font-sans text-[13px] font-semibold text-white truncate">
              {match.title}
            </span>
            {match.teams.away.badge && (
              <img src={match.teams.away.badge} alt={match.teams.away.name} className="w-6 h-6 object-contain" />
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
        </div>

        {/* Player area */}
        <div className="flex-1 min-h-0 bg-black flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center gap-3">
              <Loader size={22} className="text-white/40 animate-spin" />
              <span className="font-sans text-sm text-white/40">Loading streams…</span>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 text-center">
              <WifiOff size={32} className="text-red-400/70" />
              <p className="font-sans text-sm text-white/50">{error}</p>
              <p className="font-mono text-[11px] text-white/25">
                Streams are only live during or just before match time.
              </p>
            </div>
          ) : active && streamType === 'embed' ? (
            <iframe
              key={active.id}
              src={active.embedUrl}
              className="flex-1 w-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
            />
          ) : active && streamType === 'hls' ? (
            <div className="flex-1 flex flex-col justify-center">
              <HlsPlayer src={active.embedUrl} />
            </div>
          ) : null}
        </div>

        {/* Source picker */}
        {streams.length > 0 && !loading && !error && (
          <div
            className="shrink-0 flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
            style={{ background: '#0d0e11', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="font-mono text-[10px] text-white/30 shrink-0">SOURCES</span>
            {streams.map(s => {
              const isActive = s.id === active?.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s)}
                  className={`shrink-0 flex items-center gap-1.5 font-sans text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                    isActive
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent border-white/20 text-white/50 hover:border-white/40 hover:text-white/80'
                  }`}
                >
                  {s.hd && <span className="font-mono text-[9px] font-bold">HD</span>}
                  {s.language || s.source}
                  <Wifi size={9} className={isActive ? 'text-black' : 'text-green-400'} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Match card ───────────────────────────────────────────────────────────────

function MatchCard({ match, onWatch }: { match: LiveMatch; onWatch: () => void }) {
  const live    = isLiveOrSoon(match.date);
  const timeStr = formatLiveMatchTime(match.date);
  const cat     = categoryOf(match.category);

  return (
    <div
      className={`
        relative flex flex-col
        bg-[#111214] border rounded-2xl overflow-hidden
        transition-colors cursor-pointer group
        hover:border-white/[0.14] hover:bg-[#141618]
        ${live ? 'border-red-500/30' : 'border-white/[0.07]'}
      `}
      onClick={onWatch}
    >
      {/* Poster */}
      {match.poster ? (
        <div className="relative w-full aspect-video overflow-hidden">
          <img
            src={match.poster}
            alt={match.title}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111214] via-[#111214]/40 to-transparent" />
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play size={18} className="text-white fill-white ml-0.5" />
            </div>
          </div>
          {/* Live badge */}
          {live && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600/90 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="font-sans text-[10px] font-bold text-white">LIVE</span>
            </div>
          )}
          {/* HD badge if popular */}
          {match.popular && (
            <div className="absolute top-2 right-2 bg-amber-500/90 rounded px-1.5 py-0.5">
              <span className="font-mono text-[9px] font-bold text-black">HOT</span>
            </div>
          )}
        </div>
      ) : (
        /* No poster — show team face-off */
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
          <div className="flex flex-col items-center gap-1 flex-1">
            {match.teams.home.badge
              ? <img src={match.teams.home.badge} alt={match.teams.home.name} className="w-10 h-10 object-contain" loading="lazy" />
              : <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">{cat.emoji}</div>
            }
            <span className="font-sans text-[10px] text-white/70 text-center leading-tight">{match.teams.home.name}</span>
          </div>
          <div className="flex flex-col items-center shrink-0">
            {live
              ? <span className="font-sans text-sm font-bold text-red-400 animate-pulse">LIVE</span>
              : <span className="font-sans text-xs text-white/30">vs</span>
            }
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
            {match.teams.away.badge
              ? <img src={match.teams.away.badge} alt={match.teams.away.name} className="w-10 h-10 object-contain" loading="lazy" />
              : <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">{cat.emoji}</div>
            }
            <span className="font-sans text-[10px] text-white/70 text-center leading-tight">{match.teams.away.name}</span>
          </div>
        </div>
      )}

      {/* Info row */}
      <div className="px-3 pt-2 pb-3 flex flex-col gap-1">
        <p className="font-sans text-[12.5px] font-medium text-white leading-snug line-clamp-2">
          {match.title}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9.5px] text-white/30 uppercase tracking-wide">
            {cat.emoji} {match.category.replace(/-/g,' ')}
          </span>
          <span className={`font-mono text-[9.5px] ${live ? 'text-red-400' : 'text-white/25'}`}>
            {timeStr}
          </span>
        </div>
      </div>

      {/* Watch CTA */}
      <div className="mx-3 mb-3 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.06] group-hover:bg-white/[0.10] transition-colors border border-white/[0.06]">
        <Play size={11} className="text-white/60 fill-white/60" />
        <span className="font-sans text-[11.5px] text-white/60">
          {live ? 'Watch Live' : 'Watch'}
        </span>
      </div>
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.04] bg-[#111214] animate-pulse">
      <div className="w-full aspect-video bg-white/[0.04]" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
        <div className="h-2.5 w-1/2 rounded bg-white/[0.04]" />
        <div className="h-8 rounded-xl bg-white/[0.04]" />
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

const ALL_CAT = 'all';

export default function Sports() {
  const [matches,   setMatches]   = useState<LiveMatch[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<LiveMatch | null>(null);
  const [activeCat,   setActiveCat]   = useState(ALL_CAT);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getLiveMatches()
      .then(data => {
        // Sort: live first, then by date
        data.sort((a, b) => {
          const aLive = isLiveOrSoon(a.date) ? 0 : 1;
          const bLive = isLiveOrSoon(b.date) ? 0 : 1;
          if (aLive !== bLive) return aLive - bLive;
          return a.date - b.date;
        });
        setMatches(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = [ALL_CAT, ...Array.from(new Set(matches.map(m => m.category)))];

  const filtered = activeCat === ALL_CAT
    ? matches
    : matches.filter(m => m.category === activeCat);

  const liveCount = matches.filter(m => isLiveOrSoon(m.date)).length;

  const handleWatch = useCallback((match: LiveMatch) => {
    setActiveMatch(match);
  }, []);

  return (
    <>
      {activeMatch && (
        <StreamModal match={activeMatch} onClose={() => setActiveMatch(null)} />
      )}

      <div className="min-h-screen pb-28">
        {/* ── Header ── */}
        <div
          className="relative overflow-hidden border-b border-[#1a1a1a]"
          style={{ background: 'linear-gradient(135deg, #0a0f0a 0%, #0c180c 40%, #0f1014 100%)' }}
        >
          {/* Pitch grid */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage: `
                repeating-linear-gradient(90deg,#4ade80 0,#4ade80 1px,transparent 1px,transparent 48px),
                repeating-linear-gradient(0deg,  #4ade80 0,#4ade80 1px,transparent 1px,transparent 48px)
              `,
            }}
          />
          <div className="relative px-5 pt-10 pb-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl leading-none">⚽</span>
              <h1 className="font-sans text-[28px] font-bold tracking-tight text-white leading-none">Sports</h1>
              {liveCount > 0 && (
                <span className="flex items-center gap-1 ml-1 bg-red-600/80 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="font-mono text-[9px] font-bold text-white">{liveCount} LIVE</span>
                </span>
              )}
            </div>
            <p className="font-sans text-[13px] text-[#555] ml-[39px]">
              Live matches, streams &amp; world sport events
            </p>
          </div>
        </div>

        {/* ── Category filter ── */}
        <div className="px-5 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-b border-[#1a1a1a]">
          {categories.map(cat => {
            const active = cat === activeCat;
            const meta   = cat === ALL_CAT ? { emoji: '🌐', label: 'All Sports' } : categoryOf(cat);
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`shrink-0 flex items-center gap-1.5 font-sans text-[12px] px-4 py-1.5 rounded-full border transition-[background-color,border-color,color] duration-200 ${
                  active
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent border-[#333] text-[#888] hover:text-white hover:border-[#555]'
                }`}
              >
                <span>{meta.emoji}</span>
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        <div className="px-5 pt-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="py-24 text-center">
              <WifiOff size={36} className="mx-auto text-red-400/50 mb-4" />
              <p className="font-sans text-lg font-semibold text-white mb-2">Could not load matches</p>
              <p className="font-sans text-sm text-white/40 max-w-xs mx-auto">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <span className="text-5xl block mb-5">⚽</span>
              <p className="font-sans text-xl font-semibold text-white mb-2">No matches today</p>
              <p className="font-sans text-sm text-white/40 max-w-xs mx-auto">
                Check back later — live matches appear here as they kick off.
              </p>
              <button
                onClick={() => setActiveCat(ALL_CAT)}
                className="mt-4 flex items-center gap-1.5 mx-auto font-sans text-sm text-white/50 hover:text-white border border-white/20 rounded-full px-4 py-1.5 transition-colors"
              >
                <ChevronDown size={13} /> Show all sports
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(m => (
                <MatchCard key={m.id} match={m} onWatch={() => handleWatch(m)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
