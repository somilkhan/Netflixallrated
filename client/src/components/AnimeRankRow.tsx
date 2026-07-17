/**
 * AnimeRankRow — "Top 10"-style horizontal slider with large translucent
 * ranking numbers behind each poster, mehroon-glass themed. Used for the
 * "Trending Anime" section on the Anime page.
 */
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnimePage } from '../lib/anilist';
import { GlassCardSkeleton } from './GlassCard';
import AniCard from './AniCard';
import { buildAnimeSectionHref } from '../lib/animeSection';

interface AnimeRankRowProps {
  title: string;
  badge?: string;
  perPage?: number;
  onLoaded?: (ids: number[]) => void;
}

const SKELETON_COUNT = 6;

const AnimeRankRow = memo(function AnimeRankRow({ title, badge, perPage = 10, onLoaded }: AnimeRankRowProps) {
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const sectionRef = useRef<HTMLElement>(null);
  const didFetch = useRef(false);
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => { onLoadedRef.current = onLoaded; }, [onLoaded]);

  const viewAllHref = buildAnimeSectionHref({ title, sort: 'TRENDING_DESC' });

  const fetchData = useCallback(() => {
    setLoadState('loading');
    getAnimePage({ sort: 'TRENDING_DESC', perPage })
      .then((media: any[]) => {
        setItems(media);
        onLoadedRef.current?.(media.map((m: any) => m.id));
        setLoadState('done');
      })
      .catch(() => setLoadState('error'));
  }, [perPage]);

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

  return (
    <section ref={sectionRef} className="pt-8 pb-1">
      <div className="flex items-center px-5 mb-4 gap-3">
        <h2 className="font-serif text-[19px] font-semibold tracking-tight text-ink leading-none shrink-0">
          {title}
        </h2>
        {badge && (
          <span className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.14em] px-2 py-0.5
            rounded-full bg-maroon/20 text-maroon-bright border border-maroon/30">
            {badge}
          </span>
        )}
        <div className="h-px bg-line/60 flex-1 min-w-0" />
        <button
          type="button"
          onClick={() => nav(viewAllHref)}
          className="font-sans text-[11px] text-ink-faint whitespace-nowrap hover:text-maroon-bright transition-colors shrink-0"
        >
          View all
        </button>
      </div>

      {(loadState === 'idle' || loadState === 'loading') && (
        <div className="flex gap-6 overflow-x-auto scrollbar-hide px-5 pb-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <GlassCardSkeleton key={i} className="!w-[168px] md:!w-[196px]" />
          ))}
        </div>
      )}

      {loadState === 'error' && (
        <div className="mx-5 flex items-center justify-center py-8 border border-dashed border-line rounded-xl">
          <p className="font-mono text-[11px] text-ink-faint">
            Failed to load —{' '}
            <button onClick={() => { didFetch.current = true; fetchData(); }} className="text-maroon-bright hover:underline">
              retry
            </button>
          </p>
        </div>
      )}

      {loadState === 'done' && items.length > 0 && (
        <div
          className="flex gap-1 overflow-x-auto pb-3 scrollbar-hide px-5"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {items.map((anime: any, i: number) => (
            <div key={anime.id} className="relative flex items-end shrink-0 pl-6 first:pl-0">
              {/* Large translucent ranking number, mehroon-tinted */}
              <span
                aria-hidden
                className="absolute -left-1 bottom-0 select-none pointer-events-none
                  font-serif font-bold leading-none
                  text-[96px] md:text-[120px]"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '1.5px rgba(194,67,79,0.35)',
                  backgroundImage: 'linear-gradient(180deg, rgba(122,37,48,0.28), rgba(11,9,8,0.05))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                {i + 1}
              </span>
              <div className="relative z-10 pl-9 md:pl-11">
                <AniCard anime={anime} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
});

export default AnimeRankRow;
