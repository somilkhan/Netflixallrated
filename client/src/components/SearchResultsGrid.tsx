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
import GlassCard, { GlassCardSkeleton } from './GlassCard';

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
    if (status === 'exists') {
      // Already in the catalog — resolve straight to its detail page instead
      // of re-attempting an import that will just fail again.
      try {
        const { id } = await api.titles.resolveTmdb(item.tmdbId, item.mediaType as 'movie' | 'tv');
        nav(`/title/${id}`);
      } catch {
        nav(`/search?q=${encodeURIComponent(item.name)}`);
      }
      return;
    }
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
    <GlassCard
      title={item.name}
      typeLabel={`${item.mediaType === 'movie' ? 'Movie' : 'Series'} · TMDB`}
      year={item.year}
      posterUrl={item.posterUrl}
      onClick={status === 'idle' || status === 'exists' ? handleImport : undefined}
      className={status === 'importing' || status === 'noauth' ? 'pointer-events-none' : ''}
      overlay={
        <>
          {status === 'importing' && (
            <div className="absolute inset-0 z-20 bg-void/70 flex items-center justify-center">
              <span className="text-[11px] font-mono text-ink-dim animate-pulse">Adding…</span>
            </div>
          )}
          {status === 'done' && (
            <div className="absolute inset-0 z-20 bg-void/70 flex items-center justify-center">
              <span className="text-[11px] font-mono text-maroon-bright">Added ✓</span>
            </div>
          )}
          {status === 'exists' && (
            <div className="absolute inset-0 z-20 bg-void/70 flex items-center justify-center p-2">
              <span className="text-[10px] font-mono text-ink-dim text-center leading-snug">Already added · tap to view</span>
            </div>
          )}
          {status === 'noauth' && (
            <div className="absolute inset-0 z-20 bg-void/80 flex items-center justify-center p-2">
              <span className="text-[10px] font-mono text-ink-dim text-center leading-snug">Admin only</span>
            </div>
          )}
        </>
      }
    />
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
          <GlassCardSkeleton key={i} />
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
          <p className="font-serif text-xl font-semibold mb-2">No results for "{q}"</p>
          <p className="text-ink-faint text-sm">Try different keywords or adjust your filters</p>
        </div>
      )}
    </div>
  );
}
