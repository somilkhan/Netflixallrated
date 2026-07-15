/** Video server definitions — kept outside component files so Fast Refresh works. */

export interface Server {
  id: string;
  label: string;
  getUrl: (tmdbId: number, type: string, season: number, ep: number) => string;
}

export const SERVERS: Server[] = [
  {
    // Screenscape is the default player — correct params are s= and e= (not season= / episode=)
    id: 'screenscape-embed',
    label: 'Screenscape',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://screenscape.me/embed?tmdb=${id}&type=movie&lan=eng`
        : type === 'ANIME'
        ? `https://screenscape.me/embed?tmdb=${id}&type=tv&s=1&e=${e}&lan=eng`
        : `https://screenscape.me/embed?tmdb=${id}&type=tv&s=${s}&e=${e}&lan=eng`,
  },
  {
    id: 'vidrock',
    label: 'VidRock',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://vidrock.ru/movie/${id}`
        : `https://vidrock.ru/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidnest',
    label: 'VidNest',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://vidnest.fun/movie/${id}`
        : `https://vidnest.fun/tv/${id}/${s}/${e}`,
  },
  {
    id: 'nebulaflix',
    label: 'NebulaFlix',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://embedmaster.link/ve98e4r1wov87o5k/movie/${id}`
        : `https://embedmaster.link/ve98e4r1wov87o5k/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc',
    label: 'VidSrc',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://vidsrc.to/embed/movie/${id}`
        : `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc2',
    label: 'VidSrc2',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://vidsrc.xyz/embed/movie?tmdb=${id}`
        : `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: '2embed',
    label: '2Embed',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://www.2embed.cc/embed/${id}`
        : `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: 'filmu',
    label: 'Filmu',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://embed.filmu.in/movie/${id}`
        : type === 'ANIME'
        ? `https://embed.filmu.in/tv/${id}/1/${e}`
        : `https://embed.filmu.in/tv/${id}/${s}/${e}`,
  },
  {
    id: 'flixhq',
    label: 'FlixHQ',
    // URL resolved asynchronously by TitleDetail
    getUrl: () => '',
  },
  {
    id: 'febbox',
    label: 'FebBox',
    // URL resolved asynchronously by TitleDetail via /api/showbox/link
    getUrl: () => '',
  },
  {
    id: '4khdhub',
    label: '4kHDHub',
    // URL resolved asynchronously by TitleDetail via /api/screenscape/resolve
    getUrl: () => '',
  },
  {
    id: 'hdhub4u',
    label: 'HDHub4u',
    // URL resolved asynchronously by TitleDetail via /api/screenscape/hdhub4u/resolve
    getUrl: () => '',
  },
];
