import React, { useState, useEffect } from "react";
import { X, Tv, RefreshCw, Play, Database, ChevronDown, Check, Shield, Activity, Info, AlertTriangle, Cpu, Globe } from "lucide-react";
import { Movie } from "../types";

interface CustomPlayerProps {
  movie: Movie;
  onClose: () => void;
}

interface StreamServer {
  name: string;
  label: string;
  flag: string;
  isEmbed: boolean;
  embedUrl: string;
  speed: "Fast" | "Normal" | "Super Fast";
  stability: "Stable" | "Highly Stable" | "Backup";
  description: string;
}

const FALLBACK_TMDB_MAP: Record<string, { tmdbId: string; type: "movie" | "tv" }> = {
  "f-1": { tmdbId: "693134", type: "movie" }, // Dune: Part Two
  "f-2": { tmdbId: "872585", type: "movie" }, // Oppenheimer
  "f-3": { tmdbId: "569094", type: "movie" }, // Spider-Man: Across the Spider-Verse
  "f-4": { tmdbId: "157336", type: "movie" }, // Interstellar
  "f-5": { tmdbId: "138984", type: "tv" },    // Succession
  "f-6": { tmdbId: "115004", type: "tv" },    // Severance
  "f-7": { tmdbId: "155", type: "movie" },     // The Dark Knight
  "f-8": { tmdbId: "705996", type: "movie" }, // Everything Everywhere All at Once
  "f-9": { tmdbId: "66732", type: "tv" },     // Stranger Things
  "f-10": { tmdbId: "100088", type: "tv" },   // The Last of Us
  "f-11": { tmdbId: "335984", type: "movie" }, // Blade Runner 2049
  "f-12": { tmdbId: "1399", type: "tv" },     // Breaking Bad
  "f-13": { tmdbId: "27205", type: "movie" }, // Inception
  "f-14": { tmdbId: "76341", type: "movie" }  // Mad Max: Fury Road
};

const STREAMING_SERVERS: StreamServer[] = [
  {
    name: "Scape",
    label: "Screenscape (Direct Stream)",
    flag: "🇮🇳 🇺🇸",
    isEmbed: true,
    embedUrl: "https://main.screenscape.me/embed",
    speed: "Super Fast",
    stability: "Highly Stable",
    description: "Premium ad-shielded direct streaming player. Supports multilingual tracks (English, Hindi, Tamil, Telugu)."
  },
  {
    name: "vidsrc-me",
    label: "VidSrc.me (High Compatibility)",
    flag: "🇺🇸 🌐",
    isEmbed: true,
    embedUrl: "https://vidsrc.me/embed",
    speed: "Super Fast",
    stability: "Highly Stable",
    description: "Highly compatible backup player. Supports automatic multi-resolution."
  },
  {
    name: "vidsrc-to",
    label: "VidSrc.to (Super Fast)",
    flag: "🇺🇸 ⚡",
    isEmbed: true,
    embedUrl: "https://vidsrc.to/embed",
    speed: "Super Fast",
    stability: "Stable",
    description: "Fast loading speeds with responsive CDN mirroring."
  },
  {
    name: "vidsrc-pro",
    label: "VidSrc.pro (Multi-lang)",
    flag: "🇪🇺 🌐",
    isEmbed: true,
    embedUrl: "https://vidsrc.pro/embed",
    speed: "Fast",
    stability: "Stable",
    description: "Provides multi-language audio tracks and external subtitle choices."
  },
  {
    name: "superembed",
    label: "SuperEmbed (Multi-Source)",
    flag: "🇬🇧 🌐",
    isEmbed: true,
    embedUrl: "https://multiembed.mov",
    speed: "Normal",
    stability: "Backup",
    description: "Multi-provider scraper with aggregate stream links."
  },
  {
    name: "autoembed",
    label: "AutoEmbed (Speed)",
    flag: "🇨🇦 ⚡",
    isEmbed: true,
    embedUrl: "https://player.autoembed.cc/embed",
    speed: "Fast",
    stability: "Stable",
    description: "Fast-caching server optimized for North American routes."
  }
];

