import React, { useState, useEffect } from "react";
import { X, Play, Plus, Check, ThumbsUp, Volume2, VolumeX, Sparkles, Tv, Calendar, Hourglass } from "lucide-react";
import { Movie } from "../types";
import { useApp } from "../context/AppContext";
import { motion } from "motion/react";

interface DetailModalProps {
  key?: string | number;
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
  const [cast, setCast] = useState<string[]>(movie.cast || []);
  const [loadingCredits, setLoadingCredits] = useState(!movie.cast);
  const [youtubeId, setYoutubeId] = useState<string | null>(movie.youtube_id || null);
  const [playTrailer, setPlayTrailer] = useState(false);

  const isWatchlisted = watchlist.includes(movie.id);
  const isLiked = liked.includes(movie.id);

  // Lock body scroll once on mount, unlock on unmount
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Fetch similar titles, cast credits, and trailer when movie changes
  useEffect(() => {
    setSimilarMovies([]);
    setLoadingSimilar(true);
    setCast(movie.cast || []);
    setLoadingCredits(!movie.cast);
    setYoutubeId(movie.youtube_id || null);
    setPlayTrailer(false);

    // Timeout to trigger play trailer only after visual load
    const timer = setTimeout(() => {
      setPlayTrailer(true);
    }, 2000);

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

    // Fetch actual cast/credits
    const fetchCredits = async () => {
      try {
        const res = await fetch(`/api/movies/credits/${movie.type}/${movie.id}`);
        const data = await res.json();
        if (data && Array.isArray(data.cast) && data.cast.length > 0) {
          setCast(data.cast);
        }
      } catch (err) {
        console.error("Error fetching cast credits:", err);
      } finally {
        setLoadingCredits(false);
      }
    };

    // Fetch trailer/video key
    const fetchTrailer = async () => {
      if (movie.youtube_id) return; // already has it
      try {
        const res = await fetch(`/api/movies/videos/${movie.type}/${movie.id}`);
        const data = await res.json();
        if (data && data.youtube_id) {
          setYoutubeId(data.youtube_id);
        }
      } catch (err) {
        console.error("Error fetching trailer:", err);
      }
    };

    fetchSimilar();
    fetchCredits();
    fetchTrailer();

    return () => {
      clearTimeout(timer);
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

  // Simulated premium episodes for TV shows by season
  const simulatedEpisodesBySeason: Record<number, Array<{ episode: number; title: string; duration: string; overview: string; progress?: number; thumb: string }>> = {
    1: [
      { episode: 1, title: "The Departure / Echoes of Command", duration: "54m", overview: "The journey begins as ancient factions align, a long-hidden truth is revealed, and the weight of legacy is placed upon our protagonists.", progress: 85, thumb: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400" },
      { episode: 2, title: "Friction & Alliances", duration: "48m", overview: "As the search intensifies, key players find themselves navigating betrayal within their ranks and a fragile truce outside.", progress: 30, thumb: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400" },
      { episode: 3, title: "A Reckoning of Blood", duration: "52m", overview: "An unexpected raid disrupts the power balance, forcing a direct confrontation that changes the destiny of the entire sector.", progress: 0, thumb: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=400" },
      { episode: 4, title: "Shadows in the Dust", duration: "56m", overview: "Quiet secrets in forgotten crypts are unearthed, leading to a race against time before the rising sand covers the traces forever.", progress: 0, thumb: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=400" },
      { episode: 5, title: "The Silent Siege", duration: "51m", overview: "Survival hangs in the balance as an invisible grid locks down communication, forcing characters to rely on primitive wits.", progress: 0, thumb: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400" },
      { episode: 6, title: "Legacy & Ashes", duration: "63m", overview: "The devastating season finale where empires crumble, lines are permanently drawn, and the stage is set for a massive retaliatory war.", progress: 0, thumb: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=400" }
    ],
    2: [
      { episode: 1, title: "Rebirth / Out of the Ruins", duration: "58m", overview: "Survivors pick up the pieces of the shattered capital while a new, more dangerous player emerges from the deep outer rim.", progress: 0, thumb: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=400" },
      { episode: 2, title: "The Outer Rim Protocol", duration: "50m", overview: "A secret signal leads a faction into uncharted territories, finding unexpected resistance and a long-abandoned vessel.", progress: 0, thumb: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400" },
      { episode: 3, title: "Infiltration of the Core", duration: "55m", overview: "Going deep undercover, key agents attempt to hack the main frame before the weekly grid sweep exposes their bio-signatures.", progress: 0, thumb: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400" },
      { episode: 4, title: "The Grand Alliance", duration: "53m", overview: "Bitter rivals must sit at the negotiation table as a common, terrifying threat moves to consume both of their homeworlds.", progress: 0, thumb: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400" },
      { episode: 5, title: "Terminal Descent", duration: "57m", overview: "A tense struggle inside a failing shuttle that is burning up on re-entry, while secrets are blurted out in what they think are their final moments.", progress: 0, thumb: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=400" },
      { episode: 6, title: "Sovereign Light", duration: "65m", overview: "An epic battle in the skies and on the ground. A supreme sacrifice clears the path, but opens up a wormhole of unpredictable consequences.", progress: 0, thumb: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=400" }
    ]
  };

  const currentSeasonEpisodes = simulatedEpisodesBySeason[selectedSeason] || simulatedEpisodesBySeason[1] || [];

  const handleEpisodePlayClick = (episodeNum: number) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setActiveMovieForPlayer({
      ...movie,
      initialSeason: selectedSeason,
      initialEpisode: episodeNum,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex justify-center overflow-y-auto py-10 px-4 custom-scrollbar"
    >
      {/* Background click to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose}></div>

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, rotateX: 12, y: 30 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, rotateX: -10, y: 20 }}
        transition={{ type: "spring", damping: 26, stiffness: 160 }}
        style={{ transformOrigin: "center", perspective: "1200px", transformStyle: "preserve-3d" }}
        className="relative w-full max-w-4xl bg-[#12090B] rounded-2xl overflow-hidden shadow-2xl border border-brand-crimson/20 z-10 my-auto flex flex-col"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 border border-white/10 text-white hover:bg-brand-red hover:border-brand-red transition-all z-50 cursor-pointer"
          title="Close Modal (Esc)"
        >
          <X size={20} />
        </button>

        {/* Video / Backdrop Header */}
        <div className="relative w-full h-[280px] sm:h-[340px] md:h-[400px] overflow-hidden bg-black">
          {/* Always render static backdrop as layer so there is zero layout shift or blank/black space if iframe is blocked/delayed */}
          <img
            src={movie.backdrop_path}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: youtubeId && playTrailer ? 0.35 : 0.7 }}
            referrerPolicy="no-referrer"
          />

          {youtubeId && playTrailer && (
            <div className="absolute inset-0 w-full h-full scale-[1.35] origin-center">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=${
                  trailerMuted ? 1 : 0
                }&controls=0&loop=1&playlist=${youtubeId}&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
                title="Modal Spotlight Trailer"
                className="w-full h-full border-none pointer-events-none select-none"
                allow="autoplay; encrypted-media"
              ></iframe>
            </div>
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

              {youtubeId && (
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

            {/* Right column: Cast, Genres, Ratings Scorecard */}
            <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-5 text-xs text-gray-400 shadow-lg">
              <div>
                <span className="font-mono text-[9px] tracking-wider text-gray-500 uppercase block mb-1">STARRING</span>
                <p className="text-gray-200 font-medium leading-snug">
                  {cast && cast.length 
                    ? cast.join(", ") 
                    : loadingCredits 
                      ? "Loading cast list..." 
                      : "Cast information unavailable"}
                </p>
              </div>

              <div>
                <span className="font-mono text-[9px] tracking-wider text-gray-500 uppercase block mb-1">GENRES</span>
                <p className="text-gray-200 font-medium">
                  {movie.genres.join(", ")}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-3">
                <span className="font-mono text-[9px] tracking-wider text-gray-500 uppercase block">ALLRATED AGGREGATED SCORECARD</span>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* Critic score (IMDb equivalent) */}
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] font-mono text-gray-400 block uppercase">IMDb</span>
                    <span className="text-sm font-black font-display text-amber-400">★ {movie.vote_average.toFixed(1)}</span>
                  </div>
                  
                  {/* Rotten tomatoes score */}
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] font-mono text-gray-400 block uppercase">TOMATO</span>
                    <span className="text-sm font-black font-display text-brand-red">🍅 {Math.min(99, Math.round(movie.vote_average * 10 + 2))}%</span>
                  </div>

                  {/* Allrated score */}
                  <div className="bg-brand-red/10 p-2 rounded-lg border border-brand-red/20">
                    <span className="text-[10px] font-mono text-brand-red block uppercase font-bold">ALLRATED</span>
                    <span className="text-sm font-black font-display text-white">🔥 {(movie.vote_average * 9.8).toFixed(0)}</span>
                  </div>
                </div>

                <div className="bg-[#170A0D] border border-brand-red/10 rounded-lg p-2.5 flex items-start gap-2">
                  <span className="text-lg">🏆</span>
                  <div>
                    <span className="font-mono text-[8px] font-bold text-brand-red uppercase block">Consensus Choice</span>
                    <p className="text-[10px] text-gray-300 leading-relaxed font-sans">
                      Highly recommended cinematic entry based on overall positive critical reviews.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TV SHOW EPISODES (Render if TV Show) */}
          {movie.type === "tv" && (
            <div className="space-y-5 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-lg text-white">
                    Episodes
                  </h3>
                  <p className="text-xs text-gray-400">Select any episode to begin watching instantly.</p>
                </div>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                  className="bg-[#12090B] text-white font-mono text-xs border border-white/10 rounded-lg px-3 py-2 focus:border-brand-red focus:outline-none cursor-pointer"
                >
                  <option value={1}>Season 1 ({simulatedEpisodesBySeason[1]?.length || 0} Episodes)</option>
                  <option value={2}>Season 2 ({simulatedEpisodesBySeason[2]?.length || 0} Episodes)</option>
                </select>
              </div>

              <div className="flex flex-col gap-4">
                {currentSeasonEpisodes.map((ep) => (
                  <div
                    key={ep.episode}
                    onClick={() => handleEpisodePlayClick(ep.episode)}
                    className="group flex flex-col md:flex-row gap-4 p-4 bg-brand-maroon/20 hover:bg-brand-maroon/60 border border-white/5 hover:border-brand-red/30 rounded-xl transition duration-300 cursor-pointer shadow-md"
                  >
                    {/* Episode Thumbnail */}
                    <div className="relative aspect-[16/9] w-full md:w-48 flex-shrink-0 bg-black/40 rounded-lg overflow-hidden border border-white/5 group-hover:border-brand-red/20 transition-all">
                      <img
                        src={ep.thumb}
                        alt={ep.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Hover Play overlay */}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300">
                          <Play size={16} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>

                      {/* Episode indicator badge */}
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono font-bold tracking-wider text-brand-red border border-white/10">
                        EP {ep.episode}
                      </div>

                      {/* Runtime Badge */}
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono text-gray-300 border border-white/5">
                        {ep.duration}
                      </div>

                      {/* Realistic Progress bar */}
                      {ep.progress !== undefined && ep.progress > 0 && (
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-black/40">
                          <div className="h-full bg-brand-red transition-all duration-500" style={{ width: `${ep.progress}%` }}></div>
                        </div>
                      )}
                    </div>

                    {/* Episode Text Meta */}
                    <div className="flex-grow flex flex-col justify-between py-1 min-w-0">
                      <div>
                        <h4 className="font-display font-bold text-sm md:text-base text-white group-hover:text-brand-red transition truncate mb-1">
                          {ep.title}
                        </h4>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                          {ep.overview}
                        </p>
                      </div>
                      
                      {ep.progress !== undefined && ep.progress > 0 && (
                        <div className="text-[10px] font-mono text-brand-red mt-2 flex items-center gap-1.5 uppercase tracking-wider font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse"></span>
                          Resume Watching ({ep.progress}% completed)
                        </div>
                      )}
                    </div>
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
      </motion.div>
    </motion.div>
  );
}
