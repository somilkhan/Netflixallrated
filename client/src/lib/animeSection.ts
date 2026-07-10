/** Shared helpers for building/parsing the "View all" anime section route
 * (/anime/section?...) so AnimeRow and AnimeSectionPage always agree on the
 * query-string shape for a given row's fetch parameters. */

export interface AnimeSectionParams {
  title: string;
  sort?: string;
  genre?: string;
  tag?: string;
  status?: string;
  season?: string;
  seasonYear?: number;
  format?: string;
}

export function buildAnimeSectionHref(params: AnimeSectionParams): string {
  const qs = new URLSearchParams();
  qs.set('title', params.title);
  if (params.sort) qs.set('sort', params.sort);
  if (params.genre) qs.set('genre', params.genre);
  if (params.tag) qs.set('tag', params.tag);
  if (params.status) qs.set('status', params.status);
  if (params.season) qs.set('season', params.season);
  if (params.seasonYear) qs.set('seasonYear', String(params.seasonYear));
  if (params.format) qs.set('format', params.format);
  return `/anime/section?${qs.toString()}`;
}

export function parseAnimeSectionSearch(search: string): AnimeSectionParams {
  const qs = new URLSearchParams(search);
  return {
    title: qs.get('title') || 'Anime',
    sort: qs.get('sort') || undefined,
    genre: qs.get('genre') || undefined,
    tag: qs.get('tag') || undefined,
    status: qs.get('status') || undefined,
    season: qs.get('season') || undefined,
    seasonYear: qs.get('seasonYear') ? Number(qs.get('seasonYear')) : undefined,
    format: qs.get('format') || undefined,
  };
}
