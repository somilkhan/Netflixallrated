/**
 * AnimeHeroBanner — bingr.one style hero for the Anime page.
 * Crossfades between featured titles. Bold uppercase title, star meta, bingr buttons.
 */
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import { navigateToAnime } from '../lib/animeResolve';

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
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: backdrop ? `url(${backdrop})` : 'linear-gradient(160deg, #111, #000 75%)',
        }}
      />
    </div>
  );
});

const AnimeHeroBanner = memo(function AnimeHeroBanner({ titles }: AnimeHeroBannerProps) {
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    setIdx(i => (i + 1) % titles.length);
    setProgressKey(k => k + 1);
  }, [titles.length]);

  useEffect(() => {
    if (titles.length < 2) return;
    timerRef.current = setTimeout(advance, AUTO_ADVANCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [idx, titles.length, advance]);

  const goTo = useCallback((i: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIdx(i);
    setProgressKey(k => k + 1);
  }, []);

  if (!titles.length) return null;
  const anime = titles[idx];
  const titleStr = anime.title?.english || anime.title?.romaji;
  const year = anime.startDate?.year;
  const synopsis = anime.description ? anime.description.replace(/<[^>]+>/g, '') : null;

  const metaParts: string[] = [];
  if (year) metaParts.push(String(year));
  metaParts.push('Anime');
  if (anime.genres?.length) anime.genres.slice(0, 2).forEach((g: string) => metaParts.push(g));

  return (
    <section className="relative h-[100vh] min-h-[500px] max-h-[900px] overflow-hidden">
      {/* Crossfading banner layers */}
      <div className="absolute inset-0">
        {titles.map((t, i) => (
          <BannerLayer key={t.id} anime={t} active={i === idx} />
        ))}
      </div>

      {/* Gradient overlays — bingr style */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/70 via-black/25 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

      {/* Content — bottom-left */}
      <div className="absolute inset-0 z-[2] flex items-end">
        <div className="w-full max-w-[560px] px-5 md:px-8 pb-[100px] space-y-3">

          {/* Title — bold uppercase */}
          <h1
            key={anime.id}
            className="font-sans font-black text-white leading-[1.0] tracking-wide uppercase animate-fadeUp"
            style={{ fontSize: 'clamp(28px, 5vw, 58px)', textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}
          >
            {titleStr}
          </h1>

          {/* Meta — bingr style */}
          <div className="flex items-center gap-2 flex-wrap animate-fadeUp" style={{ animationDelay: '0.07s' }}>
            <span className="text-[#f5c518] text-[13px] font-bold flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            {metaParts.map((part, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-[#555] text-[12px]">·</span>}
                <span className="font-sans text-[13px] text-[#ccc]">{part}</span>
              </span>
            ))}
          </div>

          {synopsis && (
            <p className="font-sans text-[13.5px] text-[#bbb] leading-relaxed max-w-[420px] line-clamp-3 animate-fadeUp"
              style={{ animationDelay: '0.14s' }}>
              {synopsis}
            </p>
          )}

          {/* CTAs */}
          <div className="flex items-center gap-3 animate-fadeUp" style={{ animationDelay: '0.21s' }}>
            <button
              onClick={() => navigateToAnime(anime, nav)}
              className="flex items-center justify-center w-[46px] h-[46px] rounded-full bg-white
                hover:bg-white/90 active:scale-95 transition-all duration-150
                shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
            >
              <Play size={17} className="text-black fill-black ml-[2px]" />
            </button>
            <button
              onClick={() => navigateToAnime(anime, nav)}
              className="flex items-center gap-2 font-sans text-[14px] text-white font-medium
                hover:text-white/80 active:scale-95 transition-all duration-150"
            >
              <span className="flex items-center justify-center w-[26px] h-[26px] rounded-full border border-white/50">
                <Info size={13} className="text-white/80" />
              </span>
              See More
            </button>
          </div>

          {/* Dot progress strip */}
          {titles.length > 1 && (
            <div className="flex gap-1.5 items-center animate-fadeUp" style={{ animationDelay: '0.28s' }}>
              {titles.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="relative h-[2px] rounded-full overflow-hidden transition-all duration-300"
                  style={{ width: i === idx ? 24 : 8, background: 'rgba(255,255,255,0.2)' }}
                >
                  {i === idx && (
                    <span
                      key={progressKey}
                      className="absolute inset-y-0 left-0 bg-white rounded-full"
                      style={{ animation: `heroProgress ${AUTO_ADVANCE_MS}ms linear forwards` }}
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
