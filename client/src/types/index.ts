export interface Title {
  id: string;
  name: string;
  type: 'MOVIE' | 'SERIES' | 'ANIME';
  year: number;
  runtimeMinutes?: number;
  genres: string[];
  synopsis: string;
  posterColorFrom: string;
  posterColorTo: string;
  trailerYoutubeId?: string;
  officialWatchLinks?: { platform: string; url: string }[];
  platforms: { platform: { id: string; name: string; abbr: string } }[];
  tmdbId?: number;
  posterUrl?: string;
  backdropUrl?: string;
  createdAt: string;
}

export interface TmdbSearchResult {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  name: string;
  year: number | null;
  posterUrl: string | null;
  overview: string;
}

export interface Rating {
  id: string;
  userId: string;
  titleId: string;
  tier: 'SKIP' | 'TIMEPASS' | 'GOFORIT' | 'PERFECTION';
  reviewText?: string;
  createdAt: string;
  user?: { displayName: string };
}

export interface WatchlistItem {
  id: string;
  userId: string;
  titleId: string;
  status: 'PLAN_TO_WATCH' | 'WATCHING' | 'COMPLETED' | 'DROPPED';
  title: Title;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role?: 'USER' | 'ADMIN';
}

export interface Platform {
  id: string;
  name: string;
  abbr: string;
  iconUrl?: string;
}
