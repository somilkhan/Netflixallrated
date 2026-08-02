/**
 * ContinueWatchingCard — backward-compatible wrapper around unified Card.
 * Adds progress bar, episode label, and remove button.
 */
import React, { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from './ui/Card';

interface ContinueWatchingCardProps {
  item: {
    titleId: string;
    positionSeconds: number;
    durationSeconds: number | null;
    seasonNumber: number | null;
    episodeNumber: number | null;
    episodeTitle: string | null;
    completed: boolean;
    title: {
      id: string;
      name: string;
      type: string;
      year: number;
      posterUrl: string | null;
    };
  };
  onRemove?: (titleId: string) => void;
}

function ContinueWatchingCard({ item, onRemove }: ContinueWatchingCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { title, positionSeconds, durationSeconds, seasonNumber, episodeNumber, completed } = item;

  const subLabel =
    title.type === 'SERIES' && seasonNumber != null && episodeNumber != null
      ? `S${seasonNumber} · E${episodeNumber}`
      : title.type === 'ANIME' && episodeNumber != null
        ? `Ep ${episodeNumber}`
        : null;

  const handleClick = useCallback(() => {
    navigate(`/title/${title.id}?play=1`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  }, [navigate, title.id, location.pathname, location.search]);

  const data = {
    id: title.id,
    name: title.name,
    posterUrl: title.posterUrl,
    year: title.year,
    type: title.type,
  };

  return (
    <Card
      data={data}
      variant="continue-watching"
      fluid
      progress={!completed && durationSeconds ? { seconds: positionSeconds, duration: durationSeconds } : undefined}
      episodeLabel={subLabel ?? undefined}
      onNavigate={() => handleClick()}
      onRemove={onRemove ? () => onRemove(item.titleId) : undefined}
    />
  );
}

export default React.memo(ContinueWatchingCard);
