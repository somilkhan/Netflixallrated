import React from 'react';

interface RelatedRowProps {
  title: string;
  count?: number;
  children: React.ReactNode;
}

/** Consistent horizontally-scrolling section used for characters, relations,
 *  recommendations, and similar titles. Uses a "bleed" pattern — the row spans
 *  full width so scrolling reaches the true screen edge, while a matching
 *  padding keeps cards clear of the viewport edge at rest (no cards flush
 *  against the glass on mobile). */
export default function RelatedRow({ title, count, children }: RelatedRowProps) {
  return (
    <div className="dp-section">
      <div className="dp-section-head">
        <span className="dp-section-title">
          {title}
          {count != null && <span className="dp-section-count">({count})</span>}
        </span>
      </div>
      <div className="related-row">{children}</div>
    </div>
  );
}
