import React, { useRef, useState, useEffect } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
  RotateCcw, Sparkles, Settings, Tv, Loader2
} from 'lucide-react';

interface VideoPlayerProps {
  videoUrl?: string;
  embedUrl?: string;
  title: string;
  episodeNumber?: number;
}

export default function VideoPlayer({ videoUrl = '', embedUrl, title, episodeNumber = 1 }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showIntroSkip, setShowIntroSkip] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  if (embedUrl) {
    return (
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden bg-black border border-slate-900 aspect-video w-full shadow-2xl group transition-all duration-300"
      >
        {!iframeLoaded && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-3 z-10">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="text-xs font-mono text-zinc-500">Loading stream...</span>
          </div>
        )}
        <iframe
          src={embedUrl}
          className="w-full h-full border-0 bg-black"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer"
          title={title}
          id="streaming-embed-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          onLoad={() => setIframeLoaded(true)}
        />
        <div className="absolute top-3 right-3 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded text-[8px] font-mono text-emerald-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" />
          <span>SECURE SANDBOXED STREAM</span>
        </div>
      </div>
    );
  }

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setShowIntroSkip(false);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [videoUrl]);

  useEffect(() => {
    if (currentTime >= 5 && currentTime <= 25) {
      setShowIntroSkip(true);
    } else {
      setShowIntroSkip(false);
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const v = parseFloat(e.target.value);
    setVolume(v);
    videoRef.current.volume = v;
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    setIsMuted(!isMuted);
    videoRef.current.muted = !isMuted;
  };

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;
    setPlaybackSpeed(speed);
    videoRef.current.playbackRate = speed;
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying && showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  const handleMouseMove = () => setShowControls(true);
  const handleSkipIntro = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 30;
    setCurrentTime(30);
    setShowIntroSkip(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative rounded-2xl overflow-hidden bg-black border border-slate-900 aspect-video w-full group transition-all duration-300"
    >
      <video
        ref={videoRef}
        src={videoUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onClick={togglePlay}
        className="w-full h-full object-cover cursor-pointer"
        preload="metadata"
      />

      {!isPlaying && currentTime === 0 && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-4 cursor-pointer z-10 hover:bg-slate-950/60 transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 hover:scale-110 active:scale-95 transition-transform duration-200">
            <Play className="w-8 h-8 fill-white translate-x-0.5" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-white">Stream Episode {episodeNumber}</h3>
            <p className="text-xs text-slate-400 mt-1">{title}</p>
          </div>
        </div>
      )}

      {isBuffering && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-25 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-slate-300">Buffering Stream...</span>
          </div>
        </div>
      )}

      {showIntroSkip && isPlaying && (
        <button
          onClick={handleSkipIntro}
          className="absolute bottom-20 right-6 px-4 py-2 rounded-lg bg-slate-950/90 hover:bg-blue-500 border border-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95 z-20 hover:text-black hover:border-transparent"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Skip Introduction</span>
        </button>
      )}

      {showControls && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2.5">
            <div className="bg-purple-500/20 border border-purple-500/40 text-purple-400 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded">
              EPISODE {episodeNumber}
            </div>
            <h4 className="text-xs md:text-sm font-medium text-slate-200 truncate max-w-md">
              {title}
            </h4>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400">
            <Tv className="w-3.5 h-3.5" />
            <span>HLS FEED</span>
          </div>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/85 to-transparent z-20 flex flex-col gap-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 relative group/timeline">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 rounded bg-slate-800 accent-blue-500 hover:h-2 transition-all cursor-pointer outline-none"
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 w-10">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-slate-300 hover:text-white transition-colors" aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause className="w-5 h-5 fill-slate-300" /> : <Play className="w-5 h-5 fill-slate-300" />}
            </button>

            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="text-slate-300 hover:text-white transition-colors" aria-label="Toggle Mute">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0} max={1} step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-16 h-1 rounded bg-slate-800 accent-blue-500 transition-all cursor-pointer outline-none"
              />
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-500">
              <span className="text-emerald-500">• 1080p Web-DL</span>
              <span>• AAC 2.0</span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-slate-300 hover:text-white transition-colors text-xs font-mono font-medium flex items-center gap-1"
                title="Playback Speed"
              >
                <Settings className="w-4 h-4" />
                <span>{playbackSpeed === 1 ? '1.0x' : `${playbackSpeed}x`}</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-8 right-0 rounded-lg bg-slate-950 border border-slate-800 p-1 z-35 flex flex-col gap-0.5 shadow-2xl min-w-[70px]">
                  {[0.5, 1, 1.25, 1.5, 2].map((sp) => (
                    <button
                      key={sp}
                      onClick={() => handleSpeedChange(sp)}
                      className={`text-[10px] font-mono px-2 py-1 rounded text-left transition-colors ${
                        playbackSpeed === sp
                          ? 'bg-blue-500/15 text-blue-400 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {sp === 1 ? 'Normal' : `${sp}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className={`hidden md:block transition-colors ${isTheaterMode ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
              title="Theater Mode"
            >
              <Tv className="w-4 h-4" />
            </button>

            <button onClick={toggleFullscreen} className="text-slate-300 hover:text-white transition-colors" title="Fullscreen">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
