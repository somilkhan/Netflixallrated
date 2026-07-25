/**
 * TmdbContentCard — wraps ContentCard for raw TMDB items.
 * On interact, resolves the TMDB ID to a backend title ID, then navigates.
 * Falls back to search if resolution fails.
 */
import { useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentCard from './ui/ContentCard';
import type { TmdbNormalized } from '../services/tmdb';

interface TmdbContentCardProps {
  item: TmdbNormalized;
  rank?: number;
  className?: string;
}

const TmdbContentCard = memo(function TmdbContentCard({ item, rank, className = '' }: TmdbContentCardProps) {
  const nav = useNavigate();
  const go = useCallback((play = false) => {
    nav(`/title/tmdb/${item.tmdbId}?type=${item.mediaType}${play ? '&play=1' : ''}`);
  }, [item.tmdbId, item.mediaType, nav]);

  return (
    <ContentCard
      title={item}
      rank={rank}
      className={className}
      onNavigate={go}
    />
  );
});

export default TmdbContentCard;
