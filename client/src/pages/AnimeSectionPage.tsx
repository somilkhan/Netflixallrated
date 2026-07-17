/**
 * AnimeSectionPage — "View all" destination for any Anime page row.
 * Reads its fetch parameters from the query string (see lib/animeSection.ts),
 * and infinitely paginates live AniList results into a responsive grid.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { getAnimePageWithInfo } from '../lib/anilist';
import { parseAnimeSectionSearch } from '../lib/animeSection';
import AniCard from '../components/AniCard';
import { GlassCardSkeleton } from '../components/GlassCard';

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

  // Guards against stale-response races: bumped every time the section
  // changes, and every in-flight request is tagged with the version it was
  // fired under. A response is only applied if its version is still current.
  const requestVersion = useRef(0);
  // Prevents duplicate concurrent page fetches from multiple intersection fires.
  const inFlight = useRef(false);

  // Reset when the query string (i.e. which section) changes.
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
        if (version !== requestVersion.current) return; // stale — a newer section superseded this request
        const fresh = media.filter(m => !seenIds.current.has(m.id));
        fresh.forEach(m => seenIds.current.add(m.id));
        setItems(prev => (replace ? fresh : [...prev, ...fresh]));
        setHasNext(hasNextPage);
        setLoadState('done');
      })
      .catch(() => {
        if (version !== requestVersion.current) return;
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
    <div className="min-h-screen bg-void">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_80%_100%_at_10%_0%,rgba(122,37,48,0.22),transparent_65%)]" />

        <div className="relative px-5 pt-10 pb-8">
          <button
            onClick={() => nav('/anime')}
            className="flex items-center gap-1.5 font-mono text-[11px] text-ink-faint
              hover:text-ink transition-colors mb-6"
          >
            <ChevronLeft size={13} strokeWidth={2.2} />
            Back to Anime
          </button>

          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint/60
            flex items-center gap-1.5 mb-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
            Live from AniList
          </span>
          <h1 className="font-serif text-[38px] md:text-[52px] font-semibold tracking-tight leading-none text-ink mb-2">
            {params.title}
          </h1>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-void to-transparent pointer-events-none" />
      </div>

      <div className="px-5 pb-24">
        {loadState === 'error' && items.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-mono text-sm text-ink-faint">
              Failed to load —{' '}
              <button onClick={() => loadPage(1, true)} className="text-maroon-bright hover:underline">retry</button>
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3.5">
          {items.map(anime => (
            <AniCard key={anime.id} anime={anime} />
          ))}
          {(loadState === 'loading' || loadState === 'more') &&
            Array.from({ length: loadState === 'loading' ? 12 : 6 }).map((_, i) => (
              <GlassCardSkeleton key={`sk-${i}`} fluid />
            ))
          }
        </div>

        {loadState === 'done' && items.length === 0 && (
          <p className="font-mono text-sm text-ink-faint py-16 text-center">No anime found for this section.</p>
        )}

        {/* Infinite-scroll sentinel */}
        <div ref={sentinelRef} className="h-8" />

        {loadState === 'done' && !hasNext && items.length > 0 && (
          <p className="font-mono text-[11px] text-ink-faint/50 text-center py-6">You've reached the end.</p>
        )}
      </div>
    </div>
  );
}
