/**
 * VideoPlayer — fullscreen overlay player for TitleDetail.
 *
 * Fix #1 applied:
 * - Source-selector pills live in the top bar (normal block flow, above the iframe).
 * - Prev / Refresh / Next buttons also in the top bar — never overlap the video.
 * - The iframe is wrapped in a `min-h-0` flex child + `player-ratio` container so
 *   it stays in a 16:9 box and cannot overflow its parent.
 *
 * Fix #2 applied:
 * - FebBox streams are played natively via hls.js (direct HLS URLs from shegu.net)
 *   instead of the FebBox embed iframe which requires browser login.
 */
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { RefreshCw, ExternalLink } from 'lucide-react';

export interface Server {
  id: string;
  label: string;
  getUrl: (tmdbId: number, type: string, season: number, ep: number) => string;
}

export const SERVERS: Server[] = [
  {
    // Screenscape is the default player — correct params are s= and e= (not season= / episode=)
    id: 'screenscape-embed',
    label: 'Screenscape',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://screenscape.me/embed?tmdb=${id}&type=movie&lan=eng`
        : type === 'ANIME'
        ? `https://screenscape.me/embed?tmdb=${id}&type=tv&s=1&e=${e}&lan=eng`
        : `https://screenscape.me/embed?tmdb=${id}&type=tv&s=${s}&e=${e}&lan=eng`,
  },
  {
    id: 'vidrock',
    label: 'VidRock',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://vidrock.ru/movie/${id}`
        : `https://vidrock.ru/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidnest',
    label: 'VidNest',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://vidnest.fun/movie/${id}`
        : `https://vidnest.fun/tv/${id}/${s}/${e}`,
  },
  {
    id: 'nebulaflix',
    label: 'NebulaFlix',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://embedmaster.link/ve98e4r1wov87o5k/movie/${id}`
        : `https://embedmaster.link/ve98e4r1wov87o5k/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc',
    label: 'VidSrc',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://vidsrc.to/embed/movie/${id}`
        : `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc2',
    label: 'VidSrc2',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://vidsrc.xyz/embed/movie?tmdb=${id}`
        : `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: '2embed',
    label: '2Embed',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://www.2embed.cc/embed/${id}`
        : `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: 'filmu',
    label: 'Filmu',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://embed.filmu.in/movie/${id}`
        : type === 'ANIME'
        ? `https://embed.filmu.in/tv/${id}/1/${e}`
        : `https://embed.filmu.in/tv/${id}/${s}/${e}`,
  },
  {
    id: 'flixhq',
    label: 'FlixHQ',
    // URL resolved asynchronously by TitleDetail
    getUrl: () => '',
  },
  {
    id: 'febbox',
    label: 'FebBox',
    // URL resolved asynchronously by TitleDetail via /api/showbox/link
    getUrl: () => '',
  },
  {
    id: '4khdhub',
    label: '4kHDHub',
    // URL resolved asynchronously by TitleDetail via /api/screenscape/resolve
    getUrl: () => '',
  },
  {
    id: 'hdhub4u',
    label: 'HDHub4u',
    // URL resolved asynchronously by TitleDetail via /api/screenscape/hdhub4u/resolve
    getUrl: () => '',
  },
];

export interface FebboxStream {
  url: string;
  quality: string;
  name: string;
}

