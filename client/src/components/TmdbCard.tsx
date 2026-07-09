/**
 * Card for raw TMDB items (geo rows) that don't have a local DB row yet.
 * Tapping resolves (get-or-create) the title on the backend, then navigates
 * to the standard /title/:id detail/player page — same destination as every
 * other card.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import GlassCard from './GlassCard';

export interface TmdbItem {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  name: string;
  year: number | null;
  posterUrl: string | null;
  overview: string;
}

export default function TmdbCard({ item }: { item: TmdbItem }) {
  const nav = useNavigate();
  const [resolving, setResolving] = useState(false);

  const handleClick = async () => {
    if (resolving) return;
    setResolving(true);
    try {
      const { id } = await api.titles.resolveTmdb(item.tmdbId, item.mediaType);
      nav(`/title/${id}`);
    } catch {
      // Backend couldn't resolve/create the title (e.g. TMDB unreachable) —
      // fall back to search rather than leaving the tap dead.
      const typeFilter = item.mediaType === 'movie' ? 'MOVIE' : 'SERIES';
      nav(`/search?q=${encodeURIComponent(item.name)}&type=${typeFilter}`);
    } finally {
      setResolving(false);
    }
  };

  return (
    <GlassCard
      title={item.name}
      typeLabel={item.mediaType === 'movie' ? 'Movie' : 'Series'}
      year={item.year}
      overview={item.overview}
      posterUrl={item.posterUrl}
      onClick={handleClick}
      className={resolving ? 'opacity-60 pointer-events-none' : ''}
      overlay={resolving && (
        <div className="absolute inset-0 z-20 bg-void/70 flex items-center justify-center">
          <span className="text-[11px] font-mono text-ink-dim animate-pulse">Adding…</span>
        </div>
      )}
    />
  );
}