export default function CustomPlayer({ movie, onClose }: CustomPlayerProps) {
  const [season, setSeason] = useState(movie.initialSeason || 1);
  const [episode, setEpisode] = useState(movie.initialEpisode || 1);
  const [key, setKey] = useState(0); // For forcing iframe reload
  const [selectedServer, setSelectedServer] = useState<StreamServer>(STREAMING_SERVERS[0]);
  const [isServerHubOpen, setIsServerHubOpen] = useState(false);
  const [language, setLanguage] = useState<string>("eng");

  // Reset season/episode if movie changes
  useEffect(() => {
    if (movie.initialSeason) {
      setSeason(movie.initialSeason);
    }
    if (movie.initialEpisode) {
      setEpisode(movie.initialEpisode);
    }
  }, [movie.id, movie.initialSeason, movie.initialEpisode]);

  const { tmdbId, type } = movie.id.startsWith("f-")
    ? (FALLBACK_TMDB_MAP[movie.id] || { tmdbId: "693134", type: movie.type })
    : { tmdbId: movie.id, type: movie.type };

  const getEmbedUrl = (server: StreamServer) => {
    const sName = server.name.toLowerCase();
    
    // Screenscape (Scape)
    if (sName === "scape") {
      const baseUrl = server.embedUrl;
      const langParam = language ? `&lan=${language}` : "";
      if (type === "tv") {
        return `${baseUrl}?tmdb=${tmdbId}&type=tv&s=${season}&e=${episode}${langParam}`;
      }
      return `${baseUrl}?tmdb=${tmdbId}&type=movie${langParam}`;
    }
    
    // VidSrc.me
    if (sName === "vidsrc-me") {
      const baseUrl = "https://vidsrc.me/embed";
      if (type === "tv") {
        return `${baseUrl}/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
      }
      return `${baseUrl}/movie?tmdb=${tmdbId}`;
    }
    
    // VidSrc.to
    if (sName === "vidsrc-to") {
      const baseUrl = "https://vidsrc.to/embed";
      if (type === "tv") {
        return `${baseUrl}/tv/${tmdbId}/${season}/${episode}`;
      }
      return `${baseUrl}/movie/${tmdbId}`;
    }
    
    // VidSrc.pro
    if (sName === "vidsrc-pro") {
      const baseUrl = "https://vidsrc.pro/embed";
      if (type === "tv") {
        return `${baseUrl}/tv/${tmdbId}/${season}/${episode}`;
      }
      return `${baseUrl}/movie/${tmdbId}`;
    }
    
    // SuperEmbed
    if (sName === "superembed") {
      const baseUrl = "https://multiembed.mov";
      if (type === "tv") {
        return `${baseUrl}/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
      }
      return `${baseUrl}/?video_id=${tmdbId}&tmdb=1`;
    }
    
    // AutoEmbed
    if (sName === "autoembed") {
      const baseUrl = "https://player.autoembed.cc/embed";
      if (type === "tv") {
        return `${baseUrl}/tv/${tmdbId}/${season}/${episode}`;
      }
      return `${baseUrl}/movie/${tmdbId}`;
    }
    
    // Fallback
    const baseUrl = "https://vidsrc.me/embed";
    if (type === "tv") {
      return `${baseUrl}/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
    }
    return `${baseUrl}/movie?tmdb=${tmdbId}`;
  };

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  const handleSelectServer = (server: StreamServer) => {
    setSelectedServer(server);
    setIsServerHubOpen(false);
  };

  // Generate lists for seasons and episodes
  const totalSeasons = type === "tv" ? (movie.number_of_seasons || 5) : 0;
  const seasonsList = Array.from({ length: totalSeasons }, (_, i) => i + 1);
  const episodesList = Array.from({ length: 24 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0406] flex flex-col justify-between select-none animate-fade-in text-white font-sans">
      {/* Player Top bar Controls */}
      <div className="p-4 md:p-6 bg-gradient-to-b from-black/95 to-transparent flex flex-col xl:flex-row items-center justify-between gap-4 z-10 border-b border-white/5">
        <div className="flex items-center gap-4 w-full xl:w-auto">
          <button
            onClick={onClose}
            className="p-3 bg-[#12090B] hover:bg-brand-red text-white rounded-full transition-all duration-200 shadow-md border border-white/10 cursor-pointer shrink-0"
            title="Back to Browsing"
          >
            <X size={20} />
          </button>
          <div className="truncate">
            <h2 className="font-display font-bold text-base md:text-lg text-white flex flex-wrap items-center gap-2">
              <span className="truncate">{movie.title}</span>
              <span className="text-[10px] bg-brand-red/20 text-brand-red px-2 py-0.5 rounded uppercase font-mono font-bold">
                {type === "tv" ? "TV Show" : "Movie"}
              </span>
              <span className="text-[10px] bg-[#eab308]/20 text-[#eab308] border border-[#eab308]/30 px-2 py-0.5 rounded uppercase font-mono font-bold">
                Embed Player
              </span>
            </h2>
            <p className="text-[10px] font-mono tracking-wider text-gray-400 mt-0.5 uppercase flex items-center gap-1.5 flex-wrap">
              <span>SOURCE: <span className="text-brand-red font-bold">{selectedServer.name.replace("-", "").toUpperCase()}</span></span>
              <span>•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                💾 LIVE CONFIG SYNCED WITH REPO
              </span>
            </p>
          </div>
        </div>

        {/* Dynamic Selectors / Switchers bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto justify-end">
          {/* TV Episode Selector */}
          {type === "tv" && (
            <div className="flex items-center gap-2 bg-[#12090B] border border-white/10 rounded-xl px-3 h-11 sm:h-10 shrink-0">
              <Tv size={14} className="text-gray-400" />
              <select
                value={season}
                onChange={(e) => {
                  setSeason(parseInt(e.target.value));
                  setEpisode(1);
                }}
                className="bg-[#12090B] text-white text-xs outline-none cursor-pointer focus:text-brand-red transition animate-none py-1 border-none"
              >
                {seasonsList.map((s) => (
                  <option key={s} value={s} className="bg-[#12090B]">
                    Season {s}
                  </option>
                ))}
              </select>
              <span className="text-gray-600 text-xs">|</span>
              <select
                value={episode}
                onChange={(e) => setEpisode(parseInt(e.target.value))}
                className="bg-[#12090B] text-white text-xs outline-none cursor-pointer focus:text-brand-red transition animate-none py-1 border-none"
              >
                {episodesList.map((ep) => (
                  <option key={ep} value={ep} className="bg-[#12090B]">
                    Episode {ep}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Server Selector Dropdown - Pill Styled */}
          <div className="relative flex items-center bg-[#12090B] border border-white/10 hover:border-brand-red/50 rounded-xl px-3 h-11 sm:h-10 transition-all min-w-[210px] sm:min-w-[240px]">
            <Database size={14} className="text-brand-red mr-2 shrink-0" />
            <select
              value={selectedServer.name}
              onChange={(e) => {
                const found = STREAMING_SERVERS.find((s) => s.name === e.target.value);
                if (found) setSelectedServer(found);
              }}
              className="bg-transparent text-white text-xs outline-none cursor-pointer pr-6 w-full focus:text-brand-red font-medium transition animate-none appearance-none border-none py-1"
            >
              {STREAMING_SERVERS.map((srv) => (
                <option key={srv.name} value={srv.name} className="bg-[#12090B] text-white">
                  {srv.flag} {srv.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="text-gray-400 absolute right-3 pointer-events-none" />
          </div>

          {/* Language Selector Dropdown - ONLY for Screenscape */}
          {selectedServer.name.toLowerCase() === "scape" && (
            <div className="relative flex items-center bg-[#12090B] border border-white/10 hover:border-brand-red/50 rounded-xl px-3 h-11 sm:h-10 transition-all min-w-[130px]">
              <Globe size={14} className="text-brand-red mr-2 shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-white text-xs outline-none cursor-pointer pr-6 w-full focus:text-brand-red font-medium transition animate-none appearance-none border-none py-1"
              >
                <option value="eng" className="bg-[#12090B] text-white">🇬🇧 English</option>
                <option value="hindi" className="bg-[#12090B] text-white">🇮🇳 Hindi</option>
                <option value="tam" className="bg-[#12090B] text-white">🇮🇳 Tamil</option>
                <option value="tel" className="bg-[#12090B] text-white">🇮🇳 Telugu</option>
              </select>
              <ChevronDown size={14} className="text-gray-400 absolute right-3 pointer-events-none" />
            </div>
          )}

          {/* Buttons: Server Hub & Reload (Compact) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsServerHubOpen(true)}
              className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 px-4 h-11 sm:h-10 rounded-xl bg-[#12090B] hover:bg-brand-red text-white border border-white/10 hover:border-brand-red transition-all text-xs font-bold shadow-md cursor-pointer whitespace-nowrap"
            >
              <Database size={14} className="text-brand-red" />
              <span>Server Hub</span>
            </button>

            <button
              onClick={handleRefresh}
              className="p-3 sm:p-2.5 bg-[#12090B] hover:bg-brand-red text-gray-300 hover:text-white rounded-xl border border-white/10 hover:border-brand-red transition-all flex items-center justify-center shrink-0 h-11 sm:h-10 w-11 sm:w-10 cursor-pointer"
              title="Reload Video Stream"
            >
              <RefreshCw size={14} className="animate-spin-slow" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Stage */}
      <div className="flex-grow w-full relative bg-black flex items-center justify-center overflow-hidden">
        <iframe
          key={`${selectedServer.name}-${season}-${episode}-${key}-${language}`}
          src={getEmbedUrl(selectedServer)}
          className="w-full h-full border-none"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          title={`${movie.title} - ${selectedServer.label}`}
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        />
      </div>

      {/* FOOTER INFO BAR */}
      <div className="bg-black/95 border-t border-white/5 py-3 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-gray-500 font-mono shrink-0">
        <div className="flex items-center gap-1.5 text-center sm:text-left">
          <Play size={12} className="text-brand-red animate-pulse" />
          <span>
            Streaming via {selectedServer.label}. Enjoy seamless playback with ad-shield protocols active.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>TMDB ID: {tmdbId}</span>
          <span>SOURCE: {selectedServer.name.toUpperCase()}</span>
        </div>
      </div>

      {/* SERVER HUB DRAWER / PANEL OVERLAY */}
      {isServerHubOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          {/* Dismiss Back-backdrop */}
          <div className="absolute inset-0" onClick={() => setIsServerHubOpen(false)} />

          {/* Drawer Body */}
          <div className="relative w-full max-w-md h-full bg-[#110a0c] border-l border-white/10 flex flex-col justify-between shadow-2xl animate-slide-in p-6 text-white overflow-hidden z-10">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-brand-red animate-pulse" />
                  <h3 className="text-base font-bold font-display tracking-tight">Streaming Server Hub</h3>
                </div>
                <button
                  onClick={() => setIsServerHubOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                If the active player is buffering, lagging, or showing errors, select one of the redundant secure servers below.
              </p>

              {/* Server Cards List */}
              <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                {STREAMING_SERVERS.map((srv) => {
                  const isActive = selectedServer.name === srv.name;
                  return (
                    <div
                      key={srv.name}
                      onClick={() => handleSelectServer(srv)}
                      className={`p-4.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-brand-red/10 border-brand-red text-white"
                          : "bg-[#181012] border-white/5 hover:border-white/20 hover:bg-[#1f1517] text-gray-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{srv.flag}</span>
                          <span className="font-semibold text-xs font-display">{srv.label}</span>
                        </div>
                        {isActive ? (
                          <span className="flex items-center gap-1 text-[10px] bg-brand-red text-white px-2 py-0.5 rounded font-bold uppercase font-mono">
                            <Check size={10} /> Active
                          </span>
                        ) : (
                          <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded font-medium">
                            Select
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-400 leading-normal mb-2">
                        {srv.description}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500">
                        <span className="flex items-center gap-1">
                          <Activity size={10} className="text-emerald-500" />
                          Speed: <span className="text-emerald-400 font-bold">{srv.speed}</span>
                        </span>
                        <span>•</span>
                        <span>
                          Stability: <span className="text-gray-300 font-bold">{srv.stability}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Status Indicators */}
            <div className="mt-6 border-t border-white/5 pt-4 text-[10px] text-gray-500 font-mono space-y-2">
              <div className="flex items-center gap-2">
                <Shield size={12} className="text-brand-red" />
                <span>Malware & Ad-Shield Engine v2.1.0 is active</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu size={12} className="text-emerald-500" />
                <span>Smart Fallback mirroring is synchronized</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
