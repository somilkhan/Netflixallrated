/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Movie {
  id: string;
  type: 'movie' | 'tv';
  title: string;
  name?: string;
  backdrop_path: string;
  poster_path: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  runtime?: number;
  number_of_seasons?: number;
  genres: string[];
  youtube_id: string;
  age_rating?: string;
  match_percentage?: number;
  cast?: string[];
  initialSeason?: number;
  initialEpisode?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar_url: string;
  is_kids?: boolean;
}

export interface ProfileData {
  watchlist: string[];
  liked: string[];
  watched: string[];
  genresPreference: Record<string, number>;
}

export interface UserState {
  user: UserProfile | null;
  profiles: Profile[];
  activeProfile: Profile | null;
  watchlist: string[]; // List of movie/TV ids (fallback / main user)
  liked: string[]; // List of movie/TV ids
  watched: string[]; // List of movie/TV ids
  genresPreference: Record<string, number>; // Weights for liked genres
  profileStates?: Record<string, ProfileData>; // Map of profileId -> data
}
