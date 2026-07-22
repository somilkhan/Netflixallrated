/**
 * SearchResults — clean, focused search page.
 * Single search bar, type filter pills, results grid. No frills.
 */
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, X, Film, Tv, Sword } from 'lucide-react';
import { m } from 'framer-motion';
import { api } from '../lib/api';
import ContentCard from '../components/ui/ContentCard';

/* ── skeleton card ──────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="w-full flex flex-col gap-2">
      <div
        className="w-full rounded-lg overflow-hidden relative bg-white/[0.06]"
        style={{ aspectRatio: '2/3' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
      </div>
      <div className="h-3 rounded bg-white/[0.05] w-3/4" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
      <div className="h-2.5 rounded bg-white/[0.04] w-1/2" style={{ animation: 'shimmer 1.8s ease-in-out 0.1s infinite' }} />
    </div>
  );
}

const TYPE_FILTERS = [
  { label: 'All',      value: '',       icon: null },
  { label: 'Movies',   value: 'MOVIE',  icon: Film },
  { label: 'TV Shows', value: 'SERIES', icon: Tv },
  { label: 'Anime',    value: 'ANIME',  icon: Sword },
];

export default function SearchResults() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  // Query lives in local state — no URL nav while typing prevents input flicker
  const [query, setQuery]     = useState(params.get('q') || '');
  const [type, setType]       = useState(params.get('type') || '');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false); // has a search been attempted

  const inputRef  = useRef<HTMLInputElement>(null);
  const abortRef  = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync URL param → local state on first load only
  useEffect(() => {
    const q = params.get('q') || '';
    if (q) {
      setQuery(q);
      runSearch(q, params.get('type') || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runSearch(q: string, t: string) {
    if (abortRef.current) abortRef.current.abort();
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    api.titles.liveSearch(q.trim(), ctrl.signal)
      .then((res: any) => {
        if (ctrl.signal.aborted) return;
        let local: any[] = res.local || [];
        if (t) local = local.filter((x: any) => x.type === t);
        setResults(local);
        setLoading(false);
      })
      .catch((err: any) => {
        if (err?.name === 'AbortError' || ctrl.signal.aborted) return;
        setResults([]);
        setLoading(false);
      });
  }

  // Debounced search as user types
  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(val, type);
    }, 300);
  };

  // Type filter pill click — re-run search immediately
  const handleType = (val: string) => {
    setType(val);
    runSearch(query, val);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(query, type);
    // Update URL so the result is shareable/bookmarkable
    const p = new URLSearchParams();
    if (query.trim()) p.set('q', query.trim());
    if (type) p.set('type', type);
    nav(`/search?${p.toString()}`, { replace: true });
  };

  const isEmpty   = searched && !loading && results.length === 0;
  const hasResults = !loading && results.length > 0;

  return (
    <div
      className="min-h-screen px-4 md:px-6 py-8 max-w-[1300px] mx-auto"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      {/* ── Search bar ────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="relative mb-5 max-w-2xl">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none"
        />
        <input
          ref={inputRef}
          autoFocus
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder="Search movies, series, anime..."
          className="
            w-full bg-white/[0.05] border border-white/[0.09] rounded-xl
            pl-10 pr-10 py-3.5 text-[15px] text-white
            placeholder:text-white/28
            outline-none
            focus:border-white/[0.22] focus:bg-white/[0.07]
            focus:shadow-[0_0_0_3px_rgba(255,255,255,0.04)]
            transition-[border-color,background-color,box-shadow] duration-200
          "
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

      {/* ── Type filter pills ─────────────────────────────────────── */}
      <div className="flex gap-2 mb-7 flex-wrap">
        {TYPE_FILTERS.map(({ label, value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => handleType(value)}
            className={`
              flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm border
              transition-[border-color,background-color,color] duration-150
              ${type === value
                ? 'bg-white/[0.11] border-white/[0.28] text-white font-medium'
                : 'bg-white/[0.03] border-white/[0.08] text-white/45 hover:text-white/80 hover:border-white/[0.18]'
              }
            `}
          >
            {Icon && <Icon size={12} />}
            {label}
          </button>
        ))}
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
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
          >
            {results.map(t => (
              <ContentCard key={t.id} title={t} fluid highlightQuery={query || undefined} />
            ))}
          </m.div>
        </>
      )}

      {/* ── No results ────────────────────────────────────────────── */}
      {isEmpty && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
            <Search size={24} className="text-white/20" />
          </div>
          <p className="text-lg font-semibold text-white/75 mb-1.5">No results for "{query}"</p>
          <p className="text-sm text-white/35 mb-6">Try different keywords or browse a category</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-xs">
            {['Action', 'Drama', 'Sci-Fi', 'Comedy', 'Thriller', 'Horror'].map(g => (
              <button
                key={g}
                onClick={() => { setQuery(g); runSearch(g, type); }}
                className="text-xs px-3.5 py-2 rounded-full border border-white/[0.08] text-white/40 hover:border-white/[0.22] hover:text-white/75 transition-[border-color,color]"
              >
                {g}
              </button>
            ))}
          </div>
        </m.div>
      )}

      {/* ── Idle state (nothing typed yet) ────────────────────────── */}
      {!loading && !searched && !query && (
        <div className="py-10 text-center">
          <p className="text-lg font-semibold text-white/60 mb-2">Search the catalog</p>
          <p className="text-sm text-white/30 mb-7">Movies, TV shows, anime — all in one place</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-xs mx-auto">
            {['Action', 'Drama', 'Sci-Fi', 'Anime', 'Comedy', 'Thriller', 'Horror', 'Romance'].map(g => (
              <button
                key={g}
                onClick={() => { setQuery(g); runSearch(g, type); }}
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
