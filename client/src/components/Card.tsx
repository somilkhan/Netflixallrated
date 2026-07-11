/**
 * Card — standard title card used in horizontal sections and the search grid.
 * Renders via the shared GlassCard (frosted glass, poster background, hover
 * reveal) with this title's real data — no invented fields.
 */
import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from './GlassCard';

const Card = memo(function Card({ title, rank }: { title: any; index?: number; rank?: number }) {
  const nav = useNavigate();
  const typeLabel = title.type === 'MOVIE' ? 'Movie' : title.type === 'SERIES' ? 'Series' : 'Anime';
  const providers = (title.platforms || [])
    .map((tp: any) => tp.platform)
    .filter(Boolean)
    .map((p: any) => ({ name: p.name, logoUrl: p.iconUrl || null }));

  const handleClick = useCallback(() => nav(`/title/${title.id}`), [nav, title.id]);

  if (!title.id) return null;

  return (
    <GlassCard
      title={title.name}
      typeLabel={typeLabel}
      year={title.year}
      runtimeMinutes={title.type !== 'ANIME' ? title.runtimeMinutes : null}
      genres={title.genres}
      overview={title.synopsis}
      ratingLabel={title.topTier}
      providers={providers}
      posterUrl={title.posterUrl}
      posterColorFrom={title.posterColorFrom}
      posterColorTo={title.posterColorTo}
      rank={rank}
      onClick={handleClick}
    />
  );
});

export default Card;
