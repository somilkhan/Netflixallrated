/**
 * AniCard — backward-compatible wrapper around unified Card.
 * Resolves AniList ID to local DB title via navigateToAnime.
 */
import { memo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from './ui/Card';
import { navigateToAnime } from '../lib/animeResolve';

// Re-exported so animeResolve.ts can continue importing it
export interface AniListMediaLike {
  id: number;
  title: { romaji: string; english: string | null; native?: string | null };
  description?: string | null;
  episodes?: number | null;
  genres?: string[];
  averageScore?: number | null;
  coverImage?: { large?: string; extraLarge?: string } | null;
  startDate?: { year?: number | null } | null;
  format?: string | null;
  seasonYear?: number | null;
}

interface AniCardProps {
  anime: AniListMediaLike;
  rank?: number;
  fluid?: boolean;
  className?: string;
}

const AniCard = memo(function AniCard({ anime, rank, fluid = false, className = '' }: AniCardProps) {
  const nav = useNavigate();
  const location = useLocation();
  const [resolving, setResolving] = useState(false);

  const title = anime.title.english || anime.title.romaji || anime.title.native || 'Unknown';
  const posterUrl = anime.coverImage?.extraLarge || anime.coverImage?.large;
  const rating = anime.averageScore ? (anime.averageScore / 10) : null;
  const year = anime.seasonYear || anime.startDate?.year;

  const handleNav = useCallback((play = false) => {
    if (resolving) return;
    setResolving(true);
    navigateToAnime(anime, (path) => nav(play ? `${path}?play=1` : path, {
      state: { from: `${location.pathname}${location.search}` },
    }))
      .finally(() => setResolving(false));
  }, [anime, nav, resolving, location.pathname, location.search]);

  const data = {
    id: String(anime.id),
    name: title,
    posterUrl,
    year: year ?? undefined,
    type: 'ANIME',
    genres: anime.genres,
    rating: rating ?? undefined,
  };

  const imageSrc = posterUrl ? `/api/proxy-image?url=${encodeURIComponent(posterUrl)}` : '';

  return (
    <Card
      data={data}
      rank={rank}
      rankStyle={rank != null ? 'top10' : 'badge'}
      fluid={fluid}
      className={className}
      isResolving={resolving}
      onNavigate={handleNav}
      imageSrc={imageSrc}
      imageReferrerPolicy="no-referrer"
    />
  );
});

export default AniCard;
