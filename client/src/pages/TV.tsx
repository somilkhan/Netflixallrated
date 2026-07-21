import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tv, Inbox } from 'lucide-react';
import { api } from '../lib/api';
import ContentCard from '../components/ui/ContentCard';
import ContentRow from '../components/sections/ContentRow';
import { SkeletonCard } from '../components/ui/SkeletonCard';

const PAGE_LIMIT = 24;

function useInfiniteTitles(type: string, genre: string) {
  const [items,     setItems]     = useState<any[]>([]);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'more' | 'done'>('idle');
  const [hasNext,   setHasNext]   = useState(false);
  const pageRef     = useRef(1);
  const inFlight    = useRef(false);
  const versionRef  = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset on filter change
  const filterKey = `${type}|${genre}`;
  useEffect(() => {
    versionRef.current += 1;
    inFlight.current = false;
    pageRef.current = 1;
    setItems([]);
    setHasNext(false);
    setLoadState('idle');
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPage = useCallback((pageNum: number, replace: boolean, version: number) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoadState(pageNum === 1 ? 'loading' : 'more');
    const p: Record<string, string> = { type, limit: String(PAGE_LIMIT), page: String(pageNum) };
    if (genre) p.genre = genre;
    api.titles.list(p)
      .then((d: any) => {
        if (version !== versionRef.current) return;
        const titles = d.titles || [];
        setItems(prev => replace ? titles : [...prev, ...titles]);
        setHasNext(d.page < d.pages);
        setLoadState('done');
      })
      .catch(() => {
        if (version !== versionRef.current) return;
        setLoadState('done');
      })
      .finally(() => {
        if (version === versionRef.current) inFlight.current = false;
      });
  }, [type, genre]);

  // Kick off first page when idle
  useEffect(() => {
    if (loadState === 'idle') {
      loadPage(1, true, versionRef.current);
    }
  }, [loadState, loadPage]);

  // Infinite-scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNext && loadState === 'done' && !inFlight.current) {
          const next = pageRef.current + 1;
          pageRef.current = next;
          loadPage(next, false, versionRef.current);
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNext, loadState, loadPage]);

  return { items, loadState, hasNext, sentinelRef };
}

