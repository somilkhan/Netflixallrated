/**
 * HeroCarousel — Embla-powered full-bleed hero carousel.
 * Each slide carries its own background (trailer iframe or backdrop image).
 * Content overlay reads from the selected index tracked via emblaApi.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

const STREAMRIP = 'https://streamrip-website-production.up.railway.app';
const AUTO_ADVANCE_MS = 10000;

function getEmbedSrc(title: any): string | null {
  if (!title?.tmdbId) return null;
  if (title.type === 'MOVIE') return `${STREAMRIP}/movie/${title.tmdbId}`;
  if (title.type === 'SERIES') return `${STREAMRIP}/tv/${title.tmdbId}/1/1`;
  if (title.type === 'ANIME') return `${STREAMRIP}/anime/${title.tmdbId}/1`;
  return null;
}

function TrailerBg({ youtubeId }: { youtubeId: string }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <iframe
        className="absolute w-[177.78vh] min-w-full h-[56.25vw] min-h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&modestbranding=1&playsinline=1`}
        allow="autoplay; encrypted-media"
        title="trailer"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-void via-void/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-void/20" />
    </div>
  );
}

function ImageBg({ backdropUrl, colorFrom, colorTo }: { backdropUrl?: string; colorFrom?: string; colorTo?: string }) {
  const fallback = colorFrom && colorTo
    ? `radial-gradient(90% 70% at 12% 0%, ${colorFrom}cc 0%, ${colorTo}88 55%), radial-gradient(70% 60% at 88% 10%, #1a2030 0%, transparent 50%), linear-gradient(160deg, #1a1215, #0B0908 75%)`
    : 'radial-gradient(90% 70% at 12% 0%, #341318 0%, transparent 55%), linear-gradient(160deg, #1a1110, #0B0908 75%)';

  return (
    <div
      className="absolute inset-[-4%] z-0 animate-drift will-change-transform bg-cover bg-center"
      style={{
        backgroundImage: backdropUrl
          ? `linear-gradient(160deg, rgba(26,17,16,0.55), rgba(11,9,8,0.88) 75%), url(${backdropUrl})`
          : fallback,
      }}
    />
  );
}

export default function HeroCarousel({ titles }: { titles: any[] }) {
  const nav = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 20 });
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync selected index from Embla
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIdx(emblaApi.selectedScrollSnap());
    setProgress(0);
    setShowPlayer(false);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  // Auto-advance + progress bar
  useEffect(() => {
    if (!emblaApi || !titles.length) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    timerRef.current = setInterval(() => emblaApi.scrollNext(), AUTO_ADVANCE_MS);
    const step = 100 / (AUTO_ADVANCE_MS / 50);
    progressRef.current = setInterval(() => setProgress(p => Math.min(p + step, 100)), 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [emblaApi, selectedIdx, titles.length]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  if (!titles.length) return null;

  const title = titles[selectedIdx];
  const embedSrc = getEmbedSrc(title);

  return (
    <section className="relative h-[70vh] min-h-[500px] max-h-[80vh] border-b border-line overflow-hidden">

      {/* Embla viewport — full-bleed slides with backgrounds */}
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full">
          {titles.map((t, i) => (
            <div key={t.id} className="relative flex-[0_0_100%] h-full overflow-hidden">
              {t.trailerYoutubeId
                ? <TrailerBg youtubeId={t.trailerYoutubeId} />
                : <ImageBg backdropUrl={t.backdropUrl} colorFrom={t.posterColorFrom} colorTo={t.posterColorTo} />
              }
            </div>
          ))}
        </div>
      </div>

      {/* Scrim overlays */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-void/30 to-void pointer-events-none" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-void/60 to-transparent pointer-events-none" />

      {/* Content — reads from selectedIdx */}
      <div className="absolute inset-0 z-[2] flex items-end px-5 pb-11">
        <div className="w-full max-w-[660px] space-y-4 pb-16">
          <div className="font-mono text-[11px] tracking-widest text-ink-dim uppercase flex items-center gap-2">
            <span className="w-4 h-px bg-maroon-bright" />
            {selectedIdx === 0 ? 'Featured Today' : `Trending #${selectedIdx + 1}`}
          </div>

          <h1 className="font-serif font-semibold text-[clamp(38px,8vw,72px)] leading-[0.97] tracking-tight animate-fadeUp drop-shadow-lg">
            {title.name}
          </h1>

          <p className="text-ink-dim text-sm leading-relaxed max-w-[440px] line-clamp-3 animate-fadeUp" style={{ animationDelay: '0.1s' }}>
            {title.synopsis}
          </p>

          <div className="flex items-center gap-4 pb-5 border-b border-line/50 flex-wrap animate-fadeUp" style={{ animationDelay: '0.2s' }}>
            <div className="font-mono text-xs text-ink-dim flex gap-2 items-center">
              <span>{title.year}</span>
              <span className="text-ink-faint">·</span>
              <span>{title.runtimeMinutes ? `${Math.floor(title.runtimeMinutes / 60)}H ${title.runtimeMinutes % 60}M` : title.type}</span>
              <span className="text-ink-faint">·</span>
              <span className="uppercase">{title.type}</span>
            </div>
            {title.genres?.slice(0, 3).map((g: string) => (
              <span key={g} className="text-[10px] font-mono text-ink-faint border border-line/60 rounded px-1.5 py-0.5">{g}</span>
            ))}
          </div>

          <div className="flex gap-2.5 animate-fadeUp" style={{ animationDelay: '0.3s' }}>
            {embedSrc ? (
              <button
                onClick={() => setShowPlayer(true)}
                className="flex items-center gap-2 bg-ink text-void font-semibold text-[13.5px] px-5 py-3 rounded-lg active:scale-[0.97] transition-transform shadow-lg"
              >
                <Play size={13} fill="currentColor" /> Play Now
              </button>
            ) : (
              <button
                onClick={() => nav(`/title/${title.id}`)}
                className="flex items-center gap-2 bg-ink text-void font-semibold text-[13.5px] px-5 py-3 rounded-lg active:scale-[0.97] transition-transform"
              >
                <Play size={13} fill="currentColor" /> Play
              </button>
            )}
            <button
              onClick={() => nav(`/title/${title.id}`)}
              className="flex items-center gap-2 bg-surface/80 backdrop-blur-sm text-ink font-semibold text-[13.5px] px-5 py-3 rounded-lg border border-line-bright hover:bg-surface transition-colors"
            >
              <Info size={14} /> More info
            </button>
          </div>

          {titles.length > 1 && (
            <div className="flex items-center gap-3 pt-2 animate-fadeUp" style={{ animationDelay: '0.4s' }}>
              <button onClick={scrollPrev} className="text-ink-dim hover:text-ink transition-colors">
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-1.5">
                {titles.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollTo(i)}
                    className="relative h-[3px] rounded-full overflow-hidden transition-all duration-300"
                    style={{ width: i === selectedIdx ? 28 : 12, background: 'rgba(255,255,255,0.2)' }}
                  >
                    {i === selectedIdx && (
                      <span
                        className="absolute inset-y-0 left-0 bg-ink rounded-full"
                        style={{ width: `${progress}%`, transition: 'width 50ms linear' }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <button onClick={scrollNext} className="text-ink-dim hover:text-ink transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* StreamRip player overlay */}
      {showPlayer && embedSrc && (
        <div className="fixed inset-0 z-50 bg-void/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
            <div>
              <p className="font-serif text-lg font-semibold">{title.name}</p>
              <p className="text-xs text-ink-dim font-mono">{title.year} · {title.type}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => nav(`/title/${title.id}`)} className="text-xs text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink transition-colors">
                More info
              </button>
              <button onClick={() => setShowPlayer(false)} className="text-xs text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink transition-colors">
                ✕ Close
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden bg-black flex items-center justify-center">
            <div className="relative player-ratio w-full overflow-hidden">
              <iframe
                src={embedSrc}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                title={title.name}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
