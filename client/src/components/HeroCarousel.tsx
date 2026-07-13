/**
 * HeroCarousel — bingr.one style full-bleed hero.
 *
 * Layout matches bingr exactly:
 * - Full-screen backdrop (movie image covers entire area)
 * - Bottom-left: bold UPPERCASE title text
 * - Meta row: ★ rating · year · Genre · Genre
 * - Description text
 * - Play button (white filled circle + dark triangle) + "See More" text button
 * - Thumbnail strip centered at the bottom
 * - Right-side arrow button
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
      {/* Dark gradient overlays — bingr style */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
    </div>
  );
});

const ImageBg = memo(function ImageBg({
  backdropUrl,
  posterUrl,
  colorFrom,
  colorTo,
}: {
  backdropUrl?: string;
  posterUrl?: string;
  colorFrom?: string;
  colorTo?: string;
}) {
  const imgUrl = backdropUrl || posterUrl;
  const fallback =
    colorFrom && colorTo
      ? `radial-gradient(90% 70% at 12% 0%, ${colorFrom}cc 0%, ${colorTo}88 55%), linear-gradient(160deg, #0a0a0a, #000 75%)`
      : 'radial-gradient(90% 70% at 12% 0%, #1a1a1a 0%, transparent 55%), linear-gradient(160deg, #111, #000 75%)';

  return (
    <div
      className="absolute inset-0 z-0 bg-cover bg-center will-change-transform"
      style={{
        backgroundImage: imgUrl
          ? `url(${imgUrl})`
          : fallback,
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

  // Build bingr-style meta: year · Genre · Genre
  const metaParts: string[] = [];
  if (title.year) metaParts.push(String(title.year));
  if (title.genres?.length) {
    title.genres.slice(0, 3).forEach((g: string) => metaParts.push(g));
  }

  return (
    <section className="relative h-[100vh] min-h-[500px] max-h-[900px] overflow-hidden">

      {/* ── Slide backgrounds ───────────────────────────────────── */}
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full">
          {titles.map((t) => (
            <div key={t.id} className="relative flex-[0_0_100%] h-full overflow-hidden">
              {t.trailerYoutubeId ? (
                <TrailerBg youtubeId={t.trailerYoutubeId} />
              ) : (
                <ImageBg
                  backdropUrl={t.backdropUrl}
                  posterUrl={t.posterUrl}
                  colorFrom={t.posterColorFrom}
                  colorTo={t.posterColorTo}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Gradient overlays — bingr style ─────────────────────── */}
      {/* Left-side gradient so content reads on bright backdrops */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/70 via-black/25 to-transparent pointer-events-none" />
      {/* Bottom gradient so thumbnail strip and content area reads */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
      {/* Subtle top vignette */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

      {/* ── Content overlay — bottom-left ───────────────────────── */}
      <div className="absolute inset-0 z-[2] flex items-end">
        <div className="w-full max-w-[560px] px-5 md:px-8 pb-[100px] md:pb-[110px] space-y-3">

          {/* Title — bingr uses large bold uppercase text */}
          <h1
            key={title.id}
            className="font-sans font-black text-white leading-[1.0] tracking-wide uppercase animate-fadeUp"
            style={{
              fontSize: 'clamp(30px, 5.5vw, 62px)',
              textShadow: '0 2px 20px rgba(0,0,0,0.6)',
            }}
          >
            {title.name}
          </h1>

          {/* Meta — bingr style: ★ · year · Genre · Genre */}
          <div
            className="flex items-center gap-2 flex-wrap animate-fadeUp"
            style={{ animationDelay: '0.07s' }}
          >
            {/* Star rating dot — use gold star as visual anchor */}
            <span className="text-[#f5c518] text-[13px] font-bold flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            {metaParts.map((part, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-[#555] text-[12px]">·</span>}
                <span
                  className="font-sans text-[13px] text-[#ccc]"
                  style={{ fontWeight: i === 0 ? 500 : 400 }}
                >
                  {part}
                </span>
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <p
            className="font-sans text-[13.5px] text-[#bbb] leading-relaxed max-w-[420px] line-clamp-3 animate-fadeUp"
            style={{ animationDelay: '0.14s' }}
          >
            {title.synopsis}
          </p>

          {/* CTAs — bingr style */}
          <div
            className="flex items-center gap-3 animate-fadeUp"
            style={{ animationDelay: '0.21s' }}
          >
            {/* Play — white filled circle */}
            <button
              onClick={() => nav(`/title/${title.id}?play=1`)}
              aria-label={`Play ${title.name}`}
              className="
                flex items-center justify-center
                w-[46px] h-[46px] rounded-full
                bg-white
                hover:bg-white/90 active:scale-95
                transition-all duration-150
                shadow-[0_4px_20px_rgba(255,255,255,0.2)]
              "
            >
              <Play size={17} className="text-black fill-black ml-[2px]" />
            </button>

            {/* See More — bingr text button */}
            <button
              onClick={() => nav(`/title/${title.id}`)}
              className="
                flex items-center gap-2
                font-sans text-[14px] text-white font-medium
                hover:text-white/80 active:scale-95
                transition-all duration-150
              "
            >
              <span className="flex items-center justify-center w-[26px] h-[26px] rounded-full border border-white/50">
                <Info size={13} className="text-white/80" />
              </span>
              See More
            </button>
          </div>
        </div>
      </div>

      {/* ── Thumbnail strip — bingr: centered at bottom ─────────── */}
      {titles.length > 1 && (
        <div className="absolute z-[2] bottom-5 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {/* Thumbnail list */}
          <div className="flex items-center gap-1.5">
            {titles.slice(0, 10).map((t, i) => {
              const active = i === selectedIdx;
              return (
                <button
                  key={t.id}
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to ${t.name}`}
                  aria-current={active}
                  className={`
                    relative shrink-0 overflow-hidden rounded-[6px]
                    transition-all duration-300 ease-spring
                    ${active
                      ? 'w-[72px] h-[42px] ring-2 ring-white shadow-[0_4px_16px_rgba(0,0,0,0.6)]'
                      : 'w-[48px] h-[42px] ring-1 ring-white/20 opacity-50 hover:opacity-80'}
                  `}
                >
                  {t.backdropUrl || t.posterUrl ? (
                    <img
                      src={t.backdropUrl || t.posterUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${t.posterColorFrom || '#1a1a1a'}, ${t.posterColorTo || '#000'})`,
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20" />
                  {active && (
                    <span
                      key={progressKey}
                      className="absolute inset-x-0 bottom-0 h-[2px] bg-white"
                      style={{ animation: `heroProgress ${AUTO_ADVANCE_MS}ms linear forwards` }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right arrow — bingr's white circle arrow */}
          <button
            onClick={scrollNext}
            aria-label="Next"
            className="
              flex items-center justify-center
              w-[34px] h-[34px] rounded-full
              bg-white/10 border border-white/20 backdrop-blur-sm
              text-white hover:bg-white/20
              transition-colors duration-150
            "
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
