/**
 * HeroCarousel — bingr.one-inspired layout with our void/white design system.
 * - No type badge; straight to large display title
 * - Inline dot-separated metadata: ★ rating · year · genre · genre
 * - Bigger centered thumbnail strip at bottom
 * - Floating right-edge "Next" arrow (bingr style, desktop)
 * - Ken Burns desktop-only; no backdrop-blur on mobile
 */
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

const AUTO_ADVANCE_MS = 10000;

const TrailerBg = memo(function TrailerBg({ youtubeId, muted }: { youtubeId: string; muted: boolean }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <iframe
        key={`${youtubeId}-${muted ? 'muted' : 'unmuted'}`}
        className="absolute w-[177.78vh] min-w-full h-[56.25vw] min-h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&modestbranding=1&playsinline=1`}
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
      {/* ken-burns disabled on mobile via CSS media query in index.css */}
      <div
        className={`absolute inset-[-4%] bg-cover bg-center${active ? ' ken-burns' : ''}`}
        style={{
          backgroundImage: imgUrl
            ? `url(${imgUrl})`
            : 'linear-gradient(160deg, #1a1c20, #0f1014 75%)',
          backgroundPosition: backdropUrl ? 'center center' : 'top center',
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
  const [isMuted, setIsMuted] = useState(true);

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

  // Flat inline metadata array: [year, genre, genre, ...]
  const metaItems: string[] = [];
  if (title.year) metaItems.push(String(title.year));
  if (title.genres?.length) title.genres.slice(0, 3).forEach((g: string) => metaItems.push(g));

  return (
    <section className="relative overflow-hidden" style={{ height: '100vh', minHeight: 520, maxHeight: 920 }}>

      {/* ── Slide backgrounds ─────────────────────────────────── */}
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full">
          {titles.map((t, i) => (
            <div key={t.id} className="relative flex-[0_0_100%] h-full overflow-hidden">
              {t.trailerYoutubeId
                ? <TrailerBg youtubeId={t.trailerYoutubeId} muted={isMuted} />
                : <ImageBg backdropUrl={t.backdropUrl} posterUrl={t.posterUrl} active={i === selectedIdx} />
              }
            </div>
          ))}
        </div>
      </div>

      {/* ── Gradients — bingr style: strong left + strong bottom ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(15,16,20,0.95) 0%, rgba(15,16,20,0.65) 30%, rgba(15,16,20,0.18) 58%, transparent 100%)' }} />
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(15,16,20,1) 0%, rgba(15,16,20,0.75) 16%, rgba(15,16,20,0.18) 40%, transparent 100%)' }} />
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(15,16,20,0.42) 0%, transparent 22%)' }} />

      {/* ── Info panel — bottom-left ───────────────────────────── */}
      <div className="absolute inset-0 z-[2] flex items-end">
        <div className="w-full max-w-[520px] px-5 md:px-10 hero-content-pb">

          {/* Title — straight to display text, no badge */}
          <h1
            key={title.id}
            className="font-display text-white leading-[0.94] uppercase animate-fadeUp"
            style={{
              fontSize: 'clamp(34px, 5vw, 76px)',
              letterSpacing: '0.05em',
              textShadow: '0 2px 40px rgba(0,0,0,0.55)',
              marginBottom: 13,
            }}
          >
            {title.name}
          </h1>

          {/* ★ 7.5 · 2026 · Adventure · Action */}
          <div
            className="flex items-center flex-wrap animate-fadeUp"
            style={{ gap: 0, marginBottom: 14, animationDelay: '0.06s' }}
          >
            {rating && (
              <span className="flex items-center gap-[5px] mr-[10px]">
                <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden>
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                    fill="#f5c518"
                  />
                </svg>
                <span className="font-sans text-[13px] font-semibold text-white">
                  {typeof rating === 'number' ? rating.toFixed(1) : rating}
                </span>
              </span>
            )}
            {metaItems.map((item, i) => (
              <span key={item + i} className="flex items-center">
                <span className="font-sans text-[13px]" style={{ color: 'rgba(255,255,255,0.58)' }}>
                  {item}
                </span>
                {i < metaItems.length - 1 && (
                  <span className="mx-[9px] font-sans text-[11px]" style={{ color: 'rgba(255,255,255,0.26)' }}>·</span>
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
                color: 'rgba(255,255,255,0.54)',
                maxWidth: 420,
                marginBottom: 24,
                animationDelay: '0.12s',
              }}
            >
              {title.synopsis}
            </p>
          )}

          {/* CTA buttons */}
          <div className="flex items-center gap-3 animate-fadeUp" style={{ animationDelay: '0.18s' }}>

            {/* Play — filled white circle */}
            <button
              onClick={() => nav(`/title/${title.id}?play=1`)}
              aria-label={`Play ${title.name}`}
              className="group/play relative flex items-center justify-center shrink-0 active:scale-90 transition-transform duration-150"
              style={{ width: 52, height: 52 }}
            >
              <span className="absolute inset-0 rounded-full border border-white/25 md:transition-[inset,border-color] md:duration-300 md:ease-spring md:group-hover/play:inset-[-6px] md:group-hover/play:border-white/12" />
              <span className="absolute inset-0 rounded-full bg-white md:group-hover/play:bg-white/90 transition-colors duration-150" />
              <Play size={16} className="relative z-10 fill-black text-black ml-[2px]" />
            </button>

            {/* See More — glass pill */}
            <button
              onClick={() => nav(`/title/${title.id}`)}
              aria-label={`More info about ${title.name}`}
              className="
                flex items-center gap-2.5
                px-5 py-[11px] rounded-full
                bg-white/[0.09] border border-white/[0.14]
                active:bg-white/[0.18] transition-colors duration-150
                md:backdrop-blur-[10px]
                md:hover:bg-white/[0.14] md:hover:border-white/[0.24]
              "
            >
              <span className="flex items-center justify-center w-[19px] h-[19px] rounded-full border border-white/35 shrink-0">
                <Info size={10} className="text-white/65" />
              </span>
              <span className="font-sans font-medium text-white text-[14px]">See More</span>
            </button>

            {/* Mute / unmute — only when a trailer is available (bingr style, right of CTAs) */}
            {title.trailerYoutubeId && (
              <button
                onClick={() => setIsMuted(m => !m)}
                aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
                className="
                  ml-auto flex items-center justify-center
                  w-[40px] h-[40px] rounded-full
                  bg-white/[0.08] border border-white/[0.14]
                  active:scale-90 transition-[transform,background-color] duration-150
                  hover:bg-white/[0.14]
                "
              >
                {isMuted
                  ? <VolumeX size={15} className="text-white/70" />
                  : <Volume2 size={15} className="text-white" />
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Floating Next arrow — far right, desktop only (bingr) ── */}
      <button
        onClick={scrollNext}
        aria-label="Next title"
        className="
          hidden md:flex items-center justify-center
          absolute right-5 top-1/2 -translate-y-1/2 z-[3]
          w-[42px] h-[42px] rounded-full
          border border-white/[0.16] text-white
          bg-white/[0.08] backdrop-blur-[10px]
          hover:bg-white/[0.18] hover:border-white/[0.28]
          transition-[background-color,border-color] duration-200
          active:scale-90
        "
      >
        <ChevronRight size={18} />
      </button>

      {/* ── Thumbnail strip — bottom-center (bingr style) ──────── */}
      {titles.length > 1 && (
        <div
          className="hero-thumbstrip absolute z-[2]"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            maxWidth: 'calc(100vw - 120px)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {titles.slice(0, 12).map((t, i) => {
            const active = i === selectedIdx;
            return (
              <button
                key={t.id}
                onClick={() => scrollTo(i)}
                aria-label={`Go to ${t.name}`}
                aria-current={active ? 'true' : undefined}
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  overflow: 'hidden',
                  borderRadius: 8,
                  width: active ? 96 : 62,
                  height: 54,
                  transition: 'width 0.38s cubic-bezier(.16,1,.3,1), opacity 0.25s ease',
                  outline: active
                    ? '2px solid rgba(255,255,255,0.95)'
                    : '1.5px solid rgba(255,255,255,0.15)',
                  outlineOffset: active ? 2 : 0,
                  opacity: active ? 1 : 0.45,
                  cursor: 'pointer',
                  border: 'none',
                  background: '#1a1c20',
                }}
              >
                {(t.backdropUrl || t.posterUrl) && (
                  <img
                    src={t.backdropUrl || t.posterUrl}
                    alt={t.name}
                    loading="lazy"
                    decoding="async"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.14)' }} />
                {active && (
                  <span
                    key={progressKey}
                    style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5,
                      background: 'rgba(255,255,255,1)',
                      borderRadius: '0 0 8px 8px',
                      animation: `heroProgress ${AUTO_ADVANCE_MS}ms linear forwards`,
                    }}
                  />
                )}
              </button>
            );
          })}

          {/* Mobile-only next arrow (at end of strip) */}
          <button
            onClick={scrollNext}
            aria-label="Next title"
            className="
              md:hidden flex items-center justify-center shrink-0
              w-[36px] h-[36px] rounded-full
              border border-white/[0.16] text-white
              bg-white/[0.10] active:scale-90
            "
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </section>
  );
}
