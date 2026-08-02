/**
 * ContentCard — backward-compatible wrapper around unified Card.
 * Maps legacy ContentCardTitle shape to CardData.
 */
import { memo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from './Card';
import { tmdbSrcSet } from '../../services/tmdb';

export interface ContentCardTitle {
  id: string;
  name: string;
  posterUrl?: string | null;
  posterColorFrom?: string;
  posterColorTo?: string;
  synopsis?: string;
  genres?: string[];
  rating?: number | string | null;
  imdbRating?: number | string | null;
  voteAverage?: number | string | null;
  year?: number | string | null;
  type?: string;
  originalLanguage?: string;
}

export interface ContentCardProps {
  title: ContentCardTitle;
  rank?: number;
  showProgress?: boolean;
  progressSeconds?: number;
  durationSeconds?: number;
  className?: string;
  onAddToList?: (titleId: string) => void;
  fluid?: boolean;
  onNavigate?: (play?: boolean) => void;
  highlightQuery?: string;
}

const ContentCard = memo(function ContentCard({
  title,
  rank,
  highlightQuery = '',
  showProgress = false,
  progressSeconds = 0,
  durationSeconds = 0,
  className = '',
  onAddToList,
  fluid = false,
  onNavigate,
}: ContentCardProps) {
  const nav = useNavigate();
  const location = useLocation();

  const rating = title.rating || title.imdbRating || title.voteAverage;
  const srcSet = tmdbSrcSet(title?.posterUrl);

  const handleNavigate = useCallback((play?: boolean) => {
    if (onNavigate) {
      onNavigate(play);
      return;
    }
    if (play) {
      nav(`/title/${title.id}?play=1`, { state: { from: `${location.pathname}${location.search}` } });
    } else {
      nav(`/title/${title.id}`, { state: { from: `${location.pathname}${location.search}` } });
    }
  }, [nav, title.id, onNavigate, location.pathname, location.search]);

  const handleAddToList = useCallback(() => {
    onAddToList?.(title.id);
  }, [onAddToList, title.id]);

  const data = {
    id: title.id,
    name: title.name,
    posterUrl: title.posterUrl,
    year: title.year,
    type: title.type,
    genres: title.genres,
    rating,
    originalLanguage: title.originalLanguage,
  };

  return (
    <Card
      data={data}
      rank={rank}
      rankStyle="badge"
      fluid={fluid}
      className={className}
      highlightQuery={highlightQuery}
      progress={showProgress ? { seconds: progressSeconds, duration: durationSeconds } : undefined}
      onNavigate={handleNavigate}
      onAddToList={onAddToList ? handleAddToList : undefined}
      imageSrc={srcSet?.src ?? ''}
      imageSrcSet={srcSet?.srcSet ?? ''}
      imageSizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 230px"
    />
  );
});

export default ContentCard;
