/**
 * SearchOverlay — full-screen search experience.
 * Features: autocomplete suggestions · All/Movies/Series/Anime tabs ·
 *           recent searches (localStorage) · trending · highlight matches ·
 *           150 ms debounce · useMemo filtering · zero setState in render.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { searchMulti } from '../services/tmdb';
import TmdbContentCard from './TmdbContentCard';
import type { TmdbNormalized } from '../services/tmdb';
import { api } from '../lib/api';

/* ── Constants ─────────────────────────────────────────────────────────── */

const TRENDING_TERMS = [
  'The Odyssey',
  'House of the Dragon',
  'Solo Leveling',
  'Interstellar',
  'The Mandalorian',
];

const TABS = [
  { label: 'All',    value: 'all'    },
  { label: 'Movies', value: 'MOVIE'  },
  { label: 'Series', value: 'SERIES' },
  { label: 'Anime',  value: 'ANIME'  },
];

const TYPE_LABEL: Record<string, string> = {
  MOVIE:  'Movie',
  SERIES: 'TV Series',
  ANIME:  'Anime',
};

const RECENT_KEY = 'allrated_recentSearches';
const MAX_RECENT = 10;

/* ── Helpers ────────────────────────────────────────────────────────────── */

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}

function saveRecent(term: string) {
  const prev = getRecent();
  const next = [term, ...prev.filter(s => s !== term)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function clearRecentStorage() {
  localStorage.removeItem(RECENT_KEY);
}

/** Wrap matching substring in a <mark> element. */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <mark key={i} style={{ background: '#E50914', color: '#fff', padding: '0 2px', borderRadius: 2 }}>{p}</mark>
          : p
      )}
    </>
  );
}

/* ── Skeleton card ─────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="w-full" style={{ aspectRatio: '2/3' }}>
      <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */

interface Props { open: boolean; onClose: () => void; }

