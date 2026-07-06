import React, { useState, useMemo, useCallback } from 'react';
import {
  Server, Shield, ExternalLink, AlertTriangle, Loader2,
  Play, Tv, Film, MonitorPlay, Sparkles, Lock, RefreshCw
} from 'lucide-react';

export const EMBED_SERVERS = [
  {
    id: 'vidsrc_to',
    label: 'VidSrc.to',
    icon: 'vidsrc',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    buildUrl: (tmdbId: string, type: string, season?: number, episode?: number) => {
      if (type === 'tv') return `https://vidsrc.to/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      return `https://vidsrc.to/embed/movie/${tmdbId}`;
    }
  },
  {
    id: 'vidsrc_me',
    label: 'VidSrc.me',
    icon: 'vidsrc',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    buildUrl: (tmdbId: string, type: string, season?: number, episode?: number) => {
      if (type === 'tv') return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season || 1}&episode=${episode || 1}`;
      return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
    }
  },
  {
    id: 'vidsrc_cc',
    label: 'VidSrc.cc',
    icon: 'vidsrc',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    buildUrl: (tmdbId: string, type: string, season?: number, episode?: number) => {
      if (type === 'tv') return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      return `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;
    }
  },
  {
    id: 'vidsrc_pro',
    label: 'VidSrc.pro',
    icon: 'vidsrc',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    buildUrl: (tmdbId: string, type: string, season?: number, episode?: number) => {
      if (type === 'tv') return `https://vidsrc.pro/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      return `https://vidsrc.pro/embed/movie/${tmdbId}`;
    }
  },
  {
    id: 'superembed',
    label: 'SuperEmbed',
    icon: 'superembed',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/10',
    buildUrl: (tmdbId: string, type: string, season?: number, episode?: number) => {
      if (type === 'tv') return `https://superembed.cc/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      return `https://superembed.cc/embed/movie/${tmdbId}`;
    }
  },
  {
    id: 'embed_su',
    label: 'Embed.su',
    icon: 'embedsu',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    buildUrl: (tmdbId: string, type: string, season?: number, episode?: number) => {
      if (type === 'tv') return `https://embed.su/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      return `https://embed.su/embed/movie/${tmdbId}`;
    }
  },
  {
    id: 'smashystream',
    label: 'SmashyStream',
    icon: 'smashy',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    bgColor: 'bg-orange-500/10',
    buildUrl: (tmdbId: string, type: string, season?: number, episode?: number) => {
      if (type === 'tv') return `https://smashystream.com/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      return `https://smashystream.com/movie/${tmdbId}`;
    }
  },
  {
    id: 'showbox_native',
    label: 'Showbox Native (High-Speed)',
    icon: 'showbox',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    isNative: true,
    buildUrl: (tmdbId: string, type: string, season?: number, episode?: number, lang?: string) => {
      const params = new URLSearchParams({ id: tmdbId, type });
      if (season) params.set('season', String(season));
      if (episode) params.set('episode', String(episode));
      if (lang) params.set('lang', lang);
      return `/api/showbox/link?${params.toString()}`;
    }
  },
  {
    id: 'streamrip',
    label: 'Streamrip',
    icon: 'streamrip',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    buildUrl: (tmdbId: string, type: string, season?: number, episode?: number) => {
      if (type === 'tv') return `https://embed.filmu.in/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      return `https://embed.filmu.in/movie/${tmdbId}`;
    }
  },
  {
    id: 'vidzen',
    label: 'Vidzen',
    icon: 'vidzen',
    color: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    bgColor: 'bg-pink-500/10',
    buildUrl: (tmdbId: string, type: string, season?: number, episode?: number) => {
      if (type === 'tv') return `https://vidzen.fun/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      return `https://vidzen.fun/movie/${tmdbId}`;
    }
  },
  {
    id: 'vidcore',
    label: 'VidCore',
    icon: 'vidcore',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    bgColor: 'bg-indigo-500/10',
    buildUrl: (tmdbId: string, type: string, season?: number, episode?: number) => {
      if (type === 'tv') return `https://vidcore.net/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      return `https://vidcore.net/movie/${tmdbId}`;
    }
  },
  {
    id: 'filmu',
    label: 'Filmu.in',
    icon: 'filmu',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/10',
    buildUrl: (tmdbId: string, type: string, season?: number, episode?: number) => {
      if (type === 'tv') return `https://embed.filmu.in/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      return `https://embed.filmu.in/movie/${tmdbId}`;
    }
  },
];

interface StreamData {
  quality: string;
  url: string;
  type?: string;
}

interface CustomPlayerProps {
  tmdbId: string;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  title: string;
  lang?: string;
  anilistId?: string;
  isAnime?: boolean;
}

