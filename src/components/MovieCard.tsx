import React, { useState, useEffect, useRef } from "react";
import { Play, Plus, Check, ThumbsUp, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { Movie } from "../types";
import { useApp } from "../context/AppContext";

interface MovieCardProps {
  movie: Movie;
  onOpenAuth: () => void;
  anyCardHovered: boolean;
  setAnyCardHovered: (hovered: boolean) => void;
}

export default function MovieCard({ movie, onOpenAuth, anyCardHovered, setAnyCardHovered }: MovieCardProps) {
  const { user, watchlist, liked, toggleWatchlist, toggleLike, setActiveMovieForPlayer, setActiveMovieForModal } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [ytKey, setYtKey] = useState("");
  const [trailerMuted, setTrailerMuted] = useState(true);
  
  const hoverTimeoutRef = useRef<number | null>(null);
  const isWatchlisted = watchlist.includes(movie.id);
  const isLiked = liked.includes(movie.id);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    // Check if it's a touch device - skip hover trailer interaction
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    setAnyCardHovered(true);

    // Debounce the hover expansion by 500ms
    hoverTimeoutRef.current = window.setTimeout(async () => {
      setIsHovered(true);
      
      // Lazily fetch the YouTube trailer ID if not already available
      if (!ytKey) {
        try {
          const res = await fetch(`/api/movies/videos/${movie.type}/${movie.id}`);
          const data = await res.json();
          if (data && data.youtube_id) {
            setYtKey(data.youtube_id);
            setShowTrailer(true);
          }
        } catch (err) {
          console.error("Error fetching trailer videos:", err);
        }
      } else {
        setShowTrailer(true);
      }
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    setIsHovered(false);
    setShowTrailer(false);
    setAnyCardHovered(false);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }
    setActiveMovieForPlayer({ ...movie, youtube_id: ytKey || movie.youtube_id });
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }
    toggleWatchlist(movie);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }
    toggleLike(movie);
  };

  const handleCardClick = () => {
    setActiveMovieForModal({ ...movie, youtube_id: ytKey || movie.youtube_id });
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      className={`relative flex-shrink-0 w-36 sm:w-48 md:w-56 aspect-[2/3] md:aspect-[16/9] rounded-xl overflow-hidden cursor-pointer select-none smooth-scale bg-[#1A0E11] border border-white/5 shadow-md ${
        isHovered 
          ? "scale-[1.32] z-30 shadow-2xl -translate-y-4" 
          : anyCardHovered 
            ? "scale-[0.94] opacity-50 blur-[1px]" 
            : "scale-100 hover:scale-[1.03] hover:shadow-lg"
      }`}
    >
      {/* Base Poster Backdrop Image */}
      <img
        src={isHovered ? movie.backdrop_path : (window.innerWidth < 768 ? movie.poster_path : movie.backdrop_path)}
        alt={movie.title}
        className={`w-full h-full object-cover transition-opacity duration-500 absolute inset-0 ${
          showTrailer ? "opacity-0" : "opacity-100"
        }`}
        referrerPolicy="no-referrer"
      />

      {/* Title text overlay (only on un-hovered widescreen cards or mobile posters for context) */}
      {!isHovered && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex items-end p-3">
          <h4 className="font-display font-semibold text-xs md:text-sm text-white line-clamp-1 truncate w-full">
            {movie.title}
          </h4>
        </div>
      )}

      {/* Expanded Trailer Autoplay View */}
      {isHovered && showTrailer && ytKey && (
        <div className="absolute inset-0 w-full h-full bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${ytKey}?autoplay=1&mute=${
              trailerMuted ? 1 : 0
            }&controls=0&loop=1&playlist=${ytKey}&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
            title="Card Hover Trailer"
            className="w-full h-full border-none pointer-events-none scale-[1.25]"
            allow="autoplay; encrypted-media"
          ></iframe>
          
          {/* Audio volume switch */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTrailerMuted(prev => !prev);
            }}
            className="absolute bottom-20 right-3 p-1.5 rounded-full bg-black/60 border border-white/10 text-white hover:bg-brand-red hover:border-brand-red transition-all z-40"
          >
            {trailerMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        </div>
      )}

      {/* Expanded Card Detail Overlay (Pristine layout inside the scaled-up container) */}
      {isHovered && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a0406] via-[#12090B]/95 to-black/10 p-3 flex flex-col gap-2 z-20 animate-fade-in border-t border-white/5">
          {/* Action Row */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              {/* Play Button */}
              <button
                onClick={handlePlayClick}
                className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-brand-red hover:text-white transition cursor-pointer"
                title="Play trailer fullscreen"
              >
                <Play size={12} fill="currentColor" />
              </button>

              {/* Watchlist Button */}
              <button
                onClick={handleWatchlistClick}
                className={`w-7 h-7 rounded-full border border-white/30 flex items-center justify-center hover:border-white hover:bg-white/10 text-white transition cursor-pointer ${
                  isWatchlisted ? "bg-brand-red/10 border-brand-red text-brand-red" : ""
                }`}
                title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
              >
                {isWatchlisted ? <Check size={12} className="text-brand-red" /> : <Plus size={12} />}
              </button>

              {/* Like Button */}
              <button
                onClick={handleLikeClick}
                className={`w-7 h-7 rounded-full border border-white/30 flex items-center justify-center hover:border-white hover:bg-white/10 text-white transition cursor-pointer ${
                  isLiked ? "bg-brand-red/10 border-brand-red text-brand-red" : ""
                }`}
                title={isLiked ? "Unlike" : "Like"}
              >
                <ThumbsUp size={11} className={isLiked ? "text-brand-red" : ""} fill={isLiked ? "currentColor" : "none"} />
              </button>
            </div>

            {/* More info */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center hover:border-white hover:bg-white/10 text-white transition cursor-pointer"
              title="More Info"
            >
              <ChevronDown size={12} />
            </button>
          </div>

          {/* Title & Metadata */}
          <div>
            <h4 className="font-display font-bold text-xs text-white truncate mb-0.5">
              {movie.title}
            </h4>
            <div className="flex items-center gap-1.5 text-[9px] font-mono font-medium text-gray-300">
              <span className="text-brand-red">{movie.match_percentage}% MATCH</span>
              <span>•</span>
              <span className="border border-white/20 px-1 rounded-[2px]">{movie.age_rating}</span>
            </div>
            {/* Genres list */}
            <p className="text-[8px] font-mono text-gray-400 mt-1 truncate">
              {movie.genres.slice(0, 2).join(" • ")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
