/**
 * AniCard — glassmorphism card for AniList anime results.
 * Resolves the anime into the local catalog (creating a row on first view)
 * and navigates to /title/:id — the same unified detail page used for
 * Movies and TV, never a separate anime-only page.
 */
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentCard from './ui/ContentCard';
import { navigateToAnime } from '../lib/animeResolve';

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

  const titleStr  = anime.title.english || anime.title.romaji;
  const score     = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const posterUrl = anime.coverImage?.extraLarge || anime.coverImage?.large;
  const synopsis  = anime.description
    ? anime.description.replace(/<[^>]+>/g, '').slice(0, 200)
    : null;

  const handleClick = onClick ?? (() => {
    if (resolving) return;
    setResolving(true);
    navigateToAnime(anime, nav).finally(() => setResolving(false));
  });

  return (
    <ContentCard
      title={{
        id: `anime-${anime.id}`,
        name: titleStr,
        type: 'ANIME',
        year: anime.startDate?.year ?? null,
        posterUrl,
        rating: score ? Number(score) : null,
        genres: anime.genres ?? [],
        synopsis: synopsis ?? '',
      }}
      onNavigate={() => handleClick()}
    />
  );
});

export default AniCard;
