/**
 * Maps ISO 3166-1 alpha-2 country codes to the primary spoken/content
 * languages that should be surfaced in Luma's Cinema section.
 *
 * Values are ISO 639-1 language codes accepted by the TMDb `with_original_language`
 * and `language` query parameters.
 */
export const REGION_LANGUAGE_MAP: Record<string, string[]> = {
  IN: ['hi', 'ta', 'te'],
  KR: ['ko'],
  US: ['en'],
  GB: ['en'],
  JP: ['ja'],
  FR: ['fr'],
  DE: ['de'],
  ES: ['es'],
  BR: ['pt'],
  MX: ['es'],
  CN: ['zh'],
  TW: ['zh'],
  IT: ['it'],
  RU: ['ru'],
  TR: ['tr'],
  TH: ['th'],
  ID: ['id'],
  PH: ['tl', 'en'],
  PK: ['ur', 'hi'],
};

/**
 * Returns the list of languages to query for a given region code.
 * Falls back to English if the region is not in the map.
 */
export function getLanguagesForRegion(region: string): string[] {
  return REGION_LANGUAGE_MAP[region] ?? ['en'];
}
