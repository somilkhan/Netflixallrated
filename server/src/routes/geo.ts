import { Router } from 'express';
import {
  trendingInRegion,
  popularOnOTT,
  discoverByLanguage,
  type TmdbRegionItem,
} from '../lib/tmdb.js';
import { withTmdbCache } from '../lib/tmdbCache.js';

const router = Router();

// ── Region/language config ────────────────────────────────────────────────

const REGION_LANGUAGE_MAP: Record<string, string[]> = {
  IN: ['hi', 'ta', 'te'],
  KR: ['ko'],
  US: ['en'],
  GB: ['en'],
  JP: ['ja'],
};

const LANGUAGE_LABELS: Record<string, string> = {
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ko: 'Korean',
  en: 'English',
  ja: 'Japanese',
};

const REGION_LABELS: Record<string, string> = {
  IN: 'India',
  KR: 'South Korea',
  US: 'United States',
  GB: 'United Kingdom',
  JP: 'Japan',
};

// ── Geo detection ─────────────────────────────────────────────────────────

async function detectCountry(ip: string): Promise<string> {
  try {
    // Skip private/loopback IPs
    if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return 'IN';
    }
    const res = await fetch(`https://ipapi.co/${ip}/country/`, {
      signal: AbortSignal.timeout(3000),
    });
    const country = (await res.text()).trim();
    return country && /^[A-Z]{2}$/.test(country) ? country : 'IN';
  } catch {
    return 'IN';
  }
}

// GET /api/geo/detect — returns { region }
router.get('/detect', async (req, res) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim()
    || req.socket.remoteAddress
    || '';
  const region = await detectCountry(ip);
  res.json({ region });
});

// GET /api/geo/regions — list of supported regions
router.get('/regions', (_req, res) => {
  res.json(
    Object.entries(REGION_LABELS).map(([code, label]) => ({ code, label }))
  );
});

const SUPPORTED_REGIONS = new Set(Object.keys(REGION_LABELS));

// GET /api/geo/content?region=IN
// Always tries TMDB live first; falls back to the last cached result in the
// KV table if TMDB is unreachable. Each row is cached independently so a
// single failing row doesn't wipe out the others.
router.get('/content', async (req, res) => {
  if (!process.env.TMDB_API_KEY) {
    return res.status(503).json({ error: 'TMDB_API_KEY not configured' });
  }

  // Validate + normalize region — fall back to IN for unsupported values
  const raw = ((req.query.region as string) || '').toUpperCase().trim();
  const region = SUPPORTED_REGIONS.has(raw) ? raw : 'IN';
  const languages = REGION_LANGUAGE_MAP[region] || ['en'];
  const regionLabel = REGION_LABELS[region] || region;

  const rowDefs: { id: string; label: string; fetch: () => Promise<TmdbRegionItem[]> }[] = [
    { id: 'trending', label: `🌍 Popular in ${regionLabel}`, fetch: () => trendingInRegion(region) },
    { id: 'ott',      label: '📺 Popular on Streaming',      fetch: () => popularOnOTT(region) },
    ...languages.map(lang => ({
      id:    `lang-${lang}`,
      label: `🎬 ${LANGUAGE_LABELS[lang] || lang} Cinema`,
      fetch: () => discoverByLanguage(lang, region),
    })),
  ];

  // Each row is fetched independently: TMDB live → cached fallback.
  // allSettled ensures one bad row never kills the whole response.
  const results = await Promise.allSettled(
    rowDefs.map(def =>
      withTmdbCache<TmdbRegionItem[]>(
        `geo:${region}:${def.id}`,
        def.fetch,
      )
    )
  );

  let anyFromCache = false;

  const rows = rowDefs.map((def, i) => {
    const result = results[i];
    if (result.status === 'fulfilled') {
      if (result.value.fromCache) anyFromCache = true;
      return { id: def.id, label: def.label, items: result.value.data };
    }
    // Both TMDB and cache failed for this row — return empty
    return { id: def.id, label: def.label, items: [] };
  });

  res.json({
    region,
    regionLabel,
    rows,
    // Let the client know if we're serving cached data (e.g. to show a banner)
    ...(anyFromCache ? { cached: true } : {}),
  });
});

export default router;
