import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, LogOut, Film, Bookmark, Heart, ChevronDown, Sparkles, Users, ExternalLink } from "lucide-react";
import { useApp } from "../context/AppContext";

interface NavbarProps {
  onOpenAuth: () => void;
  activeTab: "home" | "watchlist" | "liked";
  setActiveTab: (tab: "home" | "watchlist" | "liked") => void;
}

export default function Navbar({ onOpenAuth, activeTab, setActiveTab }: NavbarProps) {
  const { user, profiles, activeProfile, selectProfile, signOut, searchQuery, setSearchQuery, config } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Live Auto-Suggestions state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Iframe sandboxing/preview detection
  const [isInsideIframe, setIsInsideIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInsideIframe(window.self !== window.top);
    } catch (e) {
      setIsInsideIframe(true);
    }

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    window.document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch live suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSuggestions(data.slice(0, 5));
        }
      } catch (err) {
        console.error("Suggestions fetch error:", err);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearchClick = () => {
    setSearchOpen(prev => !prev);
    if (!searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

  const handleProfileSwitch = (prof: any) => {
    selectProfile(prof);
    setDropdownOpen(false);
  };

  // Get other profiles that are not the current active profile
  const alternateProfiles = profiles.filter(p => p.id !== activeProfile?.id);

  return (
    <div className="fixed top-0 inset-x-0 z-45 flex flex-col">
      {isInsideIframe && (
        <div className="bg-gradient-to-r from-brand-red via-[#f43f5e] to-[#a21caf] py-2.5 px-4 text-center text-white text-[11px] font-semibold flex flex-col sm:flex-row items-center justify-center gap-2.5 shadow-lg border-b border-white/10 z-50 backdrop-blur-md animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-yellow-300 animate-bounce flex-shrink-0" />
            <span className="leading-normal">
              Some video players block viewing inside the sandboxed preview frame. Open Allrated in a new tab for instant playback!
            </span>
          </div>
          <a
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white hover:bg-white/95 text-brand-maroon hover:text-brand-crimson px-3 py-1 rounded-lg font-bold transition duration-300 shadow-md flex items-center gap-1.5 flex-shrink-0 transform active:scale-95 text-[10px]"
          >
            <span>Open in Dedicated Tab</span>
            <ExternalLink size={10} />
          </a>
        </div>
      )}
      <nav
        className={`w-full transition-all duration-500 h-20 flex items-center justify-between px-6 md:px-12 ${
          isScrolled 
            ? "glass-nav py-4 shadow-xl" 
            : "bg-gradient-to-b from-black/85 via-black/40 to-transparent py-6"
        }`}
      >
      {/* Left section: Logo & Nav Links */}
      <div className="flex items-center gap-10">
        {/* Brand Logo */}
        <div 
          onClick={() => { setActiveTab("home"); setSearchQuery(""); }}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8.5 h-8.5 rounded bg-gradient-to-br from-[#E50914] to-[#9B0F15] flex items-center justify-center font-display font-black text-white shadow-md shadow-brand-red/10 transform group-hover:scale-105 transition-all">
            A
          </div>
          <span className="font-display font-black tracking-tighter text-[#E50914] italic text-2xl group-hover:text-white transition-colors">
            ALLRATED
          </span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => { setActiveTab("home"); setSearchQuery(""); }}
            className={`transition-colors cursor-pointer ${
              activeTab === "home" && !searchQuery
                ? "text-brand-red font-semibold" 
                : "text-gray-300 hover:text-white"
            }`}
          >
            Home
          </button>
          
          {user && activeProfile && (
            <>
              <button
                onClick={() => { setActiveTab("watchlist"); setSearchQuery(""); }}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === "watchlist" 
                    ? "text-brand-red font-semibold" 
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <Bookmark size={14} />
                <span>My List</span>
              </button>
              
              <button
                onClick={() => { setActiveTab("liked"); setSearchQuery(""); }}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === "liked" 
                    ? "text-brand-red font-semibold" 
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <Heart size={14} />
                <span>Liked Titles</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right section: Search, Auth, Notifications */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Search Input bar */}
        <div ref={suggestionsRef} className="relative flex items-center">
          <div
            className={`flex items-center bg-[#12090B]/90 border border-white/10 rounded-full overflow-hidden transition-all duration-300 ${
              searchOpen ? "w-44 md:w-64 px-3 py-1.5 opacity-100" : "w-0 opacity-0 pointer-events-none"
            }`}
          >
            <Search className="text-gray-400 mr-2" size={16} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Titles, genres, directors..."
              className="bg-transparent text-white border-none outline-none text-xs w-full placeholder-gray-500"
            />
          </div>
          <button
            onClick={handleSearchClick}
            className={`p-2 rounded-full hover:bg-white/5 text-gray-300 hover:text-white transition-all cursor-pointer ${
              searchOpen ? "text-brand-red" : ""
            }`}
            title="Search movie/TV"
          >
            <Search size={18} />
          </button>

          {/* Floating live suggestions list */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-[#12090B] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-fade-in text-xs text-gray-300 max-h-60 overflow-y-auto">
              {suggestions.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => {
                    setSearchQuery(movie.title);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 hover:text-white truncate transition cursor-pointer flex items-center justify-between gap-2"
                >
                  <span className="truncate">{movie.title}</span>
                  <span className="text-[9px] bg-brand-crimson/30 text-gray-400 px-1 rounded uppercase font-mono tracking-wider shrink-0">
                    {movie.type === "tv" ? "TV" : "Movie"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <button className="hidden sm:block p-2 rounded-full hover:bg-white/5 text-gray-300 hover:text-white transition-all relative cursor-pointer">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#E50914] rounded-full animate-pulse"></span>
        </button>

        {/* Auth profile avatar / trigger */}
        {user ? (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 focus:outline-none cursor-pointer group"
            >
              <img
                src={activeProfile ? activeProfile.avatar_url : user.avatar_url}
                alt={activeProfile ? activeProfile.name : user.name}
                className="w-8 h-8 rounded-full border-2 border-brand-red/30 group-hover:border-brand-red shadow transition-all animate-fade-in"
                referrerPolicy="no-referrer"
              />
              <ChevronDown size={14} className="text-gray-400 group-hover:text-white transition" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 glass-panel rounded-xl shadow-2xl border border-brand-crimson/20 py-2 animate-fade-in text-sm text-gray-300 z-50">
                {activeProfile && (
                  <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                    <img
                      src={activeProfile.avatar_url}
                      alt={activeProfile.name}
                      className="w-8 h-8 rounded-full border border-brand-red/30"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col">
                      <span className="font-display font-semibold text-white truncate text-xs leading-none">
                        {activeProfile.name}
                      </span>
                      {activeProfile.is_kids && (
                        <span className="text-[9px] bg-brand-red/20 text-brand-red px-1.5 py-0.5 rounded mt-1 w-fit font-mono font-bold uppercase leading-none">
                          Kids
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Profiles quick switch list */}
                {alternateProfiles.length > 0 && (
                  <div className="py-1 border-b border-white/5">
                    <div className="px-4 py-1 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      Switch Profile
                    </div>
                    {alternateProfiles.map((prof) => (
                      <button
                        key={prof.id}
                        onClick={() => handleProfileSwitch(prof)}
                        className="w-full text-left px-4 py-2 hover:bg-white/5 hover:text-white flex items-center gap-2 transition text-xs cursor-pointer"
                      >
                        <img
                          src={prof.avatar_url}
                          alt={prof.name}
                          className="w-5 h-5 rounded-full"
                          referrerPolicy="no-referrer"
                        />
                        <span className="truncate">{prof.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => { selectProfile(null); setDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/5 hover:text-white flex items-center gap-2 transition text-xs text-gray-400 cursor-pointer"
                >
                  <Users size={14} />
                  <span>Manage Profiles</span>
                </button>

                <div className="border-t border-white/5 my-1"></div>

                <button
                  onClick={() => { setActiveTab("watchlist"); setDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/5 hover:text-white flex items-center gap-2 transition text-xs cursor-pointer"
                >
                  <Bookmark size={14} />
                  <span>My List</span>
                </button>

                <button
                  onClick={() => { setActiveTab("liked"); setDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/5 hover:text-white flex items-center gap-2 transition text-xs cursor-pointer"
                >
                  <Heart size={14} />
                  <span>Liked Titles</span>
                </button>

                <div className="border-t border-white/5 my-1"></div>

                <button
                  onClick={() => { signOut(); setDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-brand-crimson/30 hover:text-brand-red flex items-center gap-2 transition text-xs text-brand-red font-semibold cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 rounded-xl bg-brand-red hover:bg-[#ff1525] text-white text-xs font-semibold font-display tracking-wide uppercase transition-all shadow-md shadow-brand-red/10 hover:shadow-lg active:scale-95 cursor-pointer"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
    </div>
  );
}
