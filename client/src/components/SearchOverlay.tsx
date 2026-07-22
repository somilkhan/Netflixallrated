/**
 * SearchOverlay — Phase 3 rebuild.
 * Full-screen glassmorphism overlay with recent searches, trending pills,
 * 300ms debounce live results, and full-grid inline display.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Mic, Clock, TrendingUp, ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import ContentCard from './ui/ContentCard';

/* ── constants ────────────────────────────────────────────────── */
const TRENDING = ['Inception', 'Attack on Titan', 'Breaking Bad', 'Oppenheimer', 'Naruto', 'The Bear', 'Dune', 'One Piece'];
const RECENT_KEY = 'allrated_recent_searches';
const MAX_RECENT = 6;

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(q: string) {
  const prev = getRecent().filter(s => s.toLowerCase() !== q.toLowerCase());
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
}
function clearRecent() {
  localStorage.removeItem(RECENT_KEY);
}

/* ── skeleton cards ───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="shrink-0 w-full" style={{ aspectRatio: '2/3' }}>
      <div className="w-full h-full rounded-lg bg-white/[0.06] overflow-hidden relative">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}

/* ── main component ───────────────────────────────────────────── */
interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const nav = useNavigate();

  /* focus + state reset on open */
  useEffect(() => {
    if (!open) return;
    setRecentSearches(getRecent());
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  /* clear state when closed */
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setLoading(false);
    }
  }, [open]);

  /* ESC to close */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  /* live search with 300ms debounce */
  const doSearch = useCallback((q: string) => {
    if (abortRef.current) abortRef.current.abort();
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    api.titles.liveSearch(q.trim(), ctrl.signal)
      .then((res: any) => {
        if (ctrl.signal.aborted) return;
        setResults((res.local || []).slice(0, 20));
        setLoading(false);
      })
      .catch((err: any) => {
        if (err?.name === 'AbortError' || ctrl.signal.aborted) return;
        setLoading(false);
      });
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const navigateToSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    saveRecent(q.trim());
    nav(`/search?q=${encodeURIComponent(q.trim())}`);
    onClose();
    setQuery('');
  }, [nav, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToSearch(query);
  };

  const handleClearRecent = () => {
    clearRecent();
    setRecentSearches([]);
  };

  const hasQuery = query.trim().length > 0;
  const showRecent = !hasQuery && recentSearches.length > 0;
  const showTrending = !hasQuery;
  const showResults = hasQuery;

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="search-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
          style={{ WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)', background: 'rgba(10,10,10,0.97)' }}
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <m.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex-none px-4 pt-safe-top md:px-8"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
          >
            {/* Search bar */}
            <form onSubmit={handleSubmit} className="relative flex items-center gap-3 mt-2">
              <div className="
                flex-1 flex items-center gap-3
                rounded-2xl px-4 py-4
                border border-white/[0.12]
                bg-white/[0.06]
                shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                focus-within:border-white/[0.25] focus-within:bg-white/[0.08]
                transition-[border-color,background-color] duration-200
              ">
                <Search size={18} className="shrink-0 text-white/45" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => handleChange(e.target.value)}
                  placeholder="Search movies, series, anime..."
                  className="flex-1 bg-transparent border-none outline-none text-white text-[17px] placeholder:text-white/30"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                <div className="flex items-center gap-2 shrink-0">
                  {hasQuery ? (
                    <button
                      type="button"
                      onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                      className="text-white/35 hover:text-white/70 transition-colors p-0.5"
                      aria-label="Clear"
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <span className="text-white/25" aria-label="Voice search (decorative)">
                      <Mic size={16} />
                    </span>
                  )}
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="
                  shrink-0 flex items-center justify-center
                  w-12 h-12 rounded-xl
                  bg-white/[0.06] border border-white/[0.08]
                  text-white/60 hover:text-white hover:bg-white/[0.10]
                  transition-[color,background-color] duration-150
                  text-sm font-mono tracking-wide
                "
                aria-label="Close search"
              >
                <span className="hidden sm:block text-[10px]">ESC</span>
                <X size={16} className="sm:hidden" />
              </button>
            </form>

            {/* Keyboard shortcut hint */}
            <p className="text-center text-[11px] text-white/18 mt-2 mb-4">
              Press <kbd className="font-mono">⌘K</kbd> anytime · <kbd className="font-mono">Enter</kbd> for full results
            </p>
          </m.div>

          {/* ── Scrollable body ─────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 md:px-8">

            {/* ── No query: recent + trending ─────────────────────────── */}
            {!hasQuery && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                {/* Recent searches */}
                {showRecent && (
                  <div className="mb-7">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] uppercase tracking-wider text-white/35 font-mono flex items-center gap-1.5">
                        <Clock size={11} /> Recent
                      </span>
                      <button
                        onClick={handleClearRecent}
                        className="text-[11px] text-white/30 hover:text-white/60 transition-colors duration-150"
                      >
                        Clear History
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {recentSearches.map(s => (
                        <button
                          key={s}
                          onClick={() => navigateToSearch(s)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors duration-150 text-left group"
                        >
                          <Clock size={13} className="text-white/25 shrink-0" />
                          <span className="flex-1 text-sm text-white/65 group-hover:text-white/90 transition-colors">{s}</span>
                          <ArrowUpRight size={13} className="text-white/20 group-hover:text-white/45 transition-colors shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending searches */}
                {showTrending && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-white/35 font-mono flex items-center gap-1.5 mb-3">
                      <TrendingUp size={11} /> Trending
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {TRENDING.map(t => (
                        <button
                          key={t}
                          onClick={() => navigateToSearch(t)}
                          className="
                            inline-flex items-center gap-1.5
                            px-3.5 py-2 rounded-full
                            border border-white/[0.10] bg-white/[0.04]
                            text-sm text-white/60
                            hover:border-white/[0.25] hover:bg-white/[0.08] hover:text-white
                            transition-[border-color,background-color,color] duration-150
                          "
                        >
                          <TrendingUp size={10} className="text-white/30" />
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </m.div>
            )}

            {/* ── Has query: live results ─────────────────────────────── */}
            {showResults && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                {/* Loading skeletons */}
                {loading && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                    {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                )}

                {/* Results */}
                {!loading && results.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-white/40">
                        <span className="text-white font-medium">{results.length}</span> results for
                        {' '}<span className="text-white/70 italic">"{query}"</span>
                      </p>
                      <button
                        onClick={() => navigateToSearch(query)}
                        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                      >
                        <SlidersHorizontal size={11} /> Full results & filters
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                      {results.map(t => (
                        <div key={t.id} onClick={() => { saveRecent(query); onClose(); }} className="w-full">
                          <ContentCard title={t} fluid />
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => navigateToSearch(query)}
                        className="
                          inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                          border border-white/[0.12] bg-white/[0.05]
                          text-sm text-white/60 hover:text-white hover:bg-white/[0.10] hover:border-white/[0.22]
                          transition-[color,background-color,border-color] duration-150
                        "
                      >
                        See all results for "{query}" <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </>
                )}

                {/* Empty state */}
                {!loading && results.length === 0 && query.trim().length >= 2 && (
                  <m.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
                      <Search size={24} className="text-white/25" />
                    </div>
                    <p className="text-lg font-semibold text-white/80 mb-1.5">No results for "{query}"</p>
                    <p className="text-sm text-white/35 max-w-xs">
                      Try different keywords or browse by genre
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center mt-5">
                      {TRENDING.slice(0, 4).map(t => (
                        <button
                          key={t}
                          onClick={() => handleChange(t)}
                          className="text-xs px-3 py-1.5 rounded-full border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/[0.18] transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </m.div>
                )}

                {/* Short query hint */}
                {!loading && query.trim().length === 1 && (
                  <p className="text-center text-sm text-white/30 py-8">Keep typing…</p>
                )}
              </m.div>
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
