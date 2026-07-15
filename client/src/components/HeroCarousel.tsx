/**
 * HeroCarousel — exact bingr.one style full-bleed hero.
 *
 * Pixel-perfect match:
 * - Full-viewport backdrop behind full-bleed image
 * - Bebas Neue (font-display) UPPERCASE title — bingr's signature font
 * - Meta row: ★ rating · year · Genre · Genre
 * - White circle Play button + dark-pill "See More" button
 * - Centered landscape thumbnail strip at bottom with right arrow
 */
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

const AUTO_ADVANCE_MS = 10000;

const TrailerBg = memo(function TrailerBg({ youtubeId }: { youtubeId: string }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <iframe
        className="absolute w-[177.78vh] min-w-full h-[56.25vw] min-h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&modestbranding=1&playsinline=1`}
        allow="autoplay; encrypted-media"
        title="trailer"
      />
    </div>
  );
});

const ImageBg = memo(function ImageBg({
  backdropUrl,
  posterUrl,
}: {
  backdropUrl?: string;
  posterUrl?: string;
}) {
  const imgUrl = backdropUrl || posterUrl;
  return (
    <div
      className="absolute inset-0 z-0 bg-cover bg-center will-change-transform"
      style={{
        backgroundImage: imgUrl
          ? `url(${imgUrl})`
          : 'linear-gradient(160deg, #1a1c20, #0f1014 75%)',
        backgroundPosition: backdropUrl ? 'center center' : 'top center',
      }}
    />
  );
});

export default function HeroCarousel({ titles }: { titles: any[] }) {
  const nav = useNavigate();
  const autoplay = useMemo(
    () => Autoplay({ delay: AUTO_ADVANCE_MS, stopOnInteraction: false }),
    []
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 22 }, [autoplay]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [progressKey, setProgressKey] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIdx(emblaApi.selectedScrollSnap());
    setProgressKey(k => k + 1);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo   = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  if (!titles.length) return null;

  const title = titles[selectedIdx];

  // bingr meta: ★ rating · year · Genre · Genre
  const rating = title.rating || title.imdbRating || title.voteAverage;
  const metaParts: string[] = [];
  if (title.year) metaParts.push(String(title.year));
  if (title.genres?.length) {
    title.genres.slice(0, 3).forEach((g: string) => metaParts.push(g));
  }

  return (
    <section className="relative overflow-hidden" style={{ height: '100vh', minHeight: 500, maxHeight: 900 }}>

      {/* ── Slide backgrounds ─────────────────────────────────── */}
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full">
          {titles.map((t) => (
            <div key={t.id} className="relative flex-[0_0_100%] h-full overflow-hidden">
              {t.trailerYoutubeId ? (
                <TrailerBg youtubeId={t.trailerYoutubeId} />
              ) : (
                <ImageBg backdropUrl={t.backdropUrl} posterUrl={t.posterUrl} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Gradient overlays — bingr exact ──────────────────── */}
      {/* Left: content legibility */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(15,16,20,0.80) 0%, rgba(15,16,20,0.40) 40%, rgba(15,16,20,0.05) 70%, transparent 100%)' }} />
      {/* Bottom: thumbnail strip + content */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(15,16,20,1) 0%, rgba(15,16,20,0.55) 20%, rgba(15,16,20,0.10) 50%, transparent 100%)' }} />
      {/* Top: subtle vignette */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(15,16,20,0.45) 0%, transparent 25%)' }} />

      {/* ── Content overlay — bottom-left ─────────────────────── */}
      <div className="absolute inset-0 z-[2] flex items-end">
        <div className="w-full max-w-[540px] px-6 md:px-8" style={{ paddingBottom: 110 }}>

          {/* Title — Bebas Neue (bingr's display font) */}
          <h1
            key={title.id}
            className="font-display text-white leading-none uppercase animate-fadeUp"
            style={{
              fontSize: 'clamp(52px, 7vw, 86px)',
              letterSpacing: '0.04em',
              textShadow: '0 2px 30px rgba(0,0,0,0.5)',
              marginBottom: 10,
            }}
          >
            {title.name}
          </h1>

          {/* Meta — ★ rating · year · Genre · Genre */}
          <div
            className="flex items-center flex-wrap animate-fadeUp"
            style={{ gap: '6px 0', animationDelay: '0.07s', marginBottom: 10 }}
          >
            {/* Star + rating */}
            <span className="flex items-center gap-1 mr-2">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#f5c518">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {rating && (
                <span className="font-sans text-[13px] font-semibold text-white">
                  {typeof rating === 'number' ? rating.toFixed(1) : rating}
                </span>
              )}
            </span>
            {/* Year + genres */}
            {metaParts.map((part, i) => (
              <span key={part} className="flex items-center">
                <span className="font-sans text-[13px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {part}
                </span>
                {i < metaParts.length - 1 && (
                  <span className="mx-2 font-sans text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
                )}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          {title.synopsis && (
            <p
              className="font-sans leading-relaxed line-clamp-3 animate-fadeUp"
              style={{
                fontSize: 13.5,
                color: 'rgba(255,255,255,0.6)',
                maxWidth: 420,
                marginBottom: 18,
                animationDelay: '0.14s',
              }}
            >
              {title.synopsis}
            </p>
          )}

          {/* CTAs — bingr exact */}
          <div
            className="flex items-center gap-3 animate-fadeUp"
            style={{ animationDelay: '0.21s' }}
          >
            {/* Play — white filled circle, ~46px */}
            <button
              onClick={() => nav(`/title/${title.id}?play=1`)}
              aria-label={`Play ${title.name}`}
              style={{
                width: 46, height: 46,
                borderRadius: '50%',
                background: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s, transform 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.88)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
            >
              <Play size={16} style={{ color: '#000', fill: '#000', marginLeft: 2 }} />
            </button>

            {/* See More — dark pill with info circle, bingr exact */}
            <button
              onClick={() => nav(`/title/${title.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px 10px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            >
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24,
                borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.45)',
              }}>
                <Info size={12} style={{ color: 'rgba(255,255,255,0.75)' }} />
              </span>
              <span className="font-sans font-medium text-white" style={{ fontSize: 14 }}>
                See More
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Thumbnail strip — bingr: centered at bottom ──────────── */}
      {titles.length > 1 && (
        <div
          className="absolute z-[2]"
          style={{
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* Thumbnails */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {titles.slice(0, 10).map((t, i) => {
              const active = i === selectedIdx;
              return (
                <button
                  key={t.id}
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to ${t.name}`}
                  aria-current={active}
                  style={{
                    position: 'relative',
                    flexShrink: 0,
                    overflow: 'hidden',
                    borderRadius: 6,
                    width: active ? 76 : 52,
                    height: 44,
                    transition: 'all 0.3s cubic-bezier(.16,1,.3,1)',
                    outline: active ? '2px solid rgba(255,255,255,0.9)' : '1px solid rgba(255,255,255,0.2)',
                    outlineOffset: active ? 1 : 0,
                    opacity: active ? 1 : 0.55,
                    cursor: 'pointer',
                    border: 'none',
                    background: '#1a1c20',
                  }}
                >
                  {(t.backdropUrl || t.posterUrl) && (
                    <img
                      src={t.backdropUrl || t.posterUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />
                  {active && (
                    <span
                      key={progressKey}
                      style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                        background: 'rgba(255,255,255,0.9)',
                        animation: `heroProgress ${AUTO_ADVANCE_MS}ms linear forwards`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right arrow — bingr's white circle */}
          <button
            onClick={scrollNext}
            aria-label="Next"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              cursor: 'pointer',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
