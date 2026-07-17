/**
 * HeroCarousel — full-bleed cinematic hero with Ken Burns, smooth slide transitions,
 * and premium CTA buttons.
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
  active,
}: {
  backdropUrl?: string;
  posterUrl?: string;
  active?: boolean;
}) {
  const imgUrl = backdropUrl || posterUrl;
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-[-4%] bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: imgUrl
            ? `url(${imgUrl})`
            : 'linear-gradient(160deg, #1a1c20, #0f1014 75%)',
          backgroundPosition: backdropUrl ? 'center center' : 'top center',
          animation: active ? `kenBurns 28s ease-in-out infinite` : 'none',
        }}
      />
    </div>
  );
});

export default function HeroCarousel({ titles }: { titles: any[] }) {
  const nav = useNavigate();
  const autoplay = useMemo(
    () => Autoplay({ delay: AUTO_ADVANCE_MS, stopOnInteraction: false }),
    []
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 28 }, [autoplay]);
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
  const rating = title.rating || title.imdbRating || title.voteAverage;
  const metaParts: string[] = [];
  if (title.year) metaParts.push(String(title.year));
  if (title.genres?.length) {
    title.genres.slice(0, 3).forEach((g: string) => metaParts.push(g));
  }

  return (
    <section className="relative overflow-hidden" style={{ height: '100vh', minHeight: 520, maxHeight: 920 }}>

      {/* Slide backgrounds */}
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full">
          {titles.map((t, i) => (
            <div key={t.id} className="relative flex-[0_0_100%] h-full overflow-hidden">
              {t.trailerYoutubeId ? (
                <TrailerBg youtubeId={t.trailerYoutubeId} />
              ) : (
                <ImageBg backdropUrl={t.backdropUrl} posterUrl={t.posterUrl} active={i === selectedIdx} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gradient overlays — cinematic depth */}
      {/* Left vignette: content legibility */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(15,16,20,0.90) 0%, rgba(15,16,20,0.55) 35%, rgba(15,16,20,0.10) 65%, transparent 100%)' }} />
      {/* Bottom fade: into content */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(15,16,20,1) 0%, rgba(15,16,20,0.70) 18%, rgba(15,16,20,0.18) 45%, transparent 100%)' }} />
      {/* Top vignette */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(15,16,20,0.55) 0%, transparent 28%)' }} />

      {/* Content overlay — bottom-left */}
      <div className="absolute inset-0 z-[2] flex items-end">
        <div className="w-full max-w-[560px] px-6 md:px-10" style={{ paddingBottom: 116 }}>

          {/* Type badge */}
          {title.type && (
            <span
              key={`${title.id}-badge`}
              className="inline-block mb-3 font-mono text-[10px] tracking-[0.12em] uppercase text-white/50 animate-fadeUp"
              style={{ animationDelay: '0s' }}
            >
              {title.type === 'MOVIE' ? 'Film' : title.type === 'SERIES' ? 'Series' : title.type}
            </span>
          )}

          {/* Title — Bebas Neue */}
          <h1
            key={title.id}
            className="font-display text-white leading-none uppercase animate-fadeUp"
            style={{
              fontSize: 'clamp(48px, 6.5vw, 88px)',
              letterSpacing: '0.04em',
              textShadow: '0 2px 40px rgba(0,0,0,0.6)',
              marginBottom: 10,
              animationDelay: '0.04s',
            }}
          >
            {title.name}
          </h1>

          {/* Meta */}
          <div
            className="flex items-center flex-wrap animate-fadeUp"
            style={{ gap: '6px 0', animationDelay: '0.10s', marginBottom: 12 }}
          >
            {rating && (
              <span className="flex items-center gap-1 mr-3">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#f5c518" aria-hidden>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="font-sans text-[13px] font-semibold text-white">
                  {typeof rating === 'number' ? rating.toFixed(1) : rating}
                </span>
              </span>
            )}
            {metaParts.map((part, i) => (
              <span key={part} className="flex items-center">
                <span className="font-sans text-[13px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
                  {part}
                </span>
                {i < metaParts.length - 1 && (
                  <span className="mx-2 font-sans text-[11px]" style={{ color: 'rgba(255,255,255,0.22)' }}>·</span>
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
                color: 'rgba(255,255,255,0.58)',
                maxWidth: 440,
                marginBottom: 22,
                animationDelay: '0.16s',
              }}
            >
              {title.synopsis}
            </p>
          )}

          {/* CTAs */}
          <div
            className="flex items-center gap-3 animate-fadeUp"
            style={{ animationDelay: '0.22s' }}
          >
            {/* Play — premium white circle */}
            <button
              onClick={() => nav(`/title/${title.id}?play=1`)}
              aria-label={`Play ${title.name}`}
              className="group/play relative flex items-center justify-center shrink-0"
              style={{ width: 50, height: 50 }}
            >
              {/* Ring */}
              <span
                className="absolute inset-0 rounded-full border border-white/30
                  transition-all duration-300 ease-spring
                  group-hover/play:inset-[-5px] group-hover/play:border-white/15"
              />
              {/* Circle */}
              <span
                className="absolute inset-0 rounded-full bg-white
                  transition-all duration-200 ease-spring
                  group-hover/play:bg-white/88 group-hover/play:shadow-[0_0_24px_rgba(255,255,255,0.25)]"
              />
              <Play size={15} className="relative z-10 fill-black text-black ml-[2px]" />
            </button>

            {/* See More — glass pill */}
            <button
              onClick={() => nav(`/title/${title.id}`)}
              className="
                group/more flex items-center gap-2.5
                px-4 py-2.5
                rounded-full
                bg-white/[0.08] border border-white/[0.14]
                backdrop-blur-[10px]
                transition-all duration-200 ease-spring
                hover:bg-white/[0.14] hover:border-white/[0.22]
                hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]
              "
            >
              <span className="
                flex items-center justify-center
                w-5 h-5 rounded-full
                border border-white/40
                transition-colors duration-200
                group-hover/more:border-white/60
              ">
                <Info size={11} className="text-white/70 group-hover/more:text-white/90 transition-colors" />
              </span>
              <span className="font-sans font-medium text-white text-[14px]">See More</span>
            </button>
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {titles.length > 1 && (
        <div
          className="absolute z-[2]"
          style={{
            bottom: 26,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
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
                    borderRadius: 7,
                    width: active ? 80 : 52,
                    height: 46,
                    transition: 'all 0.35s cubic-bezier(.16,1,.3,1)',
                    outline: active ? '2px solid rgba(255,255,255,0.95)' : '1.5px solid rgba(255,255,255,0.18)',
                    outlineOffset: active ? 1.5 : 0,
                    opacity: active ? 1 : 0.5,
                    cursor: 'pointer',
                    border: 'none',
                    background: '#1a1c20',
                    transform: active ? 'scale(1)' : 'scale(0.97)',
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
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.12)' }} />
                  {active && (
                    <span
                      key={progressKey}
                      style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5,
                        background: 'rgba(255,255,255,1)',
                        borderRadius: '0 0 7px 7px',
                        animation: `heroProgress ${AUTO_ADVANCE_MS}ms linear forwards`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Next arrow */}
          <button
            onClick={scrollNext}
            aria-label="Next"
            className="
              flex items-center justify-center
              w-[36px] h-[36px] rounded-full shrink-0
              bg-white/[0.10] border border-white/[0.18]
              backdrop-blur-[10px] text-white
              transition-all duration-200 ease-spring
              hover:bg-white/[0.20] hover:border-white/[0.30]
              hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)]
              active:scale-90
            "
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </section>
  );
}
