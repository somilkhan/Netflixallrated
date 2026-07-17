import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from './GlassCard';
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
    <div className="relative group" style={{ display: 'inline-block' }}>
      <GlassCard
        title={title.name}
        typeLabel={title.type === 'MOVIE' ? 'Movie' : title.type === 'SERIES' ? 'Series' : 'Anime'}
        year={title.year}
        posterUrl={title.posterUrl ?? undefined}
        onClick={handleClick}
      />

      {/* Progress bar */}
      {!completed && pct > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'rgba(255,255,255,0.10)',
            borderRadius: '0 0 14px 14px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'rgba(255,255,255,0.75)',
              borderRadius: 'inherit',
              transition: 'width 0.4s cubic-bezier(.16,1,.3,1)',
            }}
          />
        </div>
      )}

      {/* Episode badge */}
      {subLabel && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 9.5,
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 500,
            padding: '2.5px 6px',
            borderRadius: 5,
            letterSpacing: '0.06em',
            pointerEvents: 'none',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          {subLabel}
        </div>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(item.titleId); }}
          style={{
            position: 'absolute',
            top: 7,
            right: 7,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            opacity: 0,
            transition: 'opacity 0.2s ease, background 0.15s ease',
            color: 'rgba(255,255,255,0.75)',
          }}
          className="cw-remove-btn hover:!bg-[rgba(0,0,0,0.85)] hover:!text-white"
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
