/**
 * AniCard — glassmorphism card for AniList anime results.
 * Navigates to /anime/view/:anilistId for a dedicated detail page.
 * If the anime is in the local catalog, AnimeDetailPage will redirect to /title/:id.
 */
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const titleStr  = anime.title.english || anime.title.romaji;
  const score     = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const posterUrl = anime.coverImage?.extraLarge || anime.coverImage?.large;
  const synopsis  = anime.description
    ? anime.description.replace(/<[^>]+>/g, '').slice(0, 200)
    : null;

  const handleClick = onClick ?? (() => {
    nav(`/anime/view/${anime.id}`);
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
      overlay={
        score ? (
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
        ) : null
      }
    />
  );
});

export default AniCard;
