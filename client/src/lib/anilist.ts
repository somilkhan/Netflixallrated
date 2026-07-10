const ANILIST_API = 'https://graphql.anilist.co';

export interface AniListMedia {
  id: number;
  title: { romaji: string; english: string | null };
  description: string | null;
  episodes: number | null;
  duration: number | null;
  status: string;
  genres: string[];
  averageScore: number | null;
  popularity: number;
  coverImage: { large: string; extraLarge: string };
  bannerImage: string | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  studios: { nodes: { name: string }[] };
}

/** Extended detail fields — used only by getAnimeById on the unified title page. */
export interface AniListMediaDetail extends AniListMedia {
  season: string | null;
  seasonYear: number | null;
  format: string | null;
  relations: { edges: { relationType: string; node: { id: number; title: { romaji: string; english: string | null }; format: string | null; coverImage: { large: string; extraLarge: string } } }[] };
  characters: { edges: { role: string; node: { id: number; name: { full: string }; image: { large: string | null } } }[] };
}

export interface AniListTag {
  name: string;
  category: string;
}

export interface AnimePage {
  sort?: string;
  page?: number;
  perPage?: number;
  genre?: string;
  tag?: string;
  search?: string;
  season?: string;
  seasonYear?: number;
  status?: string;
  format?: string;
  idNotIn?: number[];
}

const PAGE_MEDIA_FIELDS = `
  id
  title { romaji english }
  description(asHtml: false)
  episodes
  duration
  status
  genres
  averageScore
  popularity
  coverImage { large extraLarge }
  bannerImage
  startDate { year month day }
  studios { nodes { name } }
`;

async function runQuery<T = unknown>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`AniList HTTP ${response.status}`);
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? 'AniList API error');
  return json.data as T;
}

// ── Single-result search (used by TitleDetail for anicrush look-up) ─────────
const SEARCH_QUERY = `
  query ($search: String) {
    Media(search: $search, type: ANIME) {
      ${PAGE_MEDIA_FIELDS}
    }
  }
`;

export async function searchAnime(name: string): Promise<AniListMedia | null> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: SEARCH_QUERY, variables: { search: name } }),
    });
    const json = await response.json();
    if (json.errors) { console.error('AniList API error:', json.errors); return null; }
    return json.data?.Media ?? null;
  } catch (error) {
    console.error('Failed to fetch anime data:', error);
    return null;
  }
}

// ── Paginated feed (trending / popular / genre / tag / search) ───────────────
const PAGE_QUERY = `
  query (
    $page: Int, $perPage: Int, $sort: [MediaSort],
    $genre: String, $tag: String, $search: String,
    $season: MediaSeason, $seasonYear: Int,
    $status: MediaStatus, $format: MediaFormat, $id_not_in: [Int]
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage total }
      media(
        type: ANIME,
        sort: $sort,
        genre: $genre,
        tag: $tag,
        search: $search,
        season: $season,
        seasonYear: $seasonYear,
        status: $status,
        format: $format,
        id_not_in: $id_not_in
      ) {
        ${PAGE_MEDIA_FIELDS}
      }
    }
  }
`;

/**
 * Live trending / popular / top-rated / seasonal / genre / tag anime feed.
 * Every parameter is optional — never hardcoded.
 */
export async function getAnimePage({
  sort = 'POPULARITY_DESC',
  page = 1,
  perPage = 20,
  genre,
  tag,
  search,
  season,
  seasonYear,
  status,
  format,
  idNotIn,
}: AnimePage = {}): Promise<AniListMedia[]> {
  const variables: Record<string, unknown> = {
    page,
    perPage,
    sort: [sort],
    ...(genre      ? { genre }                   : {}),
    ...(tag        ? { tag }                     : {}),
    ...(search     ? { search }                  : {}),
    ...(season     ? { season }                  : {}),
    ...(seasonYear ? { seasonYear }              : {}),
    ...(status     ? { status }                  : {}),
    ...(format     ? { format }                  : {}),
    ...(idNotIn?.length ? { id_not_in: idNotIn } : {}),
  };
  // runQuery throws on network/API error — let it propagate so callers show error UI
  const data = await runQuery<{ Page: { media: AniListMedia[] } }>(PAGE_QUERY, variables);
  return data.Page?.media ?? [];
}

