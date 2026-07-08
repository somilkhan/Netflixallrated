/**
 * Consumet routes — wraps @consumet/extensions META providers.
 *
 * Anime  : META.Anilist  (backed by Hianime in this fork)
 * Movies : META.TMDB     (backed by HiMovies in this fork)
 *
 * Also exposes GET /api/consumet/player — a self-contained HTML page that
 * plays any HLS/MP4 stream via hls.js loaded from CDN. The client embeds
 * it as an <iframe> src, avoiding any CORS or hls.js bundle issues.
 */
import { Router, Request, Response } from 'express';
import { META } from '@consumet/extensions';

const router = Router();

// Singleton providers (init once, reuse across requests)
let anilist: InstanceType<typeof META.Anilist> | null = null;
let tmdb: InstanceType<typeof META.TMDB> | null = null;

function getAnilist() {
  return anilist ??= new META.Anilist();
}
function getTmdb() {
  // Pass our TMDB_API_KEY if available, otherwise use the built-in default
  return tmdb ??= new META.TMDB(process.env.TMDB_API_KEY);
}

// ─── Anime (Anilist META → Hianime) ────────────────────────────────────────

// GET /api/consumet/anime/search?q=demon+slayer
router.get('/anime/search', async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q required' });
  try {
    const data = await getAnilist().search(String(q));
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/consumet/anime/info/:anilistId
// Returns episodes list (id, number, title, …)
router.get('/anime/info/:anilistId', async (req: Request, res: Response) => {
  try {
    const info = await getAnilist().fetchAnimeInfo(req.params.anilistId);
    return res.json({
      id: info.id,
      title: info.title,
      totalEpisodes: info.totalEpisodes,
      episodes: info.episodes,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/consumet/anime/stream/:episodeId   (URL-encoded episode ID)
// Returns { sources: [{url, quality, isM3U8}], headers }
router.get('/anime/stream/:episodeId', async (req: Request, res: Response) => {
  try {
    const epId = decodeURIComponent(req.params.episodeId);
    const data = await getAnilist().fetchEpisodeSources(epId);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Movies / TV (TMDB META → HiMovies) ────────────────────────────────────

// GET /api/consumet/movies/search?q=avengers&type=Movie|TvSeries
router.get('/movies/search', async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q required' });
  try {
    const data = await getTmdb().search(String(q));
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/consumet/movies/info/:mediaId
router.get('/movies/info/:mediaId', async (req: Request, res: Response) => {
  try {
    const mediaId = decodeURIComponent(req.params.mediaId);
    const info = await getTmdb().fetchMediaInfo(mediaId, 'movie');
    return res.json(info);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/consumet/movies/stream?mediaId=...&episodeId=...&type=movie|tv
router.get('/movies/stream', async (req: Request, res: Response) => {
  const { mediaId, episodeId, type = 'movie' } = req.query;
  if (!mediaId || !episodeId) return res.status(400).json({ error: 'mediaId and episodeId required' });
  try {
    const src = await getTmdb().fetchEpisodeSources(String(episodeId), String(mediaId));
    return res.json(src);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/consumet/movies/auto?title=...&type=MOVIE|SERIES&season=1&ep=1
 * All-in-one: search → pick match → get episode → get stream → return playerUrl.
 * The client just iframes the playerUrl.
 */
router.get('/movies/auto', async (req: Request, res: Response) => {
  const { title, type = 'MOVIE', season = '1', ep = '1' } = req.query;
  if (!title) return res.status(400).json({ error: 'title required' });

  try {
    const searchData = await getTmdb().search(String(title));
    const results: any[] = (searchData as any).results ?? [];
    if (!results.length) return res.status(404).json({ error: 'No results found' });

    const wantMovie = String(type) === 'MOVIE';
    const best: any =
      results.find(r => wantMovie ? r.type === 'Movie' : r.type === 'TV Series') ??
      results[0];

    const info: any = await getTmdb().fetchMediaInfo(best.id, wantMovie ? 'movie' : 'tv');
    const episodes: any[] = info.episodes ?? [];
    let episodeObj: any;

    if (wantMovie) {
      episodeObj = episodes[0];
    } else {
      const s = Number(season);
      const e = Number(ep);
      episodeObj = episodes.find((ep: any) => ep.season === s && ep.number === e) ?? episodes[0];
    }

    if (!episodeObj) return res.status(404).json({ error: 'Episode not found' });

    const sources: any = await getTmdb().fetchEpisodeSources(episodeObj.id, best.id);
    const sourceList: any[] = sources.sources ?? [];
    const m3u8 = sourceList.find(s => s.isM3U8) ?? sourceList[0];
    if (!m3u8) return res.status(404).json({ error: 'No streaming source found' });

    const referer = sources.headers?.Referer ?? '';
    const base = `${req.protocol}://${req.get('host')}`;
    const playerUrl = `${base}/api/consumet/player?src=${encodeURIComponent(m3u8.url)}&ref=${encodeURIComponent(referer)}`;

    return res.json({ playerUrl, quality: m3u8.quality, title: best.title });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Embedded HLS/MP4 player page ──────────────────────────────────────────
/**
 * GET /api/consumet/player?src=<url>&ref=<referer>
 * Returns a self-contained HTML page (hls.js from CDN) designed to be
 * embedded as an <iframe> src. Works with m3u8 and direct MP4.
 */
router.get('/player', (_req: Request, res: Response) => {
  const { src, ref: referer } = _req.query;
  if (!src) return res.status(400).send('src required');

  const safeSrc = String(src);
  const safeRef = referer ? String(referer) : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Player</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:100%;height:100%;background:#000;overflow:hidden}
  video{width:100%;height:100%;display:block;background:#000}
  #err{display:none;position:absolute;inset:0;align-items:center;justify-content:center;
       flex-direction:column;gap:10px;color:rgba(245,240,236,.6);
       font:12px/1.5 monospace;background:#080606;text-align:center;padding:20px}
  #err.show{display:flex}
</style>
</head>
<body>
<div id="err"><span style="font-size:22px">⚠</span><span id="emsg">Stream unavailable</span></div>
<video id="v" autoplay controls playsinline></video>
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js"></script>
<script>
var SRC=${JSON.stringify(safeSrc)};
var REF=${JSON.stringify(safeRef)};
var v=document.getElementById('v');
var errEl=document.getElementById('err');
var emsg=document.getElementById('emsg');
function showErr(msg){errEl.className='show';emsg.textContent=msg||'Stream unavailable';}
if(Hls.isSupported()){
  var hls=new Hls({xhrSetup:function(xhr){if(REF)xhr.setRequestHeader('Referer',REF);}});
  hls.on(Hls.Events.ERROR,function(e,d){if(d.fatal)showErr('HLS error: '+d.details);});
  hls.loadSource(SRC);
  hls.attachMedia(v);
  hls.on(Hls.Events.MANIFEST_PARSED,function(){v.play().catch(function(){});});
}else if(v.canPlayType('application/vnd.apple.mpegurl')){
  v.src=SRC;
  v.addEventListener('error',function(){showErr('Native HLS error');});
  v.play().catch(function(){});
}else{
  v.src=SRC;
  v.addEventListener('error',function(){showErr('Cannot play this format');});
  v.play().catch(function(){});
}
</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  return res.send(html);
});

export default router;
