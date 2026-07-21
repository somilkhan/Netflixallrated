/**
 * Home — rebuilt from scratch.
 * Layout: HeroSection → content rows using ContentCard + ContentRow.
 * Data fetching logic preserved; only the presentation layer is new.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { getRegionCookie, setRegionCookie, normalizeRegion } from '../lib/regionConfig';
import { slugify } from '../lib/slug';
import {
  GENRE_VISUAL, DEFAULT_TINT, PLATFORM_LOGO,
  GENRE_TILE_IMG, CURATED_GENRE_TITLE, LANGUAGE_TILE_IMG, POPULAR_LANGUAGES,
} from '../lib/categoryVisuals';

import HeroSection from '../components/sections/HeroSection';
import ContentRow from '../components/sections/ContentRow';
import TopTenRow from '../components/sections/TopTenRow';
import ContentCard from '../components/ui/ContentCard';
import { FilterPill } from '../components/ui/FilterPill';
import { SkeletonRow } from '../components/ui/SkeletonCard';
import RegionPicker from '../components/RegionPicker';
import ContinueWatchingCard from '../components/ContinueWatchingCard';
import TmdbCard from '../components/TmdbCard';
import type { TmdbItem } from '../components/TmdbCard';
import { ImgTile, LogoTile, TileRowSkeleton } from '../components/CategoryTile';

interface GeoRow {
  id: string;
  label: string;
  items: TmdbItem[];
}

// Module-level cache — survives React unmount/remount during navigation
interface HomeCache {
  top10: any[];
  trending: any[];
  recent: any[];
  movies: any[];
  series: any[];
  anime: any[];
  genreList: string[];
  genreSections: Record<string, any[]>;
  topRatedTV: any[];
  geoRows: GeoRow[];
  region: string;
  scrollY: number;
}
let _cache: HomeCache | null = null;

const TABS = ['All', 'Movies', 'Series', 'Anime'] as const;
type Tab = typeof TABS[number];
const TAB_TYPE: Record<Tab, string> = {
  All: '',
  Movies: 'MOVIE',
  Series: 'SERIES',
  Anime: 'ANIME',
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRestoring = useRef(false);

  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [top10,       setTop10]       = useState<any[]>(_cache?.top10       ?? []);
  const [trending,    setTrending]    = useState<any[]>(_cache?.trending    ?? []);
  const [recent,      setRecent]      = useState<any[]>(_cache?.recent      ?? []);
  const [movies,      setMovies]      = useState<any[]>(_cache?.movies      ?? []);
  const [series,      setSeries]      = useState<any[]>(_cache?.series      ?? []);
  const [anime,       setAnime]       = useState<any[]>(_cache?.anime       ?? []);
  const [topRatedTV,  setTopRatedTV]  = useState<any[]>(_cache?.topRatedTV  ?? []);
  const [genreSections, setGenreSections] = useState<Record<string, any[]>>(_cache?.genreSections ?? {});
  const [genreList,   setGenreList]   = useState<string[]>(_cache?.genreList ?? []);
  const [initialLoading, setInitialLoading] = useState(!_cache);

  const [region,    setRegion]    = useState<string>(() => _cache?.region ?? normalizeRegion(getRegionCookie()));
  const [geoRows,   setGeoRows]   = useState<GeoRow[]>(_cache?.geoRows ?? []);
  const [geoLoading, setGeoLoading] = useState(false);
  const [studios,   setStudios]   = useState<{ slug: string; label: string; logoUrl?: string }[]>([]);

  // ── Geo content ──────────────────────────────────────────────────────────
  const loadGeoContent = useCallback(async (r: string) => {
    setGeoLoading(true);
    try {
      const data = await api.geo.content(r);
      setGeoRows(data.rows || []);
    } catch {
      setGeoRows([]);
    } finally {
      setGeoLoading(false);
    }
  }, []);

  // Restore scroll position from cache
  useEffect(() => {
    if (_cache && _cache.scrollY > 0) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: _cache!.scrollY, behavior: 'instant' as ScrollBehavior });
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save scroll position on scroll
  useEffect(() => {
    const onScroll = () => { if (_cache) _cache.scrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Geo detect / restore
  useEffect(() => {
    if (_cache) {
      if (!_cache.geoRows.length) loadGeoContent(_cache.region);
      isRestoring.current = true;
      return;
    }
    const cookie = getRegionCookie();
    if (cookie) {
      loadGeoContent(cookie);
    } else {
      api.geo.detect()
        .then((data: { region: string }) => {
          const detected = data.region || 'IN';
          setRegion(detected);
          setRegionCookie(detected);
          return loadGeoContent(detected);
        })
        .catch(() => loadGeoContent('IN'));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegionChange = useCallback((newRegion: string) => {
    setRegion(newRegion);
    setRegionCookie(newRegion);
    loadGeoContent(newRegion);
  }, [loadGeoContent]);

  // Studios
  useEffect(() => {
    if (studios.length) return;
    Promise.all([
      api.platforms.list().catch(() => []),
      api.titles.watchProvidersList('US').catch(() => []),
    ]).then(([platforms, providers]: [any[], any[]]) => {
      const providerSlugs = new Map<string, any>(
        providers.map((prov: any) => [slugify(prov.name || ''), prov])
      );
      setStudios(
        platforms.slice(0, 12).map((p: any) => {
          const slug = slugify(p.name);
          const liveMatch = providerSlugs.get(slug)
            ?? [...providerSlugs.entries()].find(([ps]) => ps.includes(slug) || slug.includes(ps))?.[1];
          return { slug, label: p.name, logoUrl: liveMatch?.logoUrl };
        }),
      );
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Main data fetch
  useEffect(() => {
    if (isRestoring.current || _cache) return;

    Promise.all([
      api.titles.top10().then(setTop10).catch(() => {}),
      api.titles.trending().then(setTrending).catch(() => {}),
      api.titles.recent().then(setRecent).catch(() => {}),
    ]).finally(() => setInitialLoading(false));

    api.titles.list({ type: 'MOVIE',  limit: '20' }).then(d => setMovies(d.titles   || [])).catch(() => {});
    api.titles.list({ type: 'SERIES', limit: '20' }).then(d => setSeries(d.titles   || [])).catch(() => {});
    api.titles.list({ type: 'ANIME',  limit: '20' }).then(d => setAnime(d.titles    || [])).catch(() => {});
    api.titles.list({ type: 'SERIES', limit: '20', sort: 'popular' }).then(d => setTopRatedTV(d.titles || [])).catch(() => {});

    api.titles.genres().then(({ genres }: { genres: { genre: string; count: number }[] }) => {
      const top = genres.slice(0, 10).map(g => g.genre);
      setGenreList(top);
      Promise.all(
        top.map(genre =>
          api.titles.list({ genre, limit: '20' })
            .then((d: any) => [genre, d.titles || []] as [string, any[]])
            .catch(() => [genre, []] as [string, any[]])
        )
      ).then(results => {
        setGenreSections(Object.fromEntries(results.filter(([, t]) => t.length > 0)));
      }).catch(() => {});
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate cache
  useEffect(() => {
    if (top10.length || trending.length || recent.length) {
      _cache = {
        top10, trending, recent, movies, series, anime,
        genreList, genreSections, topRatedTV, geoRows, region,
        scrollY: _cache?.scrollY ?? 0,
      };
    }
  }, [top10, trending, recent, movies, series, anime, genreList, genreSections, topRatedTV, geoRows, region]);

  // Continue Watching
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

  // ── Filtered lists ───────────────────────────────────────────────────────
  const filterByTab = useCallback((items: any[]) => {
    const type = TAB_TYPE[activeTab];
    const filtered = type ? items.filter(t => t.type === type) : items;
    const seen = new Set<string>();
    return filtered.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
  }, [activeTab]);

  const filteredTop10    = useMemo(() => filterByTab(top10),    [top10,    filterByTab]);
  const filteredTrending = useMemo(() => filterByTab(trending), [trending, filterByTab]);
  const filteredRecent   = useMemo(() => filterByTab(recent),   [recent,   filterByTab]);
  const heroTitles       = useMemo(() => (top10.length ? top10 : trending).slice(0, 8), [top10, trending]);
  const showAll          = activeTab === 'All';

  const typeSpecificItems = useMemo(() => {
    if (showAll) return [];
    return activeTab === 'Movies' ? movies : activeTab === 'Series' ? series : anime;
  }, [showAll, activeTab, movies, series, anime]);

  return (
    <div className="pb-32 md:pb-24">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <HeroSection titles={heroTitles} />

      {/* ── Content area ─────────────────────────────────────────────────── */}
      <div className="relative z-10 mt-0">

        {/* Tab filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-6 pt-6 pb-2">
          {TABS.map(tab => (
            <FilterPill
              key={tab}
              label={tab}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>

        {/* Loading skeletons */}
        {initialLoading && (
          <div className="pt-6">
            <div className="px-4 md:px-6 mb-3">
              <div className="h-5 w-32 rounded-full bg-[#1A1A1A] animate-pulse-soft" />
            </div>
            <SkeletonRow count={8} />
          </div>
        )}

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <ContentRow title="Continue Watching">
            {continueWatching.map(item => (
              <ContinueWatchingCard key={item.titleId} item={item} onRemove={handleRemoveCW} />
            ))}
          </ContentRow>
        )}

        {/* Top 10 — with large rank numerals */}
        {filteredTop10.length > 0 && (
          <TopTenRow
            title="Top 10 Today"
            items={filteredTop10}
            viewAllPath={`/search?q=&type=${TAB_TYPE[activeTab]}`}
          />
        )}

        {/* New Movies (All tab) */}
        {showAll && movies.length > 0 && (
          <ContentRow title="New Movies" viewAllPath="/search?q=&type=MOVIE">
            {movies.map(t => <ContentCard key={t.id} title={t} />)}
          </ContentRow>
        )}

        {/* Popular TV Shows (All tab) */}
        {showAll && series.length > 0 && (
          <ContentRow title="Popular TV Shows" viewAllPath="/search?q=&type=SERIES">
            {series.map(t => <ContentCard key={t.id} title={t} />)}
          </ContentRow>
        )}

        {/* Anime Series (All tab) */}
        {showAll && anime.length > 0 && (
          <ContentRow title="Anime Series" viewAllPath="/search?q=&type=ANIME">
            {anime.map(t => <ContentCard key={t.id} title={t} />)}
          </ContentRow>
        )}

        {/* Top Rated TV (All tab) */}
        {showAll && topRatedTV.length > 0 && (
          <ContentRow title="Top Rated TV" viewAllPath="/search?q=&type=SERIES">
            {topRatedTV.map(t => <ContentCard key={t.id} title={t} />)}
          </ContentRow>
        )}

        {/* Type-specific items (filtered tabs) */}
        {!showAll && typeSpecificItems.length > 0 && (
          <ContentRow
            title={activeTab === 'Movies' ? 'All Movies' : activeTab === 'Series' ? 'TV Shows' : 'All Anime'}
            viewAllPath={`/search?q=&type=${TAB_TYPE[activeTab]}`}
          >
            {typeSpecificItems.map(t => <ContentCard key={t.id} title={t} />)}
          </ContentRow>
        )}

        {/* Trending Now */}
        {filteredTrending.length > 0 && (
          <ContentRow title="Trending Now" viewAllPath="/search?q=trending">
            {filteredTrending.map(t => <ContentCard key={t.id} title={t} />)}
          </ContentRow>
        )}

        {/* Recently Added */}
        {filteredRecent.length > 0 && (
          <ContentRow title="Recently Added" viewAllPath="/search?q=">
            {filteredRecent.map(t => <ContentCard key={t.id} title={t} />)}
          </ContentRow>
        )}

        {/* Geo region rows */}
        {showAll && (
          <>
            <div className="px-4 md:px-6 pt-2">
              <RegionPicker region={region} onChange={handleRegionChange} />
            </div>
            {geoLoading && geoRows.length === 0 && (
              <div className="pt-4"><SkeletonRow count={6} /></div>
            )}
            {geoRows.map(row =>
              row.items.length > 0 ? (
                <ContentRow key={row.id} title={row.label}>
                  {row.items.map(item => <TmdbCard key={item.tmdbId} item={item} />)}
                </ContentRow>
              ) : null
            )}
          </>
        )}

        {/* Genre sections */}
        {showAll && genreList.map(genre => {
          const titles = genreSections[genre];
          if (!titles?.length) return null;
          return (
            <ContentRow
              key={genre}
              title={CURATED_GENRE_TITLE[genre] ?? genre}
              viewAllPath={`/search?q=${genre}&genre=${genre}`}
            >
              {titles.map(t => <ContentCard key={t.id} title={t} />)}
            </ContentRow>
          );
        })}

        {/* ── Studios browse rail ─────────────────────────────────────── */}
        {showAll && (
          <section className="py-6">
            <div className="flex items-center justify-between px-4 md:px-6 mb-3">
              <h2 className="text-base md:text-lg font-semibold text-white tracking-tight">Studios</h2>
            </div>
            {studios.length === 0 ? (
              <TileRowSkeleton />
            ) : (
              <div className="flex gap-2.5 overflow-x-auto px-4 md:px-6 pb-2 scrollbar-hide">
                {studios.map(s => {
                  const known = PLATFORM_LOGO[s.slug];
                  return known ? (
                    <LogoTile key={s.slug} logo={known.logo} color={known.color} onClick={() => navigate(`/studio/${s.slug}`)} />
                  ) : (
                    <ImgTile key={s.slug} label={s.label} img={s.logoUrl} tint={DEFAULT_TINT} onClick={() => navigate(`/studio/${s.slug}`)} />
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Popular Genres browse rail ──────────────────────────────── */}
        {showAll && genreList.length > 0 && (
          <section className="py-6">
            <div className="flex items-center justify-between px-4 md:px-6 mb-3">
              <h2 className="text-base md:text-lg font-semibold text-white tracking-tight">Popular Genres</h2>
            </div>
            <div className="flex gap-2.5 overflow-x-auto px-4 md:px-6 pb-2 scrollbar-hide">
              {genreList.map(genre => {
                const tint = GENRE_VISUAL[genre]?.tint ?? DEFAULT_TINT;
                return (
                  <ImgTile
                    key={genre}
                    label={genre}
                    img={GENRE_TILE_IMG[genre]}
                    tint={tint}
                    onClick={() => navigate(`/browse/genre/${slugify(genre)}`)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* ── Popular Languages browse rail ───────────────────────────── */}
        {showAll && (
          <section className="py-6">
            <div className="flex items-center justify-between px-4 md:px-6 mb-3">
              <h2 className="text-base md:text-lg font-semibold text-white tracking-tight">Popular Languages</h2>
            </div>
            <div className="flex gap-2.5 overflow-x-auto px-4 md:px-6 pb-2 scrollbar-hide">
              {POPULAR_LANGUAGES.map(lang => (
                <ImgTile
                  key={lang}
                  label={lang}
                  img={LANGUAGE_TILE_IMG[lang]}
                  tint={DEFAULT_TINT}
                  onClick={() => navigate(`/language/${slugify(lang)}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {top10.length === 0 && trending.length === 0 && recent.length === 0 && !initialLoading && (
          <div className="px-4 py-24 text-center">
            <Film size={36} className="mx-auto text-white/15 mb-4" />
            <p className="text-xl font-semibold text-white mb-2">Building your catalog…</p>
            <p className="text-sm text-[#737373] max-w-sm mx-auto leading-relaxed">
              The catalog is being populated from TMDB. It'll be ready shortly — check back in a moment.
            </p>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
