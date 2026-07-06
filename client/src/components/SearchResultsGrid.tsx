/**
 * SearchResultsGrid — renders local + TMDB search results with consistent
 * poster aspect ratios and truncated metadata lines.
 *
 * Fix #5 applied:
 * - Every card uses `poster-ratio` (2:3) with object-fit cover via bg-cover.
 * - Metadata line uses `truncate` so it never wraps and breaks card height.
 * - `pb-28` on the wrapper clears the floating BottomNav.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Card from './Card';

interface TmdbItem {
  tmdbId: number;
  name: string;
  year?: number;
  posterUrl?: string;
  mediaType: string;
}

// Each card manages its own import state; useNavigate is called at top of component.
function TmdbResultCard({ item, onImported }: { item: TmdbItem; onImported?: () => void }) {
  const nav = useNavigate();
  const [status, setStatus] = useState<'idle' | 'importing' | 'done' | 'exists' | 'noauth'>('idle');

  const handleImport = async () => {
    setStatus('importing');
    try {
      const result = await api.titles.importTmdb({
        tmdbId: item.tmdbId,
        mediaType: item.mediaType as 'movie' | 'tv',
        type: item.mediaType === 'movie' ? 'MOVIE' : 'SERIES',
      });
      setStatus('done');
      onImported?.();
      nav(`/title/${result.id}`);
    } catch (e: any) {
      if (e.message?.includes('Already imported')) setStatus('exists');
      else if (
        e.message?.includes('401') ||
        e.message?.includes('403') ||
        e.message?.includes('Unauthorized') ||
        e.message?.includes('Forbidden')
      ) setStatus('noauth');
      else setStatus('idle');
    }
  };

  return (
    <div
      className="shrink-0 w-[142px] md:w-[172px] group cursor-pointer"
      onClick={status === 'idle' ? handleImport : undefined}
    >
      {/* poster-ratio = 2:3, consistent across all search result cards */}
      <div
        className="relative w-full poster-ratio rounded-[11px] border border-line overflow-hidden flex flex-col justify-end p-2 bg-cover bg-center transition-all duration-200 group-hover:border-maroon group-hover:-translate-y-1"
        style={{
          backgroundImage: item.posterUrl
            ? `linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.72)), url(${item.posterUrl})`
            : 'radial-gradient(120% 100% at 30% 0%, #1a1215, #0a0708 70%)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />
        <div className="relative z-10">
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-line/60 bg-surface/60 text-ink-faint uppercase tracking-wide">
            {item.mediaType === 'movie' ? 'Movie' : 'Series'} · TMDB
          </span>
        </div>
        {status === 'importing' && (
          <div className="absolute inset-0 bg-void/70 flex items-center justify-center">
            <span className="text-[11px] font-mono text-ink-dim animate-pulse">Adding…</span>
          </div>
        )}
        {status === 'done' && (
          <div className="absolute inset-0 bg-void/70 flex items-center justify-center">
            <span className="text-[11px] font-mono text-maroon-bright">Added ✓</span>
          </div>
        )}
        {status === 'noauth' && (
          <div className="absolute inset-0 bg-void/80 flex items-center justify-center p-2">
            <span className="text-[10px] font-mono text-ink-dim text-center leading-snug">Admin only</span>
          </div>
        )}
      </div>
      {/* Title — truncate prevents wrapping */}
      <div className="mt-2.5 text-[13.5px] font-semibold truncate">{item.name}</div>
      {/* Metadata — single truncated line, never wraps */}
      <div className="font-mono text-[10.5px] text-ink-faint truncate">
        {item.year ?? '—'} · {item.mediaType === 'movie' ? 'Movie' : 'Series'}
      </div>
    </div>
  );
}

// ── Main grid ───────────────────────────────────────────────────────────────────

interface SearchResultsGridProps {
  localResults: any[];
  tmdbResults: any[];
  loading: boolean;
  q: string;
  onImported: () => void;
}

export default function SearchResultsGrid({
  localResults,
  tmdbResults,
  loading,
  q,
  onImported,
}: SearchResultsGridProps) {
  const total = localResults.length + tmdbResults.length;

  if (loading) {
    return (
      /* pb-28 clears the floating BottomNav (~64px pill + 16px gap + margin) */
      <div className="flex flex-wrap gap-4 pb-28">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="shrink-0 w-[142px] md:w-[172px]">
            {/* poster-ratio skeleton matches real card proportions exactly */}
            <div className="w-full poster-ratio rounded-[11px] border border-line bg-surface animate-pulse" />
            <div className="mt-2.5 h-3.5 bg-surface rounded w-4/5 animate-pulse" />
            <div className="mt-1 h-2.5 bg-surface rounded w-1/2 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="pb-28">
      {localResults.length > 0 && (
        <div className="mb-10">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-serif text-xl font-semibold">Results</span>
            <span className="font-mono text-[11px] text-ink-faint">{localResults.length} titles</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {localResults.map((t, i) => <Card key={t.id} title={t} index={i} />)}
          </div>
        </div>
      )}

      {tmdbResults.length > 0 && (
        <div className="mb-10">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-serif text-xl font-semibold">From TMDB</span>
            <span className="font-mono text-[11px] text-ink-faint">{tmdbResults.length} more</span>
          </div>
          <p className="text-ink-faint text-[11px] font-mono mb-4">Tap any card to add it to the catalog instantly</p>
          <div className="flex flex-wrap gap-4">
            {tmdbResults.map(t => (
              <TmdbResultCard key={t.tmdbId} item={t} onImported={onImported} />
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="py-20 text-center">
          <p className="text-5xl mb-5">🔍</p>
          <p className="font-serif text-xl font-semibold mb-2">No results for "{q}"</p>
          <p className="text-ink-faint text-sm">Try different keywords or adjust your filters</p>
        </div>
      )}
    </div>
  );
}
