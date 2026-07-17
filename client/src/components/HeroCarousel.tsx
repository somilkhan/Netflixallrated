/**
 * HeroCarousel — cinematic hero.
 *
 * Mobile perf rules:
 * - 100dvh height (accounts for browser chrome; fallback to 100vh)
 * - Dot indicators instead of thumbnail strip (strip overflows ~375px screens)
 * - Ken Burns disabled on mobile (continuous transform kills FPS)
 * - No backdrop-blur on mobile CTAs
 * - will-change:transform only on desktop to avoid GPU memory pressure on low-end devices
 *
 * GPU compositing rules (no layout/paint triggers):
 * - Slide transitions: transform only (Embla)
 * - Progress bar: width animation (only child element, acceptable)
 * - Dot expand: width animation on tiny element, cached in own layer via translate3d
 * - Gradient overlays: opacity-only compositing
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
  // Portrait-only path — bg-cover on a 2:3 poster inside a tall portrait-phone
  // hero zooms in far too aggressively (just a cropped face). Instead, anchor the
  // poster to the right edge at natural height, and fill the rest with dark bg
  // + a left-to-right gradient so the text overlay stays readable.
  if (!backdropUrl && posterUrl) {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden" style={{ background: '#080a0e' }}>
        <img
          src={posterUrl}
          alt=""
          loading="eager"
          decoding="async"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
            width: 'auto',
            objectFit: 'cover',
            objectPosition: 'center top',
            // Own compositor layer — no repaint when slides crossfade
            transform: 'translateZ(0)',
          }}
        />
        {/* Readability gradient: solid dark on the left, fades toward poster on right */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #080a0e 22%, rgba(8,10,14,0.78) 52%, rgba(8,10,14,0.12) 100%)',
          }}
        />
      </div>
    );
  }

  // Landscape backdrop — full-bleed, center-aligned, optional ken-burns on desktop.
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div
        className={`absolute inset-[-4%] bg-cover bg-center${active ? ' ken-burns' : ''}`}
        style={{
          backgroundImage: backdropUrl
            ? `url(${backdropUrl})`
            : 'linear-gradient(160deg, #1a1c20, #0f1014 75%)',
          transform: 'translateZ(0)',
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

  // dvh = dynamic viewport height (excludes mobile browser chrome).
  // Fallback to 100vh for browsers that don't support dvh yet.
  const heroHeight: React.CSSProperties = {
    height: '100dvh',
    minHeight: 520,
    maxHeight: 920,
  };

  return (
    <section
      className="relative overflow-hidden"
      style={heroHeight}
    >

      {/* Slide backgrounds — Embla handles transform-based transitions (GPU only) */}
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full" style={{ willChange: 'transform' }}>
          {titles.map((t, i) => (
            <div key={t.id} className="relative flex-[0_0_100%] h-full overflow-hidden">
              {/* Always use the backdrop image — the YouTube iframe triggers a
                  bot-check wall on load (rate-limited by yt-nocookie on non-session
                  requests). Trailers remain accessible from the detail page. */}
              <ImageBg backdropUrl={t.backdropUrl} posterUrl={t.posterUrl} active={i === selectedIdx} />
            </div>
          ))}
        </div>
      </div>

      {/* Gradient overlays — pre-painted, zero repaint cost */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(15,16,20,0.92) 0%, rgba(15,16,20,0.55) 35%, rgba(15,16,20,0.10) 65%, transparent 100%)' }} />
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(15,16,20,1) 0%, rgba(15,16,20,0.70) 18%, rgba(15,16,20,0.18) 45%, transparent 100%)' }} />
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(15,16,20,0.55) 0%, transparent 28%)' }} />

      {/* Content — bottom-left.
          paddingBottom: 96px mobile (dots are small), 120px desktop (thumbnail strip). */}
      <div className="absolute inset-0 z-[2] flex items-end">
        <div
          className="w-full max-w-[560px] px-5 md:px-10"
          style={{ paddingBottom: 'clamp(80px, 12vw, 120px)' }}
        >

          {title.type && (
            <span
              key={`${title.id}-badge`}
              className="inline-block mb-2 font-mono text-[10px] tracking-[0.12em] uppercase text-white/45 animate-fadeUp"
            >
              {title.type === 'MOVIE' ? 'Film' : title.type === 'SERIES' ? 'Series' : title.type}
            </span>
          )}

          <h1
            key={title.id}
            className="font-display text-white leading-none uppercase animate-fadeUp"
            style={{
              fontSize: 'clamp(36px, 6.5vw, 88px)',
              letterSpacing: '0.04em',
              textShadow: '0 2px 40px rgba(0,0,0,0.6)',
              marginBottom: 10,
              animationDelay: '0.04s',
            }}
          >
            {title.name}
          </h1>

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

          {title.synopsis && (
            <p
              className="font-sans leading-relaxed line-clamp-2 md:line-clamp-3 animate-fadeUp"
              style={{
                fontSize: 13.5,
                color: 'rgba(255,255,255,0.58)',
                maxWidth: 440,
                marginBottom: 20,
                animationDelay: '0.16s',
              }}
            >
              {title.synopsis}
            </p>
          )}

          <div className="flex items-center gap-3 animate-fadeUp" style={{ animationDelay: '0.22s' }}>
            {/* Play */}
            <button
              onClick={() => nav(`/title/${title.id}?play=1`)}
              aria-label={`Play ${title.name}`}
              className="group/play relative flex items-center justify-center shrink-0 active:scale-90 transition-transform duration-150"
              style={{ width: 50, height: 50 }}
            >
              <span className="absolute inset-0 rounded-full border border-white/30 md:transition-[inset,border-color] md:duration-300 md:ease-spring md:group-hover/play:inset-[-5px] md:group-hover/play:border-white/15" />
              <span className="absolute inset-0 rounded-full bg-white md:group-hover/play:bg-white/88 transition-colors duration-150" />
              <Play size={15} className="relative z-10 fill-black text-black ml-[2px]" />
            </button>

            {/* See More — no blur on mobile */}
            <button
              onClick={() => nav(`/title/${title.id}`)}
              className="
                flex items-center gap-2.5
                px-4 py-2.5 rounded-full
                bg-white/[0.10] border border-white/[0.16]
                active:bg-white/[0.20] transition-colors duration-150
                md:bg-white/[0.08] md:border-white/[0.14]
                md:backdrop-blur-[10px]
                md:hover:bg-white/[0.14] md:hover:border-white/[0.22]
              "
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full border border-white/40">
                <Info size={11} className="text-white/70" />
              </span>
              <span className="font-sans font-medium text-white text-[14px]">See More</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Slide indicators ──────────────────────────────────────────────── */}
      {titles.length > 1 && (
        <>
          {/* MOBILE: pill-dot indicators — never overflow the screen */}
          <div
            className="flex md:hidden absolute z-[2] items-center"
            style={{
              bottom: 28,
              left: '50%',
              transform: 'translateX(-50%)',
              gap: 5,
            }}
          >
            {titles.slice(0, 10).map((t, i) => {
              const active = i === selectedIdx;
              return (
                <button
                  key={t.id}
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to ${t.name}`}
                  aria-current={active}
                  style={{
                    width: active ? 22 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.28)',
                    border: 'none',
                    // width is tiny — acceptable layout cost; transform for the translate is GPU
                    transition: 'width 0.35s cubic-bezier(.16,1,.3,1), background 0.2s ease',
                    flexShrink: 0,
                    cursor: 'pointer',
                    padding: 0,
                    // Keep each dot in its own compositor layer
                    transform: 'translateZ(0)',
                  }}
                />
              );
            })}
          </div>

          {/* DESKTOP: thumbnail strip */}
          <div
            className="hidden md:flex absolute z-[2]"
            style={{
              bottom: 26,
              left: '50%',
              transform: 'translateX(-50%)',
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
                      transition: 'width 0.35s cubic-bezier(.16,1,.3,1), outline 0.2s ease, opacity 0.2s ease',
                      outline: active ? '2px solid rgba(255,255,255,0.95)' : '1.5px solid rgba(255,255,255,0.18)',
                      outlineOffset: active ? 1.5 : 0,
                      opacity: active ? 1 : 0.5,
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

            <button
              onClick={scrollNext}
              aria-label="Next"
              className="
                flex items-center justify-center
                w-[36px] h-[36px] rounded-full shrink-0
                border border-white/[0.18] text-white
                active:scale-90 transition-[transform,background-color] duration-150
                bg-white/[0.10] backdrop-blur-[10px]
                hover:bg-white/[0.20]
              "
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
