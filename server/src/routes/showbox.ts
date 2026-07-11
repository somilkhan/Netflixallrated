/**
 * Showbox + FebBox streaming integration.
 *
 * Based on: https://github.com/badwinton/show_feb_box_api
 *
 * Flow:
 *   1. Resolve the TMDB title name
 *   2. Search Showbox for the title → get internal Showbox ID
 *   3. Fetch the FebBox share key from showbox.media
 *   4. Traverse the FebBox file tree to locate the right file
 *   5. Return { embedUrl, streams[] }
 *      - embedUrl: FebBox player iframe URL (no auth required)
 *      - streams:  direct HLS/MP4 URLs (only when FEBBOX_UI_COOKIE is set)
 */
import { Router, Request, Response } from 'express';
import CryptoJS from 'crypto-js';
import { JSDOM } from 'jsdom';
import { getTmdbDetails } from '../lib/tmdb.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ── ShowboxAPI ───────────────────────────────────────────────────────────────

const CONFIG = {
  BASE_URL: 'https://mbpapi.shegu.net/api/api_client/index/',
  APP_KEY: 'moviebox',
  IV: 'wEiphTn!',
  KEY: '123d6cedf626dy54233aa1w6',
  DEFAULTS: {
    child_mode: process.env.CHILD_MODE || '0',
    app_version: '11.5',
    lang: 'en',
    platform: 'android',
    channel: 'Website',
    appid: '27',
    version: '129',
    medium: 'Website',
  },
} as const;

/** Random 32-char hex string (nanoid equivalent) */
function nanoid32(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
}

function sbEncrypt(data: string): string {
  return CryptoJS.TripleDES.encrypt(
    data,
    CryptoJS.enc.Utf8.parse(CONFIG.KEY),
    { iv: CryptoJS.enc.Utf8.parse(CONFIG.IV) },
  ).toString();
}

function sbVerify(encrypted: string): string {
  return CryptoJS.MD5(
    CryptoJS.MD5(CONFIG.APP_KEY).toString() + CONFIG.KEY + encrypted,
  ).toString();
}

async function showboxRequest(
  module: string,
  params: Record<string, unknown> = {},
): Promise<any> {
  const requestData = {
    ...CONFIG.DEFAULTS,
    expired_date: Math.floor(Date.now() / 1000 + 60 * 60 * 12),
    module,
    ...params,
  };

  const encryptedData = sbEncrypt(JSON.stringify(requestData));
  const body = JSON.stringify({
    app_key: CryptoJS.MD5(CONFIG.APP_KEY).toString(),
    verify: sbVerify(encryptedData),
    encrypt_data: encryptedData,
  });

  const formData = new URLSearchParams({
    data: Buffer.from(body).toString('base64'),
    appid: CONFIG.DEFAULTS.appid,
    platform: CONFIG.DEFAULTS.platform,
    version: CONFIG.DEFAULTS.version,
    medium: CONFIG.DEFAULTS.medium,
  });

  const res = await fetch(CONFIG.BASE_URL, {
    method: 'POST',
    headers: {
      Platform: CONFIG.DEFAULTS.platform,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'okhttp/3.2.0',
    },
    body: `${formData.toString()}&token${nanoid32()}`,
    signal: AbortSignal.timeout(12_000),
  });

  const json: any = await res.json();
  // Search5 returns data as a direct array; other calls wrap in { list: [] }
  return json.data;
}

async function searchShowbox(
  keyword: string,
  type: 'movie' | 'tv',
): Promise<any[]> {
  const data = await showboxRequest('Search5', {
    page: 1,
    type,
    keyword,
    pagelimit: 20,
  });
  return Array.isArray(data) ? data : (data?.list ?? []);
}

/** Returns FebBox share key, e.g. "fNBTg8at" */
async function getFebBoxKey(id: number, type: number): Promise<string | null> {
  const res = await fetch(
    `https://www.showbox.media/index/share_link?id=${id}&type=${type}`,
    { signal: AbortSignal.timeout(8_000) },
  );
  if (!res.ok) throw new Error(`FebBox share link HTTP ${res.status}`);
  const json: any = await res.json();
  const link: string | undefined = json?.data?.link;
  return link ? (link.split('/').pop() ?? null) : null;
}

// ── FebboxAPI ────────────────────────────────────────────────────────────────

const FEBBOX_BASE = 'https://www.febbox.com';
const FEBBOX_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

