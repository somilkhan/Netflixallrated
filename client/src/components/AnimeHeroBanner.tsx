/**
 * AnimeHeroBanner — backward-compatible wrapper around unified Hero.
 * Self-contained: fetches trending anime and maps to HeroItem shape.
 */
import { useState, useEffect, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Hero from './ui/Hero';
import { getAnimePage } from './lib/anilist';
import { navigateToAnime } from './lib/animeResolve';

const AnimeHeroBanner = memo(function AnimeHeroBanner() {
  const nav = useNavigate();
  const location = useLocation();
  const [titles, setTitles] = useState<any[]>([]);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    getAnimePage({ sort: 'TRENDING_DESC', perPage: 6 })
      .then(setTitles)
      .catch((err) => { console.error('[anime] hero fetch failed:', err); setTitles([]); });
  }, []);

  const items = titles.map((t: any) => ({
    id: String(t.id),
    name: t.title?.english || t.title?.romaji || t.title?.native || 'Unknown',
    backdropUrl: t.bannerImage || t.coverImage?.extraLarge || t.coverImage?.large || null,
    posterUrl: t.coverImage?.extraLarge || t.coverImage?.large || null,
    synopsis: t.description ? t.description.replace(/<[^>]+>/g, '') : '',
    genres: t.genres || [],
    rating: t.averageScore ? (t.averageScore / 10) : null,
    year: t.seasonYear || t.startDate?.year || null,
    type: 'ANIME',
  }));

  const handleAction = useCallback((item: any, play: boolean) => {
    const original = titles.find((t: any) => String(t.id) === item.id);
    if (!original || resolving) return;
    setResolving(true);
    navigateToAnime(original, (path) => nav(play ? `${path}?play=1` : path, {
      state: { from: `${location.pathname}${location.search}` },
    }))
      .finally(() => setResolving(false));
  }, [titles, nav, resolving, location.pathname, location.search]);

  return (
    <Hero
      items={items}
      variant="anime-hero"
      onAction={handleAction}
      isResolving={resolving}
      playLabel="Watch Now"
    />
  );
});

export default AnimeHeroBanner;
