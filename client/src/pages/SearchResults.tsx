/**
 * SearchResults — Phase 3 rebuild.
 * Responsive grid, text highlighting, FilterPanel integration,
 * better empty + loading states, 300ms debounce.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Film, Sword, X } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { searchAnime } from '../lib/anilist';
import { navigateToAnime } from '../lib/animeResolve';
import FilterPanel, { FilterState, DEFAULT_FILTERS } from '../components/FilterPanel';
import ContentCard from '../components/ui/ContentCard';

/* ── highlight matched text ─────────────────────────────────── */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-white/20 text-white rounded-[2px] px-[1px] not-italic">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

/* ── skeleton card ──────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="w-full" style={{ aspectRatio: '2/3' }}>
      <div className="w-full h-full rounded-lg bg-white/[0.06] overflow-hidden relative">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="h-3 rounded bg-white/[0.05] w-3/4" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
        <div className="h-2.5 rounded bg-white/[0.04] w-1/2" style={{ animation: 'shimmer 1.8s ease-in-out 0.15s infinite' }} />
      </div>
    </div>
  );
}

/* ── sort helper ────────────────────────────────────────────── */
function applySort(titles: any[], sort: string): any[] {
  const arr = [...titles];
  switch (sort) {
    case 'newest':
      return arr.sort((a, b) => (b.year || 0) - (a.year || 0));
    case 'rating':
      return arr.sort((a, b) => {
        const ra = a.rating || a.imdbRating || a.voteAverage || 0;
        const rb = b.rating || b.imdbRating || b.voteAverage || 0;
        return Number(rb) - Number(ra);
      });
    case 'popularity':
      return arr.sort((a, b) => (b.popularity || b.viewCount || 0) - (a.popularity || a.viewCount || 0));
    default:
      return arr; // relevance — keep API order
  }
}

/* ── filter helper ──────────────────────────────────────────── */
function applyFilters(titles: any[], f: FilterState): any[] {
  return titles.filter(t => {
    if (f.type && t.type !== f.type) return false;
    if (f.genres.length > 0 && !f.genres.some((g: string) => t.genres?.includes(g))) return false;
    if (f.yearMin && t.year && t.year < f.yearMin) return false;
    if (f.yearMax && t.year && t.year > f.yearMax) return false;
    const rating = t.rating || t.imdbRating || t.voteAverage;
    if (rating !== undefined) {
      const r = Number(rating);
      if (f.ratingMin > 0 && r < f.ratingMin) return false;
      if (f.ratingMax < 10 && r > f.ratingMax) return false;
    }
    return true;
  });
}

