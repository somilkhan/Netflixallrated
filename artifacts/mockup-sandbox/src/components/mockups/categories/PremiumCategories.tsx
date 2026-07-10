/**
 * PremiumCategories — Aperture Star brand.
 * Design: "Dissolved Marquee" — images fade cleanly into the void background,
 * minimal overlays, tight type, all genre/type rows are horizontal sliders.
 */
import { ChevronRight } from "lucide-react";

/* ─── Tokens ────────────────────────────────────────────── */
const C = {
  void:      "#0B0407",
  voidMid:   "#110B0E",
  maroon:    "#8B1A24",
  maroonBrt: "#C2434F",
  ink:       "#EDE6E8",
  inkDim:    "#8A7880",
  inkFaint:  "#3D2F34",
};

/* ─── Data ──────────────────────────────────────────────── */
const TMDB = "https://image.tmdb.org/t/p/w780";
const BASE  = import.meta.env.BASE_URL.replace(/\/$/, "");

const TYPES = [
  { label: "Movies",   sub: "12,345 titles", img: `${TMDB}/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg`, accent: "#7B6BCC" },
  { label: "TV Shows", sub: "34 titles",     img: `${TMDB}/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg`, accent: "#4DA87C" },
  { label: "Anime",    sub: "20 titles",     img: `${TMDB}/suopoADq0k8YZr4dQXcU6pToj6s.jpg`, accent: "#C2434F" },
];

const PLATFORMS = [
  { label: "Netflix",     color: "#E50914", bg: "#141414", logo: "NETFLIX"     },
  { label: "Prime Video", color: "#00A8E1", bg: "#0F1111", logo: "prime video" },
  { label: "Hotstar",     color: "#1A6CF2", bg: "#0C1324", logo: "hotstar"     },
  { label: "Crunchyroll", color: "#F47521", bg: "#0D0D0D", logo: "crunchyroll" },
  { label: "Apple TV+",   color: "#F0F0F2", bg: "#1D1D1F", logo: "Apple TV+"  },
  { label: "MUBI",        color: "#D4A84B", bg: "#12100E", logo: "MUBI"        },
];

const GENRES = [
  { label: "Action",    img: `${TMDB}/or06FN3Dka5tukK1e9sl16pB3iy.jpg`  },
  { label: "Drama",     img: `${TMDB}/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg`  },
  { label: "Horror",    img: `${BASE}/images/genre-horror_2.jpg`         },
  { label: "Sci-Fi",    img: `${TMDB}/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg`  },
  { label: "Romance",   img: `${BASE}/images/genre-romance_2.jpg`        },
  { label: "Thriller",  img: `${BASE}/images/genre-thriller_2.jpg`       },
  { label: "Comedy",    img: `${BASE}/images/genre-comedy_2.jpg`         },
  { label: "Animation", img: `${TMDB}/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg`  },
];

/* ─── Shared fade overlay ────────────────────────────────
   Bingr-style: smooth, long dissolve from opaque-void at bottom
   to fully transparent at top. No tint, no left vignette.        */
const FADE_GRADIENT =
  "linear-gradient(to top, rgba(11,4,7,1) 0%, rgba(11,4,7,0.72) 30%, rgba(11,4,7,0.28) 65%, transparent 100%)";

/* ─── Helpers ───────────────────────────────────────────── */

/** Shared scroll row */
function Row({ children, gap = 10, pl = 20 }: { children: React.ReactNode; gap?: number; pl?: number }) {
  return (
    <div style={{
      display: "flex",
      overflowX: "auto",
      gap,
      paddingLeft: pl,
      paddingRight: 20,
      scrollbarWidth: "none",
      WebkitOverflowScrolling: "touch",
    }}>
      {children}
    </div>
  );
}

/** Section label + "See all" link */
function Label({ title }: { title: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      marginBottom: 10,
    }}>
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        fontSize: 12,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: C.inkDim,
      }}>
        {title}
      </span>
      <button style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        fontSize: 11,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 400,
        color: C.maroonBrt,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        letterSpacing: "0.01em",
      }}>
        See all <ChevronRight size={11} strokeWidth={2} />
      </button>
    </div>
  );
}

/* ─── Card components ───────────────────────────────────── */

/** Type card — wide, used in "Browse by Type" */
function TypeCard({ img, label, sub }: { img: string; label: string; sub: string }) {
  return (
    <div style={{
      flexShrink: 0,
      position: "relative",
      width: 188,
      height: 108,
      borderRadius: 12,
      overflow: "hidden",
      cursor: "pointer",
      border: "1px solid rgba(255,255,255,0.05)",
    }}>
      <img
        src={img}
        alt={label}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          /* slightly desaturate so images feel cooler/darker */
          filter: "saturate(0.75) brightness(0.72)",
        }}
      />
      {/* Clean bottom fade */}
      <div style={{ position: "absolute", inset: 0, background: FADE_GRADIENT }} />

      {/* Label block */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 10px" }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 600,
          fontSize: 16,
          color: C.ink,
          margin: 0,
          lineHeight: 1.1,
          letterSpacing: "0.01em",
        }}>{label}</p>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 9,
          color: C.inkDim,
          margin: "2px 0 0",
          letterSpacing: "0.04em",
        }}>{sub}</p>
      </div>
    </div>
  );
}

