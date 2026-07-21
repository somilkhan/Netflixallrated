/**
 * PlayerContext — global state for the persistent BottomPlayer.
 * TitleDetail sets the "now playing" title when playback starts.
 * BottomPlayer reads from this context.
 */
import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

export interface NowPlaying {
  id: string;
  name: string;
  posterUrl?: string | null;
  type?: string;
  year?: number | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
}

interface PlayerCtx {
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  setNowPlaying: (title: NowPlaying | null) => void;
  setIsPlaying: (v: boolean) => void;
  clear: () => void;
}

const PlayerContext = createContext<PlayerCtx>({
  nowPlaying: null,
  isPlaying: false,
  setNowPlaying: () => {},
  setIsPlaying: () => {},
  clear: () => {},
});

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const clear = useCallback(() => {
    setNowPlaying(null);
    setIsPlaying(false);
  }, []);

  const ctx = useMemo(
    () => ({ nowPlaying, isPlaying, setNowPlaying, setIsPlaying, clear }),
    [nowPlaying, isPlaying, clear],
  );

  return <PlayerContext.Provider value={ctx}>{children}</PlayerContext.Provider>;
}

export const usePlayer = () => useContext(PlayerContext);
