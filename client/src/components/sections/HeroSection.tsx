/**
 * HeroSection — full-viewport cinematic hero with auto-advancing slides.
 * Desktop: 100vh, Ken Burns on image. Mobile: 70vh, no animation.
 * Content anchored bottom-left. Gradient fades to page background.
 */
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, ChevronRight, Volume2, VolumeX } from 'lucide-react';

const AUTO_MS = 9000;

interface HeroSectionProps {
  titles: any[];
}

const HeroSection = memo(function HeroSection({ titles }: HeroSectionProps) {
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [muted, setMuted] = useState(true);

  const current = titles[idx];

  const next = useCallback(() => {
    setIdx(i => (i + 1) % titles.length);
    setProgressKey(k => k + 1);
  }, [titles.length]);

  // Auto-advance
  useEffect(() => {
    if (titles.length <= 1) return;
    const t = setTimeout(next, AUTO_MS);
    return () => clearTimeout(t);
  }, [idx, next, titles.length]);

  const rating = current?.rating || current?.imdbRating || current?.voteAverage;
  const metaParts = useMemo(() => {
    const parts: string[] = [];
    if (current?.year) parts.push(String(current.year));
    if (current?.genres?.length) parts.push(...current.genres.slice(0, 2));
    return parts;
  }, [current]);

  if (!titles.length || !current) return null;

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: '100svh', minHeight: 520, maxHeight: 960 }}
      aria-label={`Featured: ${current.name}`}
    >
      {/* ── Background slides ─────────────────────────────────────────── */}
      <div className="absolute inset-0">
        {titles.map((t, i) => {
          const imgUrl = t.backdropUrl || t.posterUrl;
          return (
            <div
              key={t.id}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === idx ? 1 : 0, pointerEvents: i === idx ? 'auto' : 'none' }}
              aria-hidden={i !== idx}
            >
              {/* Ken Burns wrapper — disabled on mobile via media query */}
              <div
                className="absolute inset-[-4%] bg-cover bg-center"
                style={{
                  backgroundImage: imgUrl
                    ? `url(${imgUrl})`
                    : 'linear-gradient(160deg, #1A1A1A, #0A0A0A)',
                  backgroundPosition: t.backdropUrl ? 'center center' : 'top center',
                  animation: i === idx ? 'kenBurns 28s ease-in-out infinite' : 'none',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* YouTube trailer background (muted autoplay) */}
      {current.trailerYoutubeId && (
        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none hidden md:block">
          <iframe
            key={`${current.trailerYoutubeId}-${muted ? 'm' : 'u'}`}
            className="absolute w-[177.78vh] min-w-full h-[56.25vw] min-h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            src={`https://www.youtube-nocookie.com/embed/${current.trailerYoutubeId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${current.trailerYoutubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&modestbranding=1&playsinline=1`}
            allow="autoplay; encrypted-media"
            title="trailer background"
          />
        </div>
      )}

      {/* ── Gradient overlays ─────────────────────────────────────────── */}
      {/* Left gradient for text readability */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.6) 35%, rgba(10,10,10,0.15) 65%, transparent 100%)' }}
      />
      {/* Bottom gradient to fade into page */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{ background: 'linear-gradient(to top, #0A0A0A 0%, rgba(10,10,10,0.7) 18%, rgba(10,10,10,0.15) 40%, transparent 100%)' }}
      />
      {/* Top gradient for nav readability */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 20%)' }}
      />

      {/* ── Content panel — bottom-left ───────────────────────────────── */}
      <div className="absolute inset-0 z-[3] flex items-end">
        <div className="w-full max-w-[600px] px-4 md:px-12 pb-24 md:pb-28">

          {/* Title */}
          <h1
            key={current.id}
            className="font-bold text-white leading-tight mb-3 animate-fade-up"
            style={{
              fontSize: 'clamp(28px, 4.5vw, 52px)',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 24px rgba(0,0,0,0.5)',
            }}
          >
            {current.name}
          </h1>

          {/* Meta row */}
          {(rating || metaParts.length > 0) && (
            <div
              className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-3 animate-fade-up"
              style={{ animationDelay: '0.06s' }}
            >
              {rating && (
                <span className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden>
                    <polygon
                      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                      fill="#f5c518"
                    />
                  </svg>
                  <span className="text-[14px] font-semibold text-white">
                    {typeof rating === 'number' ? rating.toFixed(1) : rating}
                  </span>
                </span>
              )}
              {metaParts.map((part, i) => (
                <span key={part + i} className="flex items-center gap-2">
                  <span className="text-[14px] text-[#A3A3A3]">{part}</span>
                  {i < metaParts.length - 1 && (
                    <span className="text-[10px] text-white/25">·</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {current.synopsis && (
            <p
              className="text-[15px] md:text-base text-[#A3A3A3] leading-relaxed line-clamp-2 md:line-clamp-3 mb-5 max-w-[500px] animate-fade-up"
              style={{ animationDelay: '0.12s' }}
            >
              {current.synopsis}
            </p>
          )}

          {/* CTA buttons */}
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-fade-up"
            style={{ animationDelay: '0.18s' }}
          >
            {/* Play — white fill */}
            <button
              type="button"
              onClick={() => nav(`/title/${current.id}?play=1`)}
              aria-label={`Play ${current.name}`}
              className="
                flex items-center justify-center gap-2.5
                h-11 px-6 rounded-full
                bg-white text-black
                text-[14px] font-semibold
                hover:bg-white/90
                transition-all duration-200 active:scale-[0.97]
                touch-manipulation
              "
            >
              <Play size={16} className="fill-current shrink-0" />
              Play Now
            </button>

            {/* More Info — glass */}
            <button
              type="button"
              onClick={() => nav(`/title/${current.id}`)}
              aria-label={`More info about ${current.name}`}
              className="
                flex items-center justify-center gap-2.5
                h-11 px-6 rounded-full
                bg-white/[0.08] border border-white/[0.20] text-white
                text-[14px] font-medium
                hover:bg-white/[0.14] hover:border-white/[0.30]
                transition-all duration-200 active:scale-[0.97]
                touch-manipulation
              "
            >
              <Info size={15} className="shrink-0" />
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom controls — thumbnail strip + mute ─────────────────── */}
      <div
        className="absolute bottom-4 md:bottom-6 right-4 md:right-10 z-[4] flex items-center gap-3"
      >
        {/* Mute toggle — only when trailer is playing */}
        {current.trailerYoutubeId && (
          <button
            type="button"
            onClick={() => setMuted(m => !m)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="
              hidden md:flex items-center justify-center
              w-8 h-8 rounded-full
              bg-white/[0.06] border border-white/[0.10]
              text-white/60 hover:text-white hover:bg-white/[0.10]
              transition-colors duration-200
            "
          >
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        )}

        {/* Slide indicators */}
        {titles.length > 1 && (
          <div className="flex items-center gap-2">
            {titles.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setIdx(i); setProgressKey(k => k + 1); }}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === idx ? 'true' : undefined}
                className="touch-manipulation"
              >
                <div
                  className="h-[3px] rounded-full transition-all duration-300 overflow-hidden"
                  style={{
                    width: i === idx ? 24 : 8,
                    background: i === idx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
                  }}
                >
                  {i === idx && (
                    <div
                      key={progressKey}
                      className="h-full bg-white/60 rounded-full"
                      style={{
                        animation: `progressFill ${AUTO_MS}ms linear forwards`,
                        transformOrigin: 'left',
                      }}
                    />
                  )}
                </div>
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
              bg-white/[0.06] border border-white/[0.10]
              text-white/60 hover:text-white hover:bg-white/[0.10]
              transition-colors duration-200
            "
          >
            <ChevronRight size={15} />
          </button>
        )}
      </div>
    </section>
  );
});

export default HeroSection;