/** Genre card — slider item */
function GenreCard({ img, label }: { img: string; label: string }) {
  return (
    <div style={{
      flexShrink: 0,
      position: "relative",
      width: 148,
      height: 180,
      borderRadius: 12,
      overflow: "hidden",
      cursor: "pointer",
      border: "1px solid rgba(255,255,255,0.05)",
    }}>
      <img
        src={img}
        alt={label}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          filter: "saturate(0.65) brightness(0.62)",
        }}
      />
      {/* Dissolve fade — stronger for genre cards so they feel very dark/minimal */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(11,4,7,1) 0%, rgba(11,4,7,0.78) 38%, rgba(11,4,7,0.32) 68%, transparent 100%)",
      }} />

      {/* Bottom label */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 10px 10px" }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 600,
          fontSize: 15,
          color: C.ink,
          margin: 0,
          letterSpacing: "0.01em",
          lineHeight: 1,
        }}>{label}</p>
      </div>
    </div>
  );
}

/** Platform logo card */
function PlatformCard({ label, color, bg, logo }: { label: string; color: string; bg: string; logo: string }) {
  return (
    <div style={{
      flexShrink: 0,
      position: "relative",
      width: 128,
      height: 62,
      borderRadius: 10,
      overflow: "hidden",
      background: bg,
      border: "1px solid rgba(255,255,255,0.04)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {/* Very faint inner radial */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at center, ${color}12 0%, transparent 70%)`,
      }} />
      <span style={{
        position: "relative",
        fontFamily:
          logo === "NETFLIX" || logo === "MUBI" ? "'Montserrat', sans-serif"
          : logo === "Apple TV+" ? "-apple-system, 'SF Pro Display', sans-serif"
          : "'Plus Jakarta Sans', sans-serif",
        fontWeight: logo === "prime video" ? 400 : 700,
        fontStyle: logo === "prime video" ? "italic" : "normal",
        fontSize:
          logo === "NETFLIX" ? 15
          : logo === "prime video" ? 12
          : logo === "hotstar" ? 14
          : logo === "crunchyroll" ? 12
          : logo === "Apple TV+" ? 13
          : 17,
        letterSpacing:
          logo === "NETFLIX" ? "0.14em"
          : logo === "MUBI" ? "0.2em"
          : "0.02em",
        color,
        textTransform: logo === "NETFLIX" || logo === "MUBI" ? "uppercase" : "none",
      }}>{logo}</span>
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────── */

export function PremiumCategories() {
  return (
    <div style={{
      width: 390,
      minHeight: "100vh",
      background: C.void,
      fontFamily: "'Inter', sans-serif",
      overflowX: "hidden",
      paddingBottom: 100,
    }}>

      {/* ── Page header ─── */}
      <div style={{ padding: "32px 20px 24px" }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: C.maroonBrt,
          margin: "0 0 6px",
        }}>The Catalog</p>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 600,
          fontSize: 28,
          color: C.ink,
          margin: 0,
          lineHeight: 1,
          letterSpacing: "-0.01em",
        }}>Browse Everything</h1>
      </div>

      {/* ── Browse by Type ─── */}
      <div style={{ marginBottom: 28 }}>
        <Label title="Browse by Type" />
        <Row>
          {TYPES.map(t => <TypeCard key={t.label} {...t} />)}
        </Row>
      </div>

      {/* ── Browse by Genre — horizontal slider ─── */}
      <div style={{ marginBottom: 28 }}>
        <Label title="Browse by Genre" />
        <Row gap={8}>
          {GENRES.map(g => <GenreCard key={g.label} {...g} />)}
        </Row>
      </div>

      {/* ── Browse by Platform ─── */}
      <div style={{ marginBottom: 28 }}>
        <Label title="Browse by Platform" />
        <Row gap={8}>
          {PLATFORMS.map(p => <PlatformCard key={p.label} {...p} />)}
        </Row>
      </div>

      {/* ── Thin divider ─── */}
      <div style={{
        margin: "0 20px 24px",
        height: 1,
        background: `linear-gradient(to right, ${C.maroon}55, transparent)`,
      }} />

      {/* ── Where to Watch panel ─── */}
      <div style={{ padding: "0 20px" }}>
        <div style={{
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.05)",
          background: C.voidMid,
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 600,
              fontSize: 16,
              color: C.ink,
              margin: 0,
              letterSpacing: "0.01em",
            }}>Where to Watch</p>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 10,
              color: C.inkDim,
              margin: "3px 0 0",
              letterSpacing: "0.01em",
            }}>Filter by streaming platform</p>
          </div>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.maroon}, ${C.maroonBrt})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <ChevronRight size={15} color={C.ink} strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
