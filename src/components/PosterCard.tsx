import React from "react";
import { motion } from "motion/react";
import { Play, Plus, Check, ThumbsUp, Info } from "lucide-react";
import { Movie } from "../types";
import { useApp } from "../context/AppContext";

interface PosterCardProps {
  movie: Movie;
  onOpenAuth: () => void;
}

export default function PosterCard({ movie, onOpenAuth }: PosterCardProps) {
  const { user, watchlist, liked, toggleWatchlist, toggleLike, setActiveMovieForPlayer, setActiveMovieForModal } = useApp();

  const isWatchlisted = watchlist.includes(movie.id);
  const isLiked = liked.includes(movie.id);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }
    setActiveMovieForPlayer(movie);
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
    setActiveMovieForModal(movie);
  };

  return (
    <motion.div
      onClick={handleCardClick}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 0 20px rgba(229, 9, 20, 0.25)",
        borderColor: "rgba(229, 9, 20, 0.4)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative flex-shrink-0 w-36 sm:w-44 md:w-48 aspect-[2/3] rounded-xl overflow-hidden cursor-pointer select-none bg-[#12090B]/40 border border-[#12090B] group shadow-lg will-change-transform"
    >
      {/* Poster Image */}
      <img
        src={movie.poster_path}
        alt={movie.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        referrerPolicy="no-referrer"
        loading="lazy"
      />

      {/* Glassmorphic Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
        <h4 className="font-display font-bold text-xs sm:text-sm text-white leading-tight mb-1 truncate">
          {movie.title}
        </h4>
        
        {/* Metadata */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-300 mb-2">
          <span className="text-brand-red font-semibold">{movie.match_percentage}% MATCH</span>
          <span>•</span>
          <span className="border border-white/20 px-1 rounded-sm text-[8px]">{movie.age_rating}</span>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayClick}
            className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-brand-red hover:text-white transition-all transform hover:scale-110 cursor-pointer"
            title="Play Trailer"
          >
            <Play size={12} fill="currentColor" />
          </button>

          <button
            onClick={handleWatchlistClick}
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all transform hover:scale-110 cursor-pointer ${
              isWatchlisted 
                ? "bg-brand-red/20 border-brand-red text-brand-red" 
                : "border-white/30 text-white hover:border-white hover:bg-white/10"
            }`}
            title={isWatchlisted ? "Remove from list" : "Add to list"}
          >
            {isWatchlisted ? <Check size={12} /> : <Plus size={12} />}
          </button>

          <button
            onClick={handleLikeClick}
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all transform hover:scale-110 cursor-pointer ${
              isLiked 
                ? "bg-brand-red/20 border-brand-red text-brand-red" 
                : "border-white/30 text-white hover:border-white hover:bg-white/10"
            }`}
            title={isLiked ? "Unlike" : "Like"}
          >
            <ThumbsUp size={11} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Fallback Static Rating/Type Badge on Card in Non-hover state */}
      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded-md border border-white/5 text-[9px] font-mono font-bold uppercase tracking-wider group-hover:opacity-0 transition-opacity duration-300">
        ★ {movie.vote_average.toFixed(1)}
      </div>
    </motion.div>
  );
}
