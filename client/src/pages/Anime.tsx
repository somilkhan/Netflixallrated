/**
 * Anime — Netflix-style discovery page.
 * AnimeHeroBanner is self-contained (fetches its own data).
 * Each AnimeRow / AnimeRankRow lazy-loads via IntersectionObserver.
 */
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { getAnimePage, getCurrentSeason, formatSeason } from '../lib/anilist';
import AnimeRow from '../components/AnimeRow';
import AnimeRankRow from '../components/AnimeRankRow';
import AnimeHeroBanner from '../components/AnimeHeroBanner';
import AniCard from '../components/AniCard';
import { SkeletonCard } from '../components/ui/SkeletonCard';

const SEASON      = getCurrentSeason() as string;
const SEASON_YEAR = new Date().getFullYear();
const SEASON_LABEL = `${formatSeason(SEASON)} ${SEASON_YEAR}`;

const GENRE_ROWS: { title: string; genre?: string; tag?: string }[] = [
  { title: 'Romance',       genre: 'Romance' },
  { title: 'Action',        genre: 'Action' },
  { title: 'Fantasy',       genre: 'Fantasy' },
  { title: 'Comedy',        genre: 'Comedy' },
  { title: 'Horror',        genre: 'Horror' },
  { title: 'Mystery',       genre: 'Mystery' },
  { title: 'Sci-Fi',        genre: 'Sci-Fi' },
  { title: 'Slice of Life', genre: 'Slice of Life' },
  { title: 'Sports',        genre: 'Sports' },
  { title: 'Psychological', genre: 'Psychological' },
];

