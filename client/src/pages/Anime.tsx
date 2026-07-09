/**
 * Anime — premium discovery page.
 *
 * Each row is a self-contained <AnimeRow> that lazy-fetches from AniList
 * only when it scrolls into view, so the initial paint is fast.
 * A shared seenIds ref is threaded through the top rows to reduce duplicates
 * between Trending / Popular / Top Rated.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnimePage, getCurrentSeason, formatSeason } from '../lib/anilist';
import AnimeRow from '../components/AnimeRow';
import AniCard from '../components/AniCard';
import { GlassCardSkeleton } from '../components/GlassCard';

// ── Season constants (computed once at module load) ──────────────────────────
const SEASON = getCurrentSeason() as string;
const SEASON_YEAR = new Date().getFullYear();
const SEASON_LABEL = `${formatSeason(SEASON)} ${SEASON_YEAR}`;

// ── Genre rows — no hardcoding of data, only display labels ──────────────────
const GENRE_ROWS: { title: string; genre?: string; tag?: string }[] = [
  { title: 'Romance',       genre: 'Romance' },
  { title: 'Action',        genre: 'Action' },
  { title: 'Comedy',        genre: 'Comedy' },
  { title: 'Fantasy',       genre: 'Fantasy' },
  { title: 'Drama',         genre: 'Drama' },
  { title: 'Sci-Fi',        genre: 'Sci-Fi' },
  { title: 'Horror',        genre: 'Horror' },
  { title: 'Mystery',       genre: 'Mystery' },
  { title: 'Psychological', genre: 'Psychological' },
  { title: 'Slice of Life', genre: 'Slice of Life' },
  { title: 'Sports',        genre: 'Sports' },
  { title: 'Supernatural',  genre: 'Supernatural' },
  { title: 'Isekai',        tag: 'Isekai' },
];

export default function Anime() {
  const nav = useNavigate();

  // ── Search state ──────────────────────────────────────────────────────────
  const [query, setQuery]               = useState('');
  const [searchItems, setSearchItems]   = useState<any[]>([]);
  const [searchState, setSearchState]   = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  // ── Deduplication for the top (non-genre) rows ────────────────────────────
  const seenIds = useRef<number[]>([]);
  const [trendingIds, setTrendingIds]   = useState<number[]>([]);
  const [popularIds,  setPopularIds]    = useState<number[]>([]);

  const onTrendingLoaded = useCallback((ids: number[]) => {
    seenIds.current = [...seenIds.current, ...ids];
    setTrendingIds(ids);
  }, []);

  const onPopularLoaded = useCallback((ids: number[]) => {
    seenIds.current = [...seenIds.current, ...ids];
    setPopularIds(ids);
  }, []);

  // ── Search handler ────────────────────────────────────────────────────────
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
    } catch {
      setSearchState('error');
    }
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setSearchItems([]);
    setSearchState('idle');
  };

  // Auto-search with debounce when input is cleared
  useEffect(() => {
    if (query === '') { clearSearch(); }
  }, [query]);

  return (
    <div className="min-h-screen bg-void">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full
            bg-[radial-gradient(circle,rgba(122,37,48,0.28)_0%,transparent_65%)]" />
          <div className="absolute top-10 right-0 w-[400px] h-[400px] rounded-full
            bg-[radial-gradient(circle,rgba(194,67,79,0.10)_0%,transparent_65%)]" />
        </div>

        {/* Noise grain overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />

        <div className="relative px-5 pt-14 pb-10">
          {/* Label row */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-maroon-bright/70 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-maroon-bright animate-pulse" />
              Live from AniList
            </span>
            <button
              onClick={() => nav('/anime/genres')}
              className="font-mono text-[11px] text-ink-dim hover:text-ink transition-colors flex items-center gap-1"
            >
              Browse all genres &amp; tags
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          {/* Title */}
          <h1 className="font-serif text-[52px] md:text-[68px] font-semibold tracking-tight leading-none text-ink mb-2">
            Anime
          </h1>
          <p className="font-mono text-sm text-ink-faint mb-8 max-w-sm">
            Trending, seasonal &amp; genre picks — updated in real time
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
              >
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search any anime…"
                className="w-full bg-surface/80 border border-line rounded-full pl-10 pr-4 py-2.5
                  text-sm text-ink placeholder:text-ink-faint outline-none
                  focus:border-maroon-bright/60 focus:bg-surface transition-colors backdrop-blur-sm"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || searchState === 'loading'}
              className="bg-maroon hover:bg-maroon-bright disabled:opacity-40 text-white font-mono
                text-xs px-5 py-2.5 rounded-full transition-colors shrink-0"
            >
              {searchState === 'loading' ? '…' : 'Search'}
            </button>
            {searchState !== 'idle' && (
              <button
                type="button"
                onClick={clearSearch}
                className="font-mono text-xs text-ink-faint hover:text-ink transition-colors px-2"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-void to-transparent pointer-events-none" />
      </div>

      {/* ── Search results ──────────────────────────────────────────────── */}
      {searchState !== 'idle' && (
        <div className="px-5 pt-6 pb-2 border-b border-line">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-serif text-xl font-semibold tracking-tight">
              {searchState === 'loading' ? 'Searching…' : `Results for "${query}"`}
            </span>
            {searchState === 'done' && (
              <span className="font-mono text-[11px] text-ink-faint">{searchItems.length} found</span>
            )}
          </div>

          {searchState === 'loading' && (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3">
              {Array.from({ length: 6 }).map((_, i) => <GlassCardSkeleton key={i} />)}
            </div>
          )}

          {searchState === 'error' && (
            <p className="font-mono text-sm text-ink-faint py-4">
              Search failed —{' '}
              <button onClick={() => setSearchState('idle')} className="text-maroon-bright hover:underline">
                dismiss
              </button>
            </p>
          )}

          {searchState === 'done' && searchItems.length === 0 && (
            <p className="font-mono text-sm text-ink-faint py-4">No results found for "{query}".</p>
          )}

          {searchState === 'done' && searchItems.length > 0 && (
            <div
              className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide overscroll-x-contain"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {searchItems.map(anime => <AniCard key={anime.id} anime={anime} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Main rows ───────────────────────────────────────────────────── */}

      {/* 1 · Trending Now */}
      <AnimeRow
        title="Trending Now"
        badge="LIVE"
        sort="TRENDING_DESC"
        perPage={20}
        onLoaded={onTrendingLoaded}
      />

      {/* 2 · Popular on AniList */}
      <AnimeRow
        title="Popular on AniList"
        badge="LIVE"
        sort="POPULARITY_DESC"
        perPage={20}
        notIds={trendingIds}
        onLoaded={onPopularLoaded}
      />

      {/* 3 · Top Rated */}
      <AnimeRow
        title="Top Rated"
        sort="SCORE_DESC"
        perPage={20}
        notIds={[...trendingIds, ...popularIds]}
      />

      {/* 4 · Airing Now */}
      <AnimeRow
        title="Airing Now"
        badge="NOW"
        sort="TRENDING_DESC"
        status="RELEASING"
        perPage={20}
      />

      {/* 5 · Seasonal Picks */}
      <AnimeRow
        title={`Seasonal Picks — ${SEASON_LABEL}`}
        sort="POPULARITY_DESC"
        season={SEASON}
        seasonYear={SEASON_YEAR}
        perPage={20}
      />

      {/* 6–18 · Genre & tag rows */}
      {GENRE_ROWS.map(row => (
        <AnimeRow
          key={row.title}
          title={row.title}
          genre={row.genre}
          tag={row.tag}
          sort="POPULARITY_DESC"
          perPage={16}
        />
      ))}

      {/* ── Browse All Genres CTA ────────────────────────────────────────── */}
      <div className="px-5 pt-12 pb-8">
        <button
          onClick={() => nav('/anime/genres')}
          className="relative w-full overflow-hidden rounded-2xl border border-maroon/30 group
            bg-[radial-gradient(ellipse_120%_100%_at_20%_40%,rgba(122,37,48,0.35),rgba(22,16,17,0.8)_60%)]
            hover:border-maroon/60 transition-all duration-300
            hover:shadow-[0_0_40px_-8px_rgba(194,67,79,0.3)]"
        >
          {/* Glow on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
            bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(194,67,79,0.08),transparent_70%)]" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between
            gap-4 px-7 py-7">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-maroon-bright/70 mb-2">
                AniList · Live data
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-ink leading-tight mb-1">
                Browse All Genres &amp; Tags
              </h2>
              <p className="font-mono text-sm text-ink-faint max-w-sm">
                Every genre and media tag from AniList — searchable, filterable, with live previews.
              </p>
            </div>
            <div
              className="shrink-0 flex items-center gap-2 font-mono text-sm text-maroon-bright
                group-hover:translate-x-1 transition-transform duration-300"
            >
              Explore
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      <div className="h-10" />
    </div>
  );
}
