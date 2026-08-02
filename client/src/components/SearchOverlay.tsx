import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRENDING_SEARCHES = [
  'Stranger Things', 'Wednesday', 'The Witcher', 'Squid Game',
  'Black Mirror', 'You', 'Money Heist', 'Bridgerton'
];

const RECENT_SEARCHES = [
  'Action Movies', 'Sci-Fi Series', 'Comedy Specials'
];

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSearch = useCallback((q: string) => {
    if (q.trim()) {
      nav(`/search?q=${encodeURIComponent(q.trim())}`);
      onClose();
    }
  }, [nav, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch(query);
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-page animate-fadeIn">
      {/* Search input bar */}
      <div className="flex items-center gap-4 px-4 md:px-12 pt-4 pb-4 border-b border-border-light">
        <Search size={24} className="text-ink-tertiary shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Titles, people, genres"
          className="flex-1 bg-transparent text-white text-xl md:text-2xl outline-none placeholder:text-ink-tertiary"
          aria-label="Search"
        />
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-2 text-ink-tertiary hover:text-white transition-colors"
          aria-label="Close search"
        >
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 md:px-12 py-8 overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>
        {query.trim() ? (
          <div className="space-y-4">
            <h3 className="text-ink-tertiary text-sm font-medium">Suggestions</h3>
            <button
              onClick={() => handleSearch(query)}
              className="flex items-center gap-3 w-full text-left text-white hover:text-ink-secondary py-2"
            >
              <Search size={16} className="text-ink-tertiary" />
              <span>Search for "{query}"</span>
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Previously Searched */}
            <section>
              <h3 className="text-ink-tertiary text-sm font-medium mb-4 flex items-center gap-2">
                <Clock size={14} /> Previously Searched
              </h3>
              <div className="flex flex-wrap gap-2">
                {RECENT_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-4 py-2 rounded-md bg-overlay-light text-white/80 text-sm hover:bg-overlay-medium transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>

            {/* Trending Searches */}
            <section>
              <h3 className="text-ink-tertiary text-sm font-medium mb-4 flex items-center gap-2">
                <TrendingUp size={14} /> Trending Now
              </h3>
              <div className="space-y-1">
                {TRENDING_SEARCHES.map((term, i) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="flex items-center gap-4 w-full text-left py-3 px-2 hover:bg-overlay-light rounded-md transition-colors group"
                  >
                    <span className="text-ink-disabled text-lg font-bold w-6 text-center">{i + 1}</span>
                    <span className="text-white/80 group-hover:text-white">{term}</span>
                    <Search size={14} className="text-ink-disabled ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
