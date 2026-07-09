/**
 * HeroCarousel — Embla-powered full-bleed hero carousel.
 * Premium cinematic design with Cormorant Garamond headings.
 */
import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
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
      <div className="absolute inset-0 bg-gradient-to-r from-void/80 via-void/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/35 to-transparent" />
    </div>
  );
});

const ImageBg = memo(function ImageBg({ backdropUrl, colorFrom, colorTo }: { backdropUrl?: string; colorFrom?: string; colorTo?: string }) {
  const fallback = colorFrom && colorTo
    ? `radial-gradient(90% 70% at 12% 0%, ${colorFrom}cc 0%, ${colorTo}88 55%), linear-gradient(160deg, #1a1215, #0B0908 75%)`
    : 'radial-gradient(90% 70% at 12% 0%, #341318 0%, transparent 55%), linear-gradient(160deg, #1a1110, #0B0908 75%)';

  return (
    <div
      className="absolute inset-[-4%] z-0 animate-drift will-change-transform bg-cover bg-center"
      style={{
        backgroundImage: backdropUrl
          ? `linear-gradient(160deg, rgba(11,9,8,0.45), rgba(11,9,8,0.82) 70%), url(${backdropUrl})`
          : fallback,
      }}
    />
  );
});

export default function HeroCarousel({ titles }: { titles: any[] }) {
  const nav = useNavigate();
  const autoplay = useMemo(() => Autoplay({ delay: AUTO_ADVANCE_MS, stopOnInteraction: false }), []);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 22 }, [autoplay]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIdx(emblaApi.selectedScrollSnap());
    setProgress(0);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!titles.length) return;
    if (progressRef.current) clearInterval(progressRef.current);
    const step = 100 / (AUTO_ADVANCE_MS / 50);
    progressRef.current = setInterval(() => setProgress(p => Math.min(p + step, 100)), 50);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [selectedIdx, titles.length]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo   = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  if (!titles.length) return null;

  const title = titles[selectedIdx];

  return (
    <section className="relative h-[68vh] min-h-[480px] max-h-[780px] overflow-hidden">

      {/* Slides */}
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full">
          {titles.map((t) => (
            <div key={t.id} className="relative flex-[0_0_100%] h-full overflow-hidden">
              {t.trailerYoutubeId
                ? <TrailerBg youtubeId={t.trailerYoutubeId} />
                : <ImageBg backdropUrl={t.backdropUrl} colorFrom={t.posterColorFrom} colorTo={t.posterColorTo} />
              }
            </div>
          ))}
        </div>
      </div>

      {/* Scrim layers */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-void/25 to-void pointer-events-none" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-void/65 via-void/20 to-transparent pointer-events-none" />

      {/* Noise grain */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundSize: '200px 200px' }}
      />

      {/* Content overlay */}
      <div className="absolute inset-0 z-[2] flex items-end px-5 md:px-10">
        <div className="w-full max-w-[580px] space-y-4 pb-14">

          {/* Eyebrow */}
          <div className="font-mono text-[10px] tracking-[0.22em] text-ink-dim uppercase flex items-center gap-2">
            <span className="w-5 h-px bg-maroon-bright/80" />
            {selectedIdx === 0 ? 'Featured' : `No. ${selectedIdx + 1}`}
          </div>

          {/* Title */}
          <h1
            key={title.id}
            className="font-serif font-semibold text-[clamp(36px,7.5vw,68px)] leading-[0.96] tracking-tight text-ink animate-fadeUp drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]"
          >
            {title.name}
          </h1>

          {/* Synopsis */}
          <p
            className="text-ink-dim text-[13.5px] leading-relaxed max-w-[420px] line-clamp-2 animate-fadeUp"
            style={{ animationDelay: '0.08s' }}
          >
            {title.synopsis}
          </p>

          {/* Meta strip */}
          <div
            className="flex items-center gap-3 flex-wrap animate-fadeUp"
            style={{ animationDelay: '0.16s' }}
          >
            <div className="font-mono text-[10.5px] text-ink-dim flex gap-2 items-center">
              {title.year && <span>{title.year}</span>}
              {title.runtimeMinutes ? (
                <>
                  <span className="text-ink-faint/50">·</span>
                  <span>{Math.floor(title.runtimeMinutes / 60)}h {title.runtimeMinutes % 60}m</span>
                </>
              ) : null}
              <span className="text-ink-faint/50">·</span>
              <span className="capitalize text-ink-faint">{title.type?.toLowerCase()}</span>
            </div>
            {title.genres?.slice(0, 3).map((g: string) => (
              <span
                key={g}
                className="font-mono text-[9.5px] text-ink-faint border border-line/50 rounded-full px-2 py-0.5 bg-white/[0.03]"
              >
                {g}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div
            className="flex gap-2.5 animate-fadeUp"
            style={{ animationDelay: '0.24s' }}
          >
            <button
              onClick={() => nav(`/title/${title.id}`)}
              className="
                flex items-center gap-2
                bg-ink text-void font-sans font-semibold text-[13px]
                px-5 py-2.5 rounded-full
                active:scale-[0.97] transition-transform duration-150
                shadow-[0_4px_16px_-4px_rgba(245,240,236,0.3)]
                hover:bg-ink/90
              "
            >
              <Play size={12} fill="currentColor" /> Play
            </button>
            <button
              onClick={() => nav(`/title/${title.id}`)}
              className="
                flex items-center gap-2
                bg-white/[0.08] backdrop-blur-sm text-ink font-sans font-medium text-[13px]
                px-5 py-2.5 rounded-full
                border border-white/[0.12]
                hover:bg-white/[0.12] transition-colors duration-150
              "
            >
              <Info size={13} /> More info
            </button>
          </div>

          {/* Dot indicators */}
          {titles.length > 1 && (
            <div
              className="flex items-center gap-2.5 animate-fadeUp"
              style={{ animationDelay: '0.32s' }}
            >
              <button onClick={scrollPrev} className="text-ink-faint/60 hover:text-ink transition-colors">
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-1.5 items-center">
                {titles.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollTo(i)}
                    className="relative h-[2.5px] rounded-full overflow-hidden transition-all duration-300"
                    style={{ width: i === selectedIdx ? 24 : 8, background: 'rgba(255,255,255,0.18)' }}
                  >
                    {i === selectedIdx && (
                      <span
                        className="absolute inset-y-0 left-0 bg-ink/80 rounded-full"
                        style={{ width: `${progress}%`, transition: 'width 50ms linear' }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <button onClick={scrollNext} className="text-ink-faint/60 hover:text-ink transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
