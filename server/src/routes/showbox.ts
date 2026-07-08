/**
 * Showbox + FebBox streaming integration.
 *
 * Flow:
 *   1. Resolve the TMDB title name (from query ?title= or by fetching TMDB)
 *   2. Search Showbox for the title → get the Showbox internal ID
 *   3. Fetch the FebBox share key from showbox.media
 *   4. Traverse the FebBox file tree to locate the right file
 *      (season/episode navigation for TV shows)
 *   5. Return { embedUrl, streams[] }
 *      - embedUrl: FebBox player iframe URL (always present, no auth required)
 *      - streams:  sorted direct HLS/MP4 URLs (only when FEBBOX_UI_COOKIE is set)
 *
 * No dependency on an external SHOWBOX_FEB_BOX_API_URL relay server.
 * Reference implementation: https://github.com/badwinton/show_feb_box_api
 */
import { Router, Request, Response } from 'express';
import CryptoJS from 'crypto-js';
import { getTmdbDetails } from '../lib/tmdb.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ── ShowboxAPI ───────────────────────────────────────────────────────────────

const SB = {
  BASE_URL: 'https://mbpapi.shegu.net/api/api_client/index/',
  APP_KEY: 'moviebox',
  IV: 'wEiphTn!',
  KEY: '123d6cedf626dy54233aa1w6',
  DEFAULTS: {
    child_mode: '0',
    app_version: '11.5',
    lang: 'en',
    platform: 'android',
    channel: 'Website',
    appid: '27',
    version: '129',
    medium: 'Website',
  },
} as const;

/** Random 32-char hex string used as per-request token suffix */
function hexToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
}

function sbEncrypt(data: string): string {
  return CryptoJS.TripleDES.encrypt(
    data,
    CryptoJS.enc.Utf8.parse(SB.KEY),
    { iv: CryptoJS.enc.Utf8.parse(SB.IV) },
  ).toString();
}

function sbVerify(encrypted: string): string {
  return CryptoJS.MD5(
    CryptoJS.MD5(SB.APP_KEY).toString() + SB.KEY + encrypted,
  ).toString();
}

async function showboxRequest(
  module: string,
  params: Record<string, unknown> = {},
): Promise<any> {
  const payload = {
    ...SB.DEFAULTS,
    expired_date: Math.floor(Date.now() / 1000 + 43_200),
    module,
    ...params,
  };
  const encrypted = sbEncrypt(JSON.stringify(payload));
  const envelope = JSON.stringify({
    app_key: CryptoJS.MD5(SB.APP_KEY).toString(),
    verify: sbVerify(encrypted),
    encrypt_data: encrypted,
  });
  const form = new URLSearchParams({
    data: Buffer.from(envelope).toString('base64'),
    appid: SB.DEFAULTS.appid,
    platform: SB.DEFAULTS.platform,
    version: SB.DEFAULTS.version,
    medium: SB.DEFAULTS.medium,
  });

  const res = await fetch(SB.BASE_URL, {
    method: 'POST',
    headers: {
      Platform: SB.DEFAULTS.platform,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'okhttp/3.2.0',
    },
    body: `${form.toString()}&token${hexToken()}`,
    signal: AbortSignal.timeout(12_000),
  });
  const json: any = await res.json();
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
  // Showbox's Search5 module returns `data` as a plain array of results
  // (not `{ list: [...] }`), but also tolerate a wrapped shape defensively.
  return Array.isArray(data) ? data : (data?.list ?? []);
}

/** Returns FebBox share key, e.g. "fNBTg8at" */
async function getFebBoxKey(
  showboxId: number,
  boxType: number,
): Promise<string | null> {
  const res = await fetch(
    `https://www.showbox.media/index/share_link?id=${showboxId}&type=${boxType}`,
    { signal: AbortSignal.timeout(8_000) },
  );
  const json: any = await res.json();
  const link: string | undefined = json?.data?.link;
  return link ? (link.split('/').pop() ?? null) : null;
}

// ── FebboxAPI ────────────────────────────────────────────────────────────────

const FEBBOX_BASE = 'https://www.febbox.com';
const FEBBOX_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

