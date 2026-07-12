import React from 'react';

/** Shared shimmer bar — transform/opacity-driven, GPU-cheap. */
function Bar({ width, height = 12, radius = 6, style }: { width: string | number; height?: number; radius?: number; style?: React.CSSProperties }) {
  return (
    <div
      className="skel-bar"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

/** Full-page skeleton shown while the title record itself is loading.
 *  Mirrors the real layout (hero → poster → title → meta → actions → synopsis)
 *  so there's no layout shift once real content arrives. */
export function PageSkeleton() {
  return (
    <div className="movie-detail-page">
      <div className="hero skel-hero">
        <div className="hero-gradient" />
      </div>
      <div className="detail-shell">
        <div className="poster-row">
          <div className="detail-poster skel-block" />
        </div>
        <Bar width="70%" height={30} radius={8} style={{ marginTop: 18, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          <Bar width={48} height={14} />
          <Bar width={64} height={14} />
          <Bar width={56} height={14} />
        </div>
        <Bar width="100%" height={13} style={{ marginBottom: 8 }} />
        <Bar width="94%" height={13} style={{ marginBottom: 8 }} />
        <Bar width="60%" height={13} style={{ marginBottom: 22 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <Bar width="100%" height={44} radius={11} />
          <Bar width="100%" height={44} radius={11} />
          <Bar width="100%" height={44} radius={11} />
        </div>
      </div>
    </div>
  );
}

/** Skeleton for a horizontally-scrolling row (characters, related, recommendations). */
export function RowSkeleton({ count = 6, cardWidth = 130, cardHeight = 180 }: { count?: number; cardWidth?: number; cardHeight?: number }) {
  return (
    <div className="related-row" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ flex: '0 0 auto', width: cardWidth }}>
          <div className="skel-block" style={{ width: cardWidth, height: cardHeight, borderRadius: 12 }} />
          <Bar width="80%" height={11} style={{ marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a circular character avatar row. */
export function CharacterRowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="related-row" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ flex: '0 0 auto', width: 72, textAlign: 'center' }}>
          <div className="skel-block" style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 6px' }} />
          <Bar width={54} height={9} style={{ margin: '0 auto' }} />
        </div>
      ))}
    </div>
  );
}

/** Skeleton rows for the episode list — matches .ep-row dimensions exactly. */
export function EpisodeListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="ep-list" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ep-row skel-ep-row">
          <div className="skel-block ep-thumb" />
          <div className="ep-info" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Bar width="40%" height={11} />
            <Bar width="85%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}
