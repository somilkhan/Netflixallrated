const ANILIST_API = 'https://graphql.anilist.co';

const SEARCH_QUERY = `
  query ($search: String) {
    Media(search: $search, type: ANIME) {
      id
      title {
        romaji
        english
      }
      description(asHtml: false)
      episodes
      duration
      status
      genres
      averageScore
      popularity
      coverImage {
        large
        extraLarge
      }
      bannerImage
      startDate {
        year
        month
        day
      }
      studios {
        nodes {
          name
        }
      }
    }
  }
`;

export async function searchAnime(name) {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: { search: name },
      }),
    });

    const json = await response.json();

    if (json.errors) {
      console.error('AniList API error:', json.errors);
      return null;
    }

    return json.data.Media;
  } catch (error) {
    console.error('Failed to fetch anime data:', error);
    return null;
  }
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

async function runQuery(query, variables) {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    const json = await response.json();
    if (json.errors) {
      console.error('AniList API error:', json.errors);
      return null;
    }
    return json.data;
  } catch (error) {
    console.error('AniList request failed:', error);
    return null;
  }
}

/** Live trending/popular/top-rated/seasonal anime feed — never hardcoded. */
export async function getAnimePage({ sort = 'TRENDING_DESC', page = 1, perPage = 20, genre, season, seasonYear, status } = {}) {
  const query = `
    query ($page: Int, $perPage: Int, $sort: [MediaSort], $genre: String, $season: MediaSeason, $seasonYear: Int, $status: MediaStatus) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: $sort, genre: $genre, season: $season, seasonYear: $seasonYear, status: $status) {
          ${PAGE_MEDIA_FIELDS}
        }
      }
    }
  `;
  const data = await runQuery(query, { page, perPage, sort: [sort], genre, season, seasonYear, status });
  return data?.Page?.media || [];
}

/** Full live genre + tag list from AniList — never hardcoded. */
export async function getAnimeGenresAndTags() {
  const query = `query { GenreCollection MediaTagCollection { name } }`;
  const data = await runQuery(query, {});
  return {
    genres: data?.GenreCollection || [],
    tags: (data?.MediaTagCollection || []).map(t => t.name),
  };
}

export async function getAnimeById(id) {
  const QUERY_BY_ID = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
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
      }
    }
  `;

  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: QUERY_BY_ID,
        variables: { id },
      }),
    });

    const json = await response.json();
    return json.data?.Media || null;
  } catch (error) {
    console.error('Failed to fetch anime by id:', error);
    return null;
  }
}
