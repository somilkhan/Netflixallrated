/**
 * SearchOverlay — full-screen command-palette style search, triggered from
 * the SideRail search icon or ⌘K/Ctrl+K from anywhere in the app. Replaces
 * the always-visible top search pill so the hero can run edge-to-edge.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

const placeholders = ['Movies, shows, anime…', 'Search the catalog…', 'Find something to watch…'];

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[14vh] px-5"
      style={{ animation: 'searchFadeIn 0.18s ease-out forwards' }}
    >
      <div
        className="absolute inset-0 bg-void/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />
      <form
        onSubmit={submit}
        className="relative w-full max-w-[560px] animate-fadeUp"
        style={{ animationDuration: '0.28s' }}
      >
        <div className="
          flex items-center gap-3 border rounded-2xl px-4 py-3.5
          bg-surface border-maroon/50 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8),0_0_0_3px_rgba(122,37,48,0.14)]
        ">
          <Search size={16} className="shrink-0 text-maroon-bright" />
          <div className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-ink text-[15px] font-sans"
              aria-label="Search"
            />
            {!query && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[15px] text-ink-faint pointer-events-none select-none">
                {placeholders[phIdx]}
              </span>
            )}
          </div>
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="shrink-0 text-ink-faint hover:text-ink transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 font-mono text-[9.5px] text-ink-faint/70 border border-line rounded px-1.5 py-0.5 hover:text-ink hover:border-line-bright transition-colors"
          >
            ESC
          </button>
        </div>
      </form>
    </div>
  );
}
