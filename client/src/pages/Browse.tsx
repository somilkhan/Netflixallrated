/**
 * Browse — full catalog grid with filter pills.
 * Layout: Filter bar → 4-col desktop / 3-col tablet / 2-col mobile grid → pagination.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { api } from '../lib/api';
import ContentCard from '../components/ui/ContentCard';
import { FilterPill } from '../components/ui/FilterPill';
import { SkeletonCard } from '../components/ui/SkeletonCard';

const TYPE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Movies', value: 'MOVIE' },
  { label: 'Series', value: 'SERIES' },
  { label: 'Anime', value: 'ANIME' },
] as const;

const SORT_FILTERS = [
  { label: 'Popular', value: 'popular' },
  { label: 'Recent', value: 'recent' },
  { label: 'Top Rated', value: 'rating' },
] as const;

const PAGE_SIZE = 40;

export default function Browse() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const typeParam  = searchParams.get('type')  ?? '';
  const sortParam  = searchParams.get('sort')  ?? 'popular';
  const genreParam = searchParams.get('genre') ?? '';
  const pageParam  = parseInt(searchParams.get('page') ?? '1', 10);

  const [titles,   setTitles]   = useState<any[]>([]);
  const [total,    setTotal]    = useState(0);
  const [genres,   setGenres]   = useState<string[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Fetch genres once
  useEffect(() => {
    api.titles.genres()
      .then(({ genres: g }: { genres: { genre: string }[] }) =>
        setGenres(g.map(x => x.genre).slice(0, 14)),
      )
      .catch(() => {});
  }, []);

  // Fetch titles when filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTitles([]);

    const params: Record<string, string> = {
      limit: String(PAGE_SIZE),
      offset: String((pageParam - 1) * PAGE_SIZE),
    };
    if (typeParam)  params.type  = typeParam;
    if (sortParam)  params.sort  = sortParam;
    if (genreParam) params.genre = genreParam;

    api.titles.list(params)
      .then((data: any) => {
        if (cancelled) return;
        setTitles(data.titles ?? []);
        setTotal(data.total ?? data.titles?.length ?? 0);
      })
      .catch(() => { if (!cancelled) setTitles([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [typeParam, sortParam, genreParam, pageParam]);

  const setFilter = useCallback((key: string, value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete('page'); // reset page on filter change
      return next;
    });
  }, [setSearchParams]);

  const setPage = useCallback((p: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const pageRange = useMemo(() => {
    const delta = 2;
    const range: (number | 'ellipsis')[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= pageParam - delta && i <= pageParam + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== 'ellipsis') {
        range.push('ellipsis');
      }
    }
    return range;
  }, [totalPages, pageParam]);

  const heading = [
    genreParam || '',
    typeParam === 'MOVIE' ? 'Movies' : typeParam === 'SERIES' ? 'TV Shows' : typeParam === 'ANIME' ? 'Anime' : '',
  ].filter(Boolean).join(' · ') || 'Browse All';

  return (
    <div className="min-h-screen pb-32 pt-20">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="px-4 md:px-6 pt-4 pb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{heading}</h1>
        {total > 0 && !loading && (
          <p className="text-sm text-white/40 mt-0.5">{total.toLocaleString()} titles</p>
        )}
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 py-3 px-4 md:px-6 border-b border-white/[0.06]"
        style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        
        {/* Type filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          <div className="flex items-center gap-1.5 shrink-0 mr-1">
            <SlidersHorizontal size={14} className="text-white/40" />
          </div>

          {TYPE_FILTERS.map(f => (
            <FilterPill
              key={f.value}
              label={f.label}
              active={typeParam === f.value}
              onClick={() => setFilter('type', f.value)}
            />
          ))}

          <div className="w-px bg-white/[0.08] mx-1 self-stretch shrink-0" />

          {SORT_FILTERS.map(f => (
            <FilterPill
              key={f.value}
              label={f.label}
              active={sortParam === f.value}
              onClick={() => setFilter('sort', f.value)}
            />
          ))}
        </div>

        {/* Genre pills */}
        {genres.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pt-1">
            <FilterPill
              label="All Genres"
              active={!genreParam}
              onClick={() => setFilter('genre', '')}
            />
            {genres.map(g => (
              <FilterPill
                key={g}
                label={g}
                active={genreParam === g}
                onClick={() => setFilter('genre', genreParam === g ? '' : g)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-6 pt-[88px]">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <SkeletonCard key={i} className="w-full" />
            ))}
          </div>
        ) : titles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
            <Film size={40} className="text-white/15" />
            <p className="text-xl font-semibold text-white">No titles found</p>
            <p className="text-sm text-white/40 max-w-sm">
              Try adjusting the filters or browse a different category.
            </p>
            <button
              type="button"
              onClick={() => nav('/browse')}
              className="mt-2 px-5 py-2 rounded-full bg-white/[0.08] border border-white/[0.12] text-sm text-white/70 hover:text-white hover:bg-white/[0.12] transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {titles.map(t => (
              <ContentCard key={t.id} title={t} className="w-full" />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-10 px-4 flex-wrap">
          <button
            type="button"
            onClick={() => setPage(pageParam - 1)}
            disabled={pageParam <= 1}
            className="
              flex items-center gap-1
              h-9 px-3 rounded-lg text-sm text-white/60
              border border-white/[0.08]
              hover:text-white hover:border-white/[0.16]
              disabled:opacity-30 disabled:pointer-events-none
              transition-colors
            "
          >
            <ChevronLeft size={14} />
            Prev
          </button>

          {pageRange.map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`ellipsis-${i}`} className="text-white/30 px-1">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`
                  h-9 w-9 rounded-lg text-sm font-medium
                  border transition-colors
                  ${pageParam === p
                    ? 'bg-white text-black border-white'
                    : 'text-white/60 border-white/[0.08] hover:text-white hover:border-white/[0.16]'
                  }
                `}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => setPage(pageParam + 1)}
            disabled={pageParam >= totalPages}
            className="
              flex items-center gap-1
              h-9 px-3 rounded-lg text-sm text-white/60
              border border-white/[0.08]
              hover:text-white hover:border-white/[0.16]
              disabled:opacity-30 disabled:pointer-events-none
              transition-colors
            "
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
