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
  getGenres,
  getMovieVideos,
  getTVVideos,
  hasTmdbKey,
  type TmdbNormalized,
  type RegionParams,
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

// ── Types ─────────────────────────────────────────────────────────────────
interface GenreInfo {
  id: number;
  name: string;
}

// ── Module-level cache (survives React unmount/remount during navigation) ──
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
  scrollY: number;
  /** Region code the cache was built for — bust if user switches region. */
  regionCode: string;
}
let _cache: HomeCache | null = null;

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
  const isRestoring = useRef(false);

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
  const [trending,      setTrending]      = useState<TmdbNormalized[]>(_cache?.trending      ?? []);
  const [popularMovies, setPopularMovies] = useState<TmdbNormalized[]>(_cache?.popularMovies ?? []);
  const [popularTV,     setPopularTV]     = useState<TmdbNormalized[]>(_cache?.popularTV     ?? []);
  const [topRated,      setTopRated]      = useState<TmdbNormalized[]>(_cache?.topRated      ?? []);
  const [nowPlaying,    setNowPlaying]    = useState<TmdbNormalized[]>(_cache?.nowPlaying    ?? []);
  const [bollywood,     setBollywood]     = useState<TmdbNormalized[]>(_cache?.bollywood     ?? []);
  const [southIndian,   setSouthIndian]   = useState<TmdbNormalized[]>(_cache?.southIndian   ?? []);
  const [hindiSeries,   setHindiSeries]   = useState<TmdbNormalized[]>(_cache?.hindiSeries   ?? []);
  const [malayalam,     setMalayalam]     = useState<TmdbNormalized[]>(_cache?.malayalam     ?? []);
  const [genres,        setGenres]        = useState<GenreInfo[]>(_cache?.genres             ?? []);

  // ── Loading / error flags ──────────────────────────────────────────────
  const [loading,       setLoading]       = useState(!_cache);
  const [errors,        setErrors]        = useState<Record<string, string>>({});

  // ── Continue Watching (backend) ────────────────────────────────────────
  const [continueWatching, setContinueWatching] = useState<any[]>([]);

  // ── Scroll restore ─────────────────────────────────────────────────────
  useEffect(() => {
    if (_cache && _cache.scrollY > 0) {
      requestAnimationFrame(() => window.scrollTo({ top: _cache!.scrollY, behavior: 'instant' as ScrollBehavior }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onScroll = () => { if (_cache) _cache.scrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Main TMDB fetch ────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!hasTmdbKey()) return;
    setLoading(true);
    setErrors({});

    const rp: RegionParams = { region: region.countryCode, language: region.language };
    const isIndia = region.countryCode === 'IN';

    const results = await Promise.allSettled([
      getTrending('all', 'day', 1),                                         // 0 — global
      getPopularMovies(1, rp),                                              // 1
      getPopularTVShows(1, rp),                                             // 2
      Promise.all([getTopRatedMovies(1, rp), getTopRatedTVShows(1, rp)]).then(
        ([movies, tv]) =>
          [...movies, ...tv]
            .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
            .slice(0, 20),
      ),                                                                    // 3
      getNowPlayingMovies(1, rp),                                           // 4
      getGenres(),                                                          // 5
      isIndia ? getBollywoodMovies(1)   : Promise.resolve([]),              // 6
      isIndia ? getSouthIndianMovies(1) : Promise.resolve([]),              // 7
      isIndia ? getHindiWebSeries(1)    : Promise.resolve([]),              // 8
      isIndia ? getMalayalamMovies(1)   : Promise.resolve([]),              // 9
    ]);

    const set = <T,>(idx: number, setter: (v: T) => void, key: string) => {
      const r = results[idx];
      if (r.status === 'fulfilled') setter(r.value as T);
      else setErrors(prev => ({ ...prev, [key]: 'Failed to load' }));
    };

    set<TmdbNormalized[]>(0, setTrending,      'trending');
    set<TmdbNormalized[]>(1, setPopularMovies, 'popularMovies');
    set<TmdbNormalized[]>(2, setPopularTV,     'popularTV');
    set<TmdbNormalized[]>(3, setTopRated,      'topRated');
    set<TmdbNormalized[]>(4, setNowPlaying,    'nowPlaying');
    set<GenreInfo[]>     (5, setGenres,        'genres');
    set<TmdbNormalized[]>(6, setBollywood,     'bollywood');
    set<TmdbNormalized[]>(7, setSouthIndian,   'southIndian');
    set<TmdbNormalized[]>(8, setHindiSeries,   'hindiSeries');
    set<TmdbNormalized[]>(9, setMalayalam,     'malayalam');

    setLoading(false);
  }, [region]); // re-fetch when region changes

  useEffect(() => {
    // Use cached data only if it was built for the same region
    if (_cache && _cache.regionCode === region.countryCode) {
      isRestoring.current = true;
      return;
    }
    // Bust stale cache when region differs
    _cache = null;
    fetchAll();
  }, [fetchAll, region]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate cache when data arrives (keyed by region)
  useEffect(() => {
    if (trending.length || popularMovies.length) {
      _cache = {
        trending, popularMovies, popularTV, topRated, nowPlaying,
        bollywood, southIndian, hindiSeries, malayalam, genres,
        scrollY: _cache?.scrollY ?? 0,
        regionCode: region.countryCode,
      };
    }
  }, [trending, popularMovies, popularTV, topRated, nowPlaying, bollywood, southIndian, hindiSeries, malayalam, genres, region.countryCode]);

  // ── Hero trailer injection ─────────────────────────────────────────────
  // Fetch trailers for up to 5 hero items after initial data loads.
  const [heroTitles, setHeroTitles] = useState<TmdbNormalized[]>([]);
  useEffect(() => {
    const base = trending.slice(0, 8);
    if (!base.length) { setHeroTitles([]); return; }
    setHeroTitles(base); // show immediately without trailers

    // Fetch trailers for the first 5 hero slides in background
    const topFive = base.slice(0, 5);
    Promise.all(
      topFive.map(item =>
        (item.mediaType === 'movie' ? getMovieVideos(item.tmdbId) : getTVVideos(item.tmdbId))
          .catch(() => null),
      ),
    ).then(trailerKeys => {
      setHeroTitles(prev =>
        prev.map((item, i) =>
          i < trailerKeys.length && trailerKeys[i]
            ? { ...item, trailerYoutubeId: trailerKeys[i]! }
            : item,
        ),
      );
    });
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

  // ── Hero action (TMDB resolve before navigate) ─────────────────────────
  const heroAction = useCallback(async (item: TmdbNormalized, play: boolean) => {
    try {
      const { id } = await api.titles.resolveTmdb(item.tmdbId, item.mediaType);
      navigate(`/title/${id}${play ? '?play=1' : ''}`);
    } catch {
      navigate(`/search?q=${encodeURIComponent(item.name)}&type=${item.type}`);
    }
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
        {showMovies && (
          loading ? <SectionSkeleton /> :
          errors.popularMovies ? (
            <ErrorRow label="Popular Movies unavailable" onRetry={fetchAll} />
          ) : popularMovies.length > 0 ? (
            <ContentRow
              title={`Popular in ${region.countryName}`}
              viewAllPath="/browse?collection=movies"
            >
              {popularMovies.slice(0, 20).map(item => (
                <TmdbContentCard key={item.id} item={item} />
              ))}
            </ContentRow>
          ) : null
        )}

        {/* ── Popular TV Shows ──────────────────────────────────────── */}
        {showSeries && (
          loading ? <SectionSkeleton /> :
          errors.popularTV ? (
            <ErrorRow label="Popular TV Shows unavailable" onRetry={fetchAll} />
          ) : popularTV.length > 0 ? (
            <ContentRow
              title={`Popular TV Shows in ${region.countryName}`}
              viewAllPath="/browse?collection=series"
            >
              {popularTV.slice(0, 20).map(item => (
                <TmdbContentCard key={item.id} item={item} />
              ))}
            </ContentRow>
          ) : null
        )}

        {/* ── Top Rated ─────────────────────────────────────────────── */}
        {showAll && (
          loading ? <SectionSkeleton /> :
          errors.topRated ? (
            <ErrorRow label="Top Rated unavailable" onRetry={fetchAll} />
          ) : topRated.length > 0 ? (
            <ContentRow
              title={`Top Rated in ${region.countryName}`}
              viewAllPath="/browse?collection=top-rated"
            >
              {topRated.slice(0, 20).map(item => (
                <TmdbContentCard key={item.id} item={item} />
              ))}
            </ContentRow>
          ) : null
        )}

        {/* ── Now Playing ───────────────────────────────────────────── */}
        {showMovies && (
          loading ? <SectionSkeleton /> :
          errors.nowPlaying ? (
            <ErrorRow label="Now Playing unavailable" onRetry={fetchAll} />
          ) : nowPlaying.length > 0 ? (
            <ContentRow
              title={`Now Playing in ${region.countryName}`}
              viewAllPath="/browse?collection=now-playing"
            >
              {nowPlaying.slice(0, 20).map(item => (
                <TmdbContentCard key={item.id} item={item} />
              ))}
            </ContentRow>
          ) : null
        )}

        {/* ── India-specific rows — only shown for IN region ────────── */}

        {/* ── Bollywood Hits ────────────────────────────────────────── */}
        {region.countryCode === 'IN' && showMovies && (
          loading ? <SectionSkeleton /> :
          errors.bollywood ? null :
          bollywood.length > 0 ? (
            <ContentRow
              title="🎬 Bollywood Hits"
              viewAllPath="/browse?collection=bollywood"
            >
              {bollywood.slice(0, 20).map(item => (
                <TmdbContentCard key={item.id} item={item} />
              ))}
            </ContentRow>
          ) : null
        )}

        {/* ── South Indian Cinema ───────────────────────────────────── */}
        {region.countryCode === 'IN' && showMovies && (
          loading ? <SectionSkeleton /> :
          errors.southIndian ? null :
          southIndian.length > 0 ? (
            <ContentRow
              title="🌟 South Indian Cinema"
              viewAllPath="/browse?collection=south-indian"
            >
              {southIndian.slice(0, 20).map(item => (
                <TmdbContentCard key={item.id} item={item} />
              ))}
            </ContentRow>
          ) : null
        )}

        {/* ── Hindi Web Series ──────────────────────────────────────── */}
        {region.countryCode === 'IN' && showSeries && (
          loading ? <SectionSkeleton /> :
          errors.hindiSeries ? null :
          hindiSeries.length > 0 ? (
            <ContentRow
              title="📺 Hindi Web Series"
              viewAllPath="/browse?collection=hindi-series"
            >
              {hindiSeries.slice(0, 20).map(item => (
                <TmdbContentCard key={item.id} item={item} />
              ))}
            </ContentRow>
          ) : null
        )}

        {/* ── Malayalam Cinema ──────────────────────────────────────── */}
        {region.countryCode === 'IN' && showMovies && (
          loading ? null :
          errors.malayalam ? null :
          malayalam.length > 0 ? (
            <ContentRow
              title="🎭 Malayalam Cinema"
              viewAllPath="/browse?collection=malayalam"
            >
              {malayalam.slice(0, 20).map(item => (
                <TmdbContentCard key={item.id} item={item} />
              ))}
            </ContentRow>
          ) : null
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
