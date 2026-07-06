import { useEffect, useRef } from 'react';
import { SERVERS } from './VideoPlayer';
import '@/styles/PlayerModal.css';

interface PlayerModalProps {
  title: any;
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
  switchServer: (id: string) => void;
  iframeKey: number;
  setIframeKey: React.Dispatch<React.SetStateAction<number>>;
  seasons: any[];
  selectedSeason: number;
  setSelectedSeason: (s: number) => void;
  selectedEp: number;
  setSelectedEp: React.Dispatch<React.SetStateAction<number>>;
  episodes: any[];
  embedUrl: string | null;
  onAnimePrev?: () => void;
  onAnimeNext?: () => void;
  anicrushEpCount?: number;
}

export default function PlayerModal({
  title,
  isOpen,
  onClose,
  serverId,
  switchServer,
  iframeKey,
  setIframeKey,
  seasons,
  selectedSeason,
  setSelectedSeason,
  selectedEp,
  setSelectedEp,
  episodes,
  embedUrl,
  onAnimePrev,
  onAnimeNext,
  anicrushEpCount = 0,
}: PlayerModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !title) return null;

  const isAnime = title.type === 'ANIME';
  const isSeries = title.type === 'SERIES';

  const epCountForNav = isSeries ? episodes.length : anicrushEpCount;

  return (
    <div className="player-modal-overlay" onClick={onClose}>
      <div className="player-modal-content" onClick={e => e.stopPropagation()}>

        {/* Close button */}
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="modal-header">
          <h2>{title.name}</h2>
          <span className="modal-meta">
            {isAnime
              ? `Anime · Episode ${selectedEp}`
              : isSeries
              ? `S${selectedSeason} · E${selectedEp}`
              : `Movie · ${title.year}`}
          </span>
        </div>

        {/* Server tabs — movies & series only */}
        {!isAnime && (
          <div className="server-tabs">
            {SERVERS.map(s => (
              <button
                key={s.id}
                className={`server-tab${serverId === s.id ? ' active' : ''}`}
                onClick={() => { switchServer(s.id); setIframeKey(k => k + 1); }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        {isAnime && (
          <div className="server-tabs">
            <button className="server-tab active">Anicrush</button>
          </div>
        )}

        {/* Season & episode selectors — series only */}
        {isSeries && (seasons.length > 0 || episodes.length > 0) && (
          <div className="episode-selector">
            {seasons.length > 0 && (
              <div className="selector-group">
                <label>Season</label>
                <select
                  value={selectedSeason}
                  onChange={e => {
                    setSelectedSeason(Number(e.target.value));
                    setSelectedEp(1);
                  }}
                >
                  {seasons.map(s => (
                    <option key={s.seasonNumber} value={s.seasonNumber}>
                      {s.name || `Season ${s.seasonNumber}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {episodes.length > 0 && (
              <div className="selector-group">
                <label>Episode</label>
                <select
                  value={selectedEp}
                  onChange={e => { setSelectedEp(Number(e.target.value)); setIframeKey(k => k + 1); }}
                >
                  {episodes.map(ep => (
                    <option key={ep.episodeNumber} value={ep.episodeNumber}>
                      {ep.episodeNumber}. {ep.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Video iframe */}
        <div className="video-wrapper">
          {embedUrl ? (
            <iframe
              ref={iframeRef}
              key={`${serverId}-${selectedSeason}-${selectedEp}-${iframeKey}`}
              src={embedUrl}
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              referrerPolicy="no-referrer"
              title={title.name}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontFamily: 'monospace', fontSize: '0.875rem' }}>
              Loading stream…
            </div>
          )}
        </div>

        {/* Prev / Next — series & anime */}
        {(isSeries || isAnime) && (
          <div className="episode-nav">
            <button
              className="nav-btn"
              disabled={selectedEp <= 1}
              onClick={() => {
                if (isAnime) { onAnimePrev?.(); }
                else { setSelectedEp(p => Math.max(1, p - 1)); setIframeKey(k => k + 1); }
              }}
            >
              ← Prev
            </button>
            <span style={{ color: '#666', fontSize: '0.85rem', alignSelf: 'center', fontFamily: 'monospace' }}>
              {epCountForNav > 0 ? `${selectedEp} / ${epCountForNav}` : `Ep ${selectedEp}`}
            </span>
            <button
              className="nav-btn"
              disabled={epCountForNav > 0 && selectedEp >= epCountForNav}
              onClick={() => {
                if (isAnime) { onAnimeNext?.(); }
                else { setSelectedEp(p => p + 1); setIframeKey(k => k + 1); }
              }}
            >
              Next →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