export default function SearchOverlay({ open, onClose }: Props) {
  const [query,       setQuery]       = useState('');
  const [activeTab,   setActiveTab]   = useState('all');
   const [allResults,  setAllResults]  = useState<TmdbNormalized[]>([]);
   const [suggestions, setSuggestions] = useState<TmdbNormalized[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [showSuggs,   setShowSuggs]   = useState(false);  // suggestions dropdown visible
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const nav         = useNavigate();

  /* Focus on open */
  useEffect(() => {
    if (!open) return;
    setRecentSearches(getRecent());
    // Let mobile users see the search tab before the keyboard opens.
    if (window.matchMedia('(min-width: 768px)').matches) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  /* Reset everything on close */
  useEffect(() => {
    if (open) return;
    setQuery('');
    setAllResults([]);
    setSuggestions([]);
    setLoading(false);
    setShowSuggs(false);
    setActiveTab('all');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, [open]);

  /* ESC to close */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  /* Core search function — calls API, updates suggestions + full results */
  const doSearch = useCallback((q: string) => {
    if (abortRef.current) abortRef.current.abort();
    if (!q.trim() || q.trim().length < 2) {
      setAllResults([]);
      setSuggestions([]);
      setLoading(false);
      setShowSuggs(false);
      return;
    }
    setLoading(true);
    setShowSuggs(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
   searchMulti(q.trim())
     .then((results) => {
        if (ctrl.signal.aborted) return;
        setAllResults(results);
        setSuggestions(results.slice(0, 8));
        setLoading(false);
      })
      .catch((err: any) => {
        if (err?.name === 'AbortError' || ctrl.signal.aborted) return;
        setLoading(false);
      });
  }, []);

  /* Debounced input handler — 150 ms */
  const handleChange = useCallback((val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 150);
  }, [doSearch]);

  /* Dismiss suggestions and show full results grid */
  const showResults = useCallback(() => setShowSuggs(false), []);

  /* Save term to recent + update state */
  const persistRecent = useCallback((term: string) => {
    saveRecent(term);
    setRecentSearches(getRecent());
  }, []);

  /* Click on a suggestion → navigate to title */
  const handleSuggestionClick = useCallback(async (item: TmdbNormalized) => {
    persistRecent(item.name);
    try {
      const { id } = await api.titles.resolveTmdb(item.tmdbId, item.mediaType);
      onClose();
      nav(`/title/${id}`);
    } catch {
      nav(`/search?q=${encodeURIComponent(item.name)}`);
      onClose();
    }
  }, [persistRecent, onClose, nav]);

  /* Click recent/trending chip → fill query and search */
  const handleChipClick = useCallback((term: string) => {
    setQuery(term);
    setShowSuggs(false);
    persistRecent(term);
    doSearch(term);
  }, [doSearch, persistRecent]);

  /* Form submit → navigate to dedicated /search page */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    persistRecent(query.trim());
    nav(`/search?q=${encodeURIComponent(query.trim())}`);
    onClose();
  }, [query, persistRecent, nav, onClose]);

  /* Clear input */
  const handleClear = useCallback(() => {
    setQuery('');
    setAllResults([]);
    setSuggestions([]);
    setShowSuggs(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    inputRef.current?.focus();
  }, []);

  /* Clear recent searches */
  const handleClearRecent = useCallback(() => {
    clearRecentStorage();
    setRecentSearches([]);
  }, []);

  /* useMemo: tab-filtered results — no recompute on unrelated state */
  const filteredResults = useMemo(() => {
    if (activeTab === 'all') return allResults;
    return allResults.filter(item => item.type === activeTab);
  }, [allResults, activeTab]);

  /* useMemo: per-tab counts */
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allResults.length };
    for (const item of allResults) {
      counts[item.type] = (counts[item.type] || 0) + 1;
    }
    return counts;
  }, [allResults]);

  const hasQuery  = query.trim().length > 0;
  const showGrid  = hasQuery && !showSuggs;
  const showIdle  = !hasQuery;

  if (!open) return null;

  return (
    <m.div
      key="search-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] overflow-y-auto"
      style={{
        background: 'rgba(10,10,10,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      onClick={onClose}
    >
      {/* Inner container — stops propagation so clicking content doesn't close */}
      <div
        className="max-w-[900px] mx-auto px-4 pt-6 pb-24"
        onClick={e => e.stopPropagation()}
      >

        {/* ── Search bar ──────────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="
            flex items-center gap-3 px-4 py-3.5 rounded-2xl sticky top-4 z-10
            border border-white/[0.12] bg-white/[0.06]
            focus-within:border-white/[0.25] focus-within:bg-white/[0.08]
            transition-[border-color,background-color] duration-200
            shadow-[0_8px_32px_rgba(0,0,0,0.6)]
          "
        >
          <Search size={18} className="shrink-0 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleChange(e.target.value)}
            placeholder="Search movies, series, anime..."
            className="flex-1 bg-transparent border-none outline-none text-white text-[17px] placeholder:text-white/30"
            autoComplete="off"
            spellCheck={false}
          />
          {hasQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="text-white/35 hover:text-white/70 transition-colors text-[22px] leading-none"
              aria-label="Clear"
            >×</button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="
              shrink-0 px-3 py-1.5 rounded-lg text-sm
              bg-white/[0.06] border border-white/[0.08] text-white/50
              hover:bg-white/[0.10] hover:text-white transition-colors
            "
          >
            <span className="hidden sm:block">Close</span>
            <X size={14} className="sm:hidden" />
          </button>
        </form>

        {/* ── Suggestions dropdown ─────────────────────────────────────── */}
        <AnimatePresence>
          {showSuggs && hasQuery && (
            <m.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="mt-2 rounded-2xl overflow-hidden border border-white/[0.08]"
              style={{ background: 'rgba(20,20,20,0.98)' }}
            >
              {loading && (
                <div className="py-4 text-center text-white/35 text-sm">Searching…</div>
              )}

              {!loading && suggestions.length === 0 && query.trim().length >= 2 && (
                <div className="py-4 text-center text-white/35 text-sm">No results for "{query}"</div>
              )}

              {!loading && suggestions.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSuggestionClick(item)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.05] transition-colors text-left"
                >
                  <img
                    src={item.posterUrl}
                    alt=""
                    className="w-10 rounded object-cover shrink-0 bg-white/10"
                    style={{ height: 56 }}
                    onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-[15px] font-medium truncate">
                      <HighlightMatch text={item.name} query={query} />
                    </div>
                    <div className="text-white/45 text-[13px] mt-0.5">
                   {TYPE_LABEL[item.type] ?? item.type}
                      {item.year ? ` • ${item.year}` : ''}
                    </div>
                  </div>
                </button>
              ))}

              {!loading && suggestions.length > 0 && (
                <button
                  type="button"
                  onClick={showResults}
                  className="w-full py-3 text-sm text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors border-t border-white/[0.06] text-center"
                >
                  See all results for "<span className="text-white/70">{query}</span>"
                </button>
              )}
            </m.div>
          )}
        </AnimatePresence>

        {/* ── Tabs (only when showing results grid) ────────────────────── */}
        {showGrid && !loading && allResults.length > 0 && (
          <div className="flex gap-2 mt-5 pb-3 border-b border-white/[0.05] overflow-x-auto"
            style={{ scrollbarWidth: 'none' }}>
            {TABS.map(({ label, value }) => {
              const count = value === 'all' ? tabCounts.all : (tabCounts[value] || 0);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value)}
                  className={`
                    px-5 py-2 rounded-full text-sm border whitespace-nowrap
                    transition-all duration-150 shrink-0
                    ${activeTab === value
                      ? 'bg-white text-black border-white font-medium'
                      : 'bg-transparent text-white/50 border-white/[0.10] hover:border-white/[0.22] hover:text-white'
                    }
                  `}
                >
                  {label}{count > 0 ? ` (${count})` : ''}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Results grid ─────────────────────────────────────────────── */}
        {showGrid && (
          <div className="mt-5">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array(8).fill(null).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredResults.length > 0 ? (
              <>
                <p className="text-sm text-white/35 mb-4">
                  <span className="text-white font-medium">{filteredResults.length}</span>
                  {' '}result{filteredResults.length !== 1 ? 's' : ''}
                  {' '}for "<span className="text-white/55 italic">{query}</span>"
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredResults.map(t => (
                    <div key={t.id} onClick={onClose}>
                       <TmdbContentCard item={t} />
                    </div>
                  ))}
                </div>
              </>
            ) : allResults.length > 0 ? (
              /* Tab has 0 results but other tabs do */
              <div className="text-center py-16">
                <p className="text-base font-semibold text-white/60 mb-2">
                  No {TABS.find(t => t.value === activeTab)?.label} results for "{query}"
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className="mt-3 text-sm text-white/45 underline underline-offset-4 hover:text-white transition-colors"
                >
                  Show all results
                </button>
              </div>
            ) : (
              /* No results at all */
              <div className="flex flex-col items-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border border-white/[0.07]"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <Search size={22} className="text-white/20" />
                </div>
                <p className="text-base font-semibold text-white/70 mb-1.5">No results for "{query}"</p>
                <p className="text-sm text-white/35">Try different keywords or check your spelling</p>
              </div>
            )}
          </div>
        )}

        {/* Short query hint */}
        {hasQuery && query.trim().length === 1 && (
          <p className="text-center text-sm text-white/30 py-8">Keep typing…</p>
        )}

        {/* ── Idle state — recent + trending ───────────────────────────── */}
        {showIdle && (
          <div className="mt-8 space-y-8">

            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-[15px] font-semibold flex items-center gap-2">
                    <Clock size={15} className="text-white/40" /> Recent Searches
                  </h3>
                  <button
                    type="button"
                    onClick={handleClearRecent}
                    className="text-[13px] text-red-500 hover:text-red-400 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleChipClick(term)}
                      className="
                        flex items-center gap-2 px-4 py-2.5 rounded-full text-sm
                        border border-white/[0.10] bg-white/[0.03] text-white/55
                        hover:bg-white/[0.08] hover:text-white hover:border-white/[0.20]
                        transition-all duration-150
                      "
                    >
                      <Search size={12} className="shrink-0 text-white/30" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            <div>
              <h3 className="text-white text-[15px] font-semibold flex items-center gap-2 mb-3">
                <TrendingUp size={15} className="text-white/40" /> Trending Now
              </h3>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TERMS.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleChipClick(term)}
                    className="
                      flex items-center gap-2 px-4 py-2.5 rounded-full text-sm
                      border border-white/[0.10] bg-white/[0.03] text-white/55
                      hover:bg-white/[0.08] hover:text-white hover:border-white/[0.20]
                      transition-all duration-150
                    "
                  >
                    <span className="text-red-500 font-bold text-[11px]">{i + 1}</span>
                    {term}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </m.div>
  );
}
