/**
 * AnimeRow — lazy-loading, self-contained horizontal anime row.
 * Triggers AniList fetch only when scrolled into view.
 */
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { getAnimePage } from '../lib/anilist';
import { GlassCardSkeleton } from './GlassCard';
import AniCard from './AniCard';

interface AnimeRowProps {
  title: string;
  badge?: string;
  sort?: string;
  genre?: string;
  tag?: string;
  status?: string;
  season?: string;
  seasonYear?: number;
  perPage?: number;
  viewAllHref?: string;
  notIds?: number[];
  onLoaded?: (ids: number[]) => void;
}

const SKELETON_COUNT = 7;

const AnimeRow = memo(function AnimeRow({
  title, badge, sort = 'POPULARITY_DESC', genre, tag, status,
  season, seasonYear, perPage = 20, viewAllHref, notIds, onLoaded,
}: AnimeRowProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const sectionRef = useRef<HTMLElement>(null);
  const didFetch = useRef(false);

  const notIdsRef = useRef<number[] | undefined>(notIds);
  useEffect(() => { notIdsRef.current = notIds; }, [notIds]);

  const onLoadedRef = useRef(onLoaded);
  useEffect(() => { onLoadedRef.current = onLoaded; }, [onLoaded]);

  const fetchData = useCallback(() => {
    setLoadState('loading');
    if (sectionRef.current) {
      sectionRef.current.classList.add('opacity-100', 'translate-y-0');
      sectionRef.current.classList.remove('opacity-0', 'translate-y-4');
    }
    getAnimePage({ sort, genre, tag, status, season, seasonYear, perPage, idNotIn: notIdsRef.current })
      .then((media: any[]) => {
        setItems(media);
        onLoadedRef.current?.(media.map((m: any) => m.id));
        setLoadState('done');
      })
      .catch(() => setLoadState('error'));
  }, [sort, genre, tag, status, season, seasonYear, perPage]);

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

  const handleRetry = () => {
    didFetch.current = true;
    fetchData();
  };

  if (loadState === 'done' && items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="pt-8 pb-1 opacity-0 translate-y-4 transition-all duration-500 ease-spring"
    >
      {/* Row header */}
      <div className="flex items-center px-5 mb-4 gap-3">
        <h2 className="font-serif text-[19px] font-semibold tracking-tight text-ink leading-none shrink-0">
          {title}
        </h2>

        {badge && (
          <span className="
            shrink-0 font-mono text-[8.5px] uppercase tracking-[0.14em] px-2 py-0.5
            rounded-full bg-maroon/20 text-maroon-bright border border-maroon/30
          ">
            {badge}
          </span>
        )}

        <div className="h-px bg-line/60 flex-1 min-w-0" />

        {viewAllHref ? (
          <a
            href={viewAllHref}
            className="font-sans text-[11px] text-ink-faint whitespace-nowrap hover:text-ink transition-colors shrink-0"
          >
            View all
          </a>
        ) : (
          <span className="font-mono text-[9.5px] text-ink-faint/60 whitespace-nowrap shrink-0 select-none">
            AniList
          </span>
        )}
      </div>

      {/* Slider */}
      {(loadState === 'idle' || loadState === 'loading') && (
        <div className="flex gap-3.5 overflow-x-auto scrollbar-hide px-5 pb-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <GlassCardSkeleton key={i} />
          ))}
        </div>
      )}

      {loadState === 'error' && (
        <div className="mx-5 flex items-center justify-center py-8 border border-dashed border-line rounded-xl">
          <p className="font-mono text-[11px] text-ink-faint">
            Failed to load —{' '}
            <button
              onClick={handleRetry}
              className="text-maroon-bright hover:underline focus:outline-none"
            >
              retry
            </button>
          </p>
        </div>
      )}

      {loadState === 'done' && items.length > 0 && (
        <div
          className="flex gap-3.5 overflow-x-auto pb-3 scrollbar-hide px-5 overscroll-x-contain"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {items.map((anime: any) => (
            <AniCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}
    </section>
  );
});

export default AnimeRow;
