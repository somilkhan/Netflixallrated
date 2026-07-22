/**
 * HeroSection — rebuilt from scratch.
 * Full-viewport cinematic hero with auto-advancing slides.
 * Desktop: 100vh, Ken Burns. Mobile: 70vh, no animation.
 * Gradient fades bottom to page, left for text readability.
 */
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Volume2, VolumeX, ChevronRight, ChevronDown } from 'lucide-react';

const AUTO_MS = 8000;

interface HeroSectionProps {
  titles: any[];
  /** Override default /title/:id navigation. Receives the current item and whether Play was clicked. */
  onAction?: (item: any, play: boolean) => void;
}

const HeroSection = memo(function HeroSection({ titles, onAction }: HeroSectionProps) {
  const nav = useNavigate();
  const [idx,       setIdx]     = useState(0);
  const [muted,     setMuted]   = useState(true);
  const [paused,    setPaused]  = useState(false);
  const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  const current = titles[idx];

  const next = useCallback(() => {
    setIdx(i => (i + 1) % titles.length);
  }, [titles.length]);

  const prev = useCallback(() => {
    setIdx(i => (i - 1 + titles.length) % titles.length);
  }, [titles.length]);

  // Auto-advance — pauses on hover/touch
  useEffect(() => {
    if (titles.length <= 1 || paused) return;
    const t = setTimeout(next, AUTO_MS);
    return () => clearTimeout(t);
  }, [idx, next, titles.length, paused]);

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
    // resume after swipe
    setTimeout(() => setPaused(false), 1200);
  }, [next, prev]);

  const rating = current?.rating || current?.imdbRating || current?.voteAverage;

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

  if (!titles.length || !current) return null;

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
        {titles.map((t, i) => {
          const imgUrl = t.backdropUrl || t.posterUrl;
          return (
            <div
              key={t.id}
              className="absolute inset-0 transition-opacity duration-500 ease-out"
              style={{ opacity: i === idx ? 1 : 0, pointerEvents: i === idx ? 'auto' : 'none' }}
              aria-hidden={i !== idx}
            >
              {imgUrl ? (
                <>
                  {/* Hidden <img> fires onLoad — div background-image never does */}
                  <img
                    src={imgUrl}
                    alt=""
                    aria-hidden
                    className="sr-only"
                    onLoad={() => setImgLoaded(prev => ({ ...prev, [i]: true }))}
                  />
                  <div
                    className="absolute inset-[-5%] bg-cover bg-center transition-opacity duration-500"
                    style={{
                      backgroundImage: `url(${imgUrl})`,
                      backgroundPosition: t.backdropUrl ? 'center 20%' : 'top center',
                      animation: i === idx ? 'kenBurns 28s ease-in-out infinite' : 'none',
                      opacity: imgLoaded[i] ? 1 : 0,
                    }}
                  />
                  {/* Dark fallback while image loads */}
                  <div
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{ background: 'radial-gradient(ellipse at 30% 30%, #1a1a2e, #0A0A0A)', opacity: imgLoaded[i] ? 0 : 1 }}
                  />
                </>
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse at 30% 30%, #1a1a2e, #0A0A0A)`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* YouTube trailer background — desktop only, muted, no controls.
          Only rendered after user unmutes to avoid bot-check on load. */}
      {current.trailerYoutubeId && !muted && (
        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none hidden md:block">
          <iframe
            key={`${current.trailerYoutubeId}-u`}
            className="absolute w-[177.78vh] min-w-full h-[56.25vw] min-h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            src={`https://www.youtube-nocookie.com/embed/${current.trailerYoutubeId}?autoplay=1&mute=0&loop=1&playlist=${current.trailerYoutubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&modestbranding=1&playsinline=1`}
            allow="autoplay; encrypted-media"
            title="trailer background"
          />
        </div>
      )}

      {/* ── Gradient overlays ─────────────────────────────────────────── */}
      {/* Universal scrim — ensures text is always readable over any backdrop */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(15,15,15,1) 0%, rgba(15,15,15,0.85) 25%, rgba(15,15,15,0.4) 60%, rgba(15,15,15,0) 100%)' }}
      />
      {/* Left: extra text-area darkening on desktop */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none hidden md:block"
        style={{ background: 'linear-gradient(105deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.5) 40%, transparent 70%)' }}
      />
      {/* Top: nav readability */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 20%)' }}
      />

      {/* ── Content — bottom-left ─────────────────────────────────────── */}
      <div className="absolute inset-0 z-[3] flex items-end">
        <div className="w-full max-w-[620px] px-4 sm:px-8 md:px-12 pb-24 md:pb-28">

          {/* Genre pills */}
          {current.genres?.length > 0 && (
            <div
              className="flex flex-wrap gap-1.5 mb-3 animate-fade-up"
              style={{ animationDelay: '0.02s' }}
            >
              {current.genres.slice(0, 3).map((g: string) => (
                <span
                  key={g}
                  className="
                    text-[10px] font-medium px-2.5 py-1 rounded-full
                    border border-white/[0.12] bg-white/[0.06]
                    text-white/70 backdrop-blur-sm leading-none
                  "
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1
            key={current.id}
            className="font-bold text-white leading-[1.05] mb-3 animate-fade-up"
            style={{
              fontSize: 'clamp(28px, 5vw, 56px)',
              letterSpacing: '-0.025em',
              textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 4px 40px rgba(0,0,0,0.6)',
            }}
          >
            {current.name}
          </h1>

          {/* Meta row */}
          {(rating || metaParts.length > 0) && (
            <div
              className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-3 animate-fade-up"
              style={{ animationDelay: '0.07s' }}
            >
              {rating && (
                <span className="flex items-center gap-1.5 bg-[#f5c518]/15 border border-[#f5c518]/25 rounded-full px-2 py-0.5">
                  <svg width="9" height="9" viewBox="0 0 24 24" aria-hidden>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#f5c518" />
                  </svg>
                  <span className="text-[12px] font-semibold text-white/90">
                    {typeof rating === 'number' ? rating.toFixed(1) : rating}
                  </span>
                </span>
              )}
              {metaParts.map((part, i) => (
                <span key={part + i} className="flex items-center gap-2">
                  <span className="text-[13px] text-[#A3A3A3]">{part}</span>
                  {i < metaParts.length - 1 && <span className="text-[10px] text-white/20">·</span>}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {current.synopsis && (
            <p
              className="text-[14px] md:text-[15px] leading-relaxed mb-6 max-w-[500px] animate-fade-up"
              style={{
                animationDelay: '0.12s',
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
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-fade-up"
            style={{ animationDelay: '0.18s' }}
          >
            <button
              type="button"
              onClick={() => onAction ? onAction(current, true) : nav(`/title/${current.id}?play=1`)}
              aria-label={`Play ${current.name}`}
              className="
                flex items-center justify-center gap-2.5
                w-full sm:w-auto px-8 rounded-xl
                bg-white text-black
                text-[15px] font-semibold
                hover:bg-white/90 active:scale-[0.97]
                transition-all duration-200 touch-manipulation
                shadow-[0_4px_24px_rgba(0,0,0,0.5)]
              "
              style={{ minHeight: 56, height: 56 }}
            >
              <Play size={17} className="fill-current shrink-0" />
              Play Now
            </button>

            <button
              type="button"
              onClick={() => onAction ? onAction(current, false) : nav(`/title/${current.id}`)}
              aria-label={`More info about ${current.name}`}
              className="
                flex items-center justify-center gap-2.5
                w-full sm:w-auto px-8 rounded-xl
                bg-transparent border border-white/[0.35] text-white
                text-[15px] font-medium
                hover:bg-white/[0.10] hover:border-white/[0.50]
                active:scale-[0.97]
                transition-all duration-200 touch-manipulation
                backdrop-blur-sm
              "
              style={{ minHeight: 56, height: 56 }}
            >
              <Info size={16} className="shrink-0" />
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* ── Controls: mute + indicators + next ────────────────────────── */}
      <div className="absolute bottom-5 md:bottom-7 right-4 md:right-10 z-[4] flex items-center gap-3">

        {/* Mute toggle — only when trailer present */}
        {current.trailerYoutubeId && (
          <button
            type="button"
            onClick={() => setMuted(m => !m)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="
              hidden md:flex items-center justify-center
              w-8 h-8 rounded-full
              bg-white/[0.07] border border-white/[0.12]
              text-white/65 hover:text-white hover:bg-white/[0.12]
              backdrop-blur-sm transition-all duration-200
            "
          >
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        )}

        {/* Slide dot indicators — solid circles */}
        {titles.length > 1 && (
          <div className="flex items-center" style={{ gap: 8 }}>
            {titles.map((_, i) => (
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
                    width:        i === idx ? 8 : 6,
                    height:       i === idx ? 8 : 6,
                    borderRadius: '50%',
                    background:   'white',
                    opacity:      i === idx ? 1 : 0.4,
                    transition:   'all 300ms ease',
                    flexShrink:   0,
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Next arrow */}
        {titles.length > 1 && (
          <button
            type="button"
            onClick={next}
            aria-label="Next featured title"
            className="
              hidden md:flex items-center justify-center
              w-8 h-8 rounded-full
              bg-white/[0.07] border border-white/[0.12]
              text-white/65 hover:text-white hover:bg-white/[0.12]
              backdrop-blur-sm transition-all duration-200
            "
          >
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      {/* ── Scroll hint — centered, animated bounce ────────────────────── */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[10] md:hidden pointer-events-none"
        style={{ opacity: 0.6, animation: 'bounce 2s infinite' }}
        aria-hidden
      >
        <ChevronDown size={24} className="text-white" />
      </div>
    </section>
  );
});

export default HeroSection;
