/**
 * AnimeHeroBanner — cinematic, auto-changing hero for the Anime page.
 * Crossfades between featured titles (no drag carousel), keeping the deep
 * mehroon glassmorphism identity: glass gradient overlay, serif title,
 * mono metadata line, Play / More Info / Trailer actions.
 */
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Volume2, Film } from 'lucide-react';

const AUTO_ADVANCE_MS = 8000;

interface AnimeHeroBannerProps {
  titles: any[];
}

const BannerLayer = memo(function BannerLayer({ anime, active }: { anime: any; active: boolean }) {
  const backdrop = anime.bannerImage || anime.coverImage?.extraLarge || anime.coverImage?.large;
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${active ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className="absolute inset-[-3%] bg-cover bg-center animate-drift will-change-transform"
        style={{
          backgroundImage: backdrop
            ? `linear-gradient(160deg, rgba(11,9,8,0.35), rgba(11,9,8,0.85) 72%), url(${backdrop})`
            : 'radial-gradient(90% 70% at 12% 0%, #341318 0%, transparent 55%), linear-gradient(160deg, #1a1110, #0B0908 75%)',
        }}
      />
    </div>
  );
});

const AnimeHeroBanner = memo(function AnimeHeroBanner({ titles }: AnimeHeroBannerProps) {
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (titles.length < 2) return;
    if (progressRef.current) clearInterval(progressRef.current);
    const step = 100 / (AUTO_ADVANCE_MS / 50);
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p + step >= 100) {
          setIdx(i => (i + 1) % titles.length);
          return 0;
        }
        return p + step;
      });
    }, 50);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [idx, titles.length]);

  const goTo = useCallback((i: number) => { setIdx(i); setProgress(0); }, []);

  if (!titles.length) return null;
  const anime = titles[idx];
  const titleStr = anime.title?.english || anime.title?.romaji;
  const year = anime.startDate?.year;
  const synopsis = anime.description ? anime.description.replace(/<[^>]+>/g, '') : null;
  const trailerId = anime.trailer?.site === 'youtube' ? anime.trailer.id : null;

  return (
    <section className="relative h-[68vh] min-h-[500px] max-h-[780px] overflow-hidden">
      {/* Crossfading banner layers */}
      <div className="absolute inset-0">
        {titles.map((t, i) => (
          <BannerLayer key={t.id} anime={t} active={i === idx} />
        ))}
      </div>

      {/* Glass gradient overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-void/25 to-void pointer-events-none" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-void/70 via-void/25 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-[1] backdrop-blur-[0.5px] bg-black/[0.04] pointer-events-none" />

      {/* Noise grain */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundSize: '200px 200px' }}
      />

      {/* Mute/volume affordance, top-right — decorative, matches reference's small icon */}
      <button
        aria-label="Toggle preview audio"
        className="absolute z-[3] top-5 right-5 h-8 w-8 rounded-full bg-white/[0.08] border border-white/[0.12]
          backdrop-blur-md flex items-center justify-center text-ink-dim hover:text-ink hover:bg-white/[0.14] transition-colors"
      >
        <Volume2 size={13} />
      </button>

      {/* Content overlay */}
      <div className="absolute inset-0 z-[2] flex items-end px-5 md:px-10">
        <div className="w-full max-w-[580px] space-y-3.5 pb-14">

          <div className="font-mono text-[10px] tracking-[0.22em] text-ink-dim uppercase flex items-center gap-2">
            <span className="w-5 h-px bg-maroon-bright/80" />
            Featured Anime
          </div>

          <h1
            key={anime.id}
            className="font-serif font-semibold text-[clamp(34px,7vw,64px)] leading-[0.98] tracking-tight text-ink animate-fadeUp drop-shadow-[0_2px_20px_rgba(0,0,0,0.55)]"
          >
            {titleStr}
          </h1>

          <div className="flex items-center gap-2.5 flex-wrap font-mono text-[10.5px] text-ink-dim animate-fadeUp" style={{ animationDelay: '0.06s' }}>
            {year && <span>{year}</span>}
            <span className="text-ink-faint/50">·</span>
            <span className="capitalize text-ink-faint">Anime</span>
            {anime.genres?.slice(0, 3).map((g: string) => (
              <span key={g} className="font-mono text-[9.5px] text-ink-faint border border-line/50 rounded-full px-2 py-0.5 bg-white/[0.03]">
                {g}
              </span>
            ))}
          </div>

          {synopsis && (
            <p className="text-ink-dim text-[13.5px] leading-relaxed max-w-[440px] line-clamp-2 animate-fadeUp" style={{ animationDelay: '0.12s' }}>
              {synopsis}
            </p>
          )}

          <div className="flex gap-2.5 flex-wrap animate-fadeUp" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => nav(`/anime/view/${anime.id}`)}
              className="flex items-center gap-2 bg-ink text-void font-sans font-semibold text-[13px]
                px-5 py-2.5 rounded-full active:scale-[0.97] transition-transform duration-150
                shadow-[0_4px_16px_-4px_rgba(245,240,236,0.3)] hover:bg-ink/90"
            >
              <Play size={12} fill="currentColor" /> Play
            </button>
            <button
              onClick={() => nav(`/anime/view/${anime.id}`)}
              className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm text-ink font-sans font-medium text-[13px]
                px-5 py-2.5 rounded-full border border-white/[0.12] hover:bg-white/[0.12] transition-colors duration-150"
            >
              <Info size={13} /> More Info
            </button>
            {trailerId && (
              <button
                onClick={() => window.open(`https://www.youtube.com/watch?v=${trailerId}`, '_blank', 'noopener')}
                className="flex items-center gap-2 bg-maroon/25 backdrop-blur-sm text-maroon-bright font-sans font-medium text-[13px]
                  px-5 py-2.5 rounded-full border border-maroon/40 hover:bg-maroon/35 transition-colors duration-150"
              >
                <Film size={13} /> Trailer
              </button>
            )}
          </div>

          {titles.length > 1 && (
            <div className="flex gap-1.5 items-center animate-fadeUp" style={{ animationDelay: '0.28s' }}>
              {titles.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="relative h-[2.5px] rounded-full overflow-hidden transition-all duration-300"
                  style={{ width: i === idx ? 24 : 8, background: 'rgba(255,255,255,0.18)' }}
                >
                  {i === idx && (
                    <span
                      className="absolute inset-y-0 left-0 bg-maroon-bright/90 rounded-full"
                      style={{ width: `${progress}%`, transition: 'width 50ms linear' }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

export default AnimeHeroBanner;
