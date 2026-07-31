/**
 * AnimeRankRow — "Top 10"-style horizontal row with large rank numbers.
 * Matches Netflix Top 10 design: translucent numeral behind each poster.
 * Same ContentRow-style layout as AnimeRow (arrows, header, lazy load).
 */
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { getAnimePage } from '../lib/anilist';
import AniCard from './AniCard';
import { SkeletonCard } from './ui/SkeletonCard';
import { buildAnimeSectionHref } from '../lib/animeSection';

interface AnimeRankRowProps {
  title: string;
  badge?: string;
  perPage?: number;
  onLoaded?: (ids: number[]) => void;
  /** Fetch immediately on mount instead of waiting for IntersectionObserver */
  eager?: boolean;
}

const AnimeRankRow = memo(function AnimeRankRow({ title, badge, perPage = 10, onLoaded, eager = false }: AnimeRankRowProps) {
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didFetch = useRef(false);

  const onLoadedRef = useRef(onLoaded);
  useEffect(() => { onLoadedRef.current = onLoaded; }, [onLoaded]);

  const viewAllHref = buildAnimeSectionHref({ title, sort: 'TRENDING_DESC' });

  const fetchData = useCallback(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    setLoadState('loading');
    getAnimePage({ sort: 'TRENDING_DESC', perPage })
      .then((media: any[]) => {
        setItems(media);
        onLoadedRef.current?.(media.map((m: any) => m.id));
        setLoadState('done');
      })
      .catch((err) => {
        console.error(`[anime] failed to load "${title}"`, err);
        setLoadState('error');
      });
  }, [perPage, title]);

  // Eager rows fetch immediately on mount
  useEffect(() => {
    if (eager) fetchData();
  }, [eager, fetchData]);

  // Lazy rows fetch when scrolled into view
  useEffect(() => {
    if (eager) return;
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchData(); },
      { rootMargin: '300px 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager, fetchData]);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.78 : -el.clientWidth * 0.78, behavior: 'smooth' });
  }, []);

  const isLoading = loadState === 'loading' || loadState === 'idle';

  return (
    <section ref={sectionRef} className="py-5">
      {/* Row header */}
      <div className="flex items-center justify-between px-4 md:px-6 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="text-[18px] md:text-[22px] font-bold text-white tracking-tight leading-none truncate">
            {title}
          </h2>
          {badge && (
            <span className="shrink-0 text-[8.5px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full bg-white/[0.07] text-white/55 border border-white/[0.12]">
              {badge}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => nav(viewAllHref)}
          className="
            group shrink-0 flex items-center gap-1
            px-3 py-1.5 rounded-full
            bg-white/[0.08] hover:bg-white/[0.14]
            text-[13px] text-[#A3A3A3] hover:text-white
            transition-all duration-200 touch-manipulation
          "
        >
          View All
          <ChevronRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Scroll container */}
      <div className="relative group/row">
        {/* Left arrow */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll('left')}
          className="
            hidden md:flex
            absolute left-0 top-0 bottom-0 z-20
            items-center justify-center w-14
            opacity-0 group-hover/row:opacity-100
            transition-opacity duration-200
            pointer-events-none group-hover/row:pointer-events-auto
          "
          style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.95), transparent)' }}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.10] text-white transition-all duration-200">
            <ChevronLeft size={16} />
          </div>
        </button>

        {/* Cards — rank number sits behind each card */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide px-4 md:px-6 pb-2 scroll-smooth"
          style={{ scrollSnapType: 'x mandatory', gap: '0px' }}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shrink-0 pl-8 first:pl-0 w-[148px] sm:w-[188px] lg:w-[238px]">
                  <SkeletonCard />
                </div>
              ))
            : loadState === 'error'
            ? (
                <div className="flex items-center justify-center py-8 px-6 w-full">
                  <p className="text-sm text-white/40">
                    Failed to load —{' '}
                    <button
                      onClick={() => { didFetch.current = true; fetchData(); }}
                      className="text-white/60 hover:text-white underline underline-offset-2"
                    >
                      retry
                    </button>
                  </p>
                </div>
              )
            : items.map((anime: any, i: number) => (
                /* Each item: large translucent rank number (left-aligned behind the poster) */
                <div
                  key={anime.id}
                  className="relative shrink-0 flex items-end"
                  style={{ paddingLeft: i === 0 ? 0 : 32 }}
                >
                  {/* Rank numeral */}
                  <span
                    aria-hidden
                    className="absolute left-0 bottom-8 select-none pointer-events-none font-black leading-none"
                    style={{
                      fontSize: 'clamp(72px, 12vw, 120px)',
                      color: 'transparent',
                      WebkitTextStroke: '2px rgba(255,255,255,0.12)',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      zIndex: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  {/* Card sits over rank number */}
                  <div className="relative z-10">
                    <AniCard anime={anime} />
                  </div>
                </div>
              ))
          }
        </div>

        {/* Right arrow */}
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll('right')}
          className="
            hidden md:flex
            absolute right-0 top-0 bottom-0 z-20
            items-center justify-center w-14
            opacity-0 group-hover/row:opacity-100
            transition-opacity duration-200
            pointer-events-none group-hover/row:pointer-events-auto
          "
          style={{ background: 'linear-gradient(to left, rgba(10,10,10,0.95), transparent)' }}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.10] text-white transition-all duration-200">
            <ChevronRight size={16} />
          </div>
        </button>
      </div>
    </section>
  );
});

export default AnimeRankRow;
