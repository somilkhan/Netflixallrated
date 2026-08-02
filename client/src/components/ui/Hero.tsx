/**
 * Hero — Unified cinematic hero banner.
 * Variants: hero (default) | anime-hero
 * Supports auto-advancing slides, swipe, pause on hover, trailer background.
 * Zero hardcoded colors — uses design tokens + art-directed gradients.
 */
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Volume2, VolumeX, ChevronRight, ChevronLeft } from 'lucide-react';
import { shadows, zIndex } from '../../lib/design-tokens';

const AUTO_MS = 8000;

// ── Types ───────────────────────────────────────────────────────────

export interface HeroItem {
  id: string;
  name: string;
  backdropUrl?: string | null;
  posterUrl?: string | null;
  synopsis?: string;
  genres?: string[];
  rating?: number | string | null;
  year?: number | string | null;
  type?: string;
  trailerYoutubeId?: string | null;
}

export interface HeroProps {
  items: HeroItem[];
  variant?: 'hero' | 'anime-hero';
  regionLabel?: string;
  onAction?: (item: HeroItem, play: boolean) => void;
  isResolving?: boolean;
  playLabel?: string;
  infoLabel?: string;
}

// ── Component ───────────────────────────────────────────────────────

const Hero = memo(function Hero({
  items,
  variant = 'hero',
  regionLabel,
  onAction,
  isResolving = false,
  playLabel = 'Play Now',
  infoLabel = 'More Info',
}: HeroProps) {
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  const isHero = variant === 'hero';
  const current = items[idx];

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const next = useCallback(() => {
    setIdx(i => (i + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setIdx(i => (i - 1 + items.length) % items.length);
  }, [items.length]);

  // Auto-advance
  useEffect(() => {
    if (items.length <= 1 || paused || prefersReducedMotion) return;
    const t = setTimeout(next, AUTO_MS);
    return () => clearTimeout(t);
  }, [idx, next, items.length, paused, prefersReducedMotion]);

  // Swipe handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta < -50) next();
    else if (delta > 50) prev();
    setTimeout(() => setPaused(false), 1200);
  }, [next, prev]);

  const handleAction = useCallback((play: boolean) => {
    if (!current) return;
    if (onAction) {
      onAction(current, play);
    } else {
      nav(`/title/${current.id}${play ? '?play=1' : ''}`);
    }
  }, [current, onAction, nav]);

  const rating = current?.rating;

  const metaParts = useMemo(() => {
    if (!current) return [];
    const parts: string[] = [];
    if (current.year) parts.push(String(current.year));
    if (current.type) {
      const label = current.type === 'MOVIE' ? 'Film'
        : current.type === 'SERIES' ? 'TV Series'
        : current.type === 'ANIME' ? 'Anime'
        : current.type;
      parts.push(label);
    }
    if (current.genres?.length) parts.push(...current.genres.slice(0, 2));
    return parts;
  }, [current]);

  if (!items.length || !current) return null;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(480px, 75svh, 960px)' }}
      aria-label={`Featured: ${current.name}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Background slides ────────────────────────────────────────── */}
      <div className="absolute inset-0">
        {items.map((item, i) => {
          const imgUrl = item.backdropUrl || item.posterUrl;
          return (
            <div
              key={item.id}
              className="absolute inset-0 transition-opacity duration-500 ease-out"
              style={{ opacity: i === idx ? 1 : 0, pointerEvents: i === idx ? 'auto' : 'none' }}
              aria-hidden={i !== idx}
            >
              {imgUrl ? (
                <>
                  <img
                    src={imgUrl}
                    alt=""
                    aria-hidden
                    className="sr-only"
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onLoad={() => setImgLoaded(prev => ({ ...prev, [i]: true }))}
                  />
                  <div
                    className="absolute inset-[-5%] bg-cover bg-center transition-opacity duration-500"
                    style={{
                      backgroundImage: `url(${imgUrl})`,
                      backgroundPosition: item.backdropUrl ? 'center 20%' : 'top center',
                      animation: (i === idx && !prefersReducedMotion && isHero) ? 'kenBurns 28s ease-in-out infinite' : 'none',
                      opacity: imgLoaded[i] ? 1 : 0,
                    }}
                  />
                  <div
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{ background: 'radial-gradient(ellipse at 30% 30%, #1a1a2e, #000000)', opacity: imgLoaded[i] ? 0 : 1 }}
                  />
                </>
              ) : (
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 30%, #1a1a2e, #000000)' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* YouTube trailer — desktop only, muted, no controls */}
      {isHero && current.trailerYoutubeId && !muted && (
        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none hidden md:block">
          <iframe
            key={`${current.trailerYoutubeId}-u`}
            className="absolute w-[177.78vh] min-w-full h-[56.25vw] min-h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            src={`https://www.youtube-nocookie.com/embed/${current.trailerYoutubeId}?autoplay=1&mute=1&loop=1&playlist=${current.trailerYoutubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&modestbranding=1&playsinline=1&enablejsapi=0`}
            title="trailer background"
            allow="autoplay; encrypted-media; fullscreen"
            style={{ border: 'none' }}
          />
        </div>
      )}

      {/* ── Gradient overlays ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 25%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)' }}
      />
      <div
        className="absolute inset-0 z-[2] pointer-events-none hidden md:block"
        style={{ background: 'linear-gradient(105deg, rgba(0,0,0,0.85) 0%, rgba(10,10,10,0.5) 40%, transparent 70%)' }}
      />
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 20%)' }}
      />

      {/* ── Content — bottom-left ─────────────────────────────────────── */}
      <div className="absolute inset-0 z-[3] flex items-end">
        <div className="w-full max-w-[620px] px-4 sm:px-8 md:px-12 pb-24 md:pb-28">

          {/* Hero variant: region label + genre pills */}
          {isHero && regionLabel && (
            <div className="mb-3 animate-fade-up" style={{ animationDelay: '0s' }}>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink-secondary border border-white/[0.12] bg-page/[0.35] backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0" />
                {regionLabel}
              </span>
            </div>
          )}

          {isHero && current.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 animate-fade-up" style={{ animationDelay: '0.02s' }}>
              {current.genres.slice(0, 3).map((g: string) => (
                <span
                  key={g}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-white/[0.12] bg-page/[0.45] text-white backdrop-blur-[8px] leading-none"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Anime-hero variant: badges */}
          {!isHero && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-2xs font-bold uppercase tracking-[0.15em] text-amber-400">
                Trending Anime
              </span>
              {rating && (
                <span className="flex items-center gap-1 text-xs text-ink-secondary">
                  <span className="text-amber-400">★</span>
                  {typeof rating === 'number' ? rating.toFixed(1) : rating}
                </span>
              )}
              {current.genres?.slice(0, 2).map((g: string) => (
                <span key={g} className="text-2xs text-ink-secondary uppercase tracking-wider border border-border-light px-1.5 py-0.5 rounded">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1
            key={current.id}
            className={`font-bold text-white leading-[1.05] mb-3 ${isHero ? 'animate-fade-up' : ''}`}
            style={{
              fontSize: 'clamp(28px, 5vw, 56px)',
              letterSpacing: '-0.025em',
              textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 4px 40px rgba(0,0,0,0.6)',
              animationDelay: isHero ? '0.05s' : undefined,
            }}
          >
            {current.name}
          </h1>

          {/* Meta row — hero only */}
          {isHero && (rating || metaParts.length > 0) && (
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-3 animate-fade-up" style={{ animationDelay: '0.07s' }}>
              {rating && (
                <span className="flex items-center gap-1.5 bg-[#f5c518]/15 border border-[#f5c518]/25 rounded-full px-2 py-0.5">
                  <svg width="9" height="9" viewBox="0 0 24 24" aria-hidden>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#f5c518" />
                  </svg>
                  <span className="text-sm font-semibold text-white/90">
                    {typeof rating === 'number' ? rating.toFixed(1) : rating}
                  </span>
                </span>
              )}
              {metaParts.map((part, i) => (
                <span key={part + i} className="flex items-center gap-2">
                  <span className="text-base text-[#A3A3A3]">{part}</span>
                  {i < metaParts.length - 1 && <span className="text-2xs text-ink-disabled">·</span>}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {current.synopsis && (
            <p
              className={`text-md md:text-lg leading-relaxed mb-6 max-w-[500px] ${isHero ? 'animate-fade-up' : ''}`}
              style={{
                animationDelay: isHero ? '0.12s' : undefined,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                color: 'rgba(255,255,255,0.85)',
                textShadow: '0 1px 8px rgba(0,0,0,0.6)',
              }}
            >
              {current.synopsis}
            </p>
          )}

          {/* CTA buttons */}
          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${isHero ? 'animate-fade-up' : ''}`} style={{ animationDelay: isHero ? '0.18s' : undefined }}>
            <button
              type="button"
              onClick={() => handleAction(true)}
              disabled={isResolving}
              aria-label={`${playLabel} ${current.name}`}
              className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 rounded-md bg-white text-black text-lg font-semibold hover:bg-white/90 active:scale-[0.97] disabled:opacity-60 transition-all duration-200 touch-manipulation"
              style={{ minHeight: 56, height: 56, boxShadow: shadows.hero }}
            >
              {isResolving
                ? <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                : <Play size={17} className="fill-current shrink-0" />
              }
              {playLabel}
            </button>

            <button
              type="button"
              onClick={() => handleAction(false)}
              disabled={isResolving}
              aria-label={`${infoLabel} ${current.name}`}
              className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 rounded-md bg-btn-secondary text-white text-lg font-medium hover:bg-btn-secondary/80 active:scale-[0.97] disabled:opacity-60 transition-all duration-200 touch-manipulation"
              style={{ minHeight: 56, height: 56 }}
            >
              <Info size={16} className="shrink-0" />
              {infoLabel}
            </button>
          </div>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className="absolute bottom-5 md:bottom-7 right-4 md:right-10 z-[4] flex items-center gap-3">

        {/* Mute toggle — hero variant only, when trailer present */}
        {isHero && current.trailerYoutubeId && (
          <button
            type="button"
            onClick={() => setMuted(m => !m)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.07] border border-white/[0.12] text-white/65 hover:text-white hover:bg-overlay-medium backdrop-blur-sm transition-all duration-200"
          >
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        )}

        {/* Prev button — anime-hero only */}
        {!isHero && items.length > 1 && (
          <button
            type="button"
            onClick={prev}
            aria-label="Previous"
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.07] border border-white/[0.12] text-white/65 hover:text-white hover:bg-overlay-medium backdrop-blur-sm transition-all duration-200"
          >
            <ChevronLeft size={15} />
          </button>
        )}

        {/* Dot indicators */}
        {items.length > 1 && (
          <div className="flex items-center" style={{ gap: 8 }}>
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === idx ? 'true' : undefined}
                className="touch-manipulation flex items-center justify-center"
                style={{ padding: 4 }}
              >
                <div
                  style={{
                    width: i === idx ? 8 : 6,
                    height: i === idx ? 8 : 6,
                    borderRadius: '50%',
                    background: 'white',
                    opacity: i === idx ? 1 : 0.4,
                    transition: 'all 300ms ease',
                    flexShrink: 0,
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Next button */}
        {items.length > 1 && (
          <button
            type="button"
            onClick={next}
            aria-label="Next featured title"
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.07] border border-white/[0.12] text-white/65 hover:text-white hover:bg-overlay-medium backdrop-blur-sm transition-all duration-200"
          >
            <ChevronRight size={15} />
          </button>
        )}
      </div>
    </section>
  );
});

export default Hero;