export default function TV() {
  const nav = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genreList, setGenreList] = useState<string[]>([]);
  // Genre-section preview rows (home-style, limited to 20 per genre — correct)
  const [genreSections, setGenreSections] = useState<Record<string, any[]>>({});

  useEffect(() => {
    api.titles.genres()
      .then(({ genres }: { genres: { genre: string; count: number }[] }) => {
        setGenreList(genres.slice(0, 12).map(g => g.genre));
      })
      .catch(() => {});
  }, []);

  // Load preview rows for genres (intentionally limited — these are horizontal scrollers)
  useEffect(() => {
    if (selectedGenre || genreList.length === 0) return;
    Promise.all(
      genreList.map(g =>
        api.titles.list({ type: 'SERIES', genre: g, limit: '20' })
          .then(d => [g, d.titles || []] as [string, any[]])
          .catch(() => [g, []] as [string, any[]])
      )
    ).then(results => {
      setGenreSections(Object.fromEntries(results.filter(([, t]) => t.length > 0)));
    });
  }, [selectedGenre, genreList]);

  // All shows with infinite scroll (either filtered by genre, or unfiltered)
  const { items: all, loadState, hasNext, sentinelRef } = useInfiniteTitles('SERIES', selectedGenre);
  const loading = loadState === 'loading';

  return (
    <div className="min-h-screen">
      {/* Header — bingr style */}
      <div className="relative overflow-hidden border-b border-[#1a1a1a]">
        <div className="relative px-5 pt-10 pb-7">
          <div className="flex items-center gap-3 mb-1.5">
            <Tv size={20} className="text-white shrink-0" strokeWidth={1.8} />
            <h1 className="font-sans text-[28px] font-bold tracking-tight text-white leading-none">TV Shows</h1>
          </div>
          <p className="font-sans text-[13.5px] text-[#666] ml-[31px]">
            Series, dramas, documentaries &amp; more
          </p>
        </div>
      </div>

      {/* Genre filter pills — bingr style */}
      <div className="px-5 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-b border-[#1a1a1a]">
        <button
          onClick={() => setSelectedGenre('')}
          className={`shrink-0 font-sans text-[12px] px-4 py-1.5 rounded-full border transition-[background-color,border-color,color] duration-200 ${
            !selectedGenre ? 'bg-white text-black border-white' : 'bg-transparent border-[#333] text-[#888] hover:text-white hover:border-[#555]'
          }`}
        >All</button>
        {genreList.map(g => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g === selectedGenre ? '' : g)}
            className={`shrink-0 font-sans text-[12px] px-4 py-1.5 rounded-full border transition-[background-color,border-color,color] duration-200 ${
              selectedGenre === g ? 'bg-white text-black border-white' : 'bg-transparent border-[#333] text-[#888] hover:text-white hover:border-[#555]'
            }`}
          >{g}</button>
        ))}
      </div>

      {/* Filtered view (genre selected) */}
      {selectedGenre ? (
        <div className="px-5 pt-8">
          <div className="flex items-baseline gap-2 mb-5">
            <span className="font-sans text-[22px] font-semibold">{selectedGenre}</span>
            {!loading && <span className="font-mono text-[11px] text-ink-faint">{all.length} shows{hasNext ? '+' : ''}</span>}
          </div>
          {loading ? (
            <div className="flex flex-wrap gap-3.5">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : all.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-3.5">
                {all.map(t => <ContentCard key={t.id} title={t} />)}
                {loadState === 'more' &&
                  Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)
                }
              </div>
              <div ref={sentinelRef} className="h-8" />
              {loadState === 'done' && !hasNext && all.length > 0 && (
                <p className="font-mono text-[11px] text-ink-faint/50 text-center py-6 pb-24">
                  You've reached the end · {all.length} show{all.length !== 1 ? 's' : ''}
                </p>
              )}
            </>
          ) : (
            <div className="py-20 text-center">
              <Inbox size={36} className="mx-auto text-ink-faint/30 mb-4" />
              <p className="font-sans text-lg text-ink">No {selectedGenre} shows yet</p>
              <p className="text-ink-faint text-sm mt-1">Check back soon as the catalog grows</p>
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="px-5 pt-8 flex flex-wrap gap-3.5">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {all.length > 0 && (
            <>
              <ContentRow title="All TV Shows" viewAllPath="/search?q=&type=SERIES">
                {all.slice(0, 20).map(t => <ContentCard key={t.id} title={t} />)}
              </ContentRow>
              {/* Infinite-scroll sentinel placed after the first section row */}
              <div ref={sentinelRef} className="h-1" />
            </>
          )}
          {genreList.map(g => {
            const titles = genreSections[g];
            if (!titles || titles.length === 0) return null;
            return (
              <ContentRow key={g} title={g} viewAllPath={`/search?q=&type=SERIES&genre=${g}`}>
                {titles.map(t => <ContentCard key={t.id} title={t} />)}
              </ContentRow>
            );
          })}
          {all.length === 0 && Object.keys(genreSections).length === 0 && (
            <div className="py-20 text-center">
              <Tv size={40} className="mx-auto text-ink-faint/30 mb-5" strokeWidth={1.5} />
              <p className="font-sans text-xl font-semibold mb-2">No TV shows yet</p>
              <p className="text-ink-faint text-sm">
                The catalog is being populated.{' '}
                <button onClick={() => nav('/admin')} className="text-white/70 hover:text-white underline">Add shows</button>
                {' '}or wait for auto-sync.
              </p>
            </div>
          )}
        </>
      )}
      <div className="h-28" />
    </div>
  );
}