/* ── component ──────────────────────────────────────────────── */
export default function SearchResults() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const q = params.get('q') || '';

  const [query, setQuery] = useState(q);
  const [rawResults, setRawResults] = useState<any[]>([]);
  const [anilistResult, setAnilistResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* derived: filtered + sorted */
  const displayResults = applySort(applyFilters(rawResults, filters), filters.sort);

  /* active filter count badge */
  const activeFilterCount = [
    filters.type !== DEFAULT_FILTERS.type,
    filters.genres.length > 0,
    filters.yearMin !== DEFAULT_FILTERS.yearMin || filters.yearMax !== DEFAULT_FILTERS.yearMax,
    filters.ratingMin !== DEFAULT_FILTERS.ratingMin || filters.ratingMax !== DEFAULT_FILTERS.ratingMax,
    filters.sort !== DEFAULT_FILTERS.sort,
  ].filter(Boolean).length;

  /* load genre list */
  useEffect(() => {
    api.titles.genres()
      .then(({ genres: g }: { genres: { genre: string; count: number }[] }) => {
        setGenres(g.slice(0, 20).map(x => x.genre));
      })
      .catch(() => {});
  }, []);

  /* sync query from URL */
  useEffect(() => { setQuery(q); }, [q]);

  /* main search effect */
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    if (!q) {
      setRawResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    api.titles.liveSearch(q, ctrl.signal)
      .then((live: any) => {
        if (ctrl.signal.aborted) return;
        setRawResults(live.local || []);
        setLoading(false);
      })
      .catch((err: any) => {
        if (err?.name === 'AbortError' || ctrl.signal.aborted) return;
        setLoading(false);
      });

    return () => { ctrl.abort(); };
  }, [q]);

  /* anilist for anime searches */
  useEffect(() => {
    if (!q || filters.type !== 'ANIME') { setAnilistResult(null); return; }
    let cancelled = false;
    searchAnime(q)
      .then(data => { if (!cancelled) setAnilistResult(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [q, filters.type]);

  /* debounced URL update while typing */
  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length > 1) {
      debounceRef.current = setTimeout(() => {
        nav(`/search?q=${encodeURIComponent(val.trim())}`, { replace: true });
      }, 300);
    } else if (!val.trim()) {
      nav('/search', { replace: true });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) nav(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const clearQuery = useCallback(() => {
    setQuery('');
    nav('/search');
  }, [nav]);

  return (
    <div className="min-h-screen" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
      <div className="px-4 md:px-6 py-6 max-w-[1300px] mx-auto">

        {/* ── Search bar row ──────────────────────────────────────── */}
        <div className="flex gap-2.5 mb-5">
          <form onSubmit={handleSubmit} className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Search movies, series, anime..."
              className="
                w-full bg-white/[0.04] border border-white/[0.08] rounded-xl
                pl-10 pr-10 py-3.5 text-sm text-white
                placeholder:text-white/25
                outline-none focus:border-white/[0.22] focus:bg-white/[0.06]
                focus:shadow-[0_0_0_3px_rgba(255,255,255,0.05)]
                transition-[border-color,background-color,box-shadow] duration-200
              "
            />
            {query && (
              <button
                type="button"
                onClick={clearQuery}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                aria-label="Clear"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* Filter toggle */}
          <button
            onClick={() => setFilterOpen(o => !o)}
            className={`
              relative flex items-center gap-2 px-4 py-3.5 rounded-xl border text-sm
              transition-[border-color,background-color,color] duration-150
              ${filterOpen || activeFilterCount > 0
                ? 'border-white/[0.30] bg-white/[0.10] text-white'
                : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/[0.18] hover:text-white/85'}
            `}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="
                absolute -top-1.5 -right-1.5
                w-4.5 h-4.5 min-w-[18px] px-1
                flex items-center justify-center
                rounded-full bg-white text-black text-[9px] font-bold leading-none
              ">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Quick type pills ────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { label: 'All', value: '' },
            { label: 'Movies', icon: Film, value: 'MOVIE' },
            { label: 'TV Shows', value: 'SERIES' },
            { label: 'Anime', icon: Sword, value: 'ANIME' },
          ].map(({ label, icon: Icon, value }) => (
            <button
              key={value}
              onClick={() => setFilters(f => ({ ...f, type: value }))}
              className={`
                flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full border
                transition-[border-color,color,background-color] duration-150
                ${filters.type === value
                  ? 'bg-white/[0.10] border-white/[0.25] text-white font-medium'
                  : 'bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/75 hover:border-white/[0.15]'}
              `}
            >
              {Icon && <Icon size={11} />}
              {label}
            </button>
          ))}
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters({ ...DEFAULT_FILTERS })}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full border border-white/[0.10] text-white/40 hover:text-white/70 hover:border-white/[0.20] transition-colors"
            >
              <X size={10} /> Clear all
            </button>
          )}
        </div>

        {/* ── AniList best match ──────────────────────────────────── */}
        <AnimatePresence>
          {filters.type === 'ANIME' && q && anilistResult && (
            <m.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <p className="text-[11px] text-white/30 uppercase tracking-wider mb-3 font-mono">Best match · AniList</p>
              <div
                className="flex gap-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] max-w-lg cursor-pointer hover:border-white/[0.18] hover:bg-white/[0.05] transition-[border-color,background-color] duration-150"
                role="button" tabIndex={0}
                onClick={() => navigateToAnime(anilistResult, nav)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateToAnime(anilistResult, nav); }}}
              >
                {(anilistResult.coverImage?.large || anilistResult.coverImage?.extraLarge) && (
                  <img
                    src={anilistResult.coverImage.extraLarge || anilistResult.coverImage.large}
                    alt={anilistResult.title.romaji}
                    loading="lazy" decoding="async"
                    className="w-[68px] h-[96px] rounded-lg object-cover border border-white/[0.08] shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-sm font-semibold leading-tight">
                    <HighlightText text={anilistResult.title.english || anilistResult.title.romaji} query={q} />
                  </p>
                  {anilistResult.title.english && anilistResult.title.romaji && (
                    <p className="text-[11px] text-white/35">{anilistResult.title.romaji}</p>
                  )}
                  <div className="text-[11px] text-white/30 flex flex-wrap gap-1.5 items-center">
                    {anilistResult.startDate?.year && <span>{anilistResult.startDate.year}</span>}
                    {anilistResult.episodes && <><span>·</span><span>{anilistResult.episodes} eps</span></>}
                    {anilistResult.averageScore && (
                      <><span>·</span><span className="bg-white/[0.07] border border-white/[0.12] rounded px-1.5 py-px">
                        ★ {(anilistResult.averageScore / 10).toFixed(1)}
                      </span></>
                    )}
                  </div>
                  {anilistResult.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {anilistResult.genres.slice(0, 4).map((g: string) => (
                        <span key={g} className="text-[10px] px-1.5 py-px rounded border border-white/[0.08] text-white/30">{g}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* ── Results header ──────────────────────────────────────── */}
        {q && !loading && rawResults.length > 0 && (
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-base font-semibold text-white">
              {displayResults.length}
            </span>
            <span className="text-sm text-white/35">
              result{displayResults.length !== 1 ? 's' : ''}
              {q && <> for <span className="text-white/55 italic">"{q}"</span></>}
              {activeFilterCount > 0 && <span className="text-white/30"> · filtered</span>}
            </span>
          </div>
        )}

        {/* ── Loading skeletons ───────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Results grid ────────────────────────────────────────── */}
        {!loading && displayResults.length > 0 && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
          >
            {displayResults.map(t => (
              <ContentCard key={t.id} title={t} fluid highlightQuery={q || undefined} />
            ))}
          </m.div>
        )}

        {/* ── No results state ────────────────────────────────────── */}
        {!loading && q && displayResults.length === 0 && rawResults.length === 0 && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5">
              <Search size={30} className="text-white/20" />
            </div>
            <p className="text-xl font-semibold text-white/75 mb-2">No results for "{q}"</p>
            <p className="text-sm text-white/35 mb-7 max-w-xs leading-relaxed">
              Try different keywords, check for typos, or browse by category
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-xs">
              {['Action', 'Drama', 'Sci-Fi', 'Anime', 'Comedy', 'Thriller'].map(g => (
                <button
                  key={g}
                  onClick={() => nav(`/search?q=${g}`)}
                  className="text-xs px-3.5 py-2 rounded-full border border-white/[0.08] text-white/40 hover:border-white/[0.22] hover:text-white/75 transition-[border-color,color]"
                >
                  {g}
                </button>
              ))}
            </div>
          </m.div>
        )}

        {/* ── Filtered to empty ───────────────────────────────────── */}
        {!loading && q && displayResults.length === 0 && rawResults.length > 0 && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
              <SlidersHorizontal size={22} className="text-white/20" />
            </div>
            <p className="text-lg font-semibold text-white/70 mb-2">No matches with current filters</p>
            <p className="text-sm text-white/35 mb-5">
              {rawResults.length} result{rawResults.length !== 1 ? 's' : ''} found — adjust filters to see them
            </p>
            <button
              onClick={() => setFilters({ ...DEFAULT_FILTERS })}
              className="px-5 py-2.5 rounded-full border border-white/[0.12] text-sm text-white/55 hover:text-white hover:border-white/[0.25] transition-[border-color,color]"
            >
              Clear all filters
            </button>
          </m.div>
        )}

        {/* ── Empty state (no query) ──────────────────────────────── */}
        {!q && !loading && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center"
          >
            <p className="text-xl font-semibold text-white/70 mb-2">Search the catalog</p>
            <p className="text-sm text-white/35 mb-8">Movies, TV shows, anime — all in one place</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
              {['Action', 'Drama', 'Sci-Fi', 'Anime', 'Comedy', 'Thriller', 'Horror', 'Romance'].map(g => (
                <button
                  key={g}
                  onClick={() => nav(`/search?q=${g}`)}
                  className="text-xs px-3.5 py-2 rounded-full border border-white/[0.08] text-white/40 hover:border-white/[0.22] hover:text-white/75 transition-[border-color,color]"
                >
                  {g}
                </button>
              ))}
            </div>
          </m.div>
        )}
      </div>

      {/* ── Advanced filter panel ───────────────────────────────────── */}
      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
        genres={genres}
      />
    </div>
  );
}
