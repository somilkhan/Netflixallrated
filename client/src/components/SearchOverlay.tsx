/**
 * SearchOverlay — lightweight command palette.
 * Types → 300ms debounce → live results.
 * Enter / "See all" → navigates to /search page.
 * ESC or backdrop click → closes.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import ContentCard from './ui/ContentCard';

const SUGGESTIONS = ['Action', 'Drama', 'Sci-Fi', 'Anime', 'Comedy', 'Thriller'];

function SkeletonCard() {
  return (
    <div className="w-full" style={{ aspectRatio: '2/3' }}>
      <div className="w-full h-full rounded-lg bg-white/[0.06] overflow-hidden relative">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05) 50%, transparent)',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const nav = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) { setQuery(''); setResults([]); setLoading(false); }
  }, [open]);

  // ESC to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const doSearch = useCallback((q: string) => {
    if (abortRef.current) abortRef.current.abort();
    if (!q.trim() || q.trim().length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    api.titles.liveSearch(q.trim(), ctrl.signal)
      .then((res: any) => {
        if (ctrl.signal.aborted) return;
        setResults((res.local || []).slice(0, 12));
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

  const goToSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    nav(`/search?q=${encodeURIComponent(q.trim())}`);
    onClose();
  }, [nav, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToSearch(query);
  };

  const hasQuery   = query.trim().length > 0;
  const showResult = hasQuery && (loading || results.length > 0);
  const showEmpty  = hasQuery && !loading && results.length === 0 && query.trim().length >= 2;

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
          style={{
            background: 'rgba(10,10,10,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* ── Search bar ──────────────────────────────────────── */}
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-none px-4 md:px-8 pt-6 md:pt-10 pb-4"
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <div className="
                flex-1 flex items-center gap-3 px-4 py-4 rounded-2xl
                border border-white/[0.12] bg-white/[0.06]
                focus-within:border-white/[0.25] focus-within:bg-white/[0.08]
                transition-[border-color,background-color] duration-200
                shadow-[0_8px_32px_rgba(0,0,0,0.5)]
              ">
                <Search size={18} className="shrink-0 text-white/40" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => handleChange(e.target.value)}
                  placeholder="Search movies, series, anime..."
                  className="flex-1 bg-transparent border-none outline-none text-white text-[17px] placeholder:text-white/28"
                  autoComplete="off"
                  spellCheck={false}
                />
                {hasQuery && (
                  <button
                    type="button"
                    onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                    className="text-white/35 hover:text-white/70 transition-colors"
                    aria-label="Clear"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="
                  shrink-0 w-12 h-12 flex items-center justify-center rounded-xl
                  bg-white/[0.06] border border-white/[0.08] text-white/50
                  hover:bg-white/[0.10] hover:text-white
                  transition-[background-color,color] duration-150
                "
                aria-label="Close"
              >
                <span className="hidden sm:block text-[10px] font-mono">ESC</span>
                <X size={16} className="sm:hidden" />
              </button>
            </form>
          </m.div>

          {/* ── Body ────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-8 pb-8">

            {/* Suggestions (idle state) */}
            {!hasQuery && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
              >
                <p className="text-[11px] uppercase tracking-wider text-white/30 font-mono mb-3">Browse by genre</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s); doSearch(s); }}
                      className="
                        px-3.5 py-2 rounded-full border border-white/[0.09] bg-white/[0.04]
                        text-sm text-white/55
                        hover:border-white/[0.22] hover:bg-white/[0.08] hover:text-white
                        transition-[border-color,background-color,color] duration-150
                      "
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </m.div>
            )}

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Results */}
            {showResult && !loading && results.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-white/35">
                    <span className="text-white font-medium">{results.length}</span> results
                  </p>
                  <button
                    onClick={() => goToSearch(query)}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/75 transition-colors"
                  >
                    See all results <ArrowRight size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {results.map(t => (
                    <div key={t.id} onClick={onClose}>
                      <ContentCard title={t} fluid highlightQuery={query || undefined} />
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <button
                    onClick={() => goToSearch(query)}
                    className="
                      inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                      border border-white/[0.10] bg-white/[0.04] text-sm text-white/55
                      hover:border-white/[0.22] hover:bg-white/[0.08] hover:text-white
                      transition-[border-color,background-color,color] duration-150
                    "
                  >
                    See all results for "{query}" <ArrowRight size={13} />
                  </button>
                </div>
              </>
            )}

            {/* Empty state */}
            {showEmpty && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center py-16 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
                  <Search size={22} className="text-white/20" />
                </div>
                <p className="text-base font-semibold text-white/70 mb-1.5">No results for "{query}"</p>
                <p className="text-sm text-white/35">Try different keywords</p>
              </m.div>
            )}

            {/* Short query hint */}
            {hasQuery && query.trim().length === 1 && (
              <p className="text-center text-sm text-white/28 py-8">Keep typing…</p>
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
