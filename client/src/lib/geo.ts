/**
 * Geolocation service — IP-based country detection with localStorage cache.
 * Uses ipapi.co (free, no API key). Falls back to navigator.language.
 * Cache expires after 7 days so users don't hit the API on every visit.
 */

const CACHE_KEY = 'allrated-region';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export interface RegionInfo {
  countryCode: string;
  countryName: string;
  language: string;
}

interface CacheEntry {
  data: RegionInfo;
  expires: number;
}

/** All 20 supported regions, keyed by ISO 3166-1 alpha-2 country code. */
export const REGION_MAP: Record<string, RegionInfo> = {
  IN: { countryCode: 'IN', countryName: 'India',           language: 'hi-IN' },
  US: { countryCode: 'US', countryName: 'United States',   language: 'en-US' },
  KR: { countryCode: 'KR', countryName: 'South Korea',     language: 'ko-KR' },
  JP: { countryCode: 'JP', countryName: 'Japan',           language: 'ja-JP' },
  GB: { countryCode: 'GB', countryName: 'United Kingdom',  language: 'en-GB' },
  CA: { countryCode: 'CA', countryName: 'Canada',          language: 'en-CA' },
  BR: { countryCode: 'BR', countryName: 'Brazil',          language: 'pt-BR' },
  FR: { countryCode: 'FR', countryName: 'France',          language: 'fr-FR' },
  DE: { countryCode: 'DE', countryName: 'Germany',         language: 'de-DE' },
  ES: { countryCode: 'ES', countryName: 'Spain',           language: 'es-ES' },
  IT: { countryCode: 'IT', countryName: 'Italy',           language: 'it-IT' },
  MX: { countryCode: 'MX', countryName: 'Mexico',          language: 'es-MX' },
  TR: { countryCode: 'TR', countryName: 'Turkey',          language: 'tr-TR' },
  RU: { countryCode: 'RU', countryName: 'Russia',          language: 'ru-RU' },
  ID: { countryCode: 'ID', countryName: 'Indonesia',       language: 'id-ID' },
  TH: { countryCode: 'TH', countryName: 'Thailand',        language: 'th-TH' },
  PH: { countryCode: 'PH', countryName: 'Philippines',     language: 'tl-PH' },
  PL: { countryCode: 'PL', countryName: 'Poland',          language: 'pl-PL' },
  NL: { countryCode: 'NL', countryName: 'Netherlands',     language: 'nl-NL' },
  SE: { countryCode: 'SE', countryName: 'Sweden',          language: 'sv-SE' },
};

/** Default fallback region */
export const DEFAULT_REGION: RegionInfo = REGION_MAP['US'];

/** All regions as a sorted array for UI display. */
export const ALL_REGIONS: RegionInfo[] = Object.values(REGION_MAP).sort((a, b) =>
  a.countryName.localeCompare(b.countryName),
);

/** Convert ISO 3166-1 alpha-2 country code to flag emoji (e.g. 'IN' → '🇮🇳'). */
export function countryCodeToFlag(code: string): string {
  return code.toUpperCase().replace(/\w/g, c =>
    String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

// ── Cache helpers ─────────────────────────────────────────────────────────

function readCache(): RegionInfo | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (entry.expires > Date.now()) return entry.data;
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

function writeCache(data: RegionInfo): void {
  try {
    const entry: CacheEntry = { data, expires: Date.now() + CACHE_TTL };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage unavailable — silent
  }
}

// ── Browser language fallback ──────────────────────────────────────────────

function fromNavigatorLanguage(): RegionInfo {
  const lang = navigator.language || 'en-US';
  // e.g. 'hi-IN' → 'IN', 'en-US' → 'US', 'ko' → try common mappings
  const parts = lang.split('-');
  if (parts.length >= 2) {
    const code = parts[1].toUpperCase();
    if (REGION_MAP[code]) return REGION_MAP[code];
  }
  // Single-language codes → best-guess country
  const LANG_TO_COUNTRY: Record<string, string> = {
    hi: 'IN', ko: 'KR', ja: 'JP', pt: 'BR',
    fr: 'FR', de: 'DE', es: 'ES', it: 'IT',
    tr: 'TR', ru: 'RU', id: 'ID', th: 'TH',
    pl: 'PL', nl: 'NL', sv: 'SE',
  };
  const countryCode = LANG_TO_COUNTRY[parts[0].toLowerCase()];
  return (countryCode && REGION_MAP[countryCode]) ? REGION_MAP[countryCode] : DEFAULT_REGION;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Detect the user's region.
 * Order: localStorage cache → ipapi.co → navigator.language → default (US).
 */
export async function detectRegion(): Promise<RegionInfo> {
  const cached = readCache();
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const json = await res.json();
      const code: string = (json.country_code || '').toUpperCase();
      const region = REGION_MAP[code] ?? fromNavigatorLanguage();
      writeCache(region);
      return region;
    }
  } catch {
    // network error or timeout — fall through
  }

  const region = fromNavigatorLanguage();
  writeCache(region);
  return region;
}

/**
 * Read the currently cached region synchronously (no network call).
 * Returns null if no cache exists yet.
 */
export function getCachedRegion(): RegionInfo | null {
  return readCache();
}

/**
 * Manually override the region and persist it in localStorage.
 * Pass `null` to clear and re-detect on next call.
 */
export function setRegion(info: RegionInfo | null): void {
  if (info === null) {
    localStorage.removeItem(CACHE_KEY);
  } else {
    writeCache(info);
  }
}
