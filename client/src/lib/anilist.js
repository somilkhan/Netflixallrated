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
