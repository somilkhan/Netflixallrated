/**
 * Shared category-tile visuals (backdrop image + tint) used by the
 * "Browse by Genre/Type" rows on both the Categories page and Home page.
 * Centralized so both stay visually consistent.
 */
export const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w780';

export const GENRE_VISUAL: Record<string, { img?: string; tint: string }> = {
  Action: { img: `${TMDB_BACKDROP}/or06FN3Dka5tukK1e9sl16pB3iy.jpg`, tint: 'rgba(200,50,40,0.60)' },
  Drama: { img: `${TMDB_BACKDROP}/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg`, tint: 'rgba(180,110,30,0.60)' },
  Horror: { img: `${TMDB_BACKDROP}/6MKr3KgBuTfMVuar57mJQEcIx8x.jpg`, tint: 'rgba(80,10,10,0.60)' },
  'Sci-Fi': { img: `${TMDB_BACKDROP}/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg`, tint: 'rgba(30,80,200,0.60)' },
  'Science Fiction': { img: `${TMDB_BACKDROP}/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg`, tint: 'rgba(30,80,200,0.60)' },
  Romance: { img: `${TMDB_BACKDROP}/1MGABCxFbGuQSHRmqST7gBJMnSN.jpg`, tint: 'rgba(190,80,80,0.60)' },
  Thriller: { img: `${TMDB_BACKDROP}/or06FN3Dka5tukK1e9sl16pB3iy.jpg`, tint: 'rgba(20,80,50,0.60)' },
  Comedy: { img: `${TMDB_BACKDROP}/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg`, tint: 'rgba(180,150,0,0.60)' },
  Animation: { img: `${TMDB_BACKDROP}/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg`, tint: 'rgba(110,40,200,0.60)' },
  Crime: { tint: 'rgba(60,60,60,0.60)' },
  Fantasy: { tint: 'rgba(60,20,140,0.60)' },
  Adventure: { tint: 'rgba(20,120,80,0.60)' },
  Mystery: { tint: 'rgba(40,20,80,0.60)' },
  Documentary: { tint: 'rgba(20,60,100,0.60)' },
  Family: { tint: 'rgba(140,100,20,0.60)' },
  Music: { tint: 'rgba(180,40,140,0.60)' },
  War: { tint: 'rgba(80,60,20,0.60)' },
  Western: { tint: 'rgba(160,80,10,0.60)' },
  History: { tint: 'rgba(120,80,20,0.60)' },
};

export const DEFAULT_TINT = 'rgba(100,100,100,0.60)';

// Real genre-tile artwork (same images bingr.one uses for its "Popular Genres" rail).
export const GENRE_TILE_IMG: Record<string, string> = {
  Romance: 'https://api.bingr.one/static/categories/1750239101112-a.webp',
  Drama: 'https://api.bingr.one/static/categories/1535285-a-88035ca1ae69.webp',
  Family: 'https://api.bingr.one/static/categories/1535284-a-656c6b45a905.webp',
  Reality: 'https://api.bingr.one/static/categories/1535264-a-9e7871687c76.webp',
  Comedy: 'https://api.bingr.one/static/categories/1535292-a-5739f9c84b63.webp',
  Mythology: 'https://api.bingr.one/static/categories/1535267-a-3cae422b372e.webp',
  Action: 'https://api.bingr.one/static/categories/1535302-a-e90748391e0d.webp',
  Thriller: 'https://api.bingr.one/static/categories/1535246-a-27373cc1a222.webp',
  Crime: 'https://api.bingr.one/static/categories/1535288-a-690bac400aa1.webp',
  Horror: 'https://api.bingr.one/static/categories/1535279-a-c92b487cb711.webp',
  Mystery: 'https://api.bingr.one/static/categories/1535269-a-e0ed0b72ebe7.webp',
  'Sci-Fi': 'https://api.bingr.one/static/categories/1535259-a-6e0b7daffb29.webp',
  'Science Fiction': 'https://api.bingr.one/static/categories/1535259-a-6e0b7daffb29.webp',
  Fantasy: 'https://api.bingr.one/static/categories/1535282-a-ae97739962dc.webp',
  Adventure: 'https://api.bingr.one/static/categories/1535301-a-9bb68bcd147c.webp',
  Superhero: 'https://api.bingr.one/static/categories/1538364-a-a3b574f36633.webp',
  Anime: 'https://api.bingr.one/static/categories/1750239042025-a.webp',
  Animation: 'https://api.bingr.one/static/categories/1535299-a-e6296badeb14.webp',
  Biopic: 'https://api.bingr.one/static/categories/1750239188589-a.webp',
  Historical: 'https://api.bingr.one/static/categories/1535280-a-a1d64ccd7457.webp',
  History: 'https://api.bingr.one/static/categories/1535280-a-a1d64ccd7457.webp',
  Documentary: 'https://api.bingr.one/static/categories/1535286-a-f282f00643b5.webp',
  Musical: 'https://api.bingr.one/static/categories/1535270-a-6a85b09721ab.webp',
  Music: 'https://api.bingr.one/static/categories/1535270-a-6a85b09721ab.webp',
  Devotional: 'https://api.bingr.one/static/categories/1608815-a-7d866bb51198.webp',
  Teen: 'https://api.bingr.one/static/categories/1535248-a-35ccd1ea9ec0.webp',
  Lifestyle: 'https://api.bingr.one/static/categories/1535274-a-5532b8285ed1.webp',
  Travel: 'https://api.bingr.one/static/categories/1535245-a-90839834c474.webp',
  'Science and Technology': 'https://api.bingr.one/static/categories/1568791-a-e50a43088a1a.webp',
  War: 'https://api.bingr.one/static/categories/1535302-a-e90748391e0d.webp',
  Western: 'https://api.bingr.one/static/categories/1535245-a-90839834c474.webp',
};

