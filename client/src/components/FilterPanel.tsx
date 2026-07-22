/**
 * FilterPanel — advanced filters slide-out.
 * Desktop: fixed panel slides in from right.
 * Mobile: bottom sheet slides up.
 */
import { useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export interface FilterState {
  type: string;
  genres: string[];
  yearMin: number;
  yearMax: number;
  ratingMin: number;
  ratingMax: number;
  sort: string;
}

export const DEFAULT_FILTERS: FilterState = {
  type: '',
  genres: [],
  yearMin: 1970,
  yearMax: CURRENT_YEAR,
  ratingMin: 0,
  ratingMax: 10,
  sort: 'relevance',
};

const TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'SERIES', label: 'TV Shows' },
  { value: 'ANIME', label: 'Anime' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Rating' },
];

const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1969 }, (_, i) => CURRENT_YEAR - i);

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (f: FilterState) => void;
  genres: string[];
}

export default function FilterPanel({ open, onClose, filters, onChange, genres }: FilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  /* close on outside click (desktop) */
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // slight delay so open-click doesn't immediately close
    const t = setTimeout(() => document.addEventListener('mousedown', h), 50);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h); };
  }, [open, onClose]);

  const set = <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
    onChange({ ...filters, [key]: val });

  const toggleGenre = (g: string) => {
    const next = filters.genres.includes(g)
      ? filters.genres.filter(x => x !== g)
      : [...filters.genres, g];
    set('genres', next);
  };

  const reset = () => onChange({ ...DEFAULT_FILTERS });

  const isDefault =
    filters.type === DEFAULT_FILTERS.type &&
    filters.genres.length === 0 &&
    filters.yearMin === DEFAULT_FILTERS.yearMin &&
    filters.yearMax === DEFAULT_FILTERS.yearMax &&
    filters.ratingMin === DEFAULT_FILTERS.ratingMin &&
    filters.ratingMax === DEFAULT_FILTERS.ratingMax &&
    filters.sort === DEFAULT_FILTERS.sort;

  /* ── shared panel content ──────────────────────────────────── */
  const PanelContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
        <h2 className="text-base font-semibold text-white">Filters</h2>
        <div className="flex items-center gap-2">
          {!isDefault && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs text-white/45 hover:text-white/80 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.05]"
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.10] text-white/50 hover:text-white transition-[background-color,color] duration-150"
            aria-label="Close filters"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

        {/* Content Type */}
        <section>
          <p className="text-[11px] uppercase tracking-wider text-white/35 font-mono mb-3">Content Type</p>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => set('type', opt.value)}
                className={`px-3.5 py-2 rounded-full text-sm border transition-[border-color,background-color,color] duration-150 ${
                  filters.type === opt.value
                    ? 'bg-white text-black border-white font-medium'
                    : 'bg-white/[0.04] border-white/[0.10] text-white/55 hover:border-white/[0.22] hover:text-white/85'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Sort By */}
        <section>
          <p className="text-[11px] uppercase tracking-wider text-white/35 font-mono mb-3">Sort By</p>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => set('sort', opt.value)}
                className={`px-3.5 py-2 rounded-full text-sm border transition-[border-color,background-color,color] duration-150 ${
                  filters.sort === opt.value
                    ? 'bg-white/[0.12] border-white/[0.30] text-white font-medium'
                    : 'bg-white/[0.04] border-white/[0.10] text-white/55 hover:border-white/[0.22] hover:text-white/85'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Year Range */}
        <section>
          <p className="text-[11px] uppercase tracking-wider text-white/35 font-mono mb-3">Year Range</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-white/30 mb-1 block">From</label>
              <select
                value={filters.yearMin}
                onChange={e => set('yearMin', Number(e.target.value))}
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2.5 text-sm text-white/80 focus:border-white/[0.25] focus:outline-none cursor-pointer transition-[border-color] duration-150"
              >
                {YEAR_OPTIONS.filter(y => y <= filters.yearMax).map(y => (
                  <option key={y} value={y} className="bg-[#141414]">{y}</option>
                ))}
              </select>
            </div>
            <span className="text-white/20 text-lg mt-4">—</span>
            <div className="flex-1">
              <label className="text-[10px] text-white/30 mb-1 block">To</label>
              <select
                value={filters.yearMax}
                onChange={e => set('yearMax', Number(e.target.value))}
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2.5 text-sm text-white/80 focus:border-white/[0.25] focus:outline-none cursor-pointer transition-[border-color] duration-150"
              >
                {YEAR_OPTIONS.filter(y => y >= filters.yearMin).map(y => (
                  <option key={y} value={y} className="bg-[#141414]">{y}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Rating Range */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-wider text-white/35 font-mono">Rating</p>
            <span className="text-xs text-white/50 font-mono">
              {filters.ratingMin === 0 && filters.ratingMax === 10
                ? 'Any'
                : `${filters.ratingMin}–${filters.ratingMax}`}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-white/30 mb-1.5 flex justify-between">
                <span>Min rating</span><span className="text-white/50">{filters.ratingMin}</span>
              </label>
              <input
                type="range" min={0} max={10} step={0.5}
                value={filters.ratingMin}
                onChange={e => {
                  const v = Number(e.target.value);
                  set('ratingMin', Math.min(v, filters.ratingMax));
                }}
                className="w-full accent-white cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/30 mb-1.5 flex justify-between">
                <span>Max rating</span><span className="text-white/50">{filters.ratingMax}</span>
              </label>
              <input
                type="range" min={0} max={10} step={0.5}
                value={filters.ratingMax}
                onChange={e => {
                  const v = Number(e.target.value);
                  set('ratingMax', Math.max(v, filters.ratingMin));
                }}
                className="w-full accent-white cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Genres */}
        {genres.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-wider text-white/35 font-mono">Genres</p>
              {filters.genres.length > 0 && (
                <button
                  onClick={() => set('genres', [])}
                  className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {genres.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-[border-color,background-color,color] duration-150 ${
                    filters.genres.includes(g)
                      ? 'bg-white/[0.14] border-white/[0.35] text-white font-medium'
                      : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/[0.20] hover:text-white/80'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer apply button */}
      <div className="shrink-0 px-5 py-4 border-t border-white/[0.07]">
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-[background-color] duration-150 active:scale-[0.98]"
        >
          Apply Filters {!isDefault && <span className="opacity-60 font-normal">
            ({[
              filters.type && '1',
              filters.genres.length && String(filters.genres.length),
              (filters.yearMin !== DEFAULT_FILTERS.yearMin || filters.yearMax !== DEFAULT_FILTERS.yearMax) && '1',
              (filters.ratingMin !== DEFAULT_FILTERS.ratingMin || filters.ratingMax !== DEFAULT_FILTERS.ratingMax) && '1',
              filters.sort !== DEFAULT_FILTERS.sort && '1',
            ].filter(Boolean).length} active)
          </span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop: right slide-out ────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Scrim */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="hidden md:block fixed inset-0 z-[49] bg-black/30"
              onClick={onClose}
            />
            {/* Panel */}
            <m.div
              ref={panelRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="hidden md:flex flex-col fixed right-0 top-0 bottom-0 z-[50] w-[340px]"
              style={{ background: '#111215', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
            >
              <PanelContent />
            </m.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile: bottom sheet ────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Scrim */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="md:hidden fixed inset-0 z-[49] bg-black/60"
              style={{ WebkitBackdropFilter: 'blur(4px)', backdropFilter: 'blur(4px)' }}
              onClick={onClose}
            />
            {/* Sheet */}
            <m.div
              ref={panelRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden flex flex-col fixed inset-x-0 bottom-0 z-[50] rounded-t-2xl"
              style={{
                background: '#111215',
                borderTop: '1px solid rgba(255,255,255,0.10)',
                maxHeight: '85vh',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <PanelContent />
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
