/**
 * PremiumCategories — 1:1 bingr.one layout with Aperture Star maroon theme.
 *
 * Layout rules (measured from bingr reference):
 *  - Section title: Inter 20px bold white, plain case
 *  - "View All >": Inter 13px, right-aligned, maroon
 *  - Cards: 165 × 106px landscape, 12px radius, 2 visible + peek of 3rd
 *  - Image overlay: only a bottom-to-transparent gradient, images clearly visible
 *  - Label: Inter 15px semibold white, bottom-left
 *  - Sub-label: Inter 11px, dimmed, below label
 *  - Platform cards: same dimensions, dark bg, logo centred, no image
 *  - Section gap: 32px
 */
import { ChevronRight } from "lucide-react";

/* ─── Brand tokens ───────────────────────────────────────── */
const B = {
  bg:        "#0A0407",       // almost-black, slightly warmer than bingr
  card:      "#141010",       // card dark bg (platforms)
  maroon:    "#C2434F",       // primary accent
  maroonDim: "#8B1A24",
  white:     "#F0E8EA",
  dim:       "#7A6870",
  faint:     "#2E2228",
};

/* ─── Data ───────────────────────────────────────────────── */
const TMDB = "https://image.tmdb.org/t/p/w780";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const TYPES: CardItem[] = [
  { label: "Movies",   sub: "12,345 titles", img: `${TMDB}/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg` },
  { label: "TV Shows", sub: "34 titles",     img: `${TMDB}/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg` },
  { label: "Anime",    sub: "20 titles",     img: `${TMDB}/suopoADq0k8YZr4dQXcU6pToj6s.jpg` },
];

const GENRES: CardItem[] = [
  { label: "Action",    img: `${TMDB}/or06FN3Dka5tukK1e9sl16pB3iy.jpg` },
  { label: "Drama",     img: `${TMDB}/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg` },
  { label: "Horror",    img: `${BASE}/images/genre-horror_2.jpg`        },
  { label: "Sci-Fi",   img: `${TMDB}/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg` },
  { label: "Romance",   img: `${BASE}/images/genre-romance_2.jpg`       },
  { label: "Thriller",  img: `${BASE}/images/genre-thriller_2.jpg`      },
  { label: "Comedy",    img: `${BASE}/images/genre-comedy_2.jpg`        },
  { label: "Animation", img: `${TMDB}/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg` },
];

interface LogoItem { label: string; color: string; logo: string }
const PLATFORMS: LogoItem[] = [
  { label: "Netflix",     color: "#E50914", logo: "NETFLIX"     },
  { label: "Prime Video", color: "#00A8E1", logo: "prime video" },
  { label: "Hotstar",     color: "#1A6CF2", logo: "hotstar"     },
  { label: "Crunchyroll", color: "#F47521", logo: "crunchyroll" },
  { label: "Apple TV+",   color: "#F0F0F2", logo: "Apple TV+"  },
  { label: "MUBI",        color: "#D4A84B", logo: "MUBI"        },
];

/* ─── Shared types ───────────────────────────────────────── */
interface CardItem { label: string; sub?: string; img: string }

/* ─── Card dimensions (same across all image rows) ────────
   390px viewport, 16px left pad, 10px gap:
   2 × 165 + 10 + 16 = 356 → 34px peek of 3rd card          */
const CARD_W = 165;
const CARD_H = 106;
const RADIUS = 12;

/* ─── Sub-components ─────────────────────────────────────── */

/** Section header row — big bold title + "View All >" */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        marginBottom: 12,
      }}>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: B.white,
          letterSpacing: "-0.01em",
        }}>{title}</span>
        <button style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: 13,
          color: B.maroon,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}>
          View All <ChevronRight size={13} strokeWidth={2.5} />
        </button>
      </div>
      {children}
    </div>
  );
}

/** Horizontal scroll row — left-padded, no scrollbar */
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex",
      overflowX: "auto",
      gap: 10,
      paddingLeft: 16,
      paddingRight: 16,
      scrollbarWidth: "none",
    }}>
      {children}
    </div>
  );
}

