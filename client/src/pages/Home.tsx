/**
 * Home — rebuilt to use live TMDB API data directly.
 * All content rows fetch from TMDB on mount. No hardcoded arrays.
 * Continue Watching is the only section using the backend (user history).
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import {
  getTrending,
  getPopularMovies,
  getPopularTVShows,
  getTopRatedMovies,
  getTopRatedTVShows,
  getNowPlayingMovies,
  getBollywoodMovies,
  getSouthIndianMovies,
  getHindiWebSeries,
  getMalayalamMovies,
  getRegionalContent,
  getGenres,
  getMovieVideos,
  getTVVideos,
  hasTmdbKey,
  type TmdbNormalized,
} from '../services/tmdb';
import { detectRegion, getCachedRegion, DEFAULT_REGION, type RegionInfo } from '../lib/geo';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

import HeroSection from '../components/sections/HeroSection';
import ContentRow from '../components/sections/ContentRow';
import TopTenRow from '../components/sections/TopTenRow';
import TmdbContentCard from '../components/TmdbContentCard';
import ContinueWatchingCard from '../components/ContinueWatchingCard';
import { SkeletonRow } from '../components/ui/SkeletonCard';
import { ImgTile } from '../components/CategoryTile';
import {
  GENRE_VISUAL,
  DEFAULT_TINT,
  GENRE_TILE_IMG,
} from '../lib/categoryVisuals';
import { slugify } from '../lib/slug';
import { useHasIntersected } from '../hooks/useIntersectionObserver';

// ── Types ─────────────────────────────────────────────────────────────────
interface GenreInfo {
  id: number;
  name: string;
}

interface HomeCache {
  trending: TmdbNormalized[];
  popularMovies: TmdbNormalized[];
  popularTV: TmdbNormalized[];
  topRated: TmdbNormalized[];
  nowPlaying: TmdbNormalized[];
  bollywood: TmdbNormalized[];
  southIndian: TmdbNormalized[];
  hindiSeries: TmdbNormalized[];
  malayalam: TmdbNormalized[];
  genres: GenreInfo[];
  /** Region-specific bonus row (K-Dramas, Hollywood Hits, etc.) */
  regionalContent: TmdbNormalized[];
  scrollY: number;
  /** Region code the cache was built for — bust if user switches region. */
  regionCode: string;
  cachedAt: number;
}

const HOME_CACHE_KEY = 'allrated-home';
const HOME_CACHE_TTL = 5 * 60 * 1000;