function febHeaders(
  shareKey: string,
  cookie?: string,
): Record<string, string> {
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

interface FebStream {
  url: string;
  quality: string;
  name: string;
  size?: string;
}

const QUALITY_ORDER = ['4k', '2160p', '1080p', '720p', '480p', '360p', '240p'];

/**
 * Parse FebBox video quality HTML using regex — avoids a jsdom/canvas native
 * build dependency that crashes on Vercel's build environment.
 *
 * Each quality block looks like:
 *   <div class="file_quality" data-url="https://..." data-quality="1080p" ...>
 *     <div class="name">1080p</div>
 *     <div class="size">2.3 GB</div>
 *   </div>
 */
function parseFebStreamHtml(html: string): FebStream[] {
  const streams: FebStream[] = [];
  // Match each .file_quality div (opening tag + everything up to the next sibling/closing)
  const blockRe =
    /<div[^>]*class="[^"]*file_quality[^"]*"([^>]*)>([\s\S]*?)<\/div>\s*(?=<div|$)/gi;

  for (const block of html.matchAll(blockRe)) {
    const attrs = block[1] ?? '';
    const inner = block[2] ?? '';

    const url = (attrs.match(/data-url="([^"]*)"/) ?? [])[1] ?? '';
    const quality = (attrs.match(/data-quality="([^"]*)"/) ?? [])[1] ?? '';
    const name =
      (inner.match(/<div[^>]*class="[^"]*name[^"]*"[^>]*>([\s\S]*?)<\/div>/) ??
        [])[1]
        ?.replace(/<[^>]+>/g, '')
        .trim() ?? '';
    const size =
      (inner.match(/<div[^>]*class="[^"]*size[^"]*"[^>]*>([\s\S]*?)<\/div>/) ??
        [])[1]
        ?.replace(/<[^>]+>/g, '')
        .trim();

    if (url) streams.push({ url, quality, name, size });
  }

  return streams.sort((a, b) => {
    const ai = QUALITY_ORDER.findIndex((q) =>
      a.quality.toLowerCase().includes(q),
    );
    const bi = QUALITY_ORDER.findIndex((q) =>
      b.quality.toLowerCase().includes(q),
    );
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
  return parseFebStreamHtml(json?.html ?? '');
}

// ── File-tree navigation ─────────────────────────────────────────────────────

async function findMovieFid(
  shareKey: string,
  cookie?: string,
): Promise<number | null> {
  const files = await febFileList(shareKey, 0, cookie);
  return files.find((f) => f.is_dir === 0)?.fid ?? null;
}

async function findEpisodeFid(
  shareKey: string,
  seasonNum: number,
  episodeNum: number,
  cookie?: string,
): Promise<number | null> {
  const rootFiles = await febFileList(shareKey, 0, cookie);

  // Season folder heuristics
  const seasonFolder =
    rootFiles.find(
      (f) =>
        f.is_dir === 1 &&
        f.file_name.toLowerCase().includes(`season ${seasonNum}`),
    ) ??
    rootFiles.find(
      (f) => f.is_dir === 1 && f.file_name.toLowerCase().includes(`s${String(seasonNum).padStart(2, '0')}`),
    ) ??
    (rootFiles.filter((f) => f.is_dir === 1)[seasonNum - 1] ?? rootFiles.find((f) => f.is_dir === 1));

  const epFiles = seasonFolder
    ? await febFileList(shareKey, seasonFolder.fid, cookie)
    : rootFiles;

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
 *   [&title=...]     optional  (avoids a TMDB round-trip when caller knows the name)
 *   [&season=N]      optional, default 1
 *   [&episode=N]     optional, default 1
 *
 * Response 200: { success: true, embedUrl, shareKey, fid, streams[] }
 *   embedUrl  FebBox embed player URL — use as <iframe> src (no auth required by FebBox)
 *   streams   sorted direct HLS/MP4 links (empty unless FEBBOX_UI_COOKIE is set)
 *
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
    return res
      .status(400)
      .json({ success: false, error: 'type and id are required' });
  }

  const isMovie = String(type) === 'movie';
  const tmdbId = parseInt(String(id), 10);
  if (isNaN(tmdbId)) {
    return res
      .status(400)
      .json({ success: false, error: 'id must be a numeric TMDB ID' });
  }

  const seasonNum = Math.max(1, parseInt(String(season), 10) || 1);
  const episodeNum = Math.max(1, parseInt(String(episode), 10) || 1);
  const febCookie = process.env.FEBBOX_UI_COOKIE;

  try {
    // 1. Resolve the title name (use caller's hint if provided to save a round-trip)
    let titleName: string;
    if (titleParam) {
      titleName = String(titleParam);
    } else {
      const tmdb = await getTmdbDetails(tmdbId, isMovie ? 'movie' : 'tv');
      titleName = tmdb.name;
    }

    // 2. Search Showbox
    const results = await searchShowbox(titleName, isMovie ? 'movie' : 'tv');
    if (!results.length) {
      return res
        .status(404)
        .json({ success: false, error: 'Title not found on Showbox' });
    }
    const match = results[0];
    const boxType = isMovie ? 1 : 2; // Showbox: 1=movie, 2=tv

    // 3. Get FebBox share key
    const shareKey = await getFebBoxKey(match.id, boxType);
    if (!shareKey) {
      return res
        .status(404)
        .json({ success: false, error: 'FebBox share link unavailable' });
    }

    // 4. Locate the target file in the FebBox tree
    const fid = isMovie
      ? await findMovieFid(shareKey, febCookie)
      : await findEpisodeFid(shareKey, seasonNum, episodeNum, febCookie);

    // 5. Build the embed URL
    const embedUrl = fid
      ? `${FEBBOX_BASE}/file/player?fid=${fid}&share_key=${shareKey}`
      : `${FEBBOX_BASE}/share/${shareKey}`;

    // 6. Fetch direct stream links (optional, needs FEBBOX_UI_COOKIE)
    let streams: FebStream[] = [];
    if (febCookie && fid) {
      try {
        streams = await febStreamLinks(shareKey, fid, febCookie);
      } catch (_) {
        // streams are optional — don't fail the whole request
      }
    }

    return res.json({ success: true, embedUrl, shareKey, fid, streams });
  } catch (err: any) {
    console.error('[showbox] link error:', err.message);
    return res
      .status(500)
      .json({ success: false, error: 'Stream lookup failed' });
  }
});

export default router;
