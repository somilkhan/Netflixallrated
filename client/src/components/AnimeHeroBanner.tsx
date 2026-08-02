/**
 * AnimeHeroBanner — Netflix-style cinematic hero for the Anime page.
 * Self-contained: fetches its own trending data. Matches HeroSection design exactly.
 */
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { getAnimePage } from '../lib/anilist';
import { navigateToAnime } from '../lib/animeResolve';

const AUTO_MS = 8000;

const AnimeHeroBanner = memo(function AnimeHeroBanner() {
  const nav = useNavigate();
  const location = useLocation();
  const [titles, setTitles] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({});
  const [paused, setPaused] = useState(false);
  const [resolving, setResolving] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    getAnimePage({ sort: 'TRENDING_DESC', perPage: 6 })
      .then(setTitles)
      .catch((err) => { console.error('[anime] hero fetch failed:', err); setTitles([]); });
  }, []);

  const next = useCallback(() => setIdx(i => (titles.length ? (i + 1) % titles.length : 0)), [titles.length]);
  const prev = useCallback(() => setIdx(i => (titles.length ? (i - 1 + titles.length) % titles.length : 0)), [titles.length]);

  useEffect(() => {
    if (titles.length <= 1 || paused) return;
    const t = setTimeout(next, AUTO_MS);
    return () => clearTimeout(t);
  }, [idx, next, titles.length, paused]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta < -50) next();
    else if (delta > 50) prev();
    setTimeout(() => setPaused(false), 1200);
  }, [next, prev]);

  const handleNavigate = useCallback((play = false) => {
    const current = titles[idx];
    if (!current || resolving) return;
    setResolving(true);
    navigateToAnime(current, (path) => nav(play ? `${path}?play=1` : path, {
      state: { from: `${location.pathname}${location.search}` },
    }))
      .finally(() => setResolving(false));
  }, [idx, nav, resolving, titles, location.pathname, location.search]);

  if (!titles.length) return null;

  const current = titles[idx];
  const titleStr = current.title?.english || current.title?.romaji || current.title?.native || 'Unknown';
  const synopsis = current.description ? current.description.replace(/<[^>]+>/g, '') : '';
  const rating = current.averageScore ? (current.averageScore / 10).toFixed(1) : null;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(480px, 75svh, 960px)' }}
      aria-label={`Featured: ${titleStr}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Background slides */}
      <div className="absolute inset-0">
        {titles.map((t, i) => {
          const imgUrl = t.bannerImage || t.coverImage?.extraLarge || t.coverImage?.large;
          return (
            <div
              key={t.id}
              className="absolute inset-0 transition-opacity duration-500 ease-out"
              style={{ opacity: i === idx ? 1 : 0, pointerEvents: i === idx ? 'auto' : 'none' }}
              aria-hidden={i !== idx}
            >
              {imgUrl ? (
                <>
                  <img
                    src={imgUrl}
                    alt=""
                    aria-hidden
                    className="sr-only"
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onLoad={() => setImgLoaded(prev => ({ ...prev, [i]: true }))}
                  />
                  <div
                    className="absolute inset-[-5%] bg-cover bg-center transition-opacity duration-500"
                    style={{
                      backgroundImage: `url(${imgUrl})`,
                      backgroundPosition: 'center 20%',
                      opacity: imgLoaded[i] ? 1 : 0,
                    }}
                  />
                  <div
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{ background: 'radial-gradient(ellipse at 30% 30%, #1a1a2e, #000000)', opacity: imgLoaded[i] ? 0 : 1 }}
                  />
                </>
              ) : (
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 30%, #1a1a2e, #000000)' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Gradient overlays */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(20,20,20,1) 0%, rgba(20,20,20,0.85) 25%, rgba(20,20,20,0.4) 60%, rgba(20,20,20,0) 100%)' }}
      />
      <div
        className="absolute inset-0 z-[2] pointer-events-none hidden md:block"
        style={{ background: 'linear-gradient(105deg, rgba(20,20,20,0.85) 0%, rgba(10,10,10,0.5) 40%, transparent 70%)' }}
      />
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 20%)' }}
      />

      {/* Content — bottom-left */}
      <div className="absolute inset-0 z-[3] flex items-end">
        <div className="w-full max-w-[620px] px-4 sm:px-8 md:px-12 pb-24 md:pb-28">

          {/* Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400">
              Trending Anime
            </span>
            {rating && (
              <span className="flex items-center gap-1 text-xs text-white/70">
                <span className="text-amber-400">★</span>
                {rating}
              </span>
            )}
            {current.genres?.slice(0, 2).map((g: string) => (
              <span key={g} className="text-[10px] text-white/70 uppercase tracking-wider border border-white/10 px-1.5 py-0.5 rounded">
                {g}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1
            key={current.id}
            className="font-bold text-white leading-[1.05] mb-3"
            style={{
              fontSize: 'clamp(28px, 5vw, 56px)',
              letterSpacing: '-0.025em',
              textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 4px 40px rgba(0,0,0,0.6)',
            }}
          >
            {titleStr}
          </h1>

          {/* Synopsis */}
          {synopsis && (
            <p
              className="text-[14px] md:text-[15px] leading-relaxed mb-6 max-w-[500px]"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                color: 'rgba(255,255,255,0.85)',
                textShadow: '0 1px 8px rgba(0,0,0,0.6)',
              }}
            >
              {synopsis}
            </p>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => handleNavigate(true)}
              disabled={resolving}
              aria-label={`Play ${titleStr}`}
              className="
                flex items-center justify-center gap-2.5
                w-full sm:w-auto px-8 rounded-xl
                bg-white text-black
                text-[15px] font-semibold
                hover:bg-white/90 active:scale-[0.97] disabled:opacity-60
                transition-all duration-200 touch-manipulation
                shadow-[0_4px_24px_rgba(0,0,0,0.5)]
              "
              style={{ minHeight: 56, height: 56 }}
            >
              {resolving
                ? <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                : <Play size={17} className="fill-current shrink-0" />
              }
              Watch Now
            </button>
            <button
              type="button"
              onClick={() => handleNavigate(false)}
              disabled={resolving}
              aria-label={`More info about ${titleStr}`}
              className="
                flex items-center justify-center gap-2.5
                w-full sm:w-auto px-8 rounded-xl
                bg-transparent border border-white/[0.35] text-white
                text-[15px] font-medium
                hover:bg-white/[0.10] hover:border-white/[0.50]
                active:scale-[0.97] disabled:opacity-60
                transition-all duration-200 touch-manipulation
                backdrop-blur-sm
              "
              style={{ minHeight: 56, height: 56 }}
            >
              <Info size={16} className="shrink-0" />
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* Controls: prev/next + dots */}
      <div className="absolute bottom-5 md:bottom-7 right-4 md:right-10 z-[4] flex items-center gap-3">
        {titles.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous"
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.07] border border-white/[0.12] text-white/65 hover:text-white hover:bg-white/[0.12] backdrop-blur-sm transition-all duration-200"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="flex items-center" style={{ gap: 8 }}>
              {titles.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === idx ? 'true' : undefined}
                  className="touch-manipulation flex items-center justify-center"
                  style={{ padding: 4 }}
                >
                  <div style={{
                    width: i === idx ? 8 : 6,
                    height: i === idx ? 8 : 6,
                    borderRadius: '50%',
                    background: 'white',
                    opacity: i === idx ? 1 : 0.4,
                    transition: 'all 300ms ease',
                    flexShrink: 0,
                  }} />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              aria-label="Next featured title"
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.07] border border-white/[0.12] text-white/65 hover:text-white hover:bg-white/[0.12] backdrop-blur-sm transition-all duration-200"
            >
              <ChevronRight size={15} />
            </button>
          </>
        )}
      </div>


    </section>
  );
});

export default AnimeHeroBanner;
