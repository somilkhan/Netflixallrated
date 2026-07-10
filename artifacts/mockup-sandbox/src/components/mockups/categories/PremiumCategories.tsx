/**
 * PremiumCategories — cinematic category card design for NetflixAllRated.
 * Inspired by bingr.one's image-forward grid with a deep mehroon brand identity.
 *
 * Design concept: "Aperture Marquee"
 * — Full-bleed cinematic image cards with strong bottom gradient overlays,
 *   Cormorant Garamond display labels, and maroon accent glows.
 */
import { ChevronRight, Play } from "lucide-react";

/* ─── Color tokens ─────────────────────────────────────── */
const C = {
  void:        "#0B0407",
  voidMid:     "#130C0F",
  surface:     "#1A1015",
  maroon:      "#8B1A24",
  maroonBrt:   "#C2434F",
  maroonGlow:  "rgba(194,67,79,0.35)",
  ink:         "#F5EEF0",
  inkDim:      "#A898A0",
  inkFaint:    "#5C4A52",
  amber:       "#E6A817",
};

/* ─── Data ─────────────────────────────────────────────── */
// TMDB backdrop images (public CDN, CORS-safe)
const TMDB = "https://image.tmdb.org/t/p/w780";
// Local generated images — served under the sandbox base path
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const TYPES = [
  {
    label: "Movies",
    tag: "12,345 titles",
    img: `${TMDB}/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg`,   // Dune 2
    accent: "#7B6BCC",
  },
  {
    label: "TV Shows",
    tag: "34 titles",
    img: `${TMDB}/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg`,   // The Last of Us
    accent: "#4DA87C",
  },
  {
    label: "Anime",
    tag: "20 titles",
    img: `${TMDB}/suopoADq0k8YZr4dQXcU6pToj6s.jpg`,   // Demon Slayer
    accent: "#C2434F",
  },
];

const PLATFORMS = [
  { label: "Netflix",      color: "#E50914", bg: "#141414", logo: "NETFLIX" },
  { label: "Prime Video",  color: "#00A8E1", bg: "#0F1111", logo: "prime video" },
  { label: "Hotstar",      color: "#1A6CF2", bg: "#0C1324", logo: "hotstar" },
  { label: "Crunchyroll",  color: "#F47521", bg: "#0D0D0D", logo: "crunchyroll" },
  { label: "Apple TV+",    color: "#F5F5F7", bg: "#1D1D1F", logo: "Apple TV+" },
  { label: "MUBI",         color: "#E8C080", bg: "#12100E", logo: "MUBI" },
];

const GENRES = [
  {
    label: "Action",
    img: `${TMDB}/or06FN3Dka5tukK1e9sl16pB3iy.jpg`,   // Avengers: Endgame
    accent: "#E63946",
  },
  {
    label: "Drama",
    img: `${TMDB}/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg`,   // Oppenheimer
    accent: "#F4A261",
  },
  {
    label: "Horror",
    img: `${BASE}/images/genre-horror_2.jpg`,
    accent: "#9B2226",
  },
  {
    label: "Sci-Fi",
    img: `${TMDB}/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg`,   // Interstellar
    accent: "#4361EE",
  },
  {
    label: "Romance",
    img: `${BASE}/images/genre-romance_2.jpg`,
    accent: "#E07A5F",
  },
  {
    label: "Thriller",
    img: `${BASE}/images/genre-thriller_2.jpg`,
    accent: "#2B9348",
  },
  {
    label: "Comedy",
    img: `${BASE}/images/genre-comedy_2.jpg`,
    accent: "#FFBE0B",
  },
  {
    label: "Animation",
    img: `${TMDB}/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg`,   // Spider-Man: Into the Spider-Verse
    accent: "#8338EC",
  },
];

/* ─── Sub-components ───────────────────────────────────── */

