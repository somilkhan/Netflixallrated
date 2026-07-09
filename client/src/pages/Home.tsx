import { useState, useEffect, useCallback } from 'react';
import { Film } from 'lucide-react';
import { api } from '../lib/api';
import { getRegionCookie, setRegionCookie, normalizeRegion } from '../lib/regionConfig';
import Ticker from '../components/Ticker';
import Hero from '../components/Hero';
import Tabs from '../components/Tabs';
import Section from '../components/Section';
import Card from '../components/Card';
import TmdbCard from '../components/TmdbCard';
import type { TmdbItem } from '../components/TmdbCard';
import RegionPicker from '../components/RegionPicker';
import { GlassCardSkeleton } from '../components/GlassCard';

interface GeoRow {
  id: string;
  label: string;
  items: TmdbItem[];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('All');
  const [top10, setTop10] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [anime, setAnime] = useState<any[]>([]);
  const [genreSections, setGenreSections] = useState<Record<string, any[]>>({});
  const [genreList, setGenreList] = useState<string[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const [region, setRegion] = useState<string>(() => normalizeRegion(getRegionCookie()));
  const [geoRows, setGeoRows] = useState<GeoRow[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);

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

  useEffect(() => {
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

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    setRegionCookie(newRegion);
    loadGeoContent(newRegion);
  };

  useEffect(() => {
    const core = Promise.all([
      api.titles.top10().then(setTop10).catch(() => {}),
      api.titles.trending().then(setTrending).catch(() => {}),
      api.titles.recent().then(setRecent).catch(() => {}),
    ]);

    api.titles.list({ type: 'MOVIE', limit: '20' }).then(d => setMovies(d.titles || [])).catch(() => {});
    api.titles.list({ type: 'SERIES', limit: '20' }).then(d => setSeries(d.titles || [])).catch(() => {});
    api.titles.list({ type: 'ANIME', limit: '20' }).then(d => setAnime(d.titles || [])).catch(() => {});

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
        setGenreSections(Object.fromEntries(results.filter(([, titles]) => titles.length > 0)));
      }).catch(() => {});
    }).catch(() => {});

    core.finally(() => setInitialLoading(false));
  }, []);

  const TAB_TYPE: Record<string, string> = { Movies: 'MOVIE', Series: 'SERIES', Anime: 'ANIME' };

  const filterList = (list: any[]) => {
    const type = TAB_TYPE[activeTab];
    const filtered = type ? list.filter(t => t.type === type) : list;
    const seen = new Set<string>();
    return filtered.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
  };

  const heroTitles = (top10.length ? top10 : trending).slice(0, 10);
  const showGenre = activeTab === 'All';
  const typeSpecificItems = TAB_TYPE[activeTab]
    ? (activeTab === 'Movies' ? movies : activeTab === 'Series' ? series : anime)
    : [];

  return (
    <div>
      <Ticker />
      <Hero titles={heroTitles} />
      <Tabs active={activeTab} onChange={setActiveTab} />

      {initialLoading && (
        <div className="px-5 py-6 flex gap-3.5 overflow-x-auto scrollbar-hide">
          {Array.from({ length: 8 }).map((_, i) => <GlassCardSkeleton key={i} />)}
        </div>
      )}

      {filterList(top10).length > 0 && (
        <Section title="Top 10 Today" count={`${filterList(top10).length}`} viewAllPath={`/search?q=&type=${TAB_TYPE[activeTab] ?? ''}`}>
          {filterList(top10).map((t, i) => <Card key={t.id} title={t} rank={i + 1} />)}
        </Section>
      )}

      {activeTab !== 'All' && typeSpecificItems.length > 0 && (
        <Section
          title={activeTab === 'Movies' ? 'All Movies' : activeTab === 'Series' ? 'TV Shows' : 'Anime'}
          count={`${typeSpecificItems.length}`}
          viewAllPath={`/search?q=&type=${TAB_TYPE[activeTab]}`}
        >
          {typeSpecificItems.map(t => <Card key={t.id} title={t} />)}
        </Section>
      )}

      {filterList(trending).length > 0 && (
        <Section title="Trending Now" count={`${filterList(trending).length}`} viewAllPath="/search?q=trending">
          {filterList(trending).map(t => <Card key={t.id} title={t} />)}
        </Section>
      )}

      {filterList(recent).length > 0 && (
        <Section title="Recently Added" count={`${filterList(recent).length}`} viewAllPath="/search?q=">
          {filterList(recent).map(t => <Card key={t.id} title={t} />)}
        </Section>
      )}

      {showGenre && (
        <>
          <RegionPicker region={region} onChange={handleRegionChange} />
          {geoLoading && geoRows.length === 0 && (
            <div className="px-5 py-6 flex gap-3.5 overflow-x-auto scrollbar-hide">
              {Array.from({ length: 6 }).map((_, i) => <GlassCardSkeleton key={i} />)}
            </div>
          )}
          {geoRows.map(row =>
            row.items.length > 0 ? (
              <Section key={row.id} title={row.label} count={`${row.items.length}`}>
                {row.items.map(item => <TmdbCard key={item.tmdbId} item={item} />)}
              </Section>
            ) : null
          )}
        </>
      )}

      {/* Genre sections — plain genre names, no emoji */}
      {showGenre && genreList.map(genre => {
        const titles = genreSections[genre];
        if (!titles || titles.length === 0) return null;
        return (
          <Section key={genre} title={genre} count={`${titles.length}`} viewAllPath={`/search?q=${genre}&genre=${genre}`}>
            {titles.map(t => <Card key={t.id} title={t} />)}
          </Section>
        );
      })}

      {top10.length === 0 && trending.length === 0 && recent.length === 0 && !initialLoading && (
        <div className="px-5 py-20 text-center">
          <Film size={40} className="mx-auto text-ink-faint/30 mb-5" />
          <p className="font-serif text-2xl font-semibold mb-2">Building your catalog…</p>
          <p className="text-ink-faint text-sm max-w-sm mx-auto">
            The catalog is being populated from TMDB. It'll be ready shortly — check back in a moment.
          </p>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