function febHeaders(shareKey: string, cookie?: string): Record<string, string> {
  return {
    'x-requested-with': 'XMLHttpRequest',
    'user-agent': FEBBOX_UA,
    referer: `${FEBBOX_BASE}/share/${shareKey}`,
    ...(cookie ? { cookie: `ui=${cookie}` } : {}),
  };
}

interface FebFile {
  fid: number;
  file_name: string;
  is_dir: number;
  [k: string]: unknown;
}

interface FebStream {
  url: string;
  quality: string;
  name: string;
  speed?: string;
  size?: string;
}

async function febFileList(
  shareKey: string,
  parentId = 0,
  cookie?: string,
): Promise<FebFile[]> {
  const url =
    `${FEBBOX_BASE}/file/file_share_list` +
    `?share_key=${shareKey}&pwd=&parent_id=${parentId}&is_html=0`;
  const res = await fetch(url, {
    headers: febHeaders(shareKey, cookie),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`FebBox file list HTTP ${res.status}`);
  const json: any = await res.json();
  return json?.data?.file_list ?? [];
}

/** Parse FebBox quality HTML using JSDOM — exact same approach as reference repo */
function parseQualityHtml(html: string): FebStream[] {
  if (!html) return [];
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  return Array.from(doc.querySelectorAll('.file_quality')).map((el) => {
    const url = el.getAttribute('data-url') ?? '';
    const quality = el.getAttribute('data-quality') ?? '';
    const name = (el.querySelector('.name') as HTMLElement)?.textContent?.trim() ?? '';
    const speed = (el.querySelector('.speed span') as HTMLElement)?.textContent?.trim();
    const size = (el.querySelector('.size') as HTMLElement)?.textContent?.trim();
    return { url, quality, name, speed, size };
  }).filter((s) => !!s.url);
}

const QUALITY_ORDER = ['4k', '2160p', '1080p', '720p', '480p', '360p', '240p'];

function sortStreams(streams: FebStream[]): FebStream[] {
  return streams.sort((a, b) => {
    const ai = QUALITY_ORDER.findIndex((q) => a.quality.toLowerCase().includes(q));
    const bi = QUALITY_ORDER.findIndex((q) => b.quality.toLowerCase().includes(q));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

async function febStreamLinks(
  shareKey: string,
  fid: number,
  cookie?: string,
): Promise<FebStream[]> {
  const url = `${FEBBOX_BASE}/console/video_quality_list?fid=${fid}`;
  const res = await fetch(url, {
    headers: febHeaders(shareKey, cookie),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`FebBox quality list HTTP ${res.status}`);
  const json: any = await res.json();
  return sortStreams(parseQualityHtml(json?.html ?? ''));
}

// ── File-tree navigation ─────────────────────────────────────────────────────

async function findMovieFid(
  shareKey: string,
  cookie?: string,
): Promise<number | null> {
  const files = await febFileList(shareKey, 0, cookie);
  console.log(`[febbox] movie root files (${files.length}):`, files.map((f) => f.file_name));
  return files.find((f) => f.is_dir === 0)?.fid ?? null;
}

async function findEpisodeFid(
  shareKey: string,
  seasonNum: number,
  episodeNum: number,
  cookie?: string,
): Promise<number | null> {
  const rootFiles = await febFileList(shareKey, 0, cookie);
  console.log(`[febbox] TV root files (${rootFiles.length}):`, rootFiles.map((f) => f.file_name));

  // Find season folder
  const seasonFolder =
    rootFiles.find(
      (f) =>
        f.is_dir === 1 &&
        f.file_name.toLowerCase().includes(`season ${seasonNum}`),
    ) ??
    rootFiles.find(
      (f) =>
        f.is_dir === 1 &&
        f.file_name.toLowerCase().includes(`s${String(seasonNum).padStart(2, '0')}`),
    ) ??
    rootFiles.filter((f) => f.is_dir === 1)[seasonNum - 1] ??
    rootFiles.find((f) => f.is_dir === 1);

  const epFiles = seasonFolder
    ? await febFileList(shareKey, seasonFolder.fid, cookie)
    : rootFiles;

  console.log(`[febbox] season folder:`, seasonFolder?.file_name, `ep files (${epFiles.length}):`, epFiles.map((f) => f.file_name));

  const epPad = String(episodeNum).padStart(2, '0');
  const found =
    epFiles.find(
      (f) =>
        f.is_dir === 0 &&
        (f.file_name.toLowerCase().includes(`e${epPad}`) ||
          f.file_name.toLowerCase().includes(`episode ${episodeNum}`) ||
          f.file_name.toLowerCase().includes(`ep${episodeNum}`) ||
          f.file_name.toLowerCase().includes(`- ${episodeNum} -`) ||
          f.file_name.toLowerCase().includes(`.${epPad}.`)),
    ) ??
    epFiles.filter((f) => f.is_dir === 0)[episodeNum - 1] ??
    epFiles.find((f) => f.is_dir === 0);

  return found?.fid ?? null;
}

// ── Route ────────────────────────────────────────────────────────────────────

/**
 * GET /api/showbox/link
 *   ?type=movie|tv   required
 *   &id=<tmdbId>     required  (TMDB numeric ID)
 *   [&title=...]     optional  (skips TMDB round-trip when caller knows the name)
 *   [&season=N]      optional, default 1
 *   [&episode=N]     optional, default 1
 *
 * Response 200: { success: true, embedUrl, shareKey, fid, streams[] }
 * Response 4xx/5xx: { success: false, error: string }
 */
router.get('/link', authenticate, async (req: Request, res: Response) => {
  const {
    type,
    id,
    season = '1',
    episode = '1',
    title: titleParam,
  } = req.query;

  if (!type || !id) {
    return res.status(400).json({ success: false, error: 'type and id are required' });
  }

  const isMovie = String(type) === 'movie';
  const tmdbId = parseInt(String(id), 10);
  if (isNaN(tmdbId)) {
    return res.status(400).json({ success: false, error: 'id must be a numeric TMDB ID' });
  }

  const seasonNum = Math.max(1, parseInt(String(season), 10) || 1);
  const episodeNum = Math.max(1, parseInt(String(episode), 10) || 1);

  // Cookie from env var (set in Railway as FEBBOX_UI_COOKIE)
  const febCookie = process.env.FEBBOX_UI_COOKIE || undefined;

  console.log(`[showbox] request — type=${type} id=${tmdbId} season=${seasonNum} ep=${episodeNum} cookie=${febCookie ? 'set' : 'NOT SET'}`);

  try {
    // 1. Resolve title name
    let titleName: string;
    if (titleParam) {
      titleName = String(titleParam);
    } else {
      const tmdb = await getTmdbDetails(tmdbId, isMovie ? 'movie' : 'tv');
      titleName = tmdb.name;
    }
    console.log(`[showbox] searching for: "${titleName}"`);

    // 2. Search Showbox
    const results = await searchShowbox(titleName, isMovie ? 'movie' : 'tv');
    console.log(`[showbox] search returned ${results.length} results`, results.slice(0, 2).map((r: any) => r.title ?? r.name ?? r.id));
    if (!results.length) {
      return res.status(404).json({ success: false, error: 'Title not found on Showbox' });
    }

    const match = results[0];
    const boxType = isMovie ? 1 : 2;

    // 3. Get FebBox share key
    const shareKey = await getFebBoxKey(match.id, boxType);
    console.log(`[showbox] shareKey=${shareKey}`);
    if (!shareKey) {
      return res.status(404).json({ success: false, error: 'FebBox share link unavailable' });
    }

    // 4. Locate target file in FebBox tree
    const fid = isMovie
      ? await findMovieFid(shareKey, febCookie)
      : await findEpisodeFid(shareKey, seasonNum, episodeNum, febCookie);

    console.log(`[showbox] fid=${fid}`);

    // 5. Build embed URL
    const embedUrl = fid
      ? `${FEBBOX_BASE}/file/player?fid=${fid}&share_key=${shareKey}`
      : `${FEBBOX_BASE}/share/${shareKey}`;

    // 6. Fetch direct stream links (requires FEBBOX_UI_COOKIE)
    let streams: FebStream[] = [];
    if (febCookie && fid) {
      try {
        streams = await febStreamLinks(shareKey, fid, febCookie);
        console.log(`[showbox] streams found: ${streams.length}`);
      } catch (e: any) {
        console.warn('[showbox] stream link fetch failed (non-fatal):', e.message);
      }
    }

    return res.json({ success: true, embedUrl, shareKey, fid, streams });
  } catch (err: any) {
    console.error('[showbox] link error:', err.message);
    const upstreamDown =
      /HTTP 50\d/.test(err.message) ||
      /Unexpected token|not valid JSON/i.test(err.message) ||
      /fetch failed|ECONNREFUSED|ETIMEDOUT/i.test(err.message);
    return res.status(upstreamDown ? 503 : 500).json({
      success: false,
      error: upstreamDown
        ? 'FebBox is temporarily unavailable — try another server'
        : `Stream lookup failed: ${err.message}`,
    });
  }
});

export default router;
