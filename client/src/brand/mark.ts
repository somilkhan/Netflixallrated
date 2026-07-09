/**
 * NetflixAllrated brand mark — shared geometry.
 *
 * Concept: "The Aperture Star" — a faceted four-point compass star cut like
 * polished glass. The star's diagonal facet creases echo an "N" (zigzag,
 * left facet) and an "A" (apex + crossbar, top facet). At the exact center,
 * where all four facets meet, a small triangle of pure background shows
 * through as a hidden play glyph — the mark only reveals its "play" reading
 * once you look for it, same as the negative-space arrow in a well-known
 * shipping logo.
 *
 * Every path below lives in a 0–100 viewBox so it scales losslessly and
 * stays crisp down to a 16×16 favicon.
 */

/** Outer four-point sparkle/compass star silhouette. */
export const STAR_OUTLINE =
  'M50 3.5 C54.5 28 71 44.5 96.5 50 C71 55.5 54.5 72 50 96.5 C45.5 72 29 55.5 3.5 50 C29 44.5 45.5 28 50 3.5 Z';

/** The four tip + center points used to build facet triangles. */
export const CENTER = { x: 50, y: 50 };
export const TIP_TOP = { x: 50, y: 3.5 };
export const TIP_RIGHT = { x: 96.5, y: 50 };
export const TIP_BOTTOM = { x: 50, y: 96.5 };
export const TIP_LEFT = { x: 3.5, y: 50 };

/** Four triangles that tile the star, one per facet (top-right = highlight, bottom-left = shadow). */
export const FACET_TOP_RIGHT = `M50 50 L50 3.5 L96.5 50 Z`;
export const FACET_BOTTOM_RIGHT = `M50 50 L96.5 50 L50 96.5 Z`;
export const FACET_BOTTOM_LEFT = `M50 50 L50 96.5 L3.5 50 Z`;
export const FACET_TOP_LEFT = `M50 50 L3.5 50 L50 3.5 Z`;

/** Crease inside the top facet — apex + crossbar, an abstracted "A". */
export const CREASE_A = 'M50 3.5 L50 50 M39 32 L61 32';

/** Crease inside the left facet — a zigzag, an abstracted "N". */
export const CREASE_N = 'M3.5 50 L28 38 L28 62 L50 50';

/** Hidden play glyph — negative-space triangle at the exact facet crossing. */
export const PLAY_NEGATIVE_SPACE = 'M45.5 42.5 L45.5 57.5 L58 50 Z';

export const BRAND = {
  bg: '#090909',
  void: '#0B0908',
  maroonDeep: '#3D1219',
  maroon: '#7A2530',
  maroonBright: '#C2434F',
  rose: '#F0A5AD',
  ink: '#F5F0EC',
} as const;
