/**
 * CategoryTile — small backdrop/tinted browse tile used for the Home page's
 * "Studios" and "Popular Genres" rows (mirrors bingr.one's category rails).
 */
import type { CSSProperties } from 'react';

const CARD_BG = '#141014';
const WHITE = '#EDE6E8';
const BORDER = 'rgba(255,255,255,0.045)';
const W = 165;
const H = 115;
const R = 13;

export function ImgTile({
  label, img, tint, onClick,
}: { label: string; img?: string; tint: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, position: 'relative',
        width: W, height: H, borderRadius: R,
        overflow: 'hidden', cursor: 'pointer',
        background: CARD_BG, border: `1px solid ${BORDER}`,
        padding: 0, textAlign: 'left',
      }}
    >
      {img && (
        <img
          src={img} alt={label} loading="lazy" decoding="async"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            filter: 'brightness(0.82) saturate(0.88)',
          }}
        />
      )}
      <div style={{ position: 'absolute', inset: 0, background: tint }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top,rgba(9,4,10,0.92) 0%,rgba(9,4,10,0.45) 42%,transparent 66%)',
      }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 10px 9px' }}>
        <p style={{
          fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 15,
          color: WHITE, margin: 0, lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        }}>{label}</p>
      </div>
    </button>
  );
}

export function LogoTile({
  logo, color, onClick,
}: { logo: string; color: string; onClick?: () => void }) {
  const isNetflix = logo === 'NETFLIX', isMubi = logo === 'MUBI';
  const isPrime = logo === 'prime video', isApple = logo === 'Apple TV+';
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, position: 'relative',
        width: W, height: H, borderRadius: R,
        overflow: 'hidden', cursor: 'pointer',
        background: CARD_BG, border: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at center,${color}16 0%,transparent 70%)`,
      }} />
      <span style={{
        position: 'relative',
        fontFamily: isNetflix || isMubi ? "'Montserrat',sans-serif" : isApple ? "-apple-system,'SF Pro Display',sans-serif" : "'Plus Jakarta Sans',sans-serif",
        fontWeight: isPrime ? 400 : 700,
        fontStyle: isPrime ? 'italic' : 'normal',
        fontSize: isNetflix ? 18 : isMubi ? 22 : isPrime ? 13 : isApple ? 14 : 16,
        letterSpacing: isNetflix ? '0.15em' : isMubi ? '0.22em' : '0.02em',
        textTransform: (isNetflix || isMubi ? 'uppercase' : 'none') as CSSProperties['textTransform'],
        color, textShadow: `0 0 28px ${color}55`,
      }}>{logo}</span>
    </button>
  );
}

export function TileRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto px-5 pb-1 scrollbar-hide">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          flexShrink: 0, width: W, height: H, borderRadius: R,
          background: CARD_BG, border: `1px solid ${BORDER}`,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}
