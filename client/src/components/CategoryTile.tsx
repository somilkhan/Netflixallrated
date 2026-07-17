/**
 * CategoryTile — browse tiles for Studios, Genres, Languages rails.
 * Butter-smooth hover: lift + scale + brightness, GPU-only transforms.
 */
import type { CSSProperties } from 'react';

const CARD_BG = '#141014';
const WHITE = '#EDE6E8';
const BORDER = 'rgba(255,255,255,0.05)';
const BORDER_HOVER = 'rgba(255,255,255,0.13)';
const W = 165;
const H = 115;
const R = 14;

const tileBase: CSSProperties = {
  flexShrink: 0,
  position: 'relative',
  width: W,
  height: H,
  borderRadius: R,
  overflow: 'hidden',
  cursor: 'pointer',
  background: CARD_BG,
  border: `1px solid ${BORDER}`,
  padding: 0,
  textAlign: 'left',
  transition: 'transform 0.3s cubic-bezier(.16,1,.3,1), box-shadow 0.3s cubic-bezier(.16,1,.3,1), border-color 0.25s ease',
  willChange: 'transform',
};

function useTileHover() {
  const onMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateY(-5px) scale(1.025)';
    e.currentTarget.style.boxShadow = '0 20px 44px -10px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.10)';
    e.currentTarget.style.borderColor = BORDER_HOVER;
  };
  const onMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = '';
    e.currentTarget.style.boxShadow = '';
    e.currentTarget.style.borderColor = BORDER;
  };
  return { onMouseEnter, onMouseLeave };
}

export function ImgTile({
  label, img, tint, onClick,
}: { label: string; img?: string; tint: string; onClick?: () => void }) {
  const { onMouseEnter, onMouseLeave } = useTileHover();
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={tileBase}
    >
      {img && (
        <img
          src={img} alt={label} loading="lazy" decoding="async"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            filter: 'brightness(0.80) saturate(0.85)',
            transition: 'filter 0.3s ease, transform 0.35s cubic-bezier(.16,1,.3,1)',
          }}
        />
      )}
      <div style={{ position: 'absolute', inset: 0, background: tint }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top,rgba(9,4,10,0.90) 0%,rgba(9,4,10,0.42) 42%,transparent 68%)',
      }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 11px 10px' }}>
        <p style={{
          fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 15,
          color: WHITE, margin: 0, lineHeight: 1.22,
          textShadow: '0 1px 6px rgba(0,0,0,0.7)',
        }}>{label}</p>
      </div>
    </button>
  );
}

export function LogoTile({
  logo, color, onClick,
}: { logo: string; color: string; onClick?: () => void }) {
  const { onMouseEnter, onMouseLeave } = useTileHover();
  const isNetflix = logo === 'NETFLIX';
  const isMubi = logo === 'MUBI';
  const isPrime = logo === 'prime video';
  const isApple = logo === 'Apple TV+';

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ ...tileBase, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at center,${color}18 0%,transparent 68%)`,
        transition: 'opacity 0.3s ease',
      }} />
      <span style={{
        position: 'relative',
        fontFamily: isNetflix || isMubi
          ? "'Montserrat',sans-serif"
          : isApple
          ? "-apple-system,'SF Pro Display',sans-serif"
          : "'Plus Jakarta Sans',sans-serif",
        fontWeight: isPrime ? 400 : 700,
        fontStyle: isPrime ? 'italic' : 'normal',
        fontSize: isNetflix ? 18 : isMubi ? 22 : isPrime ? 13 : isApple ? 14 : 16,
        letterSpacing: isNetflix ? '0.15em' : isMubi ? '0.22em' : '0.02em',
        textTransform: (isNetflix || isMubi ? 'uppercase' : 'none') as CSSProperties['textTransform'],
        color,
        textShadow: `0 0 32px ${color}55`,
      }}>{logo}</span>
    </button>
  );
}

export function TileRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto px-5 pb-1 scrollbar-hide">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            flexShrink: 0, width: W, height: H, borderRadius: R,
            background: 'linear-gradient(120deg, #141014 25%, #1a1620 50%, #141014 75%)',
            backgroundSize: '200% 100%',
            animation: 'glShimmer 1.8s ease-in-out infinite',
            border: `1px solid ${BORDER}`,
          }}
        />
      ))}
    </div>
  );
}