// ---------------------------------------------------------------------------
// FebBoxPlayer — native HLS player for direct shegu.net stream URLs
// ---------------------------------------------------------------------------
export function FebBoxPlayer({
  streams,
  iframeKey,
}: {
  streams: FebboxStream[];
  iframeKey: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [qualityIdx, setQualityIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // When streams or selected quality changes, attach hls.js
  useEffect(() => {
    if (!streams.length) return;
    const video = videoRef.current;
    if (!video) return;

    // Destroy previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setError(null);

    const src = streams[qualityIdx]?.url ?? streams[0].url;

    if (src.includes('.m3u8') || src.includes('hls')) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_evt, data) => {
          if (data.fatal) setError(`Stream error: ${data.details}`);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = src;
        video.play().catch(() => {});
      } else {
        setError('HLS not supported in this browser');
      }
    } else {
      // Direct MP4 / MKV
      video.src = src;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streams, qualityIdx, iframeKey]);

  if (!streams.length) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-ink-dim text-sm">
        No streams available
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-black">
      {/* Quality selector */}
      <div className="absolute top-2 right-2 z-10 flex gap-1.5 flex-wrap justify-end">
        {streams.map((s, i) => (
          <button
            key={i}
            onClick={() => setQualityIdx(i)}
            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
              qualityIdx === i
                ? 'border-maroon-bright bg-maroon/30 text-ink'
                : 'border-line/60 text-ink-dim bg-black/60 hover:text-ink hover:border-line-bright'
            }`}
          >
            {s.quality || s.name || `Q${i + 1}`}
          </button>
        ))}
      </div>

      {error ? (
        <div className="flex-1 flex items-center justify-center text-red-400 text-sm px-4 text-center">
          {error}
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          autoPlay
          playsInline
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VideoPlayerProps
// ---------------------------------------------------------------------------
interface VideoPlayerProps {
  title: any;
  playerOpen: boolean;
  setPlayerOpen: (v: boolean) => void;
  serverId: string;
  switchServer: (id: string) => void;
  iframeKey: number;
  setIframeKey: React.Dispatch<React.SetStateAction<number>>;
  selectedSeason: number;
  selectedEp: number;
  setSelectedEp: React.Dispatch<React.SetStateAction<number>>;
  embedUrl: string | null;
  /** Direct HLS/MP4 streams from FebBox — when present, renders native player */
  febboxStreams?: FebboxStream[];
  /** Called when the user clicks ← Prev inside the anime player */
  onAnimePrev?: () => void;
  /** Called when the user clicks Next → inside the anime player */
  onAnimeNext?: () => void;
}

export default function VideoPlayer({
  title,
  playerOpen,
  setPlayerOpen,
  serverId,
  switchServer,
  iframeKey,
  setIframeKey,
  selectedSeason,
  selectedEp,
  setSelectedEp,
  embedUrl,
  febboxStreams = [],
  onAnimePrev,
  onAnimeNext,
}: VideoPlayerProps) {
  // FebBox with streams → show native player (no embedUrl needed)
  const showFebboxNative = serverId === 'febbox' && febboxStreams.length > 0;

  if (!playerOpen || (!embedUrl && !showFebboxNative)) return null;

  return (
    <div className="fixed inset-0 z-50 bg-void flex flex-col">
      {/*
       * Top bar — source-selector pills + controls all sit HERE (normal block flow).
       * They are shrink-0 so they never get squeezed by the player below.
       */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line shrink-0 bg-surface/80 backdrop-blur-sm gap-3 flex-wrap">
        <div className="shrink-0">
          <p className="font-serif text-sm font-semibold leading-tight">{title.name}</p>
          <p className="text-[10px] text-ink-dim font-mono">
            {title.type === 'SERIES'
              ? `S${selectedSeason} · E${selectedEp}`
              : title.type === 'ANIME'
              ? `Episode ${selectedEp}`
              : title.year}
          </p>
        </div>

        {/* Source-selector pills — above the player, not overlapping it */}
        {title.type !== 'ANIME' && (
          <div className="flex gap-1.5 flex-wrap">
            {SERVERS.map(s => (
              <button
                key={s.id}
                onClick={() => switchServer(s.id)}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-colors ${
                  serverId === s.id
                    ? 'border-maroon-bright bg-maroon/20 text-ink'
                    : 'border-line text-ink-dim hover:text-ink hover:border-line-bright'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        {title.type === 'ANIME' && (
          <span className="text-[10px] font-mono text-ink-dim border border-line rounded-full px-2.5 py-1">
            Anicrush
          </span>
        )}

        {/* Controls — always outside the player box */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setIframeKey(k => k + 1)}
            title="Reload player"
            className="text-xs text-ink-dim border border-line rounded-lg px-2.5 py-1.5 hover:text-ink transition-colors"
          >
            <RefreshCw size={12} />
          </button>

          {/* SERIES: Prev / Next */}
          {title.type === 'SERIES' && (
            <>
              <button
                onClick={() => { setSelectedEp(p => Math.max(1, p - 1)); setIframeKey(k => k + 1); }}
                className="text-xs text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink transition-colors"
              >← Prev</button>
              <button
                onClick={() => { setSelectedEp(p => p + 1); setIframeKey(k => k + 1); }}
                className="text-xs text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink transition-colors"
              >Next →</button>
            </>
          )}

          {/* ANIME: Prev / Next — fetches new embed URL each time */}
          {title.type === 'ANIME' && (
            <>
              <button
                onClick={onAnimePrev}
                disabled={selectedEp <= 1}
                className="text-xs text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >← Prev</button>
              <button
                onClick={onAnimeNext}
                className="text-xs text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink transition-colors"
              >Next →</button>
            </>
          )}

          {/* External link — only for iframe servers, not native HLS */}
          {!showFebboxNative && (
            <a
              href={embedUrl ?? '#'}
              target="_blank"
              rel="noreferrer"
              title="Open in new tab"
              className="text-xs text-ink-dim border border-line rounded-lg px-2.5 py-1.5 hover:text-ink transition-colors inline-flex items-center"
            >
              <ExternalLink size={12} />
            </a>
          )}
          <button
            onClick={() => setPlayerOpen(false)}
            className="text-xs text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink transition-colors"
          >✕</button>
        </div>
      </div>

      {/*
       * Player area: flex-1 + min-h-0 is the standard fix for flex children that
       * would otherwise overflow their parent.
       */}
      <div className="flex-1 min-h-0 overflow-hidden bg-black flex items-center justify-center">
        <div className="relative player-ratio w-full overflow-hidden">
          {showFebboxNative ? (
            <FebBoxPlayer
              streams={febboxStreams}
              iframeKey={iframeKey}
            />
          ) : (
            <iframe
              key={`${serverId}-${selectedSeason}-${selectedEp}-${iframeKey}`}
              src={embedUrl ?? ''}
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              title={title.name}
            />
          )}
        </div>
      </div>
    </div>
  );
}