// Curated marketing-style row titles (bingr renames plain genres into flavorful
// section headers rather than showing raw genre names).
export const CURATED_GENRE_TITLE: Record<string, string> = {
  Horror: 'Spine-Chilling Horror',
  Romance: 'Heartwarming Romance',
  Crime: 'Crime Thrillers',
  Comedy: 'Feel-Good Comedy',
  Action: 'High-Octane Action',
  Thriller: 'Edge-of-Your-Seat Thrillers',
  Fantasy: 'Epic Fantasy',
  'Sci-Fi': 'Mind-Bending Sci-Fi',
  'Science Fiction': 'Mind-Bending Sci-Fi',
  Drama: 'Powerful Dramas',
  Mystery: 'Gripping Mysteries',
  Animation: 'Family Animation',
  Documentary: 'True Stories',
  Adventure: 'Thrilling Adventures',
  Family: 'Family Favorites',
};

// Real language-tile artwork (matches bingr.one's "Popular Languages" rail).
export const LANGUAGE_TILE_IMG: Record<string, string> = {
  English: 'https://api.bingr.one/static/categories/1526660-a-afdd1ecfd8ae.webp',
  Japanese: 'https://api.bingr.one/static/categories/1750233039896-a.webp',
  Korean: 'https://api.bingr.one/static/categories/1526670-a-ec8fb58a5fb8.webp',
  Hindi: 'https://api.bingr.one/static/categories/1526661-a-00b818b5bc0e.webp',
  Portuguese: 'https://api.bingr.one/static/portuguese.webp',
  Spanish: 'https://api.bingr.one/static/spanish.webp',
  Tamil: 'https://api.bingr.one/static/categories/1526682-a-fd4e220ba563.webp',
  Telugu: 'https://api.bingr.one/static/categories/1526685-a-5f5995a53f61.webp',
  Kannada: 'https://api.bingr.one/static/categories/1781241136059-a.webp',
  Malayalam: 'https://api.bingr.one/static/categories/1526672-a-eafe6913c6c8.webp',
  Marathi: 'https://api.bingr.one/static/categories/1526674-a-fdd5233a7699.webp',
  Bengali: 'https://api.bingr.one/static/categories/1526659-a-7271cf19114e.webp',
};

export const POPULAR_LANGUAGES = Object.keys(LANGUAGE_TILE_IMG);

export const PLATFORM_LOGO: Record<string, { logo: string; color: string }> = {
  netflix: { logo: 'NETFLIX', color: '#E50914' },
  'prime-video': { logo: 'prime video', color: '#00A8E1' },
  hotstar: { logo: 'hotstar', color: '#1A6CF2' },
  crunchyroll: { logo: 'crunchyroll', color: '#F47521' },
  'apple-tv': { logo: 'Apple TV+', color: '#F0F0F2' },
  mubi: { logo: 'MUBI', color: '#D4A84B' },
};
