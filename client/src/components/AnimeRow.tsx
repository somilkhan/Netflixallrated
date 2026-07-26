/**
 * AnimeRow — Netflix-style horizontal scroll row for anime.
 * Lazy-loads via IntersectionObserver. Arrow buttons appear on hover.
 * Matches ContentRow layout used by Home/Browse/TV pages.
 */
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { getAnimePage } from '../lib/anilist';
import AniCard from './AniCard';
import { SkeletonCard } from './ui/SkeletonCard';
import { buildAnimeSectionHref } from '../lib/animeSection';

interface AnimeRowProps {
  title: string;
  badge?: string;
  sort?: string;
  genre?: string;
  tag?: string;
  status?: string;
  season?: string;
  seasonYear?: number;
  format?: string;
  perPage?: number;
  viewAllHref?: string;
  notIds?: number[];
  onLoaded?: (ids: number[]) => void;
}

const AnimeRow = memo(function AnimeRow({
  title, badge, sort = 'POPULARITY_DESC', genre, tag, status,
  season, seasonYear, format, perPage = 20, viewAllHref, notIds, onLoaded,
}: AnimeRowProps) {
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didFetch = useRef(false);

  const notIdsRef = useRef<number[] | undefined>(notIds);
  useEffect(() => { notIdsRef.current = notIds; }, [notIds]);

  const onLoadedRef = useRef(onLoaded);
  useEffect(() => { onLoadedRef.current = onLoaded; }, [onLoaded]);

  const resolvedViewAllHref = viewAllHref ?? buildAnimeSectionHref({ title, sort, genre, tag, status, season, seasonYear, format });

  const fetchData = useCallback(() => {
    setLoadState('loading');
    getAnimePage({ sort, genre, tag, status, season, seasonYear, format, perPage, idNotIn: notIdsRef.current })
      .then((media: any[]) => {
        setItems(media);
        onLoadedRef.current?.(media.map((m: any) => m.id));
        setLoadState('done');
      })
      .catch((err) => {
        console.error(`[anime] failed to load "${title}"`, err);
        setLoadState('error');
      });
  }, [sort, genre, tag, status, season, seasonYear, format, perPage]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !didFetch.current) {
          didFetch.current = true;
          fetchData();
        }
      },
      { rootMargin: '300px 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [fetchData]);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.78 : -el.clientWidth * 0.78, behavior: 'smooth' });
  }, []);

  // Hide empty rows
  if (loadState === 'done' && items.length === 0) return null;

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
          onClick={() => nav(resolvedViewAllHref)}
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

        {/* Cards */}
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-6 pb-2 scroll-smooth"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {isLoading
            ? Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[140px] sm:w-[180px] lg:w-[230px]">
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
            : items.map((anime: any) => (
                <AniCard key={anime.id} anime={anime} />
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

export default AnimeRow;