function getHomeCache(): HomeCache | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(HOME_CACHE_KEY) || 'null') as HomeCache | null;
    if (!parsed || typeof parsed.cachedAt !== 'number' || Date.now() - parsed.cachedAt > HOME_CACHE_TTL) {
      if (parsed) sessionStorage.removeItem(HOME_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setHomeCache(cache: HomeCache): void {
  try {
    sessionStorage.setItem(HOME_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('[home-cache] storage write failed', err);
  }
}

/** Row title for the region-specific bonus row. Returns '' for India (has its own rows). */
function getRegionalRowLabel(countryCode: string, countryName: string): string {
  switch (countryCode) {
    case 'IN': return '';
    case 'KR': return '🎭 K-Dramas';
    case 'JP': return '🎌 Anime & Japanese Cinema';
    case 'US':
    case 'GB':
    case 'CA':
    case 'AU': return '🎬 Hollywood Hits';
    default:   return `🌍 Popular in ${countryName}`;
  }
}
const TABS = ['All', 'Movies', 'Series'] as const;
type Tab = typeof TABS[number];

// ── No-key error state ─────────────────────────────────────────────────────
function NoKeyBanner() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <KeyRound size={40} className="mx-auto text-amber-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">TMDB API key required</h2>
        <p className="text-[#A3A3A3] text-sm leading-relaxed mb-4">
          Add your free TMDB API key as{' '}
          <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-amber-300">
            VITE_TMDB_API_KEY
          </code>{' '}
          in Replit Secrets, then restart the app.
        </p>
        <p className="text-[#737373] text-xs">
          Get a free key at{' '}
          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-white/50 hover:text-white"
          >
            themoviedb.org/settings/api
          </a>
        </p>
      </div>
    </div>
  );
}

// ── Row skeleton ───────────────────────────────────────────────────────────
function SectionSkeleton() {
  return (
    <div className="py-5">
      <div className="px-4 md:px-6 mb-3 h-6 w-36 rounded-full bg-[#1A1A1A] animate-pulse" />
      <SkeletonRow count={8} />
    </div>
  );
}

function RowWrapper({
  children,
  onVisible,
}: {
  children: React.ReactNode;
  onVisible: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useHasIntersected(ref, { threshold: 0.1 });

  useEffect(() => {
    if (isVisible) onVisible();
  }, [isVisible, onVisible]);

  return <div ref={ref}>{children}</div>;
}

// ── Error row ──────────────────────────────────────────────────────────────
function ErrorRow({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="py-5 px-4 md:px-6 flex items-center gap-3">
      <AlertCircle size={15} className="text-[#737373] shrink-0" />
      <span className="text-[13px] text-[#737373]">{label}</span>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 text-[12px] text-white/50 hover:text-white transition-colors"
      >
        <RefreshCw size={11} /> Retry
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const requestedRows = useRef(new Set<string>());
  const [loadedRows, setLoadedRows] = useState<Record<string, boolean>>({});

  const [activeTab, setActiveTab] = useState<Tab>('All');

  // ── Region detection ───────────────────────────────────────────────────
  // Initialise synchronously from localStorage cache so first render already
  // knows the region, then confirm / update with the async IP lookup.
  const [region, setRegion] = useState<RegionInfo>(() => getCachedRegion() ?? DEFAULT_REGION);

  useEffect(() => {
    detectRegion()
      .then(detected => {
        setRegion(detected);
      })
      .catch(() => { /* keep current value */ });
  }, []);

  // ── TMDB sections ──────────────────────────────────────────────────────
  const [trending,      setTrending]      = useState<TmdbNormalized[]>(() => getHomeCache()?.trending      ?? []);
  const [popularMovies, setPopularMovies] = useState<TmdbNormalized[]>(() => getHomeCache()?.popularMovies ?? []);
  const [popularTV,     setPopularTV]     = useState<TmdbNormalized[]>(() => getHomeCache()?.popularTV     ?? []);
  const [topRated,      setTopRated]      = useState<TmdbNormalized[]>(() => getHomeCache()?.topRated      ?? []);
  const [nowPlaying,    setNowPlaying]    = useState<TmdbNormalized[]>(() => getHomeCache()?.nowPlaying    ?? []);
  const [bollywood,     setBollywood]     = useState<TmdbNormalized[]>(() => getHomeCache()?.bollywood   ?? []);
  const [southIndian,   setSouthIndian]   = useState<TmdbNormalized[]>(() => getHomeCache()?.southIndian ?? []);
  const [hindiSeries,   setHindiSeries]   = useState<TmdbNormalized[]>(() => getHomeCache()?.hindiSeries ?? []);
  const [malayalam,     setMalayalam]     = useState<TmdbNormalized[]>(() => getHomeCache()?.malayalam  ?? []);
  const [regionalContent, setRegionalContent] = useState<TmdbNormalized[]>(() => getHomeCache()?.regionalContent ?? []);
  const [genres,        setGenres]        = useState<GenreInfo[]>(() => getHomeCache()?.genres ?? []);

  // ── Loading / error flags ──────────────────────────────────────────────
  const [loading,       setLoading]       = useState(() => !getHomeCache());
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [rowLoading,    setRowLoading]    = useState<Record<string, boolean>>({});

  // ── Continue Watching (backend) ────────────────────────────────────────
  const [continueWatching, setContinueWatching] = useState<any[]>([]);

  // ── Scroll restore ─────────────────────────────────────────────────────
  useEffect(() => {
    const cache = getHomeCache();
    if (cache && cache.scrollY > 0) {
      requestAnimationFrame(() => window.scrollTo({ top: cache.scrollY, behavior: 'instant' as ScrollBehavior }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onScroll = () => {
      const cache = getHomeCache();
      if (cache) setHomeCache({ ...cache, scrollY: window.scrollY });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const loadContentRow = useCallback((
    key: string,
    fetcher: () => Promise<TmdbNormalized[]>,
    setter: (items: TmdbNormalized[]) => void,
    hasCachedData: boolean,
  ) => {
    if (requestedRows.current.has(key) || hasCachedData) {
      requestedRows.current.add(key);
      if (hasCachedData) setLoadedRows(prev => ({ ...prev, [key]: true }));
      return;
    }
    requestedRows.current.add(key);
    setRowLoading(prev => ({ ...prev, [key]: true }));
    fetcher()
      .then(setter)
      .catch(() => setErrors(prev => ({ ...prev, [key]: 'Failed to load' })))
      .finally(() => {
        setLoadedRows(prev => ({ ...prev, [key]: true }));
        setRowLoading(prev => ({ ...prev, [key]: false }));
      });
  }, []);

  const renderDeferredRow = (
    key: string,
    fetcher: () => Promise<TmdbNormalized[]>,
    setter: (items: TmdbNormalized[]) => void,
    items: TmdbNormalized[],
    label: string,
    row: React.ReactNode,
  ) => (
    <RowWrapper
      onVisible={() => loadContentRow(key, fetcher, setter, items.length > 0)}
    >
      {!loadedRows[key] || rowLoading[key] ? (
        <SectionSkeleton />
      ) : errors[key] ? (
        <ErrorRow
          label={`${label} unavailable`}
          onRetry={() => {
            requestedRows.current.delete(key);
            setLoadedRows(prev => ({ ...prev, [key]: false }));
          }}
        />
      ) : items.length > 0 ? row : null}
    </RowWrapper>
  );

  // ── Immediate TMDB fetch: hero/trending and genres only ────────────────
  const fetchAll = useCallback(async (signal?: AbortSignal) => {
    if (!hasTmdbKey()) return;
    setLoading(true);
    setErrors({});
    requestedRows.current.clear();
    setRowLoading({});
    setLoadedRows({});
    setTrending([]);
    setPopularMovies([]);
    setPopularTV([]);
    setTopRated([]);
    setNowPlaying([]);
    setBollywood([]);
    setSouthIndian([]);
    setHindiSeries([]);
    setMalayalam([]);
    setRegionalContent([]);
    setGenres([]);

    const results = await Promise.allSettled([
      getTrending('all', 'day', 1, signal),
      getGenres(signal),
    ]);
    if (signal?.aborted) return;

    const set = <T,>(idx: number, setter: (value: T) => void, key: string) => {
      const r = results[idx];
      if (r.status === 'fulfilled') setter(r.value as T);
      else if (!signal?.aborted) setErrors(prev => ({ ...prev, [key]: 'Failed to load' }));
    };

    set<TmdbNormalized[]>(0, setTrending, 'trending');
    set<GenreInfo[]>(1, setGenres, 'genres');

    setLoading(false);
  }, [region]); // re-fetch when region changes

  useEffect(() => {
    // Use cached data only if it was built for the same region
    const cache = getHomeCache();
    if (cache && cache.regionCode === region.countryCode) {
      return;
    }
    // Bust stale cache when region differs
    try {
      sessionStorage.removeItem(HOME_CACHE_KEY);
    } catch {
      // Ignore storage failures.
    }
    const controller = new AbortController();
    fetchAll(controller.signal);
    return () => controller.abort();
  }, [fetchAll, region]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate cache when data arrives (keyed by region)
  useEffect(() => {
    if (trending.length || popularMovies.length) {
      setHomeCache({
        trending, popularMovies, popularTV, topRated, nowPlaying,
        bollywood, southIndian, hindiSeries, malayalam, regionalContent, genres,
        scrollY: getHomeCache()?.scrollY ?? 0,
        regionCode: region.countryCode,
        cachedAt: Date.now(),
      });
    }
  }, [trending, popularMovies, popularTV, topRated, nowPlaying, bollywood, southIndian, hindiSeries, malayalam, regionalContent, genres, region.countryCode]);

  // ── Hero trailer injection ─────────────────────────────────────────────
  // Fetch trailers for up to 5 hero items after initial data loads.
  const [heroTitles, setHeroTitles] = useState<TmdbNormalized[]>([]);
  useEffect(() => {
    const base = trending.slice(0, 8);
    if (!base.length) { setHeroTitles([]); return; }
    setHeroTitles(base); // show immediately without trailers

    const controller = new AbortController();
    // Fetch trailers for the first 5 hero slides in background
    const topFive = base.slice(0, 5);
    Promise.all(
      topFive.map(item =>
        (item.mediaType === 'movie'
          ? getMovieVideos(item.tmdbId, controller.signal)
          : getTVVideos(item.tmdbId, controller.signal))
          .catch(() => null),
      ),
    ).then(trailerKeys => {
      if (controller.signal.aborted) return;
      setHeroTitles(prev =>
        prev.map((item, i) =>
          i < trailerKeys.length && trailerKeys[i]
            ? { ...item, trailerYoutubeId: trailerKeys[i]! }
            : item,
        ),
      );
    });
    return () => controller.abort();
  }, [trending]);

  // ── Continue Watching ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setContinueWatching([]); return; }
    api.history.mine()
      .then((items: any[]) => setContinueWatching(items.filter(i => !i.completed && i.positionSeconds > 10)))
      .catch(() => setContinueWatching([]));
  }, [user]);

  const handleRemoveCW = useCallback((titleId: string) => {
    setContinueWatching(prev => prev.filter(i => i.titleId !== titleId));
    api.history.remove(titleId).catch(() => {});
  }, []);

  // ── Hero action — route immediately; the detail page resolves the local row
  const heroAction = useCallback((item: TmdbNormalized, play: boolean) => {
    const query = new URLSearchParams({ type: item.mediaType });
    if (play) query.set('play', '1');
    navigate(`/title/tmdb/${item.tmdbId}?${query.toString()}`);
  }, [navigate]);

  // ── Genre tile click ───────────────────────────────────────────────────
  const handleGenreClick = useCallback((genre: string) => {
    navigate(`/browse/genre/${slugify(genre)}`);
  }, [navigate]);

  // ── Tab visibility helpers ─────────────────────────────────────────────
  const showAll     = activeTab === 'All';
  const showMovies  = activeTab === 'All' || activeTab === 'Movies';
  const showSeries  = activeTab === 'All' || activeTab === 'Series';

  // ── No key guard ───────────────────────────────────────────────────────
  if (!hasTmdbKey()) return <NoKeyBanner />;

  return (
    <div className="pb-32 md:pb-24">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <HeroSection
        titles={heroTitles}
        onAction={heroAction}
        regionLabel={`Popular in ${region.countryName}`}
      />

      {/* ── Content area ─────────────────────────────────────────────── */}
      <div className="relative z-10 mt-0">

        {/* Tab filter pills */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-6 pt-6 pb-2" role="tablist" aria-label="Content filters">
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-pressed={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`
                shrink-0 px-5 py-2 h-10 rounded-full text-[13px] font-medium
                border transition-all duration-200 touch-manipulation
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                ${activeTab === tab
                  ? 'border-white bg-white/10 text-white'
                  : 'border-[#525252] bg-transparent text-[#A3A3A3] hover:border-white/40 hover:text-white'}
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Continue Watching (backend, hide if empty) ─────────────── */}
        {continueWatching.length > 0 && (
          <ContentRow title="Continue Watching" viewAllPath="/history">
            {continueWatching.map(item => (
              <ContinueWatchingCard key={item.titleId} item={item} onRemove={handleRemoveCW} />
            ))}
          </ContentRow>
        )}

        {/* ── Top 10 Today ──────────────────────────────────────────── */}
        {loading && <SectionSkeleton />}

        {!loading && errors.trending && (
          <ErrorRow label="Trending unavailable" onRetry={fetchAll} />
        )}

        {!loading && trending.length > 0 && (
          <TopTenRow
            title="Top 10 Today"
            items={trending.slice(0, 10)}
            viewAllPath="/browse?collection=trending"
            renderCard={(item, i) => (
              <TmdbContentCard key={item.id} item={item} rank={i + 1} />
            )}
          />
        )}

        {/* ── Trending Now ──────────────────────────────────────────── */}
        {!loading && trending.length > 0 && (
          <ContentRow title="Trending Now" viewAllPath="/browse?collection=trending">
            {trending.slice(0, 20).map(item => (
              <TmdbContentCard key={item.id} item={item} />
            ))}
          </ContentRow>
        )}

        {/* ── Popular Movies ────────────────────────────────────────── */}
        {showMovies && renderDeferredRow(
          'popularMovies',
          () => getPopularMovies(1, { region: region.countryCode, language: region.language }),
          setPopularMovies,
          popularMovies,
          'Popular Movies',
          <ContentRow title={`Popular in ${region.countryName}`} viewAllPath="/browse?collection=movies">
            {popularMovies.slice(0, 20).map(item => <TmdbContentCard key={item.id} item={item} />)}
          </ContentRow>,
        )}

        {/* ── Popular TV Shows ──────────────────────────────────────── */}
        {showSeries && renderDeferredRow(
          'popularTV',
          () => getPopularTVShows(1, { region: region.countryCode, language: region.language }),
          setPopularTV,
          popularTV,
          'Popular TV Shows',
          <ContentRow title={`Popular TV Shows in ${region.countryName}`} viewAllPath="/browse?collection=series">
            {popularTV.slice(0, 20).map(item => <TmdbContentCard key={item.id} item={item} />)}
          </ContentRow>,
        )}

        {/* ── Top Rated ─────────────────────────────────────────────── */}
        {showAll && renderDeferredRow(
          'topRated',
          () => Promise.all([getTopRatedMovies(1, { region: region.countryCode, language: region.language }), getTopRatedTVShows(1, { region: region.countryCode, language: region.language })])
            .then(([movies, tv]) => [...movies, ...tv].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 20))
            .catch((err: any) => { console.error('Home topRated fetch error:', err); return []; }),
          setTopRated,
          topRated,
          'Top Rated',
          <ContentRow title={`Top Rated in ${region.countryName}`} viewAllPath="/browse?collection=top-rated">
            {topRated.slice(0, 20).map(item => <TmdbContentCard key={item.id} item={item} />)}
          </ContentRow>,
        )}

        {/* ── Now Playing ───────────────────────────────────────────── */}
        {showMovies && renderDeferredRow(
          'nowPlaying',
          () => getNowPlayingMovies(1, { region: region.countryCode, language: region.language }),
          setNowPlaying,
          nowPlaying,
          'Now Playing',
          <ContentRow title={`Now Playing in ${region.countryName}`} viewAllPath="/browse?collection=now-playing">
            {nowPlaying.slice(0, 20).map(item => <TmdbContentCard key={item.id} item={item} />)}
          </ContentRow>,
        )}

        {/* ── India-specific rows — only shown for IN region ────────── */}

        {/* ── Bollywood Hits ────────────────────────────────────────── */}
        {region.countryCode === 'IN' && showMovies && renderDeferredRow(
          'bollywood',
          () => getBollywoodMovies(1),
          setBollywood,
          bollywood,
          'Bollywood',
          <ContentRow title="🎬 Bollywood Hits" viewAllPath="/browse?collection=bollywood">
            {bollywood.slice(0, 20).map(item => <TmdbContentCard key={item.id} item={item} />)}
          </ContentRow>,
        )}

        {/* ── South Indian Cinema ───────────────────────────────────── */}
        {region.countryCode === 'IN' && showMovies && renderDeferredRow(
          'southIndian',
          () => getSouthIndianMovies(1),
          setSouthIndian,
          southIndian,
          'South Indian Cinema',
          <ContentRow title="🌟 South Indian Cinema" viewAllPath="/browse?collection=south-indian">
            {southIndian.slice(0, 20).map(item => <TmdbContentCard key={item.id} item={item} />)}
          </ContentRow>,
        )}

        {/* ── Hindi Web Series ──────────────────────────────────────── */}
        {region.countryCode === 'IN' && showSeries && renderDeferredRow(
          'hindiSeries',
          () => getHindiWebSeries(1),
          setHindiSeries,
          hindiSeries,
          'Hindi Web Series',
          <ContentRow title="📺 Hindi Web Series" viewAllPath="/browse?collection=hindi-series">
            {hindiSeries.slice(0, 20).map(item => <TmdbContentCard key={item.id} item={item} />)}
          </ContentRow>,
        )}

        {/* ── Malayalam Cinema ──────────────────────────────────────── */}
        {region.countryCode === 'IN' && showMovies && renderDeferredRow(
          'malayalam',
          () => getMalayalamMovies(1),
          setMalayalam,
          malayalam,
          'Malayalam Cinema',
          <ContentRow title="🎭 Malayalam Cinema" viewAllPath="/browse?collection=malayalam">
            {malayalam.slice(0, 20).map(item => <TmdbContentCard key={item.id} item={item} />)}
          </ContentRow>,
        )}

        {/* ── Regional bonus row (KR / JP / US / GB / CA / AU / others) ── */}
        {showAll && renderDeferredRow(
          'regionalContent',
          () => getRegionalContent(region.countryCode, 1),
          setRegionalContent,
          regionalContent,
          'Regional content',
          <ContentRow title={getRegionalRowLabel(region.countryCode, region.countryName)} viewAllPath="/browse?collection=trending">
            {regionalContent.slice(0, 20).map(item => <TmdbContentCard key={item.id} item={item} />)}
          </ContentRow>,
        )}

        {/* ── Browse by Genre ───────────────────────────────────────── */}
        {showAll && genres.length > 0 && (
          <section className="py-6">
            <div className="flex items-center justify-between px-4 md:px-6 mb-3">
              <h2 className="text-base md:text-lg font-semibold text-white tracking-tight">
                Browse by Genre
              </h2>
            </div>
            <div className="flex gap-2.5 overflow-x-auto px-4 md:px-6 pb-2 scrollbar-hide">
              {genres.slice(0, 16).map(genre => {
                const tint = GENRE_VISUAL[genre.name]?.tint ?? DEFAULT_TINT;
                return (
                  <ImgTile
                    key={genre.id}
                    label={genre.name}
                    img={GENRE_TILE_IMG[genre.name]}
                    tint={tint}
                    onClick={() => handleGenreClick(genre.name)}
                  />
                );
              })}
            </div>
          </section>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
