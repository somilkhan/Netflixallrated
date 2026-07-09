export interface AniListTitle {
  romaji: string;
  english: string | null;
}

export interface AniListCoverImage {
  large: string;
  extraLarge: string;
}

export interface AniListDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface AniListStudio {
  name: string;
}

export interface AniListMedia {
  id: number;
  title: AniListTitle;
  description: string | null;
  episodes: number | null;
  duration: number | null;
  status: string;
  genres: string[];
  averageScore: number | null;
  popularity: number;
  coverImage: AniListCoverImage;
  bannerImage: string | null;
  startDate: AniListDate;
  studios: { nodes: AniListStudio[] };
}

export declare function searchAnime(name: string): Promise<AniListMedia | null>;
export declare function getAnimeById(id: number): Promise<AniListMedia | null>;
export declare function getAnimePage(opts?: {
  sort?: string;
  page?: number;
  perPage?: number;
  genre?: string;
  season?: string;
  seasonYear?: number;
  status?: string;
}): Promise<AniListMedia[]>;
export declare function getAnimeGenresAndTags(): Promise<{ genres: string[]; tags: string[] }>;
