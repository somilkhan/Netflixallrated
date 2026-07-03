import React, { useState, useEffect, useRef } from "react";
import { X, Tv, RefreshCw, AlertCircle } from "lucide-react";
import Hls from "hls.js";
import { Movie } from "../types";

interface CustomPlayerProps {
  movie: Movie;
  onClose: () => void;
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

export default function CustomPlayer({ movie, onClose }: CustomPlayerProps) {
  const [provider, setProvider] = useState<"netmirror" | "4khdhub">("netmirror");
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [key, setKey] = useState(0); // For forcing iframe reload

  // Programmatic stream state
  const [streamMode, setStreamMode] = useState<"api" | "embed">("embed");
  const [loadingStream, setLoadingStream] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const { tmdbId, type } = movie.id.startsWith("f-")
    ? (FALLBACK_TMDB_MAP[movie.id] || { tmdbId: "693134", type: movie.type })
    : { tmdbId: movie.id, type: movie.type };

  // 1. Fetch from NetMirror Stream API when configurations change
  useEffect(() => {
    if (provider !== "netmirror") {
      setStreamMode("embed");
      setPlaylistUrl(null);
      setSources([]);
      setSubtitles([]);
      return;
    }

    const fetchStream = async () => {
      try {
        setLoadingStream(true);
        setApiError(null);
        setPlaylistUrl(null);

        // Standard TMDB ID or TV Show ID format
        const queryId = type === "tv" 
          ? `tv-${tmdbId}-${season}-${episode}` 
          : tmdbId;

        const res = await fetch(`/api/netmirror/stream?id=${queryId}`);
        const result = await res.json();

        if (result.success && result.data) {
          const playlist = result.data.playlistUrl;
          const streamData = result.data.streamData;
          
          if (playlist) {
            setPlaylistUrl(playlist);
            setSources(streamData?.sources || []);
            setSubtitles(streamData?.subtitles || []);
            setStreamMode("api");
          } else if (streamData?.sources && streamData.sources.length > 0) {
            setPlaylistUrl(streamData.sources[0].file);
            setSources(streamData.sources);
            setSubtitles(streamData.subtitles || []);
            setStreamMode("api");
          } else {
            throw new Error("No stream sources returned from NetMirror API");
          }
        } else {
          // If first TV ID format fails, try the alternative format
          if (type === "tv" && queryId !== `${tmdbId}`) {
            const fallbackQueryId = `${tmdbId}_s${season}_e${episode}`;
            const resFallback = await fetch(`/api/netmirror/stream?id=${fallbackQueryId}`);
            const resultFallback = await resFallback.json();
            if (resultFallback.success && resultFallback.data) {
              const playlist = resultFallback.data.playlistUrl;
              const streamData = resultFallback.data.streamData;
              if (playlist) {
                setPlaylistUrl(playlist);
                setSources(streamData?.sources || []);
                setSubtitles(streamData?.subtitles || []);
                setStreamMode("api");
                return;
              }
            }
          }
          throw new Error(result.error || "Failed to retrieve stream from NetMirror API");
        }
      } catch (err: any) {
        console.warn("NetMirror programmatic API stream fetch failed, falling back to Sandbox Embed Player:", err.message);
        setApiError(err.message);
        setStreamMode("embed");
      } finally {
        setLoadingStream(false);
      }
    };

    fetchStream();
  }, [provider, tmdbId, season, episode, type]);

  // 2. Initialize Hls.js or native playback on the <video> element
  useEffect(() => {
    if (streamMode !== "api" || !playlistUrl) return;

    const video = videoRef.current;
    if (!video) return;

    // Clean up previous Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported() && playlistUrl.endsWith(".m3u8")) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(playlistUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(err => console.log("Auto-play blocked:", err));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else {
      // Native fallback (e.g. Safari, Chrome on iOS/Android, MP4 direct streams)
      video.src = playlistUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(err => console.log("Auto-play blocked:", err));
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamMode, playlistUrl]);

  // Calculate Embed URL for iframe fallback or other providers
  const getEmbedUrl = () => {
    if (provider === "netmirror") {
      if (type === "tv") {
        return `https://embed.netmirror.one/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://embed.netmirror.one/movie/${tmdbId}`;
    } else {
      // 4khdhub
      if (type === "tv") {
        return `https://4khdhub.one/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://4khdhub.one/embed/${tmdbId}`;
    }
  };

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  // Generate lists for seasons and episodes
  const totalSeasons = type === "tv" ? (movie.number_of_seasons || 5) : 0;
  const seasonsList = Array.from({ length: totalSeasons }, (_, i) => i + 1);
  const episodesList = Array.from({ length: 24 }, (_, i) => i + 1); // standard fallback ep list

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0406] flex flex-col justify-between select-none animate-fade-in">
      {/* Player Top bar Controls */}
      <div className="p-4 md:p-6 bg-gradient-to-b from-black/95 to-transparent flex flex-col md:flex-row items-center justify-between gap-4 z-10 border-b border-white/5">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={onClose}
            className="p-3 bg-[#12090B] hover:bg-brand-red text-white rounded-full transition-all duration-200 shadow-md border border-white/10"
            title="Back to Browsing"
          >
            <X size={20} />
          </button>
          <div className="truncate">
            <h2 className="font-display font-bold text-base md:text-lg text-white flex items-center gap-2">
              <span className="truncate">{movie.title}</span>
              <span className="text-[10px] bg-brand-red/20 text-brand-red px-2 py-0.5 rounded uppercase font-mono font-bold">
                {type === "tv" ? "TV Show" : "Movie"}
              </span>
              {streamMode === "api" ? (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  API Programmatic
                </span>
              ) : (
                <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded uppercase font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Embed Player
                </span>
              )}
            </h2>
            <p className="text-[10px] font-mono tracking-wider text-gray-400 mt-0.5 uppercase">
              STREAMING SOURCE: {provider.toUpperCase()} {streamMode === "api" && "• PREMIUM DIRECT STREAM ACTIVE"}
            </p>
          </div>
        </div>

        {/* Dynamic Selectors / Switchers bar */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* TV Episode Selector */}
          {type === "tv" && (
            <div className="flex items-center gap-2 bg-[#12090B] border border-white/10 rounded-xl px-2.5 py-1.5">
              <Tv size={14} className="text-gray-400" />
              <select
                value={season}
                onChange={(e) => {
                  setSeason(parseInt(e.target.value));
                  setEpisode(1);
                }}
                className="bg-transparent text-white text-xs outline-none cursor-pointer focus:text-brand-red transition animate-none"
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
                className="bg-transparent text-white text-xs outline-none cursor-pointer focus:text-brand-red transition animate-none"
              >
                {episodesList.map((ep) => (
                  <option key={ep} value={ep} className="bg-[#12090B]">
                    Episode {ep}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Provider Selector */}
          <div className="flex items-center gap-1.5 bg-[#12090B] border border-white/10 rounded-xl p-1">
            <button
              onClick={() => {
                setProvider("netmirror");
                handleRefresh();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                provider === "netmirror"
                  ? "bg-brand-red text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Netmirror
            </button>
            <button
              onClick={() => {
                setProvider("4khdhub");
                handleRefresh();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                provider === "4khdhub"
                  ? "bg-brand-red text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              4khdhub
            </button>
          </div>

          {/* Reload stream Button */}
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-[#12090B] hover:bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl transition-all"
            title="Reload Server Source"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Main Stream Player Viewport */}
      <div className="relative w-full flex-grow bg-black flex items-center justify-center overflow-hidden">
        {/* Loading Spinner */}
        {loadingStream && (
          <div className="absolute inset-0 bg-[#0a0406] flex flex-col items-center justify-center z-20">
            <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-sm font-medium font-display mt-4 animate-pulse">
              Initializing Premium Stream Pipeline...
            </p>
          </div>
        )}

        {/* Programmatic Direct HLS/MP4 Player */}
        {streamMode === "api" && playlistUrl ? (
          <video
            ref={videoRef}
            key={playlistUrl}
            className="w-full h-full object-contain"
            controls
            autoPlay
            crossOrigin="anonymous"
          >
            {subtitles.map((sub, idx) => (
              <track
                key={idx}
                kind="subtitles"
                src={sub.file}
                srcLang={sub.label ? sub.label.toLowerCase().slice(0, 2) : "en"}
                label={sub.label || `Subtitle ${idx + 1}`}
                default={idx === 0}
              />
            ))}
            Your browser does not support the video tag.
          </video>
        ) : (
          /* Iframe fallback */
          <iframe
            key={`${provider}-${season}-${episode}-${key}`}
            src={getEmbedUrl()}
            className="w-full h-full border-none"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            title={`${movie.title} - ${provider}`}
          />
        )}
      </div>

      {/* FOOTER INFO BAR */}
      <div className="bg-black/90 border-t border-white/5 py-3 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-gray-500 font-mono">
        <div className="flex items-center gap-1.5">
          <AlertCircle size={12} className="text-brand-red" />
          <span>
            {streamMode === "api" 
              ? "Programmatic stream playing with zero ad popups." 
              : "If the server is lagging or fails, switch the provider or click the refresh icon."}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>TMDB ID: {tmdbId}</span>
          <span>{streamMode === "api" ? "HLS DIRECT" : "1080P ACTIVE LINK"}</span>
        </div>
      </div>
    </div>
  );
}
