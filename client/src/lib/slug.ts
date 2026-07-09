/** Shared slugify used to build/parse category, genre, and platform URLs
 * consistently across Categories.tsx and DiscoveryPages.tsx — using two
 * different slug schemes for the same data was causing genre/studio detail
 * pages to silently show empty results. */
export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
