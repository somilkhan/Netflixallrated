/**
 * AnimeSectionPage — "View all" destination for any Anime page row.
 * Netflix-style grid with infinite scroll. Reads fetch params from URL.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Film } from 'lucide-react';
import { getAnimePageWithInfo } from '../lib/anilist';
import { parseAnimeSectionSearch } from '../lib/animeSection';
import AniCard from '../components/AniCard';
import { SkeletonCard } from '../components/ui/SkeletonCard';

const PER_PAGE = 24;

export default function AnimeSectionPage() {
  const nav = useNavigate();
  const location = useLocation();
  const params = parseAnimeSectionSearch(location.search);

  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'more' | 'done' | 'error'>('idle');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<number>>(new Set());
  const requestVersion = useRef(0);
  const inFlight = useRef(false);

  // Reset when section changes
  useEffect(() => {
    requestVersion.current += 1;
    inFlight.current = false;
    setItems([]);
    setPage(1);
    setHasNext(true);
    seenIds.current = new Set();
    setLoadState('idle');
  }, [location.search]);

  const loadPage = useCallback((pageNum: number, replace: boolean) => {
    if (inFlight.current) return;
    inFlight.current = true;
    const version = requestVersion.current;
    setLoadState(pageNum === 1 ? 'loading' : 'more');
    getAnimePageWithInfo({
      sort: params.sort, genre: params.genre, tag: params.tag, status: params.status,
      season: params.season, seasonYear: params.seasonYear, format: params.format,
      page: pageNum, perPage: PER_PAGE,
    })
      .then(({ media, hasNextPage }) => {
        if (version !== requestVersion.current) return;
        const fresh = media.filter(m => !seenIds.current.has(m.id));
        fresh.forEach(m => seenIds.current.add(m.id));
        setItems(prev => (replace ? fresh : [...prev, ...fresh]));
        setHasNext(hasNextPage);
        setLoadState('done');
      })
      .catch((err: unknown) => {
        if (version !== requestVersion.current) return;
        console.error('AnimeSectionPage fetch error:', err);
        setLoadState('error');
      })
      .finally(() => {
        if (version === requestVersion.current) inFlight.current = false;
      });
  }, [params.sort, params.genre, params.tag, params.status, params.season, params.seasonYear, params.format]);

  useEffect(() => {
    loadPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNext && loadState === 'done' && !inFlight.current) {
          const next = page + 1;
          setPage(next);
          loadPage(next, false);
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNext, loadState, page, loadPage]);

  return (
    <div className="min-h-screen pb-32 pt-20" style={{ background: '#000000' }}>
      {/* Page header */}
      <div className="px-4 md:px-6 pt-4 pb-8">
        <button
          onClick={() => nav('/anime')}
          className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-white transition-colors mb-5"
        >
          <ChevronLeft size={14} strokeWidth={2.2} />
          Back to Anime
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block w-1.5 h-1.5 rounded-lg bg-white/50 animate-pulse" />
          <span className="text-2xs uppercase tracking-[0.22em] text-white/35 font-medium">
            Live from AniList
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-none">
          {params.title}
        </h1>
      </div>

      {/* Grid */}
      <div className="px-4 md:px-6">
        {loadState === 'error' && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
            <Film size={40} className="text-white/15" />
            <p className="text-xl font-semibold text-white">Failed to load</p>
            <button
              onClick={() => loadPage(1, true)}
              className="mt-2 px-5 py-2 rounded-lg bg-overlay-light border border-white/[0.12] text-sm text-ink-secondary hover:text-white hover:bg-overlay-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map(anime => (
            <AniCard key={anime.id} anime={anime} fluid className="w-full" />
          ))}
          {(loadState === 'loading' || loadState === 'more') &&
            Array.from({ length: loadState === 'loading' ? 12 : 6 }).map((_, i) => (
              <SkeletonCard key={`sk-${i}`} />
            ))
          }
        </div>

        {loadState === 'done' && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
            <Film size={40} className="text-white/15" />
            <p className="text-ink-secondary text-sm">No anime found for this section.</p>
          </div>
        )}

        {/* Infinite-scroll sentinel */}
        <div ref={sentinelRef} className="h-8" />

        {loadState === 'done' && !hasNext && items.length > 0 && (
          <p className="text-xs text-white/25 text-center py-6">You've reached the end.</p>
        )}
      </div>
    </div>
  );
}
