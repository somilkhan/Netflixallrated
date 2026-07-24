/**
 * Geolocation & Language Detection
 * Detects user's browser language and location, caches preference
 */

export interface RegionConfig {
  code: string;
  name: string;
  languages: string[]; // ISO 639-1 codes (e.g., 'ko', 'en', 'es')
  nativeName: string;
  tmdbRegion?: string; // TMDB region code for releases
  anilistSite?: string; // AniList region site
}

const REGIONS: Record<string, RegionConfig> = {
  ko: {
    code: 'ko',
    name: 'South Korea',
    languages: ['ko'],
    nativeName: '한국',
    tmdbRegion: 'KR',
  },
  ja: {
    code: 'ja',
    name: 'Japan',
    languages: ['ja'],
    nativeName: '日本',
    tmdbRegion: 'JP',
    anilistSite: 'anilist.co',
  },
  zh: {
    code: 'zh',
    name: 'China',
    languages: ['zh-CN', 'zh'],
    nativeName: '中国',
    tmdbRegion: 'CN',
  },
  es: {
    code: 'es',
    name: 'Spain',
    languages: ['es'],
    nativeName: 'España',
    tmdbRegion: 'ES',
  },
  en: {
    code: 'en',
    name: 'United States',
    languages: ['en', 'en-US'],
    nativeName: 'United States',
    tmdbRegion: 'US',
  },
  fr: {
    code: 'fr',
    name: 'France',
    languages: ['fr'],
    nativeName: 'France',
    tmdbRegion: 'FR',
  },
  de: {
    code: 'de',
    name: 'Germany',
    languages: ['de'],
    nativeName: 'Deutschland',
    tmdbRegion: 'DE',
  },
  it: {
    code: 'it',
    name: 'Italy',
    languages: ['it'],
    nativeName: 'Italia',
    tmdbRegion: 'IT',
  },
  pt: {
    code: 'pt',
    name: 'Portugal',
    languages: ['pt', 'pt-BR'],
    nativeName: 'Portugal',
    tmdbRegion: 'PT',
  },
  br: {
    code: 'pt',
    name: 'Brazil',
    languages: ['pt-BR', 'pt'],
    nativeName: 'Brasil',
    tmdbRegion: 'BR',
  },
  ru: {
    code: 'ru',
    name: 'Russia',
    languages: ['ru'],
    nativeName: 'Россия',
    tmdbRegion: 'RU',
  },
  th: {
    code: 'th',
    name: 'Thailand',
    languages: ['th'],
    nativeName: 'ไทย',
    tmdbRegion: 'TH',
  },
  vi: {
    code: 'vi',
    name: 'Vietnam',
    languages: ['vi'],
    nativeName: 'Việt Nam',
    tmdbRegion: 'VN',
  },
  in: {
    code: 'hi',
    name: 'India',
    languages: ['hi', 'en', 'ta', 'te', 'ml', 'kn'],
    nativeName: 'भारत',
    tmdbRegion: 'IN',
  },
};

const LANGUAGE_TO_REGION: Record<string, string> = {
  ko: 'ko',
  ja: 'ja',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  zh: 'zh',
  es: 'es',
  en: 'en',
  fr: 'fr',
  de: 'de',
  it: 'it',
  pt: 'pt',
  'pt-BR': 'br',
  ru: 'ru',
  th: 'th',
  vi: 'vi',
  hi: 'in',
  ta: 'in',
  te: 'in',
  ml: 'in',
  kn: 'in',
};

const STORAGE_KEY = 'allrated_region_preference';

/**
 * Detect user's region from browser language
 */
export function detectRegionFromBrowser(): string {
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  
  // Try exact match first (e.g., 'pt-BR')
  if (LANGUAGE_TO_REGION[browserLang]) {
    return LANGUAGE_TO_REGION[browserLang];
  }

  // Try base language (e.g., 'pt' from 'pt-BR')
  const baseLang = browserLang.split('-')[0];
  if (LANGUAGE_TO_REGION[baseLang]) {
    return LANGUAGE_TO_REGION[baseLang];
  }

  // Default to English/US
  return 'en';
}

/**
 * Get current region preference (from storage or browser detection)
 */
export function getCurrentRegion(): RegionConfig {
  // Check localStorage first
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && REGIONS[stored]) {
    return REGIONS[stored];
  }

  // Auto-detect from browser
  const detected = detectRegionFromBrowser();
  return REGIONS[detected] || REGIONS['en'];
}

/**
 * Set user's region preference
 */
export function setRegionPreference(code: string): void {
  if (REGIONS[code]) {
    localStorage.setItem(STORAGE_KEY, code);
  }
}

/**
 * Get all available regions
 */
export function getAvailableRegions(): RegionConfig[] {
  return Object.values(REGIONS);
}

/**
 * Get TMDB parameters for region-specific content
 */
export function getTMDBRegionParams() {
  const region = getCurrentRegion();
  return {
    language: region.languages[0],
    region: region.tmdbRegion || 'US',
  };
}

/**
 * Hook to detect and track region changes
 */
export function useRegionDetection() {
  const region = getCurrentRegion();
  const allRegions = getAvailableRegions();

  return {
    current: region,
    all: allRegions,
    setRegion: setRegionPreference,
    tmdbParams: getTMDBRegionParams(),
  };
}