export default function Anime() {
  const nav = useNavigate();

  const [query, setQuery]             = useState('');
  const [searchItems, setSearchItems] = useState<any[]>([]);
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const seenIds = useRef<number[]>([]);
  const [trendingIds, setTrendingIds] = useState<number[]>([]);
  const [popularIds,  setPopularIds]  = useState<number[]>([]);

  const onTrendingLoaded = useCallback((ids: number[]) => {
    seenIds.current = [...seenIds.current, ...ids];
    setTrendingIds(ids);
  }, []);

  const onPopularLoaded = useCallback((ids: number[]) => {
    seenIds.current = [...seenIds.current, ...ids];
    setPopularIds(ids);
  }, []);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchState('loading');
    setSearchItems([]);
    try {
      const results = await getAnimePage({ search: q, sort: 'SEARCH_MATCH', perPage: 15 });
      setSearchItems(results);
      setSearchState('done');
    } catch (err) {
      console.error('[anime] search failed:', err);
      setSearchState('error');
    }
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setSearchItems([]);
    setSearchState('idle');
  };

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ background: '#000000' }}>

      {/* Cinematic hero — self-contained */}
      <AnimeHeroBanner />

      {/* Search bar */}
      <div className="px-4 md:px-6 pt-8 pb-2">
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xs uppercase tracking-[0.22em] text-white/35 flex items-center gap-1.5 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-lg bg-white/50 animate-pulse" />
            Live from AniList
          </span>
          <button
            onClick={() => nav('/anime/genres')}
            className="text-base text-ink-secondary hover:text-white transition-colors flex items-center gap-1"
          >
            Browse all genres &amp; tags
            <ArrowRight size={12} strokeWidth={2.2} />
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-disabled pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); if (e.target.value === '') clearSearch(); }}
              placeholder="Search any anime…"
              className="
                w-full rounded-lg pl-10 pr-4 py-2.5
                text-sm text-white placeholder:text-ink-disabled
                border border-border-light bg-overlay-light
                outline-none focus:border-white/[0.22] focus:bg-overlay-light
                transition-colors
              "
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || searchState === 'loading'}
            className="bg-white hover:bg-white/88 disabled:opacity-40 text-black text-xs px-5 py-2.5 rounded-lg transition-colors shrink-0 font-semibold"
          >
            {searchState === 'loading' ? '…' : 'Search'}
          </button>
          {searchState !== 'idle' && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clearSearch}
              className="text-ink-secondary hover:text-white transition-colors px-1"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* Search results */}
      {searchState !== 'idle' && (
        <div className="px-4 md:px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {searchState === 'loading' ? 'Searching…' : `Results for "${query}"`}
            </h2>
            {searchState === 'done' && (
              <span className="text-xs text-ink-secondary">{searchItems.length} found</span>
            )}
          </div>

          {searchState === 'loading' && (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[140px] sm:w-[180px]"><SkeletonCard /></div>
              ))}
            </div>
          )}

          {searchState === 'error' && (
            <p className="text-sm text-ink-secondary py-4">
              Search failed —{' '}
              <button onClick={() => setSearchState('idle')} className="text-ink-secondary hover:text-white underline underline-offset-2">
                dismiss
              </button>
            </p>
          )}

          {searchState === 'done' && searchItems.length === 0 && (
            <p className="text-sm text-ink-secondary py-4">No results found for "{query}".</p>
          )}

          {searchState === 'done' && searchItems.length > 0 && (
            <div
              className="flex gap-3 md:gap-4 overflow-x-auto pb-3 scrollbar-hide"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {searchItems.map(anime => <AniCard key={anime.id} anime={anime} />)}
            </div>
          )}
        </div>
      )}

      {/* Content rows — first 3 eager (fetch on mount, no IO wait) */}
      <AnimeRankRow title="Trending Anime" isTrending badge="LIVE" perPage={10} onLoaded={onTrendingLoaded} eager />
      <AnimeRow title="Popular Anime" badge="LIVE" sort="POPULARITY_DESC" perPage={20} notIds={trendingIds} onLoaded={onPopularLoaded} eager />
      <AnimeRow title="Top Rated" sort="SCORE_DESC" perPage={20} notIds={[...trendingIds, ...popularIds]} eager />
      <AnimeRow title="Top Rated Movies" sort="SCORE_DESC" format="MOVIE" perPage={20} />
      <AnimeRow title="Airing Now" badge="NOW" sort="TRENDING_DESC" status="RELEASING" perPage={20} />
      <AnimeRow title={`Seasonal — ${SEASON_LABEL}`} sort="POPULARITY_DESC" season={SEASON} seasonYear={SEASON_YEAR} perPage={20} />

      {GENRE_ROWS.map(row => (
        <AnimeRow key={row.title} title={row.title} genre={row.genre} tag={row.tag} sort="POPULARITY_DESC" perPage={16} />
      ))}

      {/* Browse All Genres CTA */}
      <div className="px-4 md:px-6 pt-12 pb-8">
        <button
          onClick={() => nav('/anime/genres')}
          className="
            relative w-full overflow-hidden rounded-xl
            border border-white/[0.07] group
            bg-[radial-gradient(ellipse_120%_100%_at_20%_40%,rgba(255,255,255,0.04),rgba(10,10,10,0.9)_60%)]
            hover:border-white/[0.14] transition-[border-color,box-shadow] duration-300
            hover:shadow-[0_0_40px_-8px_rgba(255,255,255,0.08)]
          "
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(255,255,255,0.04),transparent_70%)]" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-7 py-7">
            <div>
              <div className="text-2xs uppercase tracking-[0.2em] text-white/35 mb-2 font-medium">
                AniList · Live data
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-1">
                Browse All Genres &amp; Tags
              </h2>
              <p className="text-sm text-ink-secondary max-w-sm">
                Every genre and media tag from AniList — searchable, filterable, with live previews.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 text-sm text-ink-secondary group-hover:translate-x-1 group-hover:text-ink-secondary transition-[transform,color] duration-300">
              Explore <ArrowRight size={16} strokeWidth={2.2} />
            </div>
          </div>
        </button>
      </div>

      <div className="h-10" />
    </div>
  );
}
