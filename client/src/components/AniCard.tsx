/**
 * AniCard — premium glassmorphism card for AniList anime results.
 * Wraps GlassCard and adds the AniList score badge overlay.
 * Navigates to the catalog search page on click.
 */
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

export default function AniCard({ anime, onClick }: AniCardProps) {
  const nav = useNavigate();
  const title = anime.title.english || anime.title.romaji;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const posterUrl = anime.coverImage?.extraLarge || anime.coverImage?.large;
  const synopsis = anime.description
    ? anime.description.replace(/<[^>]+>/g, '').slice(0, 220)
    : null;

  const handleClick = onClick ?? (() =>
    nav(`/search?q=${encodeURIComponent(title)}&type=ANIME`)
  );

  return (
    <GlassCard
      title={title}
      posterUrl={posterUrl}
      year={anime.startDate?.year}
      genres={anime.genres}
      overview={synopsis}
      onClick={handleClick}
      overlay={
        score ? (
          <div
            className="absolute top-2 left-2 z-20 flex items-center gap-0.5 rounded-md px-1.5 py-0.5
              bg-void/85 border border-maroon/40 backdrop-blur-sm
              font-mono text-[10px] text-maroon-bright leading-none"
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {score}
          </div>
        ) : undefined
      }
    />
  );
}
