import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Server, Shield, ExternalLink, AlertTriangle, Loader2, Sparkles, Lock, RefreshCw } from 'lucide-react';

const EMBED_SERVERS = [
  { id: 'vidsrc_to', label: 'VidSrc.to', color: 'text-emerald-400', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/10', buildUrl: (id: string, type: string) => `https://vidsrc.to/embed/${type}/${id}` },
  { id: 'vidsrc_me', label: 'VidSrc.me', color: 'text-emerald-400', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/10', buildUrl: (id: string, type: string) => `https://vidsrc.me/embed/${type}?tmdb=${id}` },
  { id: 'superembed', label: 'SuperEmbed', color: 'text-purple-400', borderColor: 'border-purple-500/30', bgColor: 'bg-purple-500/10', buildUrl: (id: string, type: string) => `https://superembed.cc/embed/${type}/${id}` },
  { id: 'embed_su', label: 'Embed.su', color: 'text-blue-400', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/10', buildUrl: (id: string, type: string) => `https://embed.su/embed/${type}/${id}` },
  { id: 'smashystream', label: 'SmashyStream', color: 'text-orange-400', borderColor: 'border-orange-500/30', bgColor: 'bg-orange-500/10', buildUrl: (id: string, type: string) => `https://smashystream.com/${type}/${id}` },
];

interface CustomPlayerProps {
  tmdbId: string;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  title: string;
}

export default function CustomPlayer({ tmdbId, type, season = 1, episode = 1, title }: CustomPlayerProps) {
  const [selectedServer, setSelectedServer] = useState('vidsrc_to');
  const [iframeKey, setIframeKey] = useState(0);

  const activeServer = useMemo(() => EMBED_SERVERS.find(s => s.id === selectedServer) || EMBED_SERVERS[0], [selectedServer]);

  const embedUrl = useMemo(() => {
    const tmdb = tmdbId || '27205';
    if (selectedServer === 'vidsrc_to' || selectedServer === 'superembed' || selectedServer === 'embed_su') {
      if (type === 'tv') return activeServer.buildUrl(tmdb, 'tv') + `/${season}/${episode}`;
      return activeServer.buildUrl(tmdb, 'movie');
    }
    return activeServer.buildUrl(tmdb, type === 'tv' ? 'tv' : 'movie');
  }, [tmdbId, type, season, episode, selectedServer, activeServer]);

  const handleReload = () => setIframeKey(k => k + 1);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-3 bg-zinc-950 border border-zinc-900 p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">{type === 'tv' ? `S${season} • E${episode}` : 'Full Movie'}</h3>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReload} className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all" title="Reload Player"><RefreshCw className="w-3.5 h-3.5" /></button>
            <button onClick={() => window.open(embedUrl, '_blank', 'noopener,noreferrer')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-bold transition-all"><ExternalLink className="w-3.5 h-3.5" /><span>Cinema Mode</span></button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EMBED_SERVERS.map(srv => (
            <button key={srv.id} onClick={() => setSelectedServer(srv.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 border ${selectedServer === srv.id ? `${srv.bgColor} ${srv.borderColor} ${srv.color} shadow-md` : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'}`}>
              <span>{srv.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-900 aspect-video w-full shadow-2xl group">
        <iframe key={`${selectedServer}-${iframeKey}`} src={embedUrl} className="w-full h-full border-0 bg-black" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="no-referrer" title={title} sandbox="allow-scripts allow-same-origin allow-forms allow-presentation" />
        <div className="absolute top-3 left-3 bg-black/70 border border-zinc-800/50 px-2 py-1 rounded text-[8px] font-mono text-zinc-500 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5"><Lock className="w-2.5 h-2.5 text-emerald-400" /><span>SANDBOXED • {activeServer.label}</span></div>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950/60 border border-zinc-900 rounded-xl p-3.5 text-xs">
        <div className="flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div><p className="text-[11px] text-zinc-300 leading-relaxed"><strong className="text-zinc-200">Sandbox Active:</strong> iframe restricted. Use <strong className="text-blue-400">Cinema Mode</strong> for clean tab.</p></div>
        </div>
      </div>
    </div>
  );
}
