/**
 * AniCard — glassmorphism card for AniList anime results.
 * Navigates to local title detail page when available, falls back to search.
 */
import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import GlassCard from './GlassCard';

export interface AniListMediaLike {
  id: number;
  title: { romaji: string; english: string | null };
  description?: string | null;
  episodes?: number | null;
  genres?: string[];
  averageScore?: number | null;
  coverImage?: { large?: string; extraLarge?: string } | null;
  startDate?: { year?: number | null } | null;
}

interface AniCardProps {
  anime: AniListMediaLike;
  onClick?: () => void;
}

const AniCard = memo(function AniCard({ anime, onClick }: AniCardProps) {
  const nav = useNavigate();
  const [resolving, setResolving] = useState(false);

  const titleStr   = anime.title.english || anime.title.romaji;
  const score      = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const posterUrl  = anime.coverImage?.extraLarge || anime.coverImage?.large;
  const synopsis   = anime.description
    ? anime.description.replace(/<[^>]+>/g, '').slice(0, 200)
    : null;

  const handleClick = onClick ?? (async () => {
    if (resolving) return;
    setResolving(true);
    try {
      // Try to find this anime in the local catalog first
      const data = await api.titles.liveSearch(titleStr);
      const match = (data.local || []).find((t: any) => t.type === 'ANIME');
      if (match) {
        nav(`/title/${match.id}`);
        return;
      }
    } catch {
      // network error — fall through to search
    }
    setResolving(false);
    nav(`/search?q=${encodeURIComponent(titleStr)}&type=ANIME`);
  });

  return (
    <GlassCard
      title={titleStr}
      typeLabel="Anime"
      posterUrl={posterUrl}
      year={anime.startDate?.year}
      genres={anime.genres}
      overview={synopsis}
      onClick={handleClick}
      className={resolving ? 'opacity-60 pointer-events-none' : ''}
      overlay={
        <>
          {resolving && (
            <div className="absolute inset-0 z-20 bg-void/60 flex items-center justify-center">
              <span className="font-mono text-[10px] text-ink-dim animate-pulse">Opening…</span>
            </div>
          )}
          {score && !resolving && (
            <div className="
              absolute top-2 left-2 z-20
              inline-flex items-center gap-[3px]
              rounded-full border border-amber/35 bg-amber/[0.12] backdrop-blur-sm
              px-[6px] py-[2.5px] leading-none
            ">
              <svg
                width="6" height="6" viewBox="0 0 24 24"
                fill="currentColor" className="text-amber shrink-0"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="font-mono text-[7px] text-amber uppercase tracking-[0.06em]">
                {score}
              </span>
            </div>
          )}
        </>
      }
    />
  );
});

export default AniCard;
