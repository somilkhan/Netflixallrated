/**
 * TmdbContentCard — backward-compatible wrapper around unified Card.
 * Resolves TMDB ID to backend title ID on navigation.
 */
import { useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from './ui/Card';
import { tmdbSrcSet } from '../services/tmdb';
import type { TmdbNormalized } from '../services/tmdb';

interface TmdbContentCardProps {
  item: TmdbNormalized;
  rank?: number;
  className?: string;
  fluid?: boolean;
}

const TmdbContentCard = memo(function TmdbContentCard({
  item,
  rank,
  className = '',
  fluid = false,
}: TmdbContentCardProps) {
  const nav = useNavigate();
  const location = useLocation();

  const go = useCallback((play = false) => {
    nav(`/title/tmdb/${item.tmdbId}?type=${item.mediaType}${play ? '&play=1' : ''}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  }, [item.tmdbId, item.mediaType, nav, location.pathname, location.search]);

  const rating = item.voteAverage ?? undefined;
  const srcSet = tmdbSrcSet(item.posterUrl);

  const data = {
    id: String(item.tmdbId),
    name: item.name,
    posterUrl: item.posterUrl,
    year: item.year ?? undefined,
    type: item.mediaType === 'movie' ? 'MOVIE' : 'SERIES',
    rating,
  };

  return (
    <Card
      data={data}
      rank={rank}
      rankStyle="badge"
      fluid={fluid}
      className={className}
      onNavigate={go}
      imageSrc={srcSet?.src ?? ''}
      imageSrcSet={srcSet?.srcSet ?? ''}
      imageSizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 230px"
    />
  );
});

export default TmdbContentCard;
