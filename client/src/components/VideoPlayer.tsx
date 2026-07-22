/**
 * VideoPlayer — fullscreen overlay player for TitleDetail.
 *
 * FebBoxPlayer: native HLS/MP4 with fully custom HTML5 controls (no browser bar).
 * All other servers: iframe embed (controls come from the embed provider).
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  RefreshCw, ExternalLink, X, SkipBack, SkipForward,
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { SERVERS } from '../lib/servers';
export type { Server } from '../lib/servers';
export { SERVERS };

export interface FebboxStream {
  url: string;
  quality: string;
  name: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// FebBoxPlayer — native HLS with fully custom controls overlay
// ─────────────────────────────────────────────────────────────────────────────
export function FebBoxPlayer({
  streams,
  iframeKey,
}: {
  streams: FebboxStream[];
  iframeKey: number;
}) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const hlsRef     = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef    = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef       = useRef<{ x: number; time: number } | null>(null);
  const seekFlashRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timestamp of last touchend — used to suppress the synthetic click that
  // mobile browsers fire ~300 ms after touchend (prevents double-toggling play).
  const lastTouchEndRef  = useRef<number>(0);
  const singleTapTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [qualityIdx,   setQualityIdx]   = useState(0);
  const [error,        setError]        = useState<string | null>(null);
  const [playing,      setPlaying]      = useState(false);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [buffered,     setBuffered]     = useState(0);
  const [muted,        setMuted]        = useState(false);
  const [volume,       setVolume]       = useState(1);
  const [fullscreen,   setFullscreen]   = useState(false);
  const [showCtrl,     setShowCtrl]     = useState(true);
  const [seekFlash,    setSeekFlash]    = useState<'left' | 'right' | null>(null);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const playPauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Attach HLS / direct source ───────────────────────────────────────────
  useEffect(() => {
    if (!streams.length) return;
    const video = videoRef.current;
    if (!video) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;
    setError(null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const src = streams[qualityIdx]?.url ?? streams[0].url;
    const isHLS = src.includes('.m3u8') || src.includes('/hls/');

    if (isHLS) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) setError('Stream playback error — try another quality');
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.play().catch(() => {});
      } else {
        setError('HLS is not supported in this browser');
      }
    } else {
      video.src = src;
      video.play().catch(() => {});
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [streams, qualityIdx, iframeKey]);

  // ── Video event listeners ────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime  = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length) setBuffered(video.buffered.end(video.buffered.length - 1));
    };
    const onMeta  = () => setDuration(video.duration);
    const onVol   = () => { setMuted(video.muted); setVolume(video.volume); };
    const onFull  = () => setFullscreen(!!document.fullscreenElement);
    video.addEventListener('play',         onPlay);
    video.addEventListener('pause',        onPause);
    video.addEventListener('timeupdate',   onTime);
    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('volumechange', onVol);
    document.addEventListener('fullscreenchange', onFull);
    return () => {
      video.removeEventListener('play',         onPlay);
      video.removeEventListener('pause',        onPause);
      video.removeEventListener('timeupdate',   onTime);
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('volumechange', onVol);
      document.removeEventListener('fullscreenchange', onFull);
    };
  }, []);

  // ── Auto-hide controls ───────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowCtrl(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCtrl(false), 3000);
  }, []);

  // ── Flash center play/pause icon briefly ────────────────────────────────
  const flashPlayPause = useCallback(() => {
    setShowPlayPause(true);
    if (playPauseTimer.current) clearTimeout(playPauseTimer.current);
    playPauseTimer.current = setTimeout(() => setShowPlayPause(false), 600);
  }, []);

  // ── Controls ─────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
    flashPlayPause();
    resetHideTimer();
  }, [resetHideTimer, flashPlayPause]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
    resetHideTimer();
  }, [duration, resetHideTimer]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  }, []);

  const changeVolume = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.volume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.muted  = false;
  }, []);

  const skip = useCallback((secs: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + secs));
    // Show seek flash
    setSeekFlash(secs < 0 ? 'left' : 'right');
    if (seekFlashRef.current) clearTimeout(seekFlashRef.current);
    seekFlashRef.current = setTimeout(() => setSeekFlash(null), 600);
    resetHideTimer();
  }, [duration, resetHideTimer]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  // ── Desktop click — only fires from real mouse/pointer clicks, not touch ────
  // Mobile browsers synthesize a click ~300 ms after touchend. We suppress those
  // by checking how recently a touchend occurred (lastTouchEndRef).
  const handleContainerClick = useCallback(() => {
    if (Date.now() - lastTouchEndRef.current < 500) return; // synthetic click after touch — ignore
    togglePlay();
  }, [togglePlay]);

  // ── Mobile touch gestures ─────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const v = videoRef.current;
    const container = containerRef.current;

    // Record touchend time so handleContainerClick can suppress the synthetic click.
    lastTouchEndRef.current = Date.now();

    if (!v || !container || !touchStartRef.current) return;

    const t = e.changedTouches[0];
    const start = touchStartRef.current;
    touchStartRef.current = null;

    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const elapsed = Date.now() - start.time;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Swipe left/right to seek (≥50 px horizontal, <40 px vertical drift, <400 ms)
    if (absDx > 50 && absDy < 40 && elapsed < 400) {
      e.preventDefault(); // prevent synthetic click
      const seekSecs = (dx / container.clientWidth) * 60;
      v.currentTime = Math.max(0, Math.min(duration, v.currentTime + seekSecs));
      setSeekFlash(dx < 0 ? 'left' : 'right');
      if (seekFlashRef.current) clearTimeout(seekFlashRef.current);
      seekFlashRef.current = setTimeout(() => setSeekFlash(null), 600);
      resetHideTimer();
      return;
    }

    // Swipe up/down to adjust volume (≥40 px vertical, <40 px horizontal drift, <400 ms)
    if (absDy > 40 && absDx < 40 && elapsed < 400) {
      e.preventDefault(); // prevent synthetic click
      const delta = -(dy / container.clientHeight) * 0.5;
      v.volume = Math.max(0, Math.min(1, v.volume + delta));
      v.muted = false;
      resetHideTimer();
      return;
    }

    // Tap detection (small movement, short press)
    if (absDx < 20 && absDy < 20 && elapsed < 250) {
      e.preventDefault(); // prevent synthetic click for all taps
      const containerRect = container.getBoundingClientRect();
      const tapX = t.clientX - containerRect.left;
      const isLeftSide  = tapX < containerRect.width  * 0.35;
      const isRightSide = tapX > containerRect.width  * 0.65;
      const now = Date.now();

      // Double-tap on left third → rewind 10 s
      if (isLeftSide && lastTapRef.current && now - lastTapRef.current.time < 350
          && lastTapRef.current.x < containerRect.width * 0.35) {
        if (singleTapTimer.current) { clearTimeout(singleTapTimer.current); singleTapTimer.current = null; }
        lastTapRef.current = null;
        skip(-10);
        return;
      }

      // Double-tap on right third → forward 10 s
      if (isRightSide && lastTapRef.current && now - lastTapRef.current.time < 350
          && lastTapRef.current.x > containerRect.width * 0.65) {
        if (singleTapTimer.current) { clearTimeout(singleTapTimer.current); singleTapTimer.current = null; }
        lastTapRef.current = null;
        skip(10);
        return;
      }

      // First tap — arm double-tap window; on expiry treat as single tap (show/hide controls)
      lastTapRef.current = { x: tapX, time: now };
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
      singleTapTimer.current = setTimeout(() => {
        lastTapRef.current = null;
        singleTapTimer.current = null;
        // Single tap: toggle control visibility only — no play/pause accidental fires
        setShowCtrl(prev => {
          if (!prev) {
            // Showing controls — reset the auto-hide timer
            if (hideTimer.current) clearTimeout(hideTimer.current);
            hideTimer.current = setTimeout(() => setShowCtrl(false), 3000);
          }
          return !prev;
        });
      }, 350);
    }
  }, [duration, skip, resetHideTimer]);

  if (!streams.length) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
        No streams available
      </div>
    );
  }

  const pct         = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered    / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-black select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (!('ontouchstart' in window)) setShowCtrl(false); }}
      onClick={handleContainerClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: showCtrl ? 'default' : 'none' }}
    >
      {/* Video element — no browser controls */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
      />

      {/* ── Center play/pause flash ─────────────────────────────────────── */}
      <div
        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
        style={{
          opacity: showPlayPause ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 72, height: 72,
            background: 'rgba(0,0,0,0.55)',
            border: '1.5px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {playing
            ? <Pause size={28} className="fill-current text-white" />
            : <Play  size={28} className="fill-current text-white ml-1" />
          }
        </div>
      </div>

      {/* ── Double-tap seek flash (left / right) ───────────────────────── */}
      {seekFlash && (
        <div
          className="absolute inset-0 flex items-center z-20 pointer-events-none"
          style={{ justifyContent: seekFlash === 'left' ? 'flex-start' : 'flex-end' }}
        >
          <div
            className="flex flex-col items-center gap-1 text-white px-8"
            style={{
              animation: 'dpFadeIn 0.1s ease, dpFadeOut 0.4s ease 0.2s forwards',
            }}
          >
            <div className="text-2xl font-bold">{seekFlash === 'left' ? '«' : '»'}</div>
            <span className="text-xs font-semibold">10s</span>
          </div>
        </div>
      )}

      {/* Quality selector */}
      {streams.length > 1 && showCtrl && (
        <div
          className="absolute top-3 right-3 z-20 flex gap-1.5 flex-wrap justify-end"
          onClick={e => e.stopPropagation()}
        >
          {streams.map((s, i) => (
            <button
              key={s.url ?? s.quality ?? i}
              onClick={() => setQualityIdx(i)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                qualityIdx === i
                  ? 'border-white/40 bg-white/20 text-white'
                  : 'border-white/10 text-white/40 bg-black/60 hover:text-white hover:border-white/30'
              }`}
            >
              {s.quality || s.name || `Q${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
          <p className="text-red-400 text-sm text-center px-8">{error}</p>
        </div>
      )}

      {/* ── Custom controls overlay ─────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-10 flex flex-col justify-end transition-opacity duration-300"
        style={{
          opacity: showCtrl ? 1 : 0,
          pointerEvents: showCtrl ? 'auto' : 'none',
          background: 'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.3) 20%, transparent 45%)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="px-4 pb-1">
          <div
            className="relative rounded-full cursor-pointer group"
            style={{ height: 4, background: 'rgba(255,255,255,0.15)', transition: 'height 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.height = '8px'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.height = '4px'; }}
            onClick={seek}
          >
            {/* Buffered */}
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${bufferedPct}%`, background: 'rgba(255,255,255,0.20)' }}
            />
            {/* Played — Netflix red */}
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${pct}%`, background: '#E50914' }}
            />
            {/* Scrubber thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
              style={{ left: `${pct}%`, background: '#E50914', boxShadow: '0 0 6px rgba(229,9,20,0.6)' }}
            />
          </div>
        </div>

        {/* Time row */}
        <div className="flex items-center justify-between px-4 pb-1">
          <span className="text-[11px] font-mono text-white/50 tabular-nums">
            {fmtTime(currentTime)}
          </span>
          <span className="text-[11px] font-mono text-white/30 tabular-nums">
            {fmtTime(duration)}
          </span>
        </div>

        {/* Bottom control row */}
        <div className="flex items-center gap-1 px-3 pb-3">
          {/* Skip back 10s */}
          <button
            type="button"
            aria-label="Skip back 10s"
            onClick={() => skip(-10)}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <SkipBack size={16} />
          </button>

          {/* Play/Pause */}
          <button
            type="button"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={togglePlay}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            {playing
              ? <Pause size={20} className="fill-current" />
              : <Play  size={20} className="fill-current ml-0.5" />
            }
          </button>

          {/* Skip forward 10s */}
          <button
            type="button"
            aria-label="Skip forward 10s"
            onClick={() => skip(10)}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <SkipForward size={16} />
          </button>

          {/* Volume */}
          <button
            type="button"
            aria-label={muted ? 'Unmute' : 'Mute'}
            onClick={toggleMute}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-1"
          >
            {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Volume bar */}
          <div
            className="w-16 h-1 bg-white/20 rounded-full cursor-pointer hidden md:block"
            onClick={changeVolume}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${muted ? 0 : volume * 100}%`, background: '#E50914' }}
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Fullscreen */}
          <button
            type="button"
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VideoPlayerProps
// ─────────────────────────────────────────────────────────────────────────────
interface VideoPlayerProps {
  title: any;
  playerOpen: boolean;
  setPlayerOpen: (v: boolean) => void;
  serverId: string;
  switchServer: (id: string) => void;
  iframeKey: number;
  setIframeKey: React.Dispatch<React.SetStateAction<number>>;
  selectedSeason: number;
  selectedEp: number;
  setSelectedEp: React.Dispatch<React.SetStateAction<number>>;
  embedUrl: string | null;
  febboxStreams?: FebboxStream[];
  onAnimePrev?: () => void;
  onAnimeNext?: () => void;
}

export default function VideoPlayer({
  title,
  playerOpen,
  setPlayerOpen,
  serverId,
  switchServer,
  iframeKey,
  setIframeKey,
  selectedSeason,
  selectedEp,
  setSelectedEp,
  embedUrl,
  febboxStreams = [],
  onAnimePrev,
  onAnimeNext,
}: VideoPlayerProps) {
  const showFebboxNative = serverId === 'febbox' && febboxStreams.length > 0;
  if (!playerOpen || (!embedUrl && !showFebboxNative)) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0 gap-3 flex-wrap border-b border-white/[0.06]"
        style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}
      >
        {/* Title + episode info */}
        <div className="shrink-0">
          <p className="text-[13px] font-semibold text-white leading-tight truncate max-w-[200px] md:max-w-none">
            {title.name}
          </p>
          <p className="text-[10px] text-white/40 font-mono mt-0.5">
            {title.type === 'SERIES'
              ? `S${selectedSeason} · E${selectedEp}`
              : title.type === 'ANIME'
              ? `Episode ${selectedEp}`
              : title.year}
          </p>
        </div>

        {/* Server pills — non-anime only */}
        {title.type !== 'ANIME' && (
          <div className="flex gap-1.5 flex-wrap">
            {SERVERS.map(s => (
              <button
                key={s.id}
                onClick={() => switchServer(s.id)}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-colors ${
                  serverId === s.id
                    ? 'border-white/20 bg-white/[0.08] text-white'
                    : 'border-white/[0.08] text-white/40 hover:text-white/80 hover:border-white/[0.16]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Anime source label */}
        {title.type === 'ANIME' && (
          <span className="text-[10px] font-mono text-white/30 border border-white/[0.08] rounded-full px-2.5 py-1">
            Anicrush
          </span>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIframeKey(k => k + 1)}
            title="Reload player"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 border border-white/[0.08] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <RefreshCw size={13} />
          </button>

          {title.type === 'SERIES' && (
            <>
              <button
                type="button"
                onClick={() => { setSelectedEp(p => Math.max(1, p - 1)); setIframeKey(k => k + 1); }}
                className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-[11px] text-white/40 border border-white/[0.08] hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <ChevronLeft size={12} /> Prev
              </button>
              <button
                type="button"
                onClick={() => { setSelectedEp(p => p + 1); setIframeKey(k => k + 1); }}
                className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-[11px] text-white/40 border border-white/[0.08] hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Next <ChevronRight size={12} />
              </button>
            </>
          )}

          {title.type === 'ANIME' && (
            <>
              <button
                type="button"
                onClick={onAnimePrev}
                disabled={selectedEp <= 1}
                className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-[11px] text-white/40 border border-white/[0.08] hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={12} /> Prev
              </button>
              <button
                type="button"
                onClick={onAnimeNext}
                className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-[11px] text-white/40 border border-white/[0.08] hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Next <ChevronRight size={12} />
              </button>
            </>
          )}

          {!showFebboxNative && (
            <a
              href={embedUrl ?? '#'}
              target="_blank"
              rel="noreferrer"
              title="Open in new tab"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 border border-white/[0.08] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <ExternalLink size={13} />
            </a>
          )}

          <button
            type="button"
            onClick={() => setPlayerOpen(false)}
            aria-label="Close player"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 border border-white/[0.08] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Player area ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden bg-black flex items-center justify-center">
        <div className="relative player-ratio w-full overflow-hidden">
          {showFebboxNative ? (
            <FebBoxPlayer streams={febboxStreams} iframeKey={iframeKey} />
          ) : (
            <iframe
              key={`${serverId}-${selectedSeason}-${selectedEp}-${iframeKey}`}
              src={embedUrl ?? ''}
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              title={title.name}
            />
          )}
        </div>
      </div>
    </div>
  );
}
