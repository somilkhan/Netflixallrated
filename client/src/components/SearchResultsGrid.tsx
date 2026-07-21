/**
 * SearchResultsGrid — renders local catalog search results.
 */
import ContentCard from './ui/ContentCard';
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
            <span className="text-xl font-semibold text-white">Results</span>
            <span className="text-[11px] text-[#737373]">{localResults.length} titles</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {localResults.map((t) => <ContentCard key={t.id} title={t} />)}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-xl font-semibold text-white mb-2">No results for "{q}"</p>
          <p className="text-[#737373] text-sm">Try different keywords or adjust your filters</p>
        </div>
      )}
    </div>
  );
}
