import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentCard from './ui/ContentCard';
import { X } from 'lucide-react';

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
  const { title, positionSeconds, durationSeconds, seasonNumber, episodeNumber, completed } = item;

  const pct = durationSeconds && durationSeconds > 0
    ? Math.min(100, Math.round((positionSeconds / durationSeconds) * 100))
    : 0;

  const subLabel =
    title.type === 'SERIES' && seasonNumber != null && episodeNumber != null
      ? `S${seasonNumber} · E${episodeNumber}`
      : title.type === 'ANIME' && episodeNumber != null
      ? `Ep ${episodeNumber}`
      : null;

  const handleClick = useCallback(() => {
    navigate(`/title/${title.id}?play=1`);
  }, [navigate, title.id]);

  return (
    <div className="relative group shrink-0 w-[92px] md:w-[124px]">
      <ContentCard
        title={{
          ...title,
          posterUrl: title.posterUrl,
          rating: undefined,
          synopsis: subLabel ? `${subLabel}${item.episodeTitle ? ` · ${item.episodeTitle}` : ''}` : '',
        }}
        showProgress={!completed}
        progressSeconds={positionSeconds}
        durationSeconds={durationSeconds ?? 0}
        onNavigate={() => handleClick()}
      />

      {/* Progress bar */}
      {!completed && pct > 0 && subLabel && (
        <span className="pointer-events-none absolute left-2 top-2 z-30 rounded-md border border-white/10 bg-black/75 px-1.5 py-1 text-[10px] font-medium text-white/85">
          {subLabel}
        </span>
      )}

      {/* Episode badge */}
      {subLabel && (
        <span className="sr-only">{subLabel}</span>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(item.titleId); }}
          className="absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white/80 opacity-0 transition-opacity hover:bg-black hover:text-white group-hover:opacity-100"
          title="Remove from history"
          aria-label="Remove from history"
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

export default React.memo(ContinueWatchingCard);
