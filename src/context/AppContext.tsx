import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Movie, UserProfile, Profile } from "../types";
import { dbService } from "../lib/db";

interface AppContextType {
  user: UserProfile | null;
  profiles: Profile[];
  activeProfile: Profile | null;
  selectProfile: (profile: Profile | null) => void;
  createProfile: (name: string, avatarUrl: string, isKids?: boolean) => Promise<Profile>;
  deleteProfile: (profileId: string) => Promise<void>;
  watchlist: string[];
  liked: string[];
  watched: string[];
  loading: boolean;
  activeMovieForPlayer: Movie | null;
  activeMovieForModal: Movie | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  config: { supabaseActive: boolean; tmdbActive: boolean; appName: string };
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  toggleWatchlist: (movie: Movie) => Promise<void>;
  toggleLike: (movie: Movie) => Promise<void>;
  markAsWatched: (movie: Movie) => Promise<void>;
  setActiveMovieForPlayer: (movie: Movie | null) => void;
  setActiveMovieForModal: (movie: Movie | null) => void;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [watched, setWatched] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMovieForPlayer, setActiveMovieForPlayer] = useState<Movie | null>(null);
  const [activeMovieForModal, setActiveMovieForModal] = useState<Movie | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [config, setConfig] = useState({ supabaseActive: false, tmdbActive: false, appName: "Allrated" });

  useEffect(() => {
    // Fetch backend config
    fetch("/api/config")
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error("Error fetching config:", err));

    // Load user & sync initial data
    refreshUser();
  }, []);

  const refreshUser = async () => {
    setLoading(true);
    const currentUser = await dbService.getUser();
    setUser(currentUser);
    if (currentUser) {
      // Load profiles
      const profs = await dbService.getProfiles(currentUser.id);
      setProfiles(profs);

      // Restore active profile from localStorage if any
      const savedProfileId = localStorage.getItem(`allrated_active_profile_${currentUser.id}`);
      const foundProfile = profs.find(p => p.id === savedProfileId);
      
      if (foundProfile) {
        setActiveProfile(foundProfile);
        await loadProfileData(currentUser.id, foundProfile);
      } else if (profs.length === 1) {
        // Auto-select if there is exactly 1 profile
        setActiveProfile(profs[0]);
        await loadProfileData(currentUser.id, profs[0]);
      } else {
        // Clear active profile to show profile selection screen
        setActiveProfile(null);
        setWatchlist([]);
        setLiked([]);
        setWatched([]);
      }
    } else {
      setProfiles([]);
      setActiveProfile(null);
      setWatchlist([]);
      setLiked([]);
      setWatched([]);
    }
    setLoading(false);
  };

  const loadProfileData = async (userId: string, profile: Profile | null) => {
    const pId = profile?.id;
    const [wl, lk, wt] = await Promise.all([
      dbService.getWatchlist(userId, pId),
      dbService.getLiked(userId, pId),
      dbService.getWatched(userId, pId)
    ]);
    setWatchlist(wl);
    setLiked(lk);
    setWatched(wt);
  };

  const selectProfile = async (profile: Profile | null) => {
    setActiveProfile(profile);
    if (user) {
      if (profile) {
        localStorage.setItem(`allrated_active_profile_${user.id}`, profile.id);
        await loadProfileData(user.id, profile);
      } else {
        localStorage.removeItem(`allrated_active_profile_${user.id}`);
        setWatchlist([]);
        setLiked([]);
        setWatched([]);
      }
    }
  };

  const createProfile = async (name: string, avatarUrl: string, isKids: boolean = false) => {
    if (!user) throw new Error("User must be logged in to create a profile");
    const newProf = await dbService.createProfile(user.id, name, avatarUrl, isKids);
    const updated = await dbService.getProfiles(user.id);
    setProfiles(updated);
    return newProf;
  };

  const deleteProfile = async (profileId: string) => {
    if (!user) return;
    await dbService.deleteProfile(user.id, profileId);
    const updated = await dbService.getProfiles(user.id);
    setProfiles(updated);
    if (activeProfile?.id === profileId) {
      setActiveProfile(null);
      setWatchlist([]);
      setLiked([]);
      setWatched([]);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { user: profile, error } = await dbService.signIn(email, password);
    if (error) return { error };
    setUser(profile);
    if (profile) {
      const profs = await dbService.getProfiles(profile.id);
      setProfiles(profs);
      
      const savedProfileId = localStorage.getItem(`allrated_active_profile_${profile.id}`);
      const foundProfile = profs.find(p => p.id === savedProfileId);
      if (foundProfile) {
        setActiveProfile(foundProfile);
        await loadProfileData(profile.id, foundProfile);
      } else if (profs.length === 1) {
        setActiveProfile(profs[0]);
        await loadProfileData(profile.id, profs[0]);
      } else {
        setActiveProfile(null);
      }
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { user: profile, error } = await dbService.signUp(email, password, name);
    if (error) return { error };
    setUser(profile);
    if (profile) {
      // Auto-create initial profile for the user
      const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
      const mainProfile = await dbService.createProfile(profile.id, name, defaultAvatar, false);
      setProfiles([mainProfile]);
      setActiveProfile(mainProfile);
      await loadProfileData(profile.id, mainProfile);
    }
    return { error: null };
  };

  const signOut = async () => {
    await dbService.signOut();
    setUser(null);
    setProfiles([]);
    setActiveProfile(null);
    setWatchlist([]);
    setLiked([]);
    setWatched([]);
  };

  const toggleWatchlist = async (movie: Movie) => {
    if (!user) return;
    const isAdded = watchlist.includes(movie.id);
    if (isAdded) {
      await dbService.removeFromWatchlist(user.id, movie.id, activeProfile?.id);
      setWatchlist(prev => prev.filter(id => id !== movie.id));
    } else {
      await dbService.addToWatchlist(user.id, movie.id, activeProfile?.id);
      setWatchlist(prev => [...prev, movie.id]);
    }
  };

  const toggleLike = async (movie: Movie) => {
    if (!user) return;
    const isLikedNow = await dbService.toggleLike(user.id, movie.id, movie.genres, activeProfile?.id);
    if (isLikedNow) {
      setLiked(prev => [...prev, movie.id]);
    } else {
      setLiked(prev => prev.filter(id => id !== movie.id));
    }
  };

  const markAsWatched = async (movie: Movie) => {
    if (!user) return;
    await dbService.addToWatched(user.id, movie.id, activeProfile?.id);
    if (!watched.includes(movie.id)) {
      setWatched(prev => [...prev, movie.id]);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        profiles,
        activeProfile,
        selectProfile,
        createProfile,
        deleteProfile,
        watchlist,
        liked,
        watched,
        loading,
        activeMovieForPlayer,
        activeMovieForModal,
        searchQuery,
        setSearchQuery,
        config,
        signIn,
        signUp,
        signOut,
        toggleWatchlist,
        toggleLike,
        markAsWatched,
        setActiveMovieForPlayer,
        setActiveMovieForModal,
        refreshUser
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
