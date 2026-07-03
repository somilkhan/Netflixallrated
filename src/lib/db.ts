import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { UserProfile, UserState, Profile } from "../types";

// Dynamic check for Supabase configs in Vite env (if any are provided by user)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
}

// Global state for when we are in localStorage fallback mode
const LOCAL_STORAGE_KEY = "allrated_local_state";

const DEFAULT_LOCAL_STATE: UserState = {
  user: null,
  profiles: [],
  activeProfile: null,
  watchlist: [],
  liked: [],
  watched: [],
  genresPreference: {},
  profileStates: {}
};

// Helper to get local state
function getLocalState(): UserState {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_LOCAL_STATE;
    }
  }
  return DEFAULT_LOCAL_STATE;
}

// Helper to save local state
function saveLocalState(state: UserState) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
}

export const dbService = {
  isSupabaseActive(): boolean {
    return !!supabase;
  },

  // USER / AUTH METHODS
  async getUser(): Promise<UserProfile | null> {
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          return {
            id: user.id,
            email: user.email || "",
            name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
            avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`
          };
        }
      } catch (err) {
        console.error("Supabase getUser error:", err);
      }
    }
    
    // Local fallback
    return getLocalState().user;
  },

  async signUp(email: string, password: string, name: string): Promise<{ user: UserProfile | null; error: string | null }> {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`
            }
          }
        });
        if (error) return { user: null, error: error.message };
        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || "",
            name,
            avatar_url: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`
          };
          return { user: profile, error: null };
        }
      } catch (err: any) {
        return { user: null, error: err.message || "Sign up failed" };
      }
    }

    // Local signup (simulate)
    const localState = getLocalState();
    const profile: UserProfile = {
      id: "u-" + Math.random().toString(36).substring(2, 9),
      email,
      name,
      avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`
    };
    localState.user = profile;
    saveLocalState(localState);
    return { user: profile, error: null };
  },

  async signIn(email: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { user: null, error: error.message };
        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || "",
            name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
            avatar_url: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`
          };
          return { user: profile, error: null };
        }
      } catch (err: any) {
        return { user: null, error: err.message || "Login failed" };
      }
    }

    // Local signin (simulate)
    const localState = getLocalState();
    if (!localState.user || localState.user.email !== email) {
      // Create active user
      const profile: UserProfile = {
        id: "u-123",
        email,
        name: email.split("@")[0],
        avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`
      };
      localState.user = profile;
      saveLocalState(localState);
    }
    return { user: localState.user, error: null };
  },

  async signOut(): Promise<void> {
    if (supabase) {
      await supabase.auth.signOut();
    }
    const localState = getLocalState();
    localState.user = null;
    saveLocalState(localState);
  },

  // DATABASE/HISTORY SYNC
  async getProfiles(userId: string): Promise<Profile[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId);
        if (!error && data) {
          return data.map((d: any) => ({
            id: String(d.id),
            name: d.name,
            avatar_url: d.avatar_url,
            is_kids: !!d.is_kids
          }));
        }
      } catch (err) {
        console.warn("Supabase profile fetch failed, using local fallback", err);
      }
    }
    const state = getLocalState();
    return state.profiles || [];
  },

  async createProfile(userId: string, name: string, avatarUrl: string, isKids: boolean = false): Promise<Profile> {
    const newProfile: Profile = {
      id: "p-" + Math.random().toString(36).substring(2, 9),
      name,
      avatar_url: avatarUrl,
      is_kids: isKids
    };

    if (supabase) {
      try {
        const { error } = await supabase
          .from("profiles")
          .insert([{ user_id: userId, id: newProfile.id, name, avatar_url: avatarUrl, is_kids: isKids }]);
        if (!error) {
          // Success, also sync local
        }
      } catch (err) {
        console.warn("Supabase profile create failed, using local storage", err);
      }
    }

    const state = getLocalState();
    if (!state.profiles) state.profiles = [];
    state.profiles.push(newProfile);
    if (!state.profileStates) state.profileStates = {};
    state.profileStates[newProfile.id] = {
      watchlist: [],
      liked: [],
      watched: [],
      genresPreference: {}
    };
    saveLocalState(state);
    return newProfile;
  },

  async deleteProfile(userId: string, profileId: string): Promise<void> {
    if (supabase) {
      try {
        await supabase
          .from("profiles")
          .delete()
          .eq("user_id", userId)
          .eq("id", profileId);
      } catch (err) {
        console.warn("Supabase profile delete failed, using local storage", err);
      }
    }

    const state = getLocalState();
    if (state.profiles) {
      state.profiles = state.profiles.filter(p => p.id !== profileId);
    }
    if (state.profileStates) {
      delete state.profileStates[profileId];
    }
    if (state.activeProfile?.id === profileId) {
      state.activeProfile = null;
    }
    saveLocalState(state);
  },

  async getWatchlist(userId: string, profileId?: string): Promise<string[]> {
    if (supabase) {
      try {
        const targetUser = profileId ? `${userId}:${profileId}` : userId;
        const { data, error } = await supabase
          .from("watchlist")
          .select("movie_id")
          .eq("user_id", targetUser);
        if (!error && data) {
          return data.map((d: any) => String(d.movie_id));
        }

        // Alternative profile_id field if the column exists
        if (profileId) {
          const { data: pData, error: pError } = await supabase
            .from("watchlist")
            .select("movie_id")
            .eq("user_id", userId)
            .eq("profile_id", profileId);
          if (!pError && pData) {
            return pData.map((d: any) => String(d.movie_id));
          }
        }
      } catch (err) {
        console.error("Supabase fetch watchlist error:", err);
      }
    }

    // Local state fallback
    const state = getLocalState();
    if (profileId) {
      return state.profileStates?.[profileId]?.watchlist || [];
    }
    return state.watchlist;
  },

  async addToWatchlist(userId: string, movieId: string, profileId?: string): Promise<void> {
    if (supabase) {
      try {
        const targetUser = profileId ? `${userId}:${profileId}` : userId;
        const { error } = await supabase
          .from("watchlist")
          .insert([{ user_id: targetUser, movie_id: movieId }]);
        if (!error) return;

        if (profileId) {
          // Alternative if the schema has profile_id column
          await supabase
            .from("watchlist")
            .insert([{ user_id: userId, movie_id: movieId, profile_id: profileId }]);
          return;
        }
      } catch (err) {
        console.error("Supabase insert watchlist error:", err);
      }
    }

    const state = getLocalState();
    if (profileId) {
      if (!state.profileStates) state.profileStates = {};
      if (!state.profileStates[profileId]) {
        state.profileStates[profileId] = { watchlist: [], liked: [], watched: [], genresPreference: {} };
      }
      if (!state.profileStates[profileId].watchlist.includes(movieId)) {
        state.profileStates[profileId].watchlist.push(movieId);
      }
    } else {
      if (!state.watchlist.includes(movieId)) {
        state.watchlist.push(movieId);
      }
    }
    saveLocalState(state);
  },

  async removeFromWatchlist(userId: string, movieId: string, profileId?: string): Promise<void> {
    if (supabase) {
      try {
        const targetUser = profileId ? `${userId}:${profileId}` : userId;
        await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", targetUser)
          .eq("movie_id", movieId);

        if (profileId) {
          await supabase
            .from("watchlist")
            .delete()
            .eq("user_id", userId)
            .eq("profile_id", profileId)
            .eq("movie_id", movieId);
        }
      } catch (err) {
        console.error("Supabase delete watchlist error:", err);
      }
    }

    const state = getLocalState();
    if (profileId) {
      if (state.profileStates?.[profileId]) {
        state.profileStates[profileId].watchlist = state.profileStates[profileId].watchlist.filter(id => id !== movieId);
      }
    } else {
      state.watchlist = state.watchlist.filter(id => id !== movieId);
    }
    saveLocalState(state);
  },

  async getLiked(userId: string, profileId?: string): Promise<string[]> {
    if (supabase) {
      try {
        const targetUser = profileId ? `${userId}:${profileId}` : userId;
        const { data, error } = await supabase
          .from("liked")
          .select("movie_id")
          .eq("user_id", targetUser);
        if (!error && data) {
          return data.map((d: any) => String(d.movie_id));
        }

        if (profileId) {
          const { data: pData, error: pError } = await supabase
            .from("liked")
            .select("movie_id")
            .eq("user_id", userId)
            .eq("profile_id", profileId);
          if (!pError && pData) {
            return pData.map((d: any) => String(d.movie_id));
          }
        }
      } catch (err) {
        console.error("Supabase fetch liked error:", err);
      }
    }
    
    const state = getLocalState();
    if (profileId) {
      return state.profileStates?.[profileId]?.liked || [];
    }
    return state.liked;
  },

  async toggleLike(userId: string, movieId: string, genres: string[] = [], profileId?: string): Promise<boolean> {
    const state = getLocalState();
    let isLiked = false;
    if (profileId) {
      isLiked = !!state.profileStates?.[profileId]?.liked.includes(movieId);
    } else {
      isLiked = state.liked.includes(movieId);
    }
    let newLikedState = !isLiked;

    if (supabase) {
      try {
        const targetUser = profileId ? `${userId}:${profileId}` : userId;
        if (isLiked) {
          await supabase.from("liked").delete().eq("user_id", targetUser).eq("movie_id", movieId);
          if (profileId) {
            await supabase.from("liked").delete().eq("user_id", userId).eq("profile_id", profileId).eq("movie_id", movieId);
          }
        } else {
          const { error } = await supabase.from("liked").insert([{ user_id: targetUser, movie_id: movieId }]);
          if (error && profileId) {
            await supabase.from("liked").insert([{ user_id: userId, movie_id: movieId, profile_id: profileId }]);
          }
        }
      } catch (err) {
        console.error("Supabase toggleLike error:", err);
      }
    }

    if (profileId) {
      if (!state.profileStates) state.profileStates = {};
      if (!state.profileStates[profileId]) {
        state.profileStates[profileId] = { watchlist: [], liked: [], watched: [], genresPreference: {} };
      }
      const pState = state.profileStates[profileId];
      if (isLiked) {
        pState.liked = pState.liked.filter(id => id !== movieId);
        genres.forEach(g => {
          pState.genresPreference[g] = Math.max(0, (pState.genresPreference[g] || 1) - 1);
        });
      } else {
        pState.liked.push(movieId);
        genres.forEach(g => {
          pState.genresPreference[g] = (pState.genresPreference[g] || 0) + 1;
        });
      }
    } else {
      if (isLiked) {
        state.liked = state.liked.filter(id => id !== movieId);
        genres.forEach(g => {
          state.genresPreference[g] = Math.max(0, (state.genresPreference[g] || 1) - 1);
        });
      } else {
        state.liked.push(movieId);
        genres.forEach(g => {
          state.genresPreference[g] = (state.genresPreference[g] || 0) + 1;
        });
      }
    }
    saveLocalState(state);
    return newLikedState;
  },

  async getWatched(userId: string, profileId?: string): Promise<string[]> {
    if (supabase) {
      try {
        const targetUser = profileId ? `${userId}:${profileId}` : userId;
        const { data, error } = await supabase
          .from("history")
          .select("movie_id")
          .eq("user_id", targetUser);
        if (!error && data) {
          return data.map((d: any) => String(d.movie_id));
        }

        if (profileId) {
          const { data: pData, error: pError } = await supabase
            .from("history")
            .select("movie_id")
            .eq("user_id", userId)
            .eq("profile_id", profileId);
          if (!pError && pData) {
            return pData.map((d: any) => String(d.movie_id));
          }
        }
      } catch (err) {
        console.error("Supabase fetch history error:", err);
      }
    }
    
    const state = getLocalState();
    if (profileId) {
      return state.profileStates?.[profileId]?.watched || [];
    }
    return state.watched;
  },

  async addToWatched(userId: string, movieId: string, profileId?: string): Promise<void> {
    if (supabase) {
      try {
        const targetUser = profileId ? `${userId}:${profileId}` : userId;
        const { error } = await supabase
          .from("history")
          .upsert([{ user_id: targetUser, movie_id: movieId, watched_at: new Date().toISOString() }]);
        if (error && profileId) {
          await supabase
            .from("history")
            .upsert([{ user_id: userId, movie_id: movieId, profile_id: profileId, watched_at: new Date().toISOString() }]);
        }
      } catch (err) {
        console.error("Supabase history upsert error:", err);
      }
    }

    const state = getLocalState();
    if (profileId) {
      if (!state.profileStates) state.profileStates = {};
      if (!state.profileStates[profileId]) {
        state.profileStates[profileId] = { watchlist: [], liked: [], watched: [], genresPreference: {} };
      }
      if (!state.profileStates[profileId].watched.includes(movieId)) {
        state.profileStates[profileId].watched.push(movieId);
      }
    } else {
      if (!state.watched.includes(movieId)) {
        state.watched.push(movieId);
      }
    }
    saveLocalState(state);
  },

  getGenreWeights(profileId?: string): Record<string, number> {
    const state = getLocalState();
    if (profileId && state.profileStates?.[profileId]) {
      return state.profileStates[profileId].genresPreference;
    }
    return state.genresPreference;
  }
};
