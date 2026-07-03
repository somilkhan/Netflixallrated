import React, { useState, useEffect } from "react";
import { X, Play, Plus, Check, ThumbsUp, Volume2, VolumeX, Sparkles, Tv, Calendar, Hourglass } from "lucide-react";
import { Movie } from "../types";
import { useApp } from "../context/AppContext";

interface DetailModalProps {
  movie: Movie;
  onClose: () => void;
  onOpenAuth: () => void;
}

export default function DetailModal({ movie, onClose, onOpenAuth }: DetailModalProps) {
  const { user, watchlist, liked, toggleWatchlist, toggleLike, setActiveMovieForPlayer, setActiveMovieForModal } = useApp();
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [trailerMuted, setTrailerMuted] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);

  const isWatchlisted = watchlist.includes(movie.id);
  const isLiked = liked.includes(movie.id);

  // Lock body scroll on mount
  useEffect(() => {
    document.body.style.overflow = "hidden";
    
    // Fetch similar movies
    const fetchSimilar = async () => {
      try {
        setLoadingSimilar(true);
        const res = await fetch(`/api/movies/recommendations/${movie.type}/${movie.id}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSimilarMovies(data);
        }
      } catch (err) {
        console.error("Error fetching similar titles:", err);
      } finally {
        setLoadingSimilar(false);
      }
    };
    fetchSimilar();

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [movie.id, movie.type]);

  const handlePlayClick = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setActiveMovieForPlayer(movie);
  };

  const handleWatchlistClick = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    toggleWatchlist(movie);
  };

  const handleLikeClick = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    toggleLike(movie);
  };

  // Simulated premium episodes for TV shows
  const simulatedEpisodes = [
    { episode: 1, title: "Pilot / The Genesis", duration: "54m", overview: "The introductory saga that sparks the overarching mystery and lays bare the power dynamics within." },
    { episode: 2, title: "Interlocking Threads", duration: "48m", overview: "Unseen alliances are forged as key players attempt to assert control over the burgeoning narrative chaos." },
    { episode: 3, title: "The Breaking Point", duration: "52m", overview: "Tension boils over when a critical decision threatens to tear the central community apart." },
    { episode: 4, title: "Echoes of History", duration: "56m", overview: "A deep dive into past secrets exposes the heavy price paid by predecessors to secure their legacy." },
    { episode: 5, title: "The Grand Strategy", duration: "51m", overview: "Infiltration plans are set in motion as factions mobilize for a coordinated, high-stakes coup." },
    { episode: 6, title: "Resolution & Ruin", duration: "63m", overview: "The climactic season finale where old conflicts are temporarily settled, leaving behind a trail of unanswered questions." }
  ];

  return (
    <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex justify-center overflow-y-auto py-10 px-4 animate-fade-in custom-scrollbar">
      {/* Background click to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-[#12090B] rounded-2xl overflow-hidden shadow-2xl border border-brand-crimson/20 z-10 my-auto animate-scale-up flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 border border-white/10 text-white hover:bg-brand-red hover:border-brand-red transition-all z-50 cursor-pointer"
          title="Close Modal (Esc)"
        >
          <X size={20} />
        </button>

        {/* Video / Backdrop Header */}
        <div className="relative w-full aspect-[16/9] md:h-[400px] overflow-hidden bg-black">
          {movie.youtube_id ? (
            <div className="absolute inset-0 w-full h-full scale-[1.35] origin-center">
              <iframe
                src={`https://www.youtube.com/embed/${movie.youtube_id}?autoplay=1&mute=${
                  trailerMuted ? 1 : 0
                }&controls=0&loop=1&playlist=${movie.youtube_id}&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
                title="Modal Spotlight Trailer"
                className="w-full h-full border-none pointer-events-none select-none"
                allow="autoplay; encrypted-media"
              ></iframe>
            </div>
          ) : (
            <img
              src={movie.backdrop_path}
              alt={movie.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#12090B] via-[#12090B]/40 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#12090B]/60 via-transparent to-transparent z-10 pointer-events-none"></div>

          {/* Floating Actions on Backdrop */}
          <div className="absolute bottom-6 left-6 md:left-10 right-6 z-20 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-crimson/50 text-brand-red border border-brand-crimson font-mono text-[9px] font-bold uppercase tracking-wider">
                🍿 THEATRICAL PRESENTATION
              </span>
              <h2 className="font-display font-black tracking-tight text-white text-2xl md:text-4xl drop-shadow">
                {movie.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayClick}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white hover:bg-brand-red hover:text-white text-black font-display font-semibold rounded-xl text-xs transition-all duration-200 transform active:scale-95 shadow-lg shadow-black/20 cursor-pointer"
              >
                <Play size={14} fill="currentColor" />
                <span>Play Fullscreen</span>
              </button>

              <button
                onClick={handleWatchlistClick}
                className={`p-2.5 rounded-full border border-white/30 text-white hover:border-white hover:bg-white/10 transition-all cursor-pointer ${
                  isWatchlisted ? "bg-brand-red/10 border-brand-red text-brand-red" : ""
                }`}
                title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
              >
                {isWatchlisted ? <Check size={16} className="text-brand-red" /> : <Plus size={16} />}
              </button>

              <button
                onClick={handleLikeClick}
                className={`p-2.5 rounded-full border border-white/30 text-white hover:border-white hover:bg-white/10 transition-all cursor-pointer ${
                  isLiked ? "bg-brand-red/10 border-brand-red text-brand-red" : ""
                }`}
                title={isLiked ? "Unlike" : "Like"}
              >
                <ThumbsUp size={15} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "text-brand-red" : ""} />
              </button>

              {movie.youtube_id && (
                <button
                  onClick={() => setTrailerMuted(prev => !prev)}
                  className="p-2.5 rounded-full bg-black/60 border border-white/10 text-white hover:bg-brand-red transition-all cursor-pointer"
                  title={trailerMuted ? "Unmute trailer background" : "Mute trailer background"}
                >
                  {trailerMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 md:p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {/* Left/Middle columns: Overview and stats */}
            <div className="md:col-span-2 space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-medium text-gray-300">
                <span className="text-brand-red font-bold">{movie.match_percentage}% MATCH</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {movie.release_date ? movie.release_date.split("-")[0] : movie.first_air_date ? movie.first_air_date.split("-")[0] : "2024"}
                </span>
                <span>•</span>
                <span className="border border-white/20 px-1.5 py-0.5 rounded text-[10px]">{movie.age_rating}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {movie.type === "tv" ? (
                    <>
                      <Tv size={13} />
                      <span>{movie.number_of_seasons || 2} Seasons</span>
                    </>
                  ) : (
                    <>
                      <Hourglass size={13} />
                      <span>{movie.runtime || 142} mins</span>
                    </>
                  )}
                </span>
              </div>

              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                {movie.overview || "No overview synopsis details available currently. Check back later for active theatrical descriptions."}
              </p>
            </div>

            {/* Right column: Cast, Genres, Creators */}
            <div className="glass-panel p-4.5 rounded-xl border border-white/5 space-y-4 text-xs text-gray-400">
              <div>
                <span className="font-mono text-[10px] text-gray-500 uppercase block mb-1">STARRING</span>
                <p className="text-gray-200 leading-snug">
                  {movie.cast && movie.cast.length ? movie.cast.join(", ") : "Timothée Chalamet, Zendaya, Austin Butler, Florence Pugh, Pedro Pascal"}
                </p>
              </div>

              <div>
                <span className="font-mono text-[10px] text-gray-500 uppercase block mb-1">GENRES</span>
                <p className="text-gray-200">
                  {movie.genres.join(", ")}
                </p>
              </div>

              <div>
                <span className="font-mono text-[10px] text-gray-500 uppercase block mb-1">CRITIC SCORE</span>
                <p className="text-brand-red font-bold">
                  ★ {movie.vote_average.toFixed(1)} / 10 <span className="text-[10px] font-normal text-gray-500">({movie.vote_count} votes)</span>
                </p>
              </div>
            </div>
          </div>

          {/* TV SHOW EPISODES (Render if TV Show) */}
          {movie.type === "tv" && (
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-white">
                  Episodes
                </h3>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                  className="bg-[#12090B] text-white font-mono text-xs border border-white/10 rounded-lg px-3 py-1.5 focus:border-brand-red focus:outline-none"
                >
                  <option value={1}>Season 1</option>
                  <option value={2}>Season 2</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {simulatedEpisodes.map((ep) => (
                  <div
                    key={ep.episode}
                    className="flex flex-col gap-2 p-3.5 bg-brand-maroon/20 border border-white/5 rounded-xl hover:border-brand-crimson/50 transition duration-300"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-brand-red">EPISODE {ep.episode}</span>
                      <span className="text-gray-400">{ep.duration}</span>
                    </div>
                    <h4 className="font-display font-semibold text-sm text-white mt-1">
                      {ep.title}
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed mt-1">
                      {ep.overview}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SIMILAR TITLES SECTION */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="font-display font-bold text-lg text-white">
              More Like This
            </h3>

            {loadingSimilar ? (
              <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 w-36 sm:w-44 aspect-[16/9] bg-[#1e1014] rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : similarMovies.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 scroll-smooth">
                {similarMovies.map((similar) => (
                  <div
                    key={similar.id}
                    onClick={() => setActiveMovieForModal(similar)}
                    className="flex-shrink-0 w-36 sm:w-44 aspect-[16/9] relative rounded-lg overflow-hidden border border-white/5 cursor-pointer hover:border-brand-red hover:scale-105 transition duration-300 group"
                  >
                    <img
                      src={similar.backdrop_path}
                      alt={similar.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/10 flex items-end p-2.5">
                      <span className="font-display font-semibold text-[10px] text-white truncate w-full group-hover:text-brand-red transition">
                        {similar.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                No recommendations found for this title.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