export default function CustomPlayer({
  tmdbId,
  type,
  season = 1,
  episode = 1,
  title,
  lang = 'en',
  anilistId,
  isAnime = false
}: CustomPlayerProps) {
  const [selectedServer, setSelectedServer] = useState<string>('vidsrc_to');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showboxStreams, setShowbox  const [showboxStreams, setShowboxStreams] = useState<StreamData[] | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>('1080p');
  const [iframeKey, setIframeKey] = useState(0);
  const [showCinemaMode, setShowCinemaMode] = useState(false);

  const activeServer = useMemo(() =>
    EMBED_SERVERS.find(s => s.id === selectedServer) || EMBED_SERVERS[0]
  , [selectedServer]);

  const embedUrl = useMemo(() => {
    setError(null);
    setShowboxStreams(null);

    if (isAnime && anilistId) {
      if (selectedServer === 'streamrip' || selectedServer === 'filmu') {
        return `https://embed.filmu.in/anime/${anilistId}/${episode}`;
      }
      if (selectedServer === 'vidzen') {
        return `https://vidzen.fun/anime/${anilistId}/${episode}`;
      }
    }

    return activeServer.buildUrl(tmdbId, type, season, episode, lang);
  }, [tmdbId, type, season, episode, selectedServer, lang, isAnime, anilistId, activeServer]);

  const resolveShowboxStream = useCallback(async () => {
    if (selectedServer !== 'showbox_native') return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(embedUrl);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to resolve stream');
      }

      setShowboxStreams(data.streams || []);
      if (data.streams && data.streams.length > 0) {
        setSelectedQuality(data.streams[0].quality);
      }
    } catch (err: any) {
      setError(err.message || 'Showbox stream resolution failed');
      setShowboxStreams(null);
    } finally {
      setIsLoading(false);
    }
  }, [embedUrl, selectedServer]);

  React.useEffect(() => {
    if (selectedServer === 'showbox_native') {
      resolveShowboxStream();
    }
  }, [selectedServer, resolveShowboxStream]);

  const handleReload = () => {
    setIframeKey(prev => prev + 1);
  };

  const openCinemaMode = () => {
    const url = activeServer.isNative && showboxStreams
      ? showboxStreams.find(s => s.quality === selectedQuality)?.url || showboxStreams[0]?.url
      : embedUrl;

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">

      <div className="flex flex-col gap-3 bg-zinc-950 border border-zinc-900 p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              {type === 'tv'
                ? `S${season} • E${episode}`
                : type === 'movie' ? 'Full Movie' : `EP ${episode}`}
            </h3>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReload}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
              title="Reload Player"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={openCinemaMode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-bold transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Cinema Mode</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {EMBED_SERVERS.map((srv) => (
            <button
              key={srv.id}
              onClick={() => setSelectedServer(srv.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 border ${
                selectedServer === srv.id
                  ? `${srv.bgColor} ${srv.borderColor} ${srv.color} shadow-md`
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {srv.isNative && <Sparkles className="w-3 h-3" />}
              <span>{srv.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-900 aspect-video w-full shadow-2xl group">

        {isLoading && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-3 z-30">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="text-xs font-mono text-zinc-400">Resolving high-speed stream...</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-3 z-30 p-6">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <p className="text-sm text-zinc-300 text-center">{error}</p>
            <button
              onClick={handleReload}
              className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {selectedServer === 'showbox_native' && showboxStreams && showboxStreams.length > 0 ? (
          <div className="w-full h-full relative">
            <video
              key={selectedQuality}
              src={showboxStreams.find(s => s.quality === selectedQuality)?.url || showboxStreams[0]?.url}
              className="w-full h-full"
              controls
              autoPlay
              playsInline
              preload="metadata"
            />

            <div className="absolute top-3 right-3 flex items-center gap-2">
              <div className="flex items-center gap-1 bg-black/80 border border-zinc-800 rounded-lg px-2 py-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase">Quality:</span>
                {showboxStreams.map((stream) => (
                  <button
                    key={stream.quality}
                    onClick={() => setSelectedQuality(stream.quality)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      selectedQuality === stream.quality
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {stream.quality}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <iframe
            key={`${selectedServer}-${iframeKey}`}
            src={embedUrl}
            className="w-full h-full border-0 bg-black"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="no-referrer"
            title={title}
            id="streaming-embed-iframe"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          />
        )}

        <div className="absolute top-3 left-3 bg-black/70 border border-zinc-800/50 px-2 py-1 rounded text-[8px] font-mono text-zinc-500 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5">
          <Lock className="w-2.5 h-2.5 text-emerald-400" />
          <span>SANDBOXED • {activeServer.label}</span>
        </div>

        <div
          className="absolute inset-0 pointer-events-none z-20"
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950/60 border border-zinc-900 rounded-xl p-3.5 text-xs">
        <div className="flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              <strong className="text-zinc-200">Sandbox Active:</strong> iframe is restricted with
              <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-400 mx-1">sandbox</code>
              attributes. Popups, redirects, and malicious scripts are blocked.
              Use <strong className="text-blue-400">Cinema Mode</strong> for a clean external tab.
            </p>
          </div>
        </div>

        {activeServer.isNative && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full shrink-0">
            <Sparkles className="w-3 h-3" />
            <span>Native Stream • Server-Side Resolved</span>
          </div>
        )}
      </div>
    </div>
  );
}

export { EMBED_SERVERS };
export type { StreamData, CustomPlayerProps };
