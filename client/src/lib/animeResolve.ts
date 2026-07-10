/**
 * Shared "resolve or create" bridge from an AniList media object to the
 * local DB title id, so every anime card — Anime Home, Trending, Genres,
 * Search, Recommendations, Similar Titles — navigates to the SAME unified
 * /title/:id detail page used by Movies and TV instead of a separate view.
 */
import { api } from './api';
import type { AniListMediaLike } from '../components/AniCard';

export async function resolveAnimeTitleId(anime: AniListMediaLike): Promise<string> {
  const { id: dbId } = await api.titles.resolveAnilist({
    anilistId: anime.id,
    name: anime.title.english || anime.title.romaji,
    romaji: anime.title.romaji,
    year: anime.startDate?.year ?? undefined,
    genres: anime.genres,
    synopsis: anime.description
      ? anime.description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
      : undefined,
    posterUrl: anime.coverImage?.extraLarge || anime.coverImage?.large || undefined,
  });
  return dbId;
}

/** Navigate helper — resolves the anime into a local title, then routes to /title/:id. */
export async function navigateToAnime(
  anime: AniListMediaLike,
  navigate: (path: string) => void,
): Promise<void> {
  try {
    const dbId = await resolveAnimeTitleId(anime);
    navigate(`/title/${dbId}`);
  } catch {
    // Resolve failed (network/API) — nothing to navigate to; caller's UI stays put.
  }
}
