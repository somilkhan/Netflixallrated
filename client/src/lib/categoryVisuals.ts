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

export const PLATFORM_LOGO: Record<string, { logo: string; color: string }> = {
  netflix: { logo: 'NETFLIX', color: '#E50914' },
  'prime-video': { logo: 'prime video', color: '#00A8E1' },
  hotstar: { logo: 'hotstar', color: '#1A6CF2' },
  crunchyroll: { logo: 'crunchyroll', color: '#F47521' },
  'apple-tv': { logo: 'Apple TV+', color: '#F0F0F2' },
  mubi: { logo: 'MUBI', color: '#D4A84B' },
};
