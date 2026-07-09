/**
 * AnimeRow — lazy-loading, self-contained horizontal anime row.
 *
 * - Triggers its AniList fetch only when it scrolls into view
 *   (IntersectionObserver with 300px root margin).
 * - Uses a live ref for notIds so parent updates are picked up even if
 *   the parent re-renders before the IO fires.
 * - Fades in on first intersection (not just on success), so skeletons
 *   and error states are always visible.
 * - runQuery throws on network/API errors; AnimeRow catches and shows retry UI.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
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
  /** IDs to exclude — tracked via a live ref so parent updates are honoured */
  notIds?: number[];
  onLoaded?: (ids: number[]) => void;
}

const SKELETON_COUNT = 7;

export default function AnimeRow({
  title,
  badge,
  sort = 'POPULARITY_DESC',
  genre,
  tag,
  status,
  season,
  seasonYear,
  perPage = 20,
  viewAllHref,
  notIds,
  onLoaded,
}: AnimeRowProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const sectionRef = useRef<HTMLElement>(null);
  const didFetch = useRef(false);

  // Live ref for notIds — always reflects the latest prop value at fetch time
  const notIdsRef = useRef<number[] | undefined>(notIds);
  useEffect(() => { notIdsRef.current = notIds; }, [notIds]);

  // Stable fetch function — reads live notIdsRef at call time
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => { onLoadedRef.current = onLoaded; }, [onLoaded]);

  const fetchData = useCallback(() => {
    setLoadState('loading');
    // Reveal row immediately so skeletons & errors are visible
    if (sectionRef.current) {
      sectionRef.current.classList.add('opacity-100', 'translate-y-0');
      sectionRef.current.classList.remove('opacity-0', 'translate-y-4');
    }
    getAnimePage({
      sort,
      genre,
      tag,
      status,
      season,
      seasonYear,
      perPage,
      idNotIn: notIdsRef.current,
    })
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

  // Don't occupy space for an empty (but successful) row
  if (loadState === 'done' && items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="px-5 pt-9 pb-1.5 opacity-0 translate-y-4 transition-all duration-500"
    >
      {/* ── Row header ── */}
      <div className="flex items-center w-full mb-4 gap-2">
        <span className="font-serif text-xl font-semibold tracking-tight shrink-0">{title}</span>

        {badge && (
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5
            rounded-full bg-maroon/20 text-maroon-bright border border-maroon/35">
            {badge}
          </span>
        )}

        <div className="h-px bg-line flex-1 mx-2 min-w-0" />

        {viewAllHref ? (
          <a
            href={viewAllHref}
            className="font-mono text-[11px] text-ink-dim whitespace-nowrap hover:text-ink
              transition-colors shrink-0"
          >
            view all →
          </a>
        ) : (
          <span className="font-mono text-[10px] text-ink-faint whitespace-nowrap shrink-0 select-none">
            live · anilist
          </span>
        )}
      </div>

      {/* ── Slider ── */}
      {(loadState === 'idle' || loadState === 'loading') && (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <GlassCardSkeleton key={i} />
          ))}
        </div>
      )}

      {loadState === 'error' && (
        <div className="flex items-center justify-center py-10 border border-dashed border-line rounded-xl">
          <p className="font-mono text-xs text-ink-faint">
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
          className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide overscroll-x-contain"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {items.map((anime: any) => (
            <AniCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}
    </section>
  );
}
