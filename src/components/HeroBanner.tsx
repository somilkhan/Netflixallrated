import React, { useState, useEffect, useRef } from "react";
import { Play, Info, Volume2, VolumeX } from "lucide-react";
import { Movie } from "../types";
import { useApp } from "../context/AppContext";

interface HeroBannerProps {
  movie: Movie;
  onOpenAuth: () => void;
}

export default function HeroBanner({ movie, onOpenAuth }: HeroBannerProps) {
  const { user, setActiveMovieForPlayer, setActiveMovieForModal } = useApp();
  const [playTrailer, setPlayTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [scrolledPast, setScrolledPast] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [gyroOffset, setGyroOffset] = useState({ x: 0, y: 0 });
  const bannerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!bannerRef.current || window.matchMedia("(pointer: coarse)").matches) return;
    const rect = bannerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // gamma is tilt left/right in degrees [-90, 90]
      // beta is tilt front/back in degrees [-180, 180]
      const x = e.gamma ? Math.max(-20, Math.min(20, e.gamma)) / 20 : 0;
      const rawBeta = e.beta || 45;
      const y = Math.max(-20, Math.min(20, rawBeta - 45)) / 20;

      // Dampen the sensor values slightly for an incredibly smooth experience
      setGyroOffset(prev => ({
        x: prev.x * 0.82 + x * 0.18,
        y: prev.y * 0.82 + y * 0.18,
      }));
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  useEffect(() => {
    // Reset play state when movie changes
    setPlayTrailer(false);
    
    // Set timer to autoplay trailer after 4 seconds
    if (movie.youtube_id) {
      timerRef.current = window.setTimeout(() => {
        if (!scrolledPast) {
          setPlayTrailer(true);
        }
      }, 4000);
    }

    const handleScroll = () => {
      if (window.scrollY > 150) {
        setScrolledPast(true);
        setPlayTrailer(false);
      } else {
        setScrolledPast(false);
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [movie.id, scrolledPast]);

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

  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  const finalX = isCoarse ? gyroOffset.x : mousePos.x;
  const finalY = isCoarse ? gyroOffset.y : mousePos.y;

  return (
    <div
      ref={bannerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: "1200px" }}
      className="relative w-full h-[65vh] md:h-[85vh] overflow-hidden bg-black select-none"
    >
      {/* Background Media */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          transform: `scale(1.08) translate(${finalX * -18}px, ${finalY * -18}px)`,
          transition: isCoarse ? "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
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
          <img
            src={movie.backdrop_path}
            alt={movie.title}
            className="w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
            loading="eager"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Cinematic Overlays (Side & Bottom Fades for Allrated Maroon Base) */}
      <div className="absolute inset-0 hero-side-gradient z-10 pointer-events-none"></div>
      <div className="absolute inset-x-0 bottom-0 h-40 hero-gradient z-10 pointer-events-none"></div>

      {/* Banner Metadata / Content */}
      <div 
        className="absolute bottom-16 md:bottom-28 left-6 md:left-12 max-w-xl z-20 flex flex-col gap-4 md:gap-6"
        style={{
          transform: `translate(${finalX * 24}px, ${finalY * 24}px) translateZ(40px)`,
          transition: isCoarse ? "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          transformStyle: "preserve-3d"
        }}
      >
        <div className="space-y-2">
          {/* Tagline or Type Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#E50914] text-white font-mono text-[10px] font-bold uppercase tracking-widest shadow-md shadow-brand-red/30">
            ★ ALLRATED SPOTLIGHT
          </span>
          
          <h1 className="font-display font-extrabold tracking-tight text-white text-3xl md:text-5xl lg:text-6xl drop-shadow-md">
            {movie.title}
          </h1>
        </div>

        {/* Rating and Genres */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-medium text-gray-300">
          <span className="text-brand-red font-bold">{movie.match_percentage}% MATCH</span>
          <span>•</span>
          <span className="border border-white/20 px-1.5 py-0.5 rounded text-[10px]">{movie.age_rating}</span>
          <span>•</span>
          <span>{movie.genres.join(" / ")}</span>
        </div>

        <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 drop-shadow">
          {movie.overview}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={handlePlayClick}
            className="flex items-center justify-center gap-2 px-6 md:px-8 py-3 bg-white hover:bg-brand-red hover:text-white text-black font-display font-semibold rounded-xl text-sm transition-all duration-300 shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Play size={16} fill="currentColor" />
            <span>Play Trailer</span>
          </button>
          
          <button
            onClick={handleInfoClick}
            className="flex items-center justify-center gap-2 px-6 md:px-8 py-3 bg-white/10 hover:bg-white/25 text-white font-display font-semibold rounded-xl text-sm transition-all duration-300 backdrop-blur cursor-pointer"
          >
            <Info size={16} />
            <span>More Info</span>
          </button>

          {/* Sound Toggle (Shown only during trailer playback) */}
          {playTrailer && (
            <button
              onClick={() => setIsMuted(prev => !prev)}
              className="p-3 rounded-full bg-[#12090B]/60 border border-white/10 text-white hover:bg-[#E50914] transition-all cursor-pointer"
              title={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
