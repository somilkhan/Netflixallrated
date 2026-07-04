import React from "react";
import { motion } from "motion/react";
import { Play, Plus, Check } from "lucide-react";
import { Movie } from "../types";
import { useApp } from "../context/AppContext";

interface TopTenCardProps {
  movie: Movie;
  index: number;
  onOpenAuth: () => void;
}

export default function TopTenCard({ movie, index, onOpenAuth }: TopTenCardProps) {
  const { user, watchlist, toggleWatchlist, setActiveMovieForPlayer, setActiveMovieForModal } = useApp();

  const isWatchlisted = watchlist.includes(movie.id);

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

  const handleCardClick = () => {
    setActiveMovieForModal(movie);
  };

  return (
    <div className="relative flex items-center flex-shrink-0 py-4 pl-12 md:pl-16 pr-2 select-none">
      {/* Huge Semi-Transparent Rank Number */}
      <span
        className="absolute left-0 bottom-4 text-[130px] md:text-[160px] font-display font-black leading-none text-white select-none pointer-events-none z-10 opacity-15"
        style={{
          WebkitTextStroke: "2px rgba(229, 9, 20, 0.4)",
          textShadow: "0 0 35px rgba(229, 9, 20, 0.25)",
        }}
      >
        {index + 1}
      </span>

      {/* Poster Card */}
      <motion.div
        onClick={handleCardClick}
        whileHover={{ 
          scale: 1.05,
          boxShadow: "0 0 25px rgba(229, 9, 20, 0.3)",
          borderColor: "rgba(229, 9, 20, 0.4)"
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative w-36 sm:w-44 md:w-48 aspect-[2/3] rounded-xl overflow-hidden cursor-pointer bg-[#12090B]/40 border border-[#12090B] group shadow-xl z-20 will-change-transform"
      >
        <img
          src={movie.poster_path}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Hover detail overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <h4 className="font-display font-bold text-xs sm:text-sm text-white leading-tight mb-1 truncate">
            {movie.title}
          </h4>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-300 mb-2">
            <span className="text-brand-red font-semibold">{movie.match_percentage}% MATCH</span>
            <span>•</span>
            <span className="border border-white/20 px-1 rounded-sm text-[8px]">{movie.age_rating}</span>
          </div>

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
          </div>
        </div>
      </motion.div>
    </div>
  );
}
