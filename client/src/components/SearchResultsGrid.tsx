/**
 * SearchResultsGrid — renders local catalog search results.
 * The catalog is fully managed by the automatic TMDB sync;
 * there is no manual import flow.
 */
import Card from './Card';
import { GlassCardSkeleton } from './GlassCard';

interface SearchResultsGridProps {
  localResults: any[];
  loading: boolean;
  q: string;
}

export default function SearchResultsGrid({ localResults, loading, q }: SearchResultsGridProps) {
  if (loading) {
    return (
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
      {localResults.length > 0 ? (
        <div className="mb-10">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-serif text-xl font-semibold">Results</span>
            <span className="font-mono text-[11px] text-ink-faint">{localResults.length} titles</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {localResults.map((t, i) => <Card key={t.id} title={t} index={i} />)}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="font-serif text-xl font-semibold mb-2">No results for "{q}"</p>
          <p className="text-ink-faint text-sm">Try different keywords or adjust your filters</p>
        </div>
      )}
    </div>
  );
}