/**
 * Same as getAnimePage but also returns pageInfo, used by infinite-scroll
 * "View all" section pages.
 */
export async function getAnimePageWithInfo({
  sort = 'POPULARITY_DESC',
  page = 1,
  perPage = 24,
  genre,
  tag,
  search,
  season,
  seasonYear,
  status,
  format,
  idNotIn,
}: AnimePage = {}): Promise<{ media: AniListMedia[]; hasNextPage: boolean; total: number }> {
  const variables: Record<string, unknown> = {
    page,
    perPage,
    sort: [sort],
    ...(genre      ? { genre }                   : {}),
    ...(tag        ? { tag }                     : {}),
    ...(search     ? { search }                  : {}),
    ...(season     ? { season }                  : {}),
    ...(seasonYear ? { seasonYear }              : {}),
    ...(status     ? { status }                  : {}),
    ...(format     ? { format }                  : {}),
    ...(idNotIn?.length ? { id_not_in: idNotIn } : {}),
  };
  const data = await runQuery<{ Page: { media: AniListMedia[]; pageInfo: { hasNextPage: boolean; total: number } } }>(PAGE_QUERY, variables);
  return {
    media: data.Page?.media ?? [],
    hasNextPage: !!data.Page?.pageInfo?.hasNextPage,
    total: data.Page?.pageInfo?.total ?? 0,
  };
}

// ── Full live genre + tag list ────────────────────────────────────────────────
export async function getAnimeGenresAndTags(): Promise<{
  genres: string[];
  tags: AniListTag[];
}> {
  const query = `
    query {
      GenreCollection
      MediaTagCollection { name category isGeneralSpoiler }
    }
  `;
  const data = await runQuery<{
    GenreCollection: string[];
    MediaTagCollection: { name: string; category: string; isGeneralSpoiler: boolean }[];
  }>(query, {});
  return {
    genres: data.GenreCollection ?? [],
    tags: (data.MediaTagCollection ?? [])
      .filter(t => !t.isGeneralSpoiler)
      .map(t => ({ name: t.name, category: t.category })),
  };
}

// ── Single title by AniList ID ────────────────────────────────────────────────
const BY_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      ${PAGE_MEDIA_FIELDS}
    }
  }
`;

export async function getAnimeById(id: number): Promise<AniListMedia | null> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: BY_ID_QUERY, variables: { id } }),
    });
    const json = await response.json();
    return json.data?.Media ?? null;
  } catch (error) {
    console.error('Failed to fetch anime by id:', error);
    return null;
  }
}

// ── Detail fields — season/status/studios/relations/characters for /title/:id ──
const DETAIL_QUERY = `
  query ($id: Int, $search: String) {
    Media(id: $id, search: $search, type: ANIME) {
      ${PAGE_MEDIA_FIELDS}
      season
      seasonYear
      format
      relations {
        edges {
          relationType
          node { id title { romaji english } format coverImage { large extraLarge } }
        }
      }
      characters(sort: ROLE, perPage: 12) {
        edges {
          role
          node { id name { full } image { large } }
        }
      }
    }
  }
`;

/** Anime-specific metadata for the unified title page — by AniList id if known, else by name. */
export async function getAnimeDetail(opts: { id?: number; name?: string }): Promise<AniListMediaDetail | null> {
  try {
    const data = await runQuery<{ Media: AniListMediaDetail | null }>(DETAIL_QUERY, {
      id: opts.id,
      search: opts.id ? undefined : opts.name,
    });
    return data.Media ?? null;
  } catch (error) {
    console.error('Failed to fetch anime detail:', error);
    return null;
  }
}

// ── Season helpers ────────────────────────────────────────────────────────────
export function getCurrentSeason(): 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' {
  const m = new Date().getMonth() + 1;
  if (m <= 3) return 'WINTER';
  if (m <= 6) return 'SPRING';
  if (m <= 9) return 'SUMMER';
  return 'FALL';
}

/** Capitalises first letter — 'SUMMER' → 'Summer' */
export function formatSeason(season: string): string {
  return season.charAt(0) + season.slice(1).toLowerCase();
}
