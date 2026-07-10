import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Film, Tv, Sword, X } from 'lucide-react';
import { api } from '../lib/api';
import { searchAnime } from '../lib/anilist';
import { navigateToAnime } from '../lib/animeResolve';
import SearchResultsGrid from '../components/SearchResultsGrid';

export default function SearchResults() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const q = params.get('q') || '';
  const [query, setQuery] = useState(q);
  const [filters, setFilters] = useState({ type: params.get('type') || '', genre: params.get('genre') || '' });
  const [localResults, setLocalResults] = useState<any[]>([]);
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [anilistResult, setAnilistResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tmdbKey, setTmdbKey] = useState(0);
  // Live genre list (never hardcoded) — keeps this dropdown in sync with the
  // real catalog instead of a static array that could drift (e.g. "Sci-Fi"
  // vs the real "Science Fiction" genre name, which silently returned ~0 results).
  const [genres, setGenres] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.titles.genres()
      .then(({ genres: g }: { genres: { genre: string; count: number }[] }) => {
        setGenres(g.slice(0, 14).map(x => x.genre));
      })
      .catch(() => {});
  }, []);

  useEffect(() => { setQuery(q); }, [q]);

  useEffect(() => {
    if (!q) {
      setTmdbResults([]);
      // No query — browse by genre/type if either filter is active
      if (!filters.genre && !filters.type) {
        setLocalResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const params: Record<string, string> = { limit: '50' };
      if (filters.genre) params.genre = filters.genre;
      if (filters.type) params.type = filters.type;
      api.titles.list(params)
        .then((d: any) => { setLocalResults(d.titles || []); setLoading(false); })
        .catch(() => setLoading(false));
      return;
    }
    setLoading(true);

    Promise.all([
      api.titles.liveSearch(q).catch(() => ({ local: [], tmdb: [] })),
    ]).then(([live]) => {
      let local = live.local || [];
      if (filters.type) local = local.filter((t: any) => t.type === filters.type);
      if (filters.genre) local = local.filter((t: any) => t.genres?.includes(filters.genre));
      setLocalResults(local);

      let tmdb: any[] = live.tmdb || [];
      if (filters.type === 'ANIME') tmdb = [];
      else if (filters.type === 'MOVIE') tmdb = tmdb.filter((r: any) => r.mediaType === 'movie');
      else if (filters.type === 'SERIES') tmdb = tmdb.filter((r: any) => r.mediaType === 'tv');
      setTmdbResults(tmdb);
      setLoading(false);
    });
  }, [q, filters, tmdbKey]);

  useEffect(() => {
    if (!q || filters.type !== 'ANIME') { setAnilistResult(null); return; }
    searchAnime(q).then((data) => { setAnilistResult(data); }).catch(() => {});
  }, [q, filters.type]);

  const buildSearchUrl = (q: string, type: string, genre: string) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (type) p.set('type', type);
    if (genre) p.set('genre', genre);
    return `/search?${p.toString()}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) nav(buildSearchUrl(query.trim(), filters.type, filters.genre));
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length > 1) {
      debounceRef.current = setTimeout(() => {
        nav(buildSearchUrl(val.trim(), filters.type, filters.genre), { replace: true });
      }, 400);
    }
  };

  return (
    <div className="px-5 py-7 max-w-[1200px] mx-auto">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="relative mb-7 max-w-xl">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          placeholder="Search movies, shows, anime…"
          className="w-full bg-surface border border-line rounded-full pl-10 pr-10 py-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-maroon focus:shadow-[0_0_0_3px_rgba(122,37,48,0.15)] transition-all"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); nav('/search'); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors">
            <X size={15} />
          </button>
        )}
      </form>

      {/* Filters */}
      <div className="flex gap-2.5 mb-7 flex-wrap">
        {[
          { label: 'All', icon: null, value: '' },
          { label: 'Movies', icon: Film, value: 'MOVIE' },
          { label: 'TV Shows', icon: Tv, value: 'SERIES' },
          { label: 'Anime', icon: Sword, value: 'ANIME' },
        ].map(({ label, icon: Icon, value }) => (
          <button
            key={value}
            onClick={() => setFilters(f => ({ ...f, type: value }))}
            className={`flex items-center gap-1.5 text-xs font-mono px-3.5 py-2 rounded-full border transition-all ${
              filters.type === value
                ? 'bg-maroon/20 border-maroon text-ink'
                : 'bg-surface border-line text-ink-faint hover:text-ink hover:border-line-bright'
            }`}
          >
            {Icon && <Icon size={11} />} {label}
          </button>
        ))}
        <select
          value={filters.genre}
          onChange={e => setFilters(f => ({ ...f, genre: e.target.value }))}
          className="bg-surface border border-line rounded-full px-3.5 py-2 text-xs font-mono text-ink-faint focus:border-maroon focus:text-ink outline-none transition-all cursor-pointer"
        >
          <option value="">All Genres</option>
          {genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* AniList best match */}
      {filters.type === 'ANIME' && q && anilistResult && (
        <div className="mb-8">
          <p className="font-mono text-[11px] text-ink-faint uppercase tracking-wider mb-3">Best match · AniList</p>
          <div
            className="flex gap-4 p-4 rounded-xl border border-line bg-surface max-w-xl cursor-pointer hover:border-maroon/50 transition-colors"
            onClick={() => navigateToAnime(anilistResult, nav)}
          >
            {(anilistResult.coverImage?.large || anilistResult.coverImage?.extraLarge) && (
              <img
                src={anilistResult.coverImage.extraLarge || anilistResult.coverImage.large}
                alt={anilistResult.title.romaji}
                loading="lazy" decoding="async"
                className="w-[72px] h-[102px] rounded-lg object-cover border border-line shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="font-serif text-base font-semibold leading-tight">
                {anilistResult.title.english || anilistResult.title.romaji}
              </p>
              {anilistResult.title.english && anilistResult.title.romaji && (
                <p className="font-mono text-[11px] text-ink-faint">{anilistResult.title.romaji}</p>
              )}
              <div className="font-mono text-[11px] text-ink-dim flex flex-wrap gap-1.5 items-center">
                {anilistResult.startDate?.year && <span>{anilistResult.startDate.year}</span>}
                {anilistResult.episodes && <><span>·</span><span>{anilistResult.episodes} eps</span></>}
                {anilistResult.averageScore && (
                  <><span>·</span>
                  <span className="bg-maroon/20 border border-maroon/50 text-ink rounded px-1.5 py-px">
                    ★ {(anilistResult.averageScore / 10).toFixed(1)}
                  </span></>
                )}
                {anilistResult.status && <><span>·</span><span className="capitalize">{anilistResult.status.toLowerCase().replace('_', ' ')}</span></>}
              </div>
              {anilistResult.genres?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {anilistResult.genres.slice(0, 4).map((g: string) => (
                    <span key={g} className="font-mono text-[10px] px-1.5 py-px rounded border border-line text-ink-faint">{g}</span>
                  ))}
                </div>
              )}
              {anilistResult.description && (
                <p className="text-ink-dim text-[12px] leading-relaxed line-clamp-2">
                  {anilistResult.description.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results grid — handles loading skeleton, local results, TMDB results, empty states */}
      <SearchResultsGrid
        localResults={localResults}
        tmdbResults={tmdbResults}
        loading={loading}
        q={q}
        onImported={() => setTmdbKey(k => k + 1)}
      />

      {/* Empty state — no query and no active filter */}
      {!q && !loading && !filters.genre && !filters.type && (
        <div className="py-16 pb-28 text-center">
          <p className="font-serif text-xl font-semibold mb-2">Search the catalog</p>
          <p className="text-ink-faint text-sm mb-8">Movies, TV shows, anime — all in one place</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
            {['Action', 'Drama', 'Sci-Fi', 'Anime', 'Comedy', 'Thriller', 'Horror', 'Romance'].map(g => (
              <button
                key={g}
                onClick={() => nav(`/search?q=${g}`)}
                className="font-mono text-xs px-3 py-1.5 rounded-full border border-line text-ink-faint hover:border-maroon hover:text-ink transition-all"
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
