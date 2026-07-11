import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from './GlassCard';

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
      ? `S${seasonNumber} E${episodeNumber}`
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
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '0 0 8px 8px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: '#e50914',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}

      {/* Episode badge */}
      {subLabel && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            background: 'rgba(0,0,0,0.72)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            letterSpacing: '0.04em',
            pointerEvents: 'none',
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
            top: 6,
            right: 6,
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            borderRadius: '50%',
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            opacity: 0,
            transition: 'opacity 0.2s',
            color: '#fff',
          }}
          className="cw-remove-btn"
          title="Remove from history"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export default React.memo(ContinueWatchingCard);
