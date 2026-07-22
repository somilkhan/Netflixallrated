/**
 * SearchResults — dedicated /search page.
 * Tabs: All · Movies · Series · Anime  with live counts.
 * Shareable URL: /search?q=iron&type=MOVIE
 */
import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, X, Film, Tv } from 'lucide-react';
import { m } from 'framer-motion';
import { searchMulti, hasTmdbKey } from '../services/tmdb';
import TmdbContentCard from '../components/TmdbContentCard';
import type { TmdbNormalized } from '../services/tmdb';

/* ── Skeleton card ─────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="w-full flex flex-col gap-2">
      <div
        className="w-full rounded-lg overflow-hidden relative"
        style={{ aspectRatio: '2/3', background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
      </div>
      <div className="h-3 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.05)', animation: 'shimmer 1.8s ease-in-out infinite' }} />
      <div className="h-2.5 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.8s ease-in-out 0.1s infinite' }} />
    </div>
  );
}

/* ── Tabs config ───────────────────────────────────────────────────────── */
const TABS = [
  { label: 'All',    value: '',       icon: null   },
  { label: 'Movies', value: 'MOVIE',  icon: Film   },
  { label: 'Series', value: 'SERIES', icon: Tv     },
];

export default function SearchResults() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  const [query,   setQuery]   = useState(params.get('q') || '');
  const [type,    setType]    = useState(params.get('type') || '');
  const [rawResults, setRawResults] = useState<TmdbNormalized[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const inputRef    = useRef<HTMLInputElement>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Tab-filtered results via useMemo — no re-filter on every render */
  const results = useMemo(() => {
    if (!type) return rawResults;
    return rawResults.filter((x: any) => x.type === type);
  }, [rawResults, type]);

  /* Per-tab counts */
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { '': rawResults.length };
    for (const item of rawResults) {
      counts[item.type] = (counts[item.type] || 0) + 1;
    }
    return counts;
  }, [rawResults]);

  function runSearch(q: string) {
    if (abortRef.current) abortRef.current.abort();
    if (!q.trim()) {
      setRawResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    searchMulti(q.trim())
      .then((results) => {
        if (ctrl.signal.aborted) return;
        setRawResults(results);
        setLoading(false);
      })
      .catch((err: any) => {
        if (err?.name === 'AbortError' || ctrl.signal.aborted) return;
        setRawResults([]);
        setLoading(false);
      });
  }

  /* Run search on mount if URL has a query param */
  useEffect(() => {
    const q = params.get('q') || '';
    if (q) {
      setQuery(q);
      runSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Debounced typing handler — 150 ms */
  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 150);
  };

  const handleClear = () => {
    setQuery('');
    setRawResults([]);
    setSearched(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(query);
    const p = new URLSearchParams();
    if (query.trim()) p.set('q', query.trim());
    if (type) p.set('type', type);
    nav(`/search?${p.toString()}`, { replace: true });
  };

  /* Change tab — client-side filter only, no new API call */
  const handleTab = (val: string) => {
    setType(val);
  };

  const isEmpty    = searched && !loading && results.length === 0;
  const hasResults = !loading && results.length > 0;

  return (
    <div
      className="min-h-screen px-4 md:px-6 py-8 max-w-[1300px] mx-auto"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      {!hasTmdbKey() && (
        <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-100/70">
          TMDB search is unavailable until <code>VITE_TMDB_API_KEY</code> is configured.
        </div>
      )}
      <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-white/30">
        Smart search powered by TMDB
      </p>
      {/* ── Search bar ─────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="relative mb-5 max-w-2xl">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none"
        />
         <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder="Search movies, series, anime..."
          className="
            w-full rounded-xl pl-10 pr-10 py-3.5 text-[15px] text-white
            border border-white/[0.09] outline-none
            placeholder:text-white/28
            focus:border-white/[0.22] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.04)]
            transition-[border-color,box-shadow] duration-200
          "
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors p-0.5"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </form>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-7 flex-wrap">
        {TABS.map(({ label, value, icon: Icon }) => {
          const count = tabCounts[value] ?? 0;
          return (
            <button
              key={value}
              onClick={() => handleTab(value)}
              className={`
                flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm border
                transition-[border-color,background-color,color] duration-150
                ${type === value
                  ? 'border-white/[0.28] text-white font-medium'
                  : 'border-white/[0.08] text-white/45 hover:text-white/80 hover:border-white/[0.18]'
                }
              `}
              style={type === value ? { background: 'rgba(255,255,255,0.11)' } : { background: 'rgba(255,255,255,0.03)' }}
            >
              {Icon && <Icon size={12} />}
              {label}
              {searched && count > 0 && (
                <span className={`text-[11px] ${type === value ? 'text-white/70' : 'text-white/30'}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Loading skeletons ─────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────── */}
      {hasResults && (
        <>
          <p className="text-sm text-white/35 mb-4">
            <span className="text-white font-medium">{results.length}</span>
            {' '}result{results.length !== 1 ? 's' : ''}
            {query && <> for <span className="text-white/55 italic">"{query}"</span></>}
          </p>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
           className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-5"
          >
            {results.map(t => (
              <TmdbContentCard key={`${t.mediaType}-${t.tmdbId}`} item={t} />
            ))}
          </m.div>
        </>
      )}

      {/* ── Empty: tab has 0 but all has some ─────────────────────── */}
      {isEmpty && rawResults.length > 0 && (
        <div className="text-center py-16">
          <p className="text-base font-semibold text-white/60 mb-2">
            No {TABS.find(t => t.value === type)?.label} results for "{query}"
          </p>
          <button
            type="button"
            onClick={() => setType('')}
            className="mt-2 text-sm text-white/45 underline underline-offset-4 hover:text-white transition-colors"
          >
            Show all results
          </button>
        </div>
      )}

      {/* ── Empty: no results at all ──────────────────────────────── */}
      {isEmpty && rawResults.length === 0 && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-white/[0.07]"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Search size={24} className="text-white/20" />
          </div>
          <p className="text-lg font-semibold text-white/75 mb-1.5">No results for "{query}"</p>
          <p className="text-sm text-white/35 mb-6">Try different keywords or browse a category</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-xs">
            {['Action', 'Drama', 'Sci-Fi', 'Comedy', 'Thriller', 'Horror'].map(g => (
              <button
                key={g}
                onClick={() => { setQuery(g); runSearch(g); }}
                className="text-xs px-3.5 py-2 rounded-full border border-white/[0.08] text-white/40 hover:border-white/[0.22] hover:text-white/75 transition-[border-color,color]"
              >
                {g}
              </button>
            ))}
          </div>
        </m.div>
      )}

      {/* ── Idle state ────────────────────────────────────────────── */}
      {!loading && !searched && !query && (
        <div className="py-10 text-center">
          <p className="text-lg font-semibold text-white/60 mb-2">Search the catalog</p>
          <p className="text-sm text-white/30 mb-7">Movies, TV shows, anime — all in one place</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-xs mx-auto">
            {['Action', 'Drama', 'Sci-Fi', 'Anime', 'Comedy', 'Thriller', 'Horror', 'Romance'].map(g => (
              <button
                key={g}
                onClick={() => { setQuery(g); runSearch(g); }}
                className="text-xs px-3.5 py-2 rounded-full border border-white/[0.08] text-white/40 hover:border-white/[0.22] hover:text-white/75 transition-[border-color,color]"
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
