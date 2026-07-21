/**
 * BottomPlayer — persistent 80px mini player bar (64px on mobile).
 * Shows now-playing title from PlayerContext.
 * Desktop: thumbnail + title + controls + progress + volume.
 * Mobile: thumbnail + title + play button (tap to expand to full controls).
 */
import { memo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, List, Maximize, X, ChevronDown,
} from 'lucide-react';
import { usePlayer } from '../../lib/playerContext';
import { ProgressBar } from '../ui/ProgressBar';
import { IconButton } from '../ui/IconButton';

const BottomPlayer = memo(function BottomPlayer() {
  const { nowPlaying, isPlaying, setIsPlaying, clear } = usePlayer();
  const nav = useNavigate();
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [expanded, setExpanded] = useState(false);

  const handlePlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    clear();
    setExpanded(false);
  }, [clear]);

  const handleGoToTitle = useCallback(() => {
    if (nowPlaying) nav(`/title/${nowPlaying.id}`);
  }, [nowPlaying, nav]);

  const handleVolumeToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted(m => !m);
  }, []);

  if (!nowPlaying) return null;

  const subLabel = nowPlaying.type === 'SERIES' && nowPlaying.seasonNumber != null
    ? `S${nowPlaying.seasonNumber} · E${nowPlaying.episodeNumber ?? 1}`
    : nowPlaying.type === 'ANIME' && nowPlaying.episodeNumber != null
    ? `Ep ${nowPlaying.episodeNumber}`
    : nowPlaying.year
    ? String(nowPlaying.year)
    : null;

  return (
    <>
      {/* Mobile expanded overlay */}
      {expanded && (
        <div
          className="
            md:hidden fixed inset-0 z-[48] flex flex-col justify-end
          "
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
          onClick={() => setExpanded(false)}
        >
          <div
            className="
              mx-3 mb-[72px] rounded-2xl overflow-hidden
              border border-white/[0.08]
            "
            style={{ background: '#141414' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Collapse player"
              >
                <ChevronDown size={18} />
              </button>
              <p className="text-xs text-white/50 font-medium">Now Playing</p>
              <button
                type="button"
                onClick={handleClose}
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Close player"
              >
                <X size={16} />
              </button>
            </div>

            {/* Large poster */}
            <div className="px-8 py-6 flex flex-col items-center gap-4">
              <div
                className="w-full max-w-[180px] rounded-xl overflow-hidden cursor-pointer"
                style={{ aspectRatio: '2/3', background: '#1A1A1A' }}
                onClick={handleGoToTitle}
              >
                {nowPlaying.posterUrl && (
                  <img
                    src={nowPlaying.posterUrl}
                    alt={nowPlaying.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>

              <div className="text-center w-full">
                <p className="text-base font-semibold text-white truncate">{nowPlaying.name}</p>
                {subLabel && <p className="text-xs text-white/50 mt-0.5">{subLabel}</p>}
              </div>

              {/* Full controls */}
              <div className="w-full flex flex-col gap-4">
                <ProgressBar value={0} />

                <div className="flex items-center justify-center gap-4">
                  <IconButton aria-label="Previous" className="text-white/60">
                    <SkipBack size={20} strokeWidth={1.8} />
                  </IconButton>
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="
                      w-14 h-14 rounded-full bg-white text-black
                      flex items-center justify-center
                      hover:bg-white/90 active:scale-90 transition-all
                      shadow-[0_4px_20px_rgba(0,0,0,0.4)]
                    "
                  >
                    {isPlaying
                      ? <Pause size={22} className="fill-current" />
                      : <Play size={22} className="fill-current ml-0.5" />
                    }
                  </button>
                  <IconButton aria-label="Next" className="text-white/60">
                    <SkipForward size={20} strokeWidth={1.8} />
                  </IconButton>
                </div>

                <div className="flex items-center gap-3">
                  <IconButton size="sm" onClick={handleVolumeToggle} className="text-white/60">
                    {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </IconButton>
                  <ProgressBar
                    value={muted ? 0 : volume}
                    onChange={v => setVolume(v)}
                    className="flex-1"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoToTitle}
                className="
                  w-full flex items-center justify-center gap-2
                  h-10 rounded-xl
                  text-sm text-white/70 bg-white/[0.06] border border-white/[0.08]
                  hover:bg-white/[0.10] hover:text-white transition-colors
                "
              >
                <Maximize size={14} />
                Go to title
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main bar ───────────────────────────────────────────────────────── */}
      <div
        className="
          fixed bottom-0 inset-x-0 z-[49]
          h-16 md:h-20
          flex items-center
          border-t border-white/[0.05]
        "
        style={{ background: '#0A0A0A' }}
        role="region"
        aria-label="Now playing"
      >
        {/* Progress line at top of bar */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-white/[0.05]">
          <div
            className="h-full bg-white/30 rounded-full"
            style={{ width: '0%' }}
          />
        </div>

        {/* ── Left: thumbnail + info ───────────────────────────────────── */}
        <button
          type="button"
          className="
            flex items-center gap-3 pl-3 md:pl-4 pr-2
            min-w-0 flex-1 md:flex-none md:w-[280px] xl:w-[320px]
            touch-manipulation
          "
          onClick={() => {
            if (window.innerWidth < 768) setExpanded(true);
            else handleGoToTitle();
          }}
          aria-label={`Now playing: ${nowPlaying.name}`}
        >
          {/* Poster */}
          <div
            className="
              shrink-0 w-10 h-14 md:w-12 md:h-[60px]
              rounded-md overflow-hidden
            "
            style={{ background: '#1A1A1A' }}
          >
            {nowPlaying.posterUrl && (
              <img
                src={nowPlaying.posterUrl}
                alt={nowPlaying.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[13px] font-medium text-white truncate leading-tight">
              {nowPlaying.name}
            </p>
            {subLabel && (
              <p className="text-[11px] text-white/45 mt-0.5 truncate">{subLabel}</p>
            )}
          </div>
        </button>

        {/* ── Center: transport controls (desktop) ─────────────────────── */}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-1.5 px-4">
          <div className="flex items-center gap-2">
            <IconButton size="sm" className="text-white/60" aria-label="Previous">
              <SkipBack size={16} strokeWidth={1.8} />
            </IconButton>

            <button
              type="button"
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="
                w-9 h-9 rounded-full bg-white text-black
                flex items-center justify-center
                hover:bg-white/90 active:scale-90 transition-all
                shadow-[0_2px_12px_rgba(0,0,0,0.4)]
              "
            >
              {isPlaying
                ? <Pause size={14} className="fill-current" />
                : <Play size={14} className="fill-current ml-0.5" />
              }
            </button>

            <IconButton size="sm" className="text-white/60" aria-label="Next">
              <SkipForward size={16} strokeWidth={1.8} />
            </IconButton>
          </div>

          <div className="flex items-center gap-2 w-full max-w-[400px]">
            <span className="text-[10px] text-white/35 font-mono shrink-0">0:00</span>
            <ProgressBar value={0} buffered={0} thin />
            <span className="text-[10px] text-white/35 font-mono shrink-0">–:––</span>
          </div>
        </div>

        {/* ── Right: volume + actions (desktop) / play only (mobile) ───── */}
        <div className="flex items-center gap-1 pr-3 md:pr-4 md:w-[280px] xl:w-[320px] justify-end">

          {/* Mobile: just play button */}
          <button
            type="button"
            onClick={handlePlayPause}
            className="
              md:hidden w-10 h-10 rounded-full bg-white text-black
              flex items-center justify-center
              hover:bg-white/90 active:scale-90 transition-all
              shadow-[0_2px_12px_rgba(0,0,0,0.4)]
            "
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause size={16} className="fill-current" />
              : <Play size={16} className="fill-current ml-0.5" />
            }
          </button>

          {/* Desktop: volume + icons */}
          <div className="hidden md:flex items-center gap-1">
            <IconButton size="sm" onClick={handleVolumeToggle} aria-label={muted ? 'Unmute' : 'Mute'}>
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </IconButton>
            <div className="w-20">
              <ProgressBar
                value={muted ? 0 : volume}
                onChange={v => setVolume(v)}
                thin
              />
            </div>
            <IconButton size="sm" aria-label="Queue">
              <List size={15} />
            </IconButton>
            <IconButton size="sm" onClick={handleGoToTitle} aria-label="Fullscreen">
              <Maximize size={15} />
            </IconButton>
          </div>

          {/* Close */}
          <IconButton size="sm" onClick={handleClose} aria-label="Close player">
            <X size={15} />
          </IconButton>
        </div>
      </div>
    </>
  );
});

export default BottomPlayer;
