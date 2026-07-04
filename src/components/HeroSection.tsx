import React, { useState, useEffect, useRef } from "react";
import { Play, Info, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Movie } from "../types";
import { useApp } from "../context/AppContext";

interface HeroSectionProps {
  movie: Movie;
  onOpenAuth: () => void;
}

export default function HeroSection({ movie, onOpenAuth }: HeroSectionProps) {
  const { user, setActiveMovieForPlayer, setActiveMovieForModal } = useApp();
  const [playTrailer, setPlayTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset play state and set timer to autoplay trailer
    setPlayTrailer(false);
    if (movie.youtube_id) {
      timerRef.current = window.setTimeout(() => {
        setPlayTrailer(true);
      }, 4000);
    }

    const handleScroll = () => {
      if (window.scrollY > 150) {
        setPlayTrailer(false);
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [movie.id]);

  const handlePlayClick = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setActiveMovieForPlayer(movie);
  };

  const handleInfoClick = () => {
    setActiveMovieForModal(movie);
  };

  return (
    <div className="relative w-full h-[70vh] md:h-[90vh] overflow-hidden bg-black select-none">
      {/* Background Media */}
      <div className="absolute inset-0 w-full h-full scale-105">
        {playTrailer && movie.youtube_id ? (
          <div className="absolute inset-0 w-full h-full scale-[1.35] origin-center">
            <iframe
              src={`https://www.youtube.com/embed/${movie.youtube_id}?autoplay=1&mute=${
                isMuted ? 1 : 0
              }&controls=0&loop=1&playlist=${
                movie.youtube_id
              }&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&enablejsapi=1`}
              title="Hero Background Video"
              className="w-full h-full border-none pointer-events-none select-none"
              allow="autoplay; encrypted-media"
            ></iframe>
          </div>
        ) : (
          <motion.img
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.7, scale: 1 }}
            transition={{ duration: 1.2 }}
            src={movie.backdrop_path}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="eager"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Extreme dark gradient overlay from bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/60 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/80 via-transparent to-transparent z-10 pointer-events-none"></div>

      {/* Hero Content overlaid lower-left */}
      <div className="absolute bottom-16 md:bottom-28 left-6 md:left-12 max-w-2xl z-20 flex flex-col gap-4 md:gap-6">
        
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center gap-1.5"
        >
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-red text-white font-mono text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-brand-red/50">
            ★ SPOTLIGHT
          </span>
          <span className="text-[10px] text-gray-400 font-mono font-semibold">
            {movie.type === "movie" ? "FEATURED MOVIE" : "FEATURED SHOW"}
          </span>
        </motion.div>

        {/* Stylized Title Text with subtle RGB-split / chromatic-aberration glow effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative group"
        >
          {/* Chromatic aberration layers */}
          <h1 className="font-display font-black tracking-tight text-[#E50914] text-4xl md:text-6xl lg:text-7xl absolute left-[1px] top-[1px] opacity-40 select-none blur-[0.5px]">
            {movie.title}
          </h1>
          <h1 className="font-display font-black tracking-tight text-[#9B0F15] text-4xl md:text-6xl lg:text-7xl absolute -left-[1px] -top-[1px] opacity-40 select-none blur-[0.5px]">
            {movie.title}
          </h1>
          {/* Main heading */}
          <h1 className="font-display font-black tracking-tight text-white text-4xl md:text-6xl lg:text-7xl relative z-10 drop-shadow-[0_0_20px_rgba(229,9,20,0.5)]">
            {movie.title}
          </h1>
        </motion.div>

        {/* Metadata and tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col gap-3"
        >
          {/* Match & categories */}
          <div className="flex items-center gap-3 text-xs font-mono font-semibold text-gray-300">
            <span className="text-brand-red">{movie.match_percentage}% MATCH</span>
            <span>•</span>
            <span className="border border-white/10 bg-white/5 backdrop-blur px-2 py-0.5 rounded text-[10px]">{movie.age_rating}</span>
            <span>•</span>
            <span>{movie.genres.join(" / ")}</span>
          </div>

          <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 md:line-clamp-4 font-normal tracking-wide drop-shadow-md">
            {movie.overview}
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex items-center gap-3 md:gap-4"
        >
          {/* Filled Play button */}
          <button
            onClick={handlePlayClick}
            className="flex items-center justify-center gap-2.5 px-6 md:px-8 py-3 bg-brand-red hover:bg-[#ff1525] text-white font-display font-bold rounded-full text-sm transition-all duration-300 shadow-xl shadow-brand-red/20 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <Play size={16} fill="currentColor" />
            <span>Play Trailer</span>
          </button>

          {/* Outlined See More pill button */}
          <button
            onClick={handleInfoClick}
            className="flex items-center justify-center gap-2.5 px-6 md:px-8 py-3 bg-black/40 hover:bg-white/10 text-white font-display font-bold rounded-full text-sm transition-all duration-300 border border-white/10 backdrop-blur shadow-lg transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <Info size={16} />
            <span>See More</span>
          </button>

          {/* Sound Toggle (Shown only during trailer playback) */}
          {playTrailer && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => setIsMuted(prev => !prev)}
              className="p-3 rounded-full bg-black/60 border border-white/10 text-white hover:bg-brand-red hover:border-brand-red transition-all cursor-pointer shadow-lg backdrop-blur"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
