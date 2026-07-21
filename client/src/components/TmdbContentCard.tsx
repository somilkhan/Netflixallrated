/**
 * TmdbContentCard — wraps ContentCard for raw TMDB items.
 * On interact, resolves the TMDB ID to a backend title ID, then navigates.
 * Falls back to search if resolution fails.
 */
import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import ContentCard from './ui/ContentCard';
import type { TmdbNormalized } from '../services/tmdb';

interface TmdbContentCardProps {
  item: TmdbNormalized;
  rank?: number;
}

const TmdbContentCard = memo(function TmdbContentCard({ item, rank }: TmdbContentCardProps) {
  const nav = useNavigate();
  const [resolving, setResolving] = useState(false);

  const go = useCallback(async (play = false) => {
    if (resolving) return;
    setResolving(true);
    try {
      const { id } = await api.titles.resolveTmdb(item.tmdbId, item.mediaType);
      nav(`/title/${id}${play ? '?play=1' : ''}`);
    } catch {
      nav(`/search?q=${encodeURIComponent(item.name)}&type=${item.type}`);
    } finally {
      setResolving(false);
    }
  }, [resolving, item.tmdbId, item.mediaType, item.name, item.type, nav]);

  return (
    <div className={resolving ? 'pointer-events-none opacity-60 transition-opacity' : ''}>
      <ContentCard
        title={item as any}
        rank={rank}
        onNavigate={go}
      />
    </div>
  );
});

export default TmdbContentCard;
