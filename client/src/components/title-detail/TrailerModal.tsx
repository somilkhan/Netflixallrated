import { useEffect } from 'react';

interface TrailerModalProps {
  youtubeId: string;
  title: string;
  onClose: () => void;
}

/** Lightweight, user-initiated trailer player. Because playback only starts on a
 *  real click, there's no autoplay policy to fight — the black-hero / silently
 *  blocked embed problem this replaces simply can't happen here. */
export default function TrailerModal({ youtubeId, title, onClose }: TrailerModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="trailer-modal-overlay" onClick={onClose}>
      <div className="trailer-modal-content" onClick={e => e.stopPropagation()}>
        <button className="trailer-modal-close" onClick={onClose} aria-label="Close trailer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="trailer-modal-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={`${title} — Trailer`}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
