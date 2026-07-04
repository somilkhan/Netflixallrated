import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ContentRow from "./components/ContentRow";
import FilterTabs from "./components/FilterTabs";
import BottomNav from "./components/BottomNav";
import PosterCard from "./components/PosterCard";
import DetailModal from "./components/DetailModal";
import CustomPlayer from "./components/CustomPlayer";
import AuthModal from "./components/AuthModal";
import ProfileScreen from "./components/ProfileScreen";
import { Movie } from "./types";
import { Search, Sparkles, AlertCircle, Heart, Bookmark, Filter, Grid } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

function AllratedApp() {
  const {
    user,
    profiles,
    activeProfile,
    loading,
    activeMovieForPlayer,
    activeMovieForModal,
    searchQuery,
    setSearchQuery,
    watchlist,
    liked,
    setActiveMovieForPlayer,
    setActiveMovieForModal
  } = useApp();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "watchlist" | "liked">("home");
  const [spotlightMovie, setSpotlightMovie] = useState<Movie | null>(null);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Home Filters state
  const [homeSection, setHomeSection] = useState<"all" | "movie" | "tv" | "anime">("all");
  const [homeGenre, setHomeGenre] = useState<string>("");
  const [homeYear, setHomeYear] = useState<string>("");

  // Search Filters state
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  // All movies for home filtering
  const [allAvailableMovies, setAllAvailableMovies] = useState<Movie[]>([]);

  // Default fallback items to use for spotlight or initial states
  const fallbackSpotlight: Movie = {
    id: "f-1",
    type: "movie",
    title: "Dune: Part Two",
    backdrop_path: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600",
    overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
    release_date: "2024-03-01",
    vote_average: 8.5,
    vote_count: 4200,
    runtime: 166,
    genres: ["Sci-Fi", "Adventure", "Action"],
    youtube_id: "Way9Dexny3w",
    age_rating: "PG-13",
    match_percentage: 98,
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Austin Butler", "Florence Pugh"]
  };

  // Reset filters when search query changes
  useEffect(() => {
    setSelectedGenre("");
    setSelectedYear("");
    setSelectedType("");
  }, [searchQuery]);

  // Fetch all movies to build dynamic filter pool
  useEffect(() => {
    const loadAllMoviesForFilters = async () => {
      try {
        const endpoints = [
          "/api/movies/trending",
          "/api/movies/top-rated",
          "/api/movies/new-releases"
        ];
        const responses = await Promise.all(
          endpoints.map(ep => fetch(ep).then(r => r.ok ? r.json() : []).catch(() => []))
        );
        const combined = responses.flat();
        
        // Deduplicate by ID
        const unique: Record<string, Movie> = {};
        combined.forEach(m => {
          if (m && m.id) unique[m.id] = m;
        });
        setAllAvailableMovies(Object.values(unique));
      } catch (err) {
        console.error("Error loading combined filter movie list:", err);
      }
    };
    loadAllMoviesForFilters();
  }, []);

  // 1. Fetch spotlight movie on mount
  useEffect(() => {
    fetch("/api/movies/trending")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSpotlightMovie(data[0]);
        } else {
          setSpotlightMovie(fallbackSpotlight);
        }
      })
      .catch(() => {
        setSpotlightMovie(fallbackSpotlight);
      });
  }, []);

  // 2. Fetch search results when query changes
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setSearching(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // 3. Dynamic "Recommended for You" Row based on liked/watchlist titles
  useEffect(() => {
    if (!user || liked.length === 0) {
      setRecommendedMovies([]);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setLoadingRecommendations(true);
        const sampleLikes = liked.slice(0, 3);
        const promises = sampleLikes.map(async (movieId) => {
          const type = "movie";
          const res = await fetch(`/api/movies/recommendations/${type}/${movieId}`);
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        });

        const results = await Promise.all(promises);
        const combined = results.flat();
        
        const unique: Record<string, Movie> = {};
        combined.forEach(item => {
          if (!liked.includes(item.id)) {
            unique[item.id] = item;
          }
        });

        setRecommendedMovies(Object.values(unique).slice(0, 8));
      } catch (err) {
        console.error("Error generating dynamic recommendations:", err);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [liked, user]);

  // 4. Calculate Genre-affinity priority row orders
  const getGenreRowOrder = () => {
    const baseGenres = ["Action", "Sci-Fi", "Drama", "Thriller", "Comedy"];
    
    const storedState = localStorage.getItem("allrated_local_state");
    if (storedState) {
      try {
        const parsed = JSON.parse(storedState);
        const profilePrefs = activeProfile ? (parsed.profileStates?.[activeProfile.id]?.genresPreference || {}) : (parsed.genresPreference || {});
        
        return [...baseGenres].sort((a, b) => {
          const weightA = profilePrefs[a] || 0;
          const weightB = profilePrefs[b] || 0;
          return weightB - weightA;
        });
      } catch {
        return baseGenres;
      }
    }
    return baseGenres;
  };

  const prioritizedGenres = getGenreRowOrder();

  // 5. Watchlist movies list
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  useEffect(() => {
    if (watchlist.length > 0) {
      setLoadingWatchlist(true);
      const fetchWatchlistDetails = async () => {
        try {
          const res = await fetch("/api/movies/trending");
          const trending = await res.json();
          const res2 = await fetch("/api/movies/top-rated");
          const topRated = await res2.json();
          
          const combined = [...trending, ...topRated];
          const filtered = combined.filter((item, idx, self) => 
            watchlist.includes(item.id) && self.findIndex(s => s.id === item.id) === idx
          );
          setWatchlistMovies(filtered);
        } catch {
          setWatchlistMovies([]);
        } finally {
          setLoadingWatchlist(false);
        }
      };

      fetchWatchlistDetails();
    } else {
      setWatchlistMovies([]);
    }
  }, [watchlist]);

  // 6. Liked movies list
  const [likedMovies, setLikedMovies] = useState<Movie[]>([]);
  const [loadingLiked, setLoadingLiked] = useState(false);

  useEffect(() => {
    if (activeTab === "liked" && liked.length > 0) {
      setLoadingLiked(true);
      const fetchLikedDetails = async () => {
        try {
          const res = await fetch("/api/movies/trending");
          const trending = await res.json();
          const res2 = await fetch("/api/movies/top-rated");
          const topRated = await res2.json();
          
          const combined = [...trending, ...topRated];
          const filtered = combined.filter((item, idx, self) => 
            liked.includes(item.id) && self.findIndex(s => s.id === item.id) === idx
          );
          setLikedMovies(filtered);
        } catch {
          setLikedMovies([]);
        } finally {
          setLoadingLiked(false);
        }
      };
      fetchLikedDetails();
    } else {
      setLikedMovies([]);
    }
  }, [activeTab, liked]);

  // Apply search filters
  const filteredSearchResults = searchResults.filter((movie) => {
    if (selectedGenre && !movie.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase())) {
      return false;
    }
    if (selectedType) {
      if (selectedType === "movie" && movie.type !== "movie") return false;
      if (selectedType === "tv" && movie.type !== "tv") return false;
    }
    if (selectedYear) {
      const dateStr = movie.release_date || "";
      if (!dateStr) return false;
      const year = new Date(dateStr).getFullYear();
      if (isNaN(year)) return false;

      if (selectedYear === "2026" && year !== 2026) return false;
      if (selectedYear === "2025" && year !== 2025) return false;
      if (selectedYear === "2024" && year !== 2024) return false;
      if (selectedYear === "2023" && year !== 2023) return false;
      if (selectedYear === "2022" && year !== 2022) return false;
      if (selectedYear === "2020s" && (year < 2020 || year > 2029)) return false;
      if (selectedYear === "2010s" && (year < 2010 || year > 2019)) return false;
      if (selectedYear === "2000s" && (year < 2000 || year > 2009)) return false;
      if (selectedYear === "Older" && year >= 2000) return false;
    }
    return true;
  });

  // Apply dynamic Home filters
  const filteredHomeMovies = allAvailableMovies.filter((movie) => {
    if (homeSection === "movie" && movie.type !== "movie") return false;
    if (homeSection === "tv" && movie.type !== "tv") return false;
    if (homeSection === "anime" && !movie.genres.some(g => g.toLowerCase() === "animation")) return false;

    if (homeGenre && !movie.genres.some(g => g.toLowerCase() === homeGenre.toLowerCase())) return false;

    if (homeYear) {
      const dateStr = movie.release_date || movie.first_air_date || "";
      if (!dateStr) return false;
      const year = new Date(dateStr).getFullYear();
      if (isNaN(year)) return false;

      if (homeYear === "2026" && year !== 2026) return false;
      if (homeYear === "2025" && year !== 2025) return false;
      if (homeYear === "2024" && year !== 2024) return false;
      if (homeYear === "2023" && year !== 2023) return false;
      if (homeYear === "2020s" && (year < 2020 || year > 2029)) return false;
      if (homeYear === "2010s" && (year < 2010 || year > 2019)) return false;
      if (homeYear === "Older" && year >= 2010) return false;
    }

    return true;
  });

  const isHomeFiltered = homeSection !== "all" || homeGenre || homeYear;

  const handleClearHomeFilters = () => {
    setHomeSection("all");
    setHomeGenre("");
    setHomeYear("");
  };

  const handleSearchClickInBottomNav = () => {
    // Focus or open Navbar search by targeting the search trigger or setting a placeholder
    const searchTrigger = document.querySelector('[title="Search movie/TV"]') as HTMLButtonElement;
    if (searchTrigger) {
      searchTrigger.click();
    } else {
      setSearchQuery(" ");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-xs tracking-widest text-gray-500 uppercase animate-pulse">
          Initializing Allrated Cinematic Core...
        </p>
      </div>
    );
  }

  // Profile selection gating: if logged in but no active profile selected, show "Who's watching?"
  if (user && !activeProfile) {
    return <ProfileScreen />;
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col relative select-none">
      {/* Fixed top Navbar */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-grow pb-32">
        {searchQuery ? (
          /* SEARCH RESULTS GRID VIEW WITH INTEGRATED FILTERS */
          <div className="pt-28 px-6 md:px-12 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Search className="text-brand-red" size={20} />
                <h2 className="font-display font-bold text-lg md:text-2xl text-white">
                  Search Results for <span className="text-brand-red">"{searchQuery}"</span>
                </h2>
              </div>

              {/* Advanced Search Filters Bar */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="bg-[#12090B] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-red cursor-pointer transition"
                >
                  <option value="">All Genres</option>
                  <option value="Action">Action</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Sci-Fi">Sci-Fi</option>
                  <option value="Drama">Drama</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Thriller">Thriller</option>
                  <option value="Horror">Horror</option>
                  <option value="Mystery">Mystery</option>
                  <option value="Animation">Animation</option>
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-[#12090B] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-red cursor-pointer transition"
                >
                  <option value="">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2020s">2020s</option>
                  <option value="2010s">2010s</option>
                  <option value="2000s">2000s</option>
                  <option value="Older">Older</option>
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-[#12090B] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-red cursor-pointer transition"
                >
                  <option value="">All Types</option>
                  <option value="movie">Movies</option>
                  <option value="tv">TV Shows</option>
                </select>

                {(selectedGenre || selectedYear || selectedType) && (
                  <button
                    onClick={() => {
                      setSelectedGenre("");
                      setSelectedYear("");
                      setSelectedType("");
                    }}
                    className="px-3 py-2 bg-brand-crimson/20 border border-brand-red/30 hover:bg-brand-red text-white text-[10px] font-bold uppercase rounded-xl transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {searching ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredSearchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredSearchResults.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => setActiveMovieForModal(movie)}
                    className="aspect-[2/3] relative rounded-xl overflow-hidden border border-[#12090B] cursor-pointer hover:border-brand-red hover:scale-105 transition-all duration-300 group shadow-lg bg-[#12090B]/30"
                  >
                    <img
                      src={movie.poster_path}
                      alt={movie.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3">
                      <h4 className="font-display font-semibold text-xs text-white truncate group-hover:text-brand-red transition">
                        {movie.title}
                      </h4>
                      <p className="text-[9px] font-mono text-gray-400 mt-0.5 uppercase tracking-wide">
                        {movie.type === "tv" ? "TV Series" : "Movie"} • {movie.genres.slice(0, 1).join("")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 glass-panel rounded-2xl max-w-xl mx-auto border border-white/5">
                <AlertCircle className="text-gray-500 mx-auto mb-3" size={32} />
                <p className="font-display font-medium text-white">No matches found</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  We couldn't find any titles matching your search and filter criteria. Try clearing some filters.
                </p>
              </div>
            )}
          </div>
        ) : activeTab === "watchlist" ? (
          /* WATCHLIST (MY LIST) TAB PAGE */
          <div className="pt-28 px-6 md:px-12 space-y-6">
            <div className="flex items-center gap-2">
              <Bookmark className="text-brand-red" size={20} />
              <h2 className="font-display font-bold text-lg md:text-2xl text-white">
                My List
              </h2>
            </div>

            {!user ? (
              <div className="text-center py-20">
                <p className="text-gray-400">Please sign in to view your list.</p>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="mt-4 px-6 py-2.5 bg-brand-red text-white text-xs font-semibold uppercase rounded-xl hover:bg-[#ff1525]"
                >
                  Sign In Now
                </button>
              </div>
            ) : loadingWatchlist ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : watchlistMovies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {watchlistMovies.map((movie) => (
                  <PosterCard 
                    key={movie.id} 
                    movie={movie} 
                    onOpenAuth={() => setIsAuthOpen(true)} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl max-w-md mx-auto">
                <Bookmark className="text-gray-500 mx-auto mb-3" size={32} />
                <p className="text-sm font-semibold text-white">Your list is empty</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click the "+" button on cards to save trailers and TV shows to watch later.
                </p>
              </div>
            )}
          </div>
        ) : activeTab === "liked" ? (
          /* LIKED TITLES PAGE */
          <div className="pt-28 px-6 md:px-12 space-y-6">
            <div className="flex items-center gap-2">
              <Heart className="text-brand-red" size={20} />
              <h2 className="font-display font-bold text-lg md:text-2xl text-white">
                Liked Titles
              </h2>
            </div>

            {!user ? (
              <div className="text-center py-20">
                <p className="text-gray-400">Please sign in to view liked titles.</p>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="mt-4 px-6 py-2.5 bg-brand-red text-white text-xs font-semibold uppercase rounded-xl hover:bg-[#ff1525]"
                >
                  Sign In Now
                </button>
              </div>
            ) : loadingLiked ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : likedMovies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {likedMovies.map((movie) => (
                  <PosterCard 
                    key={movie.id} 
                    movie={movie} 
                    onOpenAuth={() => setIsAuthOpen(true)} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl max-w-md mx-auto">
                <Heart className="text-gray-500 mx-auto mb-3" size={32} />
                <p className="text-sm font-semibold text-white">No liked titles yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Like titles to activate smart genre-affinity row priority sorting and custom recommendations!
                </p>
              </div>
            )}
          </div>
        ) : (
          /* STANDARD CINEMATIC HOME DASHBOARD WITH GLASSMORPHIC REDESIGN */
          <div className="flex flex-col">
            {spotlightMovie && (
              <HeroSection
                movie={spotlightMovie}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {/* Filter Tabs Section */}
            <FilterTabs
              activeSection={homeSection}
              setActiveSection={setHomeSection}
              selectedGenre={homeGenre}
              setSelectedGenre={setHomeGenre}
              selectedYear={homeYear}
              setSelectedYear={setHomeYear}
              onClearFilters={handleClearHomeFilters}
            />

            {/* Movie Rows Area / Dynamic Filtered Grid */}
            <div className="relative -mt-10 md:-mt-14 z-20 space-y-2 md:space-y-4">
              {isHomeFiltered ? (
                /* Beautiful glassmorphic filtered grid */
                <div className="px-6 md:px-12 py-8 space-y-6 bg-black/40 backdrop-blur-md rounded-t-3xl border-t border-white/5 shadow-[0_-15px_40px_rgba(0,0,0,0.9)]">
                  <div className="flex items-center gap-2">
                    <Grid className="text-brand-red" size={20} />
                    <h3 className="font-display font-bold text-lg md:text-xl text-white">
                      Filtered Exploration ({filteredHomeMovies.length} matching)
                    </h3>
                  </div>

                  {filteredHomeMovies.length > 0 ? (
                    <motion.div 
                      layout
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
                    >
                      <AnimatePresence>
                        {filteredHomeMovies.map((movie) => (
                          <motion.div
                            key={movie.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                          >
                            <PosterCard
                              movie={movie}
                              onOpenAuth={() => setIsAuthOpen(true)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl max-w-md mx-auto">
                      <AlertCircle className="text-gray-500 mx-auto mb-3" size={32} />
                      <p className="text-sm font-semibold text-white">No items match your filters</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Try selecting a different genre or clearing filters to discover incredible cinematic releases.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Unfiltered horizontal scrolling modular content rows */
                <div className="bg-gradient-to-b from-[#000000]/10 via-[#000000]/80 to-black rounded-t-3xl pt-4 shadow-[0_-25px_50px_rgba(0,0,0,0.9)]">
                  {/* Prominent My List (Watchlist) row for the Active Profile */}
                  {user && activeProfile && watchlistMovies.length > 0 && (
                    <ContentRow
                      title="My List"
                      initialMovies={watchlistMovies}
                      onOpenAuth={() => setIsAuthOpen(true)}
                    />
                  )}

                  {/* Dynamic Recommendations for You row based on likes */}
                  {user && liked.length > 0 && recommendedMovies.length > 0 && (
                    <ContentRow
                      title="Recommended For You"
                      initialMovies={recommendedMovies}
                      onOpenAuth={() => setIsAuthOpen(true)}
                    />
                  )}

                  <ContentRow
                    title="Top 10 Global Trending Leaderboard"
                    fetchUrl="/api/movies/trending"
                    onOpenAuth={() => setIsAuthOpen(true)}
                    isTop10={true}
                  />

                  <ContentRow
                    title="Top Rated Blockbusters"
                    fetchUrl="/api/movies/top-rated"
                    onOpenAuth={() => setIsAuthOpen(true)}
                  />

                  <ContentRow
                    title="New Releases"
                    fetchUrl="/api/movies/new-releases"
                    onOpenAuth={() => setIsAuthOpen(true)}
                  />

                  {/* Dynamic Priority Sorted Genres Rows based on Liked Affinity weights */}
                  {prioritizedGenres.map((genre) => (
                    <ContentRow
                      key={genre}
                      title={`${genre} Spotlight`}
                      fetchUrl={`/api/movies/genre/${genre}`}
                      onOpenAuth={() => setIsAuthOpen(true)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Pill Bottom Navigation Bar */}
      <BottomNav
        activeTab={
          activeTab === "home" && isHomeFiltered 
            ? "search" // active search state for indicators
            : activeTab
        }
        setActiveTab={setActiveTab}
        onSearchClick={handleSearchClickInBottomNav}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-gray-500 font-mono tracking-wide mt-auto">
        <p>© {new Date().getFullYear()} ALLRATED CINEMA CORP. ALL RIGHTS RESERVED.</p>
        <p className="mt-1 text-[10px] text-gray-600">
          POWERED BY THEATRICAL TMDB API PROXIES & SECURE SUPABASE CLOUD HISTORY
        </p>
      </footer>

      {/* MODAL SYSTEMS */}
      <AnimatePresence mode="wait">
        {isAuthOpen && (
          <AuthModal onClose={() => setIsAuthOpen(false)} />
        )}

        {activeMovieForModal && (
          <DetailModal
            key={`detail-modal-${activeMovieForModal.id}`}
            movie={activeMovieForModal}
            onClose={() => setActiveMovieForModal(null)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}
      </AnimatePresence>

      {activeMovieForPlayer && (
        <CustomPlayer
          movie={activeMovieForPlayer}
          onClose={() => setActiveMovieForPlayer(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AllratedApp />
    </AppProvider>
  );
}