/** Full-bleed image card — used for type & genre rows */
function CinemaCard({
  img, label, tag, accent, wide,
}: {
  img: string;
  label: string;
  tag?: string;
  accent?: string;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        position: "relative",
        width: wide ? 200 : 148,
        height: wide ? 112 : 92,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
        cursor: "pointer",
        boxShadow: accent
          ? `0 4px 24px -8px ${accent}55, 0 2px 8px rgba(0,0,0,0.5)`
          : "0 2px 12px rgba(0,0,0,0.5)",
      }}
    >
      {/* Backdrop image */}
      <img
        src={img}
        alt={label}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />

      {/* Cinematic gradient overlay — heavy at bottom, clear at top */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(11,4,7,0.97) 0%, rgba(11,4,7,0.55) 45%, rgba(11,4,7,0.12) 75%, transparent 100%)",
        }}
      />

      {/* Subtle left-edge accent vignette */}
      {accent && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(115deg, ${accent}22 0%, transparent 50%)`,
          }}
        />
      )}

      {/* Noise grain texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
          opacity: 0.6,
          mixBlendMode: "overlay" as const,
          pointerEvents: "none",
        }}
      />

      {/* Label */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "8px 10px 9px",
        }}
      >
        <p
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 600,
            fontSize: wide ? 17 : 15,
            lineHeight: 1.1,
            color: C.ink,
            margin: 0,
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </p>
        {tag && (
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8,
              color: C.inkDim,
              margin: "2px 0 0",
              letterSpacing: "0.05em",
            }}
          >
            {tag}
          </p>
        )}
      </div>

      {/* Hover-state maroon glow ring (always-on at 30% for static mockup) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 15,
          boxShadow: `inset 0 0 0 1px rgba(194,67,79,0.25)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

/** Platform card — logo on dark gradient, no background image */
function PlatformCard({
  label, color, bg, logo,
}: {
  label: string;
  color: string;
  bg: string;
  logo: string;
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        position: "relative",
        width: 148,
        height: 72,
        borderRadius: 16,
        overflow: "hidden",
        background: bg,
        border: `1px solid ${color}30`,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 4px 20px -8px ${color}44, 0 2px 8px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Subtle radial glow behind logo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${color}18 0%, transparent 70%)`,
        }}
      />

      {/* Logo text */}
      <span
        style={{
          position: "relative",
          fontFamily:
            logo === "NETFLIX" || logo === "MUBI"
              ? "'Montserrat', sans-serif"
              : logo === "Apple TV+"
              ? "-apple-system, 'SF Pro Display', sans-serif"
              : "'Plus Jakarta Sans', sans-serif",
          fontWeight: logo === "prime video" ? 400 : 700,
          fontSize:
            logo === "NETFLIX" ? 18
            : logo === "prime video" ? 13
            : logo === "hotstar" ? 16
            : logo === "crunchyroll" ? 13
            : logo === "Apple TV+" ? 14
            : 20,
          letterSpacing:
            logo === "NETFLIX" ? "0.12em"
            : logo === "MUBI" ? "0.18em"
            : "0.02em",
          color,
          textShadow: `0 0 20px ${color}66`,
          textTransform: logo === "NETFLIX" || logo === "MUBI" ? "uppercase" : "none",
          fontStyle: logo === "prime video" ? "italic" : "normal",
        }}
      >
        {logo}
      </span>

      {/* Bottom edge shine */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(to right, transparent, ${color}55, transparent)`,
        }}
      />
    </div>
  );
}

/** Section header */
function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        padding: "0 20px",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Maroon accent line */}
        <div
          style={{
            width: 3,
            height: 18,
            borderRadius: 2,
            background: `linear-gradient(to bottom, ${C.maroonBrt}, ${C.maroon})`,
            flexShrink: 0,
          }}
        />
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 600,
            fontSize: 22,
            color: C.ink,
            margin: 0,
            letterSpacing: "0.01em",
            lineHeight: 1,
          }}
        >
          {title}
        </h2>
        {count !== undefined && (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              color: C.inkFaint,
              letterSpacing: "0.06em",
              marginLeft: 2,
            }}
          >
            {count}
          </span>
        )}
      </div>
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 500,
          color: C.maroonBrt,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          letterSpacing: "0.02em",
        }}
      >
        View All
        <ChevronRight size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/** Horizontal scroll row */
function ScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        overflowX: "auto",
        paddingLeft: 20,
        paddingRight: 20,
        display: "flex",
        gap: 10,
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Main export ──────────────────────────────────────── */

export function PremiumCategories() {
  return (
    <div
      style={{
        width: 390,
        minHeight: "100vh",
        background: C.void,
        fontFamily: "'Inter', sans-serif",
        overflowX: "hidden",
        paddingBottom: 100,
      }}
    >
      {/* ── Page header ─────────────────────────────────── */}
      <div style={{ padding: "28px 20px 20px" }}>
        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 28,
              height: 1,
              background: `linear-gradient(to right, ${C.maroonBrt}, transparent)`,
            }}
          />
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              color: C.maroonBrt,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            The Catalog
          </span>
        </div>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 600,
            fontSize: 36,
            color: C.ink,
            margin: 0,
            lineHeight: 1,
            letterSpacing: "-0.01em",
          }}
        >
          Browse Everything
        </h1>
      </div>

      {/* ── Browse by Type ──────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <SectionHeader title="Browse by Type" count={3} />
        <ScrollRow>
          {TYPES.map((t) => (
            <CinemaCard key={t.label} img={t.img} label={t.label} tag={t.tag} accent={t.accent} wide />
          ))}
        </ScrollRow>
      </div>

      {/* ── Browse by Platform ──────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <SectionHeader title="Browse by Platform" count={6} />
        <ScrollRow>
          {PLATFORMS.map((p) => (
            <PlatformCard key={p.label} {...p} />
          ))}
        </ScrollRow>
      </div>

      {/* ── Browse by Genre ─────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <SectionHeader title="Browse by Genre" />

        {/* Genre search bar */}
        <div style={{ padding: "0 20px 14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: C.voidMid,
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: "9px 14px",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.inkFaint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                color: C.inkFaint,
                letterSpacing: "0.01em",
              }}
            >
              Search genres…
            </span>
          </div>
        </div>

        {/* Genre grid — 2 cards per row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            padding: "0 20px",
          }}
        >
          {GENRES.map((g) => (
            <GenreCard key={g.label} img={g.img} label={g.label} accent={g.accent} />
          ))}
        </div>
      </div>

      {/* ── Where to Watch teaser ───────────────────────── */}
      <div style={{ padding: "0 20px" }}>
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.07)",
            background: C.voidMid,
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 600,
                fontSize: 18,
                color: C.ink,
                margin: 0,
              }}
            >
              Where to Watch
            </p>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                color: C.inkDim,
                margin: "3px 0 0",
              }}
            >
              Browse by streaming platform
            </p>
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.maroon}, ${C.maroonBrt})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 16px -4px ${C.maroonGlow}`,
            }}
          >
            <Play size={15} fill={C.ink} stroke="none" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Genre card — taller, 2-per-row grid layout */
function GenreCard({ img, label, accent }: { img: string; label: string; accent?: string }) {
  return (
    <div
      style={{
        position: "relative",
        height: 96,
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
        cursor: "pointer",
        boxShadow: accent
          ? `0 3px 18px -6px ${accent}55, 0 2px 6px rgba(0,0,0,0.5)`
          : "0 2px 10px rgba(0,0,0,0.5)",
      }}
    >
      {/* Image */}
      <img
        src={img}
        alt={label}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
        }}
      />

      {/* Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(11,4,7,0.95) 0%, rgba(11,4,7,0.5) 50%, rgba(11,4,7,0.08) 100%)",
        }}
      />

      {/* Accent left vignette */}
      {accent && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(110deg, ${accent}28 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Bottom accent line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: accent
            ? `linear-gradient(to right, ${accent}CC 0%, ${accent}44 60%, transparent 100%)`
            : `linear-gradient(to right, ${C.maroon}99, transparent)`,
        }}
      />

      {/* Label */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 10px 9px" }}>
        <p
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 600,
            fontSize: 15,
            color: C.ink,
            margin: 0,
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
