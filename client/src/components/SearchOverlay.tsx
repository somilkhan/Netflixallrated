/**
 * SearchOverlay — full-screen command-palette.
 * Uses parent App-level LazyMotion — no nested context.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';

const placeholders = ['Movies, shows, anime…', 'Search the catalog…', 'Find something to watch…'];

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const iv = setInterval(() => setPhIdx(i => (i + 1) % placeholders.length), 3000);
    return () => clearInterval(iv);
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      nav(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
      setQuery('');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center px-5"
          style={{ paddingTop: '13vh' }}
        >
          {/* Backdrop — solid dark, no blur (blur is expensive on mobile) */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
            aria-hidden
          />

          {/* Search card */}
          <m.form
            onSubmit={submit}
            initial={{ opacity: 0, y: -14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[580px]"
          >
            <div className="
              flex items-center gap-3 border rounded-2xl px-4 py-4
              bg-[#111215] border-white/[0.12]
              shadow-[0_32px_80px_-12px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.04)]
            ">
              <Search size={16} className="shrink-0 text-white/45" />

              <div className="relative flex-1 min-w-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-white text-[16px] font-sans"
                  aria-label="Search"
                />
                {!query && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[16px] text-white/25 pointer-events-none select-none">
                    {placeholders[phIdx]}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {query && (
                  <>
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="text-white/35 hover:text-white/70 transition-colors duration-150"
                      aria-label="Clear"
                    >
                      <X size={14} />
                    </button>
                    <button
                      type="submit"
                      className="
                        flex items-center gap-1.5 rounded-xl px-3 py-1.5
                        bg-white text-black text-[12px] font-sans font-semibold
                        hover:bg-white/88 transition-colors duration-150
                        active:scale-95
                      "
                      aria-label="Search"
                    >
                      Go <ArrowRight size={11} />
                    </button>
                  </>
                )}
                {!query && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="
                      font-mono text-[9px] text-white/30 border border-white/[0.08]
                      rounded-lg px-2 py-1
                      hover:text-white/55 hover:border-white/[0.16]
                      transition-all duration-150 tracking-wide
                    "
                  >
                    ESC
                  </button>
                )}
              </div>
            </div>

            <p className="mt-3 text-center font-sans text-[12px] text-white/18">
              Press <kbd className="font-mono">⌘K</kbd> anytime to search
            </p>
          </m.form>
        </m.div>
      )}
    </AnimatePresence>
  );
}