/** Image card — matches bingr genre/type card exactly */
function ImgCard({ label, sub, img }: CardItem) {
  return (
    <div style={{
      flexShrink: 0,
      position: "relative",
      width: CARD_W,
      height: CARD_H,
      borderRadius: RADIUS,
      overflow: "hidden",
      cursor: "pointer",
      backgroundColor: B.card,
    }}>
      {/* Image — brightness kept high so it's clearly visible like bingr */}
      <img
        src={img}
        alt={label}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          filter: "brightness(0.85)",
        }}
      />

      {/* Bottom fade only — same subtle dissolve as bingr */}
      <div style={{
        position: "absolute", inset: 0,
        background:
          "linear-gradient(to top, rgba(10,4,7,0.90) 0%, rgba(10,4,7,0.40) 45%, transparent 75%)",
      }} />

      {/* Text */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        padding: "0 10px 9px",
      }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: 15,
          color: B.white,
          margin: 0,
          lineHeight: 1.2,
          textShadow: "0 1px 3px rgba(0,0,0,0.7)",
        }}>{label}</p>
        {sub && (
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: 10,
            color: B.dim,
            margin: "1px 0 0",
            letterSpacing: "0.01em",
          }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

/** Platform / logo card — dark bg, centred logo text, no image */
function LogoCard({ label, color, logo }: LogoItem) {
  const isNetflix     = logo === "NETFLIX";
  const isMubi        = logo === "MUBI";
  const isPrime       = logo === "prime video";
  const isApple       = logo === "Apple TV+";

  return (
    <div style={{
      flexShrink: 0,
      position: "relative",
      width: CARD_W,
      height: CARD_H,
      borderRadius: RADIUS,
      overflow: "hidden",
      cursor: "pointer",
      background: B.card,
      border: `1px solid ${B.faint}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {/* Very faint brand glow behind logo */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at center, ${color}14 0%, transparent 65%)`,
      }} />
      <span style={{
        position: "relative",
        fontFamily:
          isNetflix || isMubi   ? "'Montserrat', sans-serif"
          : isApple             ? "-apple-system, 'SF Pro Display', sans-serif"
          : isPrime             ? "'Plus Jakarta Sans', sans-serif"
          :                       "'Plus Jakarta Sans', sans-serif",
        fontWeight: isPrime ? 400 : 700,
        fontStyle:  isPrime ? "italic" : "normal",
        fontSize:
          isNetflix  ? 18
          : isMubi   ? 22
          : isPrime  ? 13
          : isApple  ? 15
          :             16,
        letterSpacing:
          isNetflix  ? "0.15em"
          : isMubi   ? "0.22em"
          :             "0.02em",
        color,
        textTransform: isNetflix || isMubi ? "uppercase" : "none",
        textShadow: `0 0 24px ${color}44`,
      }}>{logo}</span>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export function PremiumCategories() {
  return (
    <div style={{
      width: 390,
      minHeight: "100vh",
      background: B.bg,
      fontFamily: "'Inter', sans-serif",
      overflowX: "hidden",
      paddingBottom: 120,
    }}>

      {/* ── Page header ── */}
      <div style={{ padding: "32px 16px 28px" }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: 10,
          letterSpacing: "0.11em",
          textTransform: "uppercase",
          color: B.maroon,
          margin: "0 0 5px",
        }}>The Catalog</p>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 600,
          fontSize: 30,
          color: B.white,
          margin: 0,
          lineHeight: 1,
          letterSpacing: "-0.01em",
        }}>Browse Everything</h1>
      </div>

      {/* ── Browse by Type ── */}
      <Section title="Browse by Type">
        <Row>
          {TYPES.map(t => <ImgCard key={t.label} {...t} />)}
        </Row>
      </Section>

      {/* ── Browse by Genre ── */}
      <Section title="Browse by Genre">
        <Row>
          {GENRES.map(g => <ImgCard key={g.label} {...g} />)}
        </Row>
      </Section>

      {/* ── Browse by Platform ── */}
      <Section title="Browse by Platform">
        <Row>
          {PLATFORMS.map(p => <LogoCard key={p.label} {...p} />)}
        </Row>
      </Section>

      {/* ── Thin maroon rule ── */}
      <div style={{
        margin: "0 16px 28px",
        height: 1,
        background: `linear-gradient(to right, ${B.maroon}60, transparent)`,
      }} />

      {/* ── Where to Watch ── */}
      <div style={{ padding: "0 16px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 14,
          border: `1px solid ${B.faint}`,
          background: B.card,
          padding: "16px 18px",
        }}>
          <div>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              color: B.white,
              margin: 0,
            }}>Where to Watch</p>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              color: B.dim,
              margin: "3px 0 0",
            }}>Filter by streaming platform</p>
          </div>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${B.maroonDim}, ${B.maroon})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <ChevronRight size={16} color={B.white} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  );
}
