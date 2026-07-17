import { useState, useMemo, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, X } from "lucide-react";
import { api } from "../lib/api";
import { slugify } from "../lib/slug";
import GlassCard from "../components/GlassCard";

/* ─── Types ──────────────────────────────────────────────── */
type CategoryItem = {
  slug: string;
  label: string;
  tag?: string;
  image?: string;
  imageFit?: "contain" | "cover";
};
type PosterItem = {
  key: string;
  name: string;
  posterUrl: string | null;
  year: number | null;
  tmdbId?: number;
  mediaType?: string;
};
type Expanded = "type" | "genre" | "studio" | null;

/* ─── Static maps ────────────────────────────────────────── */
const TYPE_LABEL: Record<string, string> = { MOVIE: "Movies", SERIES: "TV Shows", ANIME: "Anime" };
const TYPE_SLUG:  Record<string, string> = { MOVIE: "movies", SERIES: "tv-shows", ANIME: "anime" };

const TMDB = "https://image.tmdb.org/t/p/w780";

// Tint colors + backdrop images per genre (tint at 60% opacity — bingr style)
const GENRE_VISUAL: Record<string, { img?: string; tint: string }> = {
  "Action":    { img: `${TMDB}/or06FN3Dka5tukK1e9sl16pB3iy.jpg`, tint: "rgba(200,50,40,0.60)"  },
  "Drama":     { img: `${TMDB}/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg`, tint: "rgba(180,110,30,0.60)" },
  "Horror":    { img: `${TMDB}/6MKr3KgBuTfMVuar57mJQEcIx8x.jpg`, tint: "rgba(80,10,10,0.60)"   },
  "Sci-Fi":    { img: `${TMDB}/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg`, tint: "rgba(30,80,200,0.60)"  },
  "Science Fiction": { img: `${TMDB}/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg`, tint: "rgba(30,80,200,0.60)" },
  "Romance":   { img: `${TMDB}/1MGABCxFbGuQSHRmqST7gBJMnSN.jpg`, tint: "rgba(190,80,80,0.60)"  },
  "Thriller":  { img: `${TMDB}/or06FN3Dka5tukK1e9sl16pB3iy.jpg`, tint: "rgba(20,80,50,0.60)"   },
  "Comedy":    { img: `${TMDB}/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg`, tint: "rgba(180,150,0,0.60)"  },
  "Animation": { img: `${TMDB}/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg`, tint: "rgba(110,40,200,0.60)" },
  "Crime":     { tint: "rgba(60,60,60,0.60)" },
  "Fantasy":   { tint: "rgba(60,20,140,0.60)" },
  "Adventure": { tint: "rgba(20,120,80,0.60)" },
  "Mystery":   { tint: "rgba(40,20,80,0.60)" },
  "Documentary": { tint: "rgba(20,60,100,0.60)" },
  "Family":    { tint: "rgba(140,100,20,0.60)" },
  "Music":     { tint: "rgba(180,40,140,0.60)" },
  "War":       { tint: "rgba(80,60,20,0.60)" },
  "Western":   { tint: "rgba(160,80,10,0.60)" },
  "History":   { tint: "rgba(120,80,20,0.60)" },
};

// Tint + backdrop for type cards
const TYPE_VISUAL: Record<string, { img: string; tint: string }> = {
  movies:    { img: `${TMDB}/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg`, tint: "rgba(100,70,200,0.60)" },
  "tv-shows":{ img: `${TMDB}/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg`, tint: "rgba(40,140,100,0.60)" },
  anime:     { img: `${TMDB}/suopoADq0k8YZr4dQXcU6pToj6s.jpg`, tint: "rgba(190,50,60,0.60)"  },
};

// Known platform logo styling
const PLATFORM_LOGO: Record<string, { logo: string; color: string }> = {
  netflix:       { logo: "NETFLIX",     color: "#E50914" },
  "prime-video": { logo: "prime video", color: "#00A8E1" },
  hotstar:       { logo: "hotstar",     color: "#1A6CF2" },
  crunchyroll:   { logo: "crunchyroll", color: "#F47521" },
  "apple-tv":    { logo: "Apple TV+",   color: "#F0F0F2" },
  mubi:          { logo: "MUBI",        color: "#D4A84B" },
};

// Static Era row
const ERAS = [
  { label: "Classics", sub: "Pre-2000", img: `${TMDB}/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg`, tint: "rgba(120,80,20,0.60)"  },
  { label: "90s",      sub: "1990–99",  img: `${TMDB}/or06FN3Dka5tukK1e9sl16pB3iy.jpg`, tint: "rgba(160,90,20,0.60)"  },
  { label: "2000s",    sub: "2000–09",  img: `${TMDB}/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg`, tint: "rgba(40,100,160,0.60)" },
  { label: "2010s",    sub: "2010–19",  img: `${TMDB}/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg`, tint: "rgba(30,120,80,0.60)"  },
  { label: "2020s",    sub: "2020–Now", img: `${TMDB}/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg`, tint: "rgba(70,40,180,0.60)"  },
];

// Static Mood row (gradient-only cards, like bingr's "Sparks")
const MOODS = [
  { label: "Dark & Gritty",  slug: "thriller", grad: "linear-gradient(135deg,#1a0a0a 0%,#3a1010 50%,#200808 100%)" },
  { label: "Feel-Good",      slug: "comedy",   grad: "linear-gradient(135deg,#0d2010 0%,#1a4a20 50%,#0a2510 100%)" },
  { label: "Mind-Bending",   slug: "sci-fi",   grad: "linear-gradient(135deg,#0d0a20 0%,#2a1060 50%,#150830 100%)" },
  { label: "Heartwarming",   slug: "romance",  grad: "linear-gradient(135deg,#200a0a 0%,#4a1520 50%,#280a10 100%)" },
  { label: "Adrenaline",     slug: "action",   grad: "linear-gradient(135deg,#1a0a00 0%,#3a1a00 50%,#200800 100%)" },
];

/* ─── Design tokens (inline — Tailwind can't handle dynamic tints) ── */
const BG      = "#09040A";
const CARD_BG = "#141014";
const MAROON  = "#C2434F";
const DIM_RED = "#8B1A24";
const WHITE   = "#EDE6E8";
const DIM     = "#6E6070";
const BORDER  = "rgba(255,255,255,0.045)";
const W = 165;   // card width
const H = 115;   // card height
const R = 13;    // border-radius

/* ─── Skeleton ───────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div style={{
      flexShrink: 0, width: W, height: H, borderRadius: R,
      background: CARD_BG, border: `1px solid ${BORDER}`,
      animation: "pulse 1.5s ease-in-out infinite",
    }} />
  );
}

/* ─── Image card ─────────────────────────────────────────── */
function ImgCard({
  label, sub, img, tint, onClick,
}: {
  label: string; sub?: string; img?: string; tint: string;
  onClick?: () => void;
}) {
  // Track load failure separately so we always reflect the current `img` prop.
  const [imgError, setImgError] = useState(false);
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, position: "relative",
        width: W, height: H, borderRadius: R,
        overflow: "hidden", cursor: "pointer",
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        padding: 0, textAlign: "left",
      }}
    >
      {/* Image */}
      {img && !imgError && (
        <img
          src={img} alt={label}
          loading="lazy" decoding="async"
          onError={() => setImgError(true)}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            filter: "brightness(0.82) saturate(0.88)",
          }}
        />
      )}

      {/* Bingr-style colored tint */}
      <div style={{ position: "absolute", inset: 0, background: tint }} />

      {/* Bottom fade for text readability */}
      <div style={{
        position: "absolute", inset: 0,
        background:
          "linear-gradient(to top,rgba(9,4,10,0.92) 0%,rgba(9,4,10,0.45) 42%,transparent 66%)",
      }} />

      {/* Label */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 10px 9px" }}>
        <p style={{
          fontFamily: "'Inter',sans-serif",
          fontWeight: 700, fontSize: 15,
          color: WHITE, margin: 0, lineHeight: 1.2,
          textShadow: "0 1px 4px rgba(0,0,0,0.6)",
        }}>{label}</p>
        {sub && (
          <p style={{
            fontFamily: "'Inter',sans-serif",
            fontWeight: 400, fontSize: 10,
            color: "rgba(255,255,255,0.50)",
            margin: "1px 0 0",
          }}>{sub}</p>
        )}
      </div>
    </button>
  );
}

/* ─── Platform / logo card ───────────────────────────────── */
function LogoCard({
  color, logo, onClick,
}: {
  label: string; color: string; logo: string; onClick?: () => void;
}) {
  const isNetflix = logo === "NETFLIX", isMubi = logo === "MUBI";
  const isPrime   = logo === "prime video", isApple = logo === "Apple TV+";
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, position: "relative",
        width: W, height: H, borderRadius: R,
        overflow: "hidden", cursor: "pointer",
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 0,
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at center,${color}16 0%,transparent 70%)`,
      }} />
      <span style={{
        position: "relative",
        fontFamily: isNetflix || isMubi
          ? "'Montserrat',sans-serif"
          : isApple
          ? "-apple-system,'SF Pro Display',sans-serif"
          : "'Plus Jakarta Sans',sans-serif",
        fontWeight: isPrime ? 400 : 700,
        fontStyle:  isPrime ? "italic" : "normal",
        fontSize:   isNetflix ? 18 : isMubi ? 22 : isPrime ? 13 : isApple ? 14 : 16,
        letterSpacing: isNetflix ? "0.15em" : isMubi ? "0.22em" : "0.02em",
        textTransform: (isNetflix || isMubi ? "uppercase" : "none") as CSSProperties["textTransform"],
        color,
        textShadow: `0 0 28px ${color}55`,
      }}>{logo}</span>
    </button>
  );
}

/* ─── Mood card (gradient-only, editorial) ───────────────── */
function MoodCard({ label, grad, onClick }: { label: string; grad: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, position: "relative",
        width: W, height: H, borderRadius: R,
        overflow: "hidden", cursor: "pointer",
        background: grad,
        border: `1px solid ${BORDER}`,
        padding: 0, textAlign: "left",
      }}
    >
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 10px 9px" }}>
        <p style={{
          fontFamily: "'Inter',sans-serif",
          fontWeight: 700, fontSize: 15,
          color: WHITE, margin: 0, lineHeight: 1.2,
          textShadow: "0 1px 5px rgba(0,0,0,0.8)",
        }}>{label}</p>
      </div>
    </button>
  );
}

/* ─── Shared scroll row ──────────────────────────────────── */
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", overflowX: "auto", gap: 10,
      paddingLeft: 16, paddingRight: 16,
      scrollbarWidth: "none",
      WebkitOverflowScrolling: "touch",
    } as CSSProperties}>
      {children}
    </div>
  );
}

/* ─── Section header ─────────────────────────────────────── */
function SectionHeader({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px", marginBottom: 11,
    }}>
      <span style={{
        fontFamily: "'Inter',sans-serif",
        fontWeight: 700, fontSize: 19,
        color: WHITE, letterSpacing: "-0.01em",
      }}>{title}</span>
      {onViewAll && (
        <button
          onClick={onViewAll}
          style={{
            display: "flex", alignItems: "center", gap: 2,
            fontFamily: "'Inter',sans-serif",
            fontWeight: 500, fontSize: 13, color: MAROON,
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          View All <ChevronRight size={13} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

/* ─── Expanded grid (full view all) ─────────────────────── */
function ExpandedGrid({ title, items, onBack, onOpen }: {
  title: string; items: CategoryItem[]; onBack: () => void; onOpen: (item: CategoryItem) => void;
}) {
  return (
    <div className="px-4">
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1 text-sm text-white/40 hover:text-white/80 transition-colors duration-200"
      >
        <ChevronRight size={15} className="rotate-180" /> Back
      </button>
      <h2 className="mb-5 font-serif text-3xl font-semibold text-ink">{title}</h2>
      <div className="grid grid-cols-2 gap-3 pb-20">
        {items.map((item, i) => {
          const v = GENRE_VISUAL[item.label];
          return (
            <div key={item.slug} className="animate-fadeUp opacity-0" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
              <ImgCard
                label={item.label}
                sub={item.tag}
                img={v?.img}
                tint={v?.tint ?? "rgba(100,100,100,0.60)"}
                onClick={() => onOpen(item)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Poster row (geo / trending content) ───────────────── */
function PosterRow({ title, items }: { title: string; items: PosterItem[] }) {
  const navigate = useNavigate();
  if (items.length === 0) return null;

  const handleClick = async (item: PosterItem) => {
    if (item.tmdbId && item.mediaType) {
      try {
        const { id } = await api.titles.resolveTmdb(item.tmdbId, item.mediaType === "movie" ? "movie" : "tv");
        navigate(`/title/${id}`);
        return;
      } catch {
        // not in catalog
      }
    }
    navigate(`/search?q=${encodeURIComponent(item.name)}`);
  };

  return (
    <div style={{ marginBottom: 30 }}>
      <SectionHeader title={title} />
      <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none snap-x snap-mandatory">
        {items.map((item, i) => (
          <div key={item.key} className="snap-start animate-fadeUp opacity-0" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
            <GlassCard
              title={item.name}
              year={item.year}
              posterUrl={item.posterUrl}
              onClick={() => handleClick(item)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type GeoRow = { id: string; label: string; items: PosterItem[] };

/* ─── Page ───────────────────────────────────────────────── */
export default function CategoriesPage() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Expanded>(null);
  const [types,    setTypes]    = useState<CategoryItem[]>([]);
  const [genres,   setGenres]   = useState<CategoryItem[]>([]);
  const [studios,  setStudios]  = useState<CategoryItem[]>([]);
  const [geoRows,  setGeoRows]  = useState<GeoRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [genreQuery, setGenreQuery] = useState("");

  useEffect(() => {
    api.titles
      .genres()
      .then(({ genres: g, types: t }: { genres: { genre: string; count: number }[]; types: { type: string; count: number }[] }) => {
        setTypes(
          t.map(({ type, count }) => ({
            slug:  TYPE_SLUG[type]  || slugify(type),
            label: TYPE_LABEL[type] || type,
            tag:   `${count} title${count === 1 ? "" : "s"}`,
          })),
        );
        setGenres(
          g.map(({ genre, count }) => ({
            slug:  slugify(genre),
            label: genre,
            tag:   `${count} title${count === 1 ? "" : "s"}`,
          })),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    Promise.all([
      api.platforms.list().catch(() => []),
      api.titles.watchProvidersList("US").catch(() => []),
    ]).then(([platforms, providers]: [any[], any[]]) => {
      const providerSlugs = new Map<string, any>(
        providers.map((prov: any) => [slugify(prov.name || ""), prov])
      );
      setStudios(
        platforms.map((p) => {
          const slug = slugify(p.name);
          const liveMatch = providerSlugs.get(slug)
            ?? [...providerSlugs.entries()].find(([ps]) => ps.includes(slug) || slug.includes(ps))?.[1];
          return {
            slug,
            label: p.name,
            tag:   `${p._count?.titles ?? 0} title${(p._count?.titles ?? 0) === 1 ? "" : "s"}`,
            image: liveMatch?.logoUrl,
            imageFit: "contain" as const,
          };
        }),
      );
    });

    api.geo
      .detect()
      .then((d: { region?: string }) => api.geo.content(d.region || "US"))
      .then((data: { rows: { id: string; label: string; items: any[] }[] }) => {
        setGeoRows(
          (data.rows || []).map((row) => ({
            id:    row.id,
            label: row.label,
            items: (row.items || []).slice(0, 20).map((it: any) => ({
              key:       `${row.id}-${it.mediaType}-${it.tmdbId}`,
              name:      it.name,
              posterUrl: it.posterUrl,
              year:      it.year,
              tmdbId:    it.tmdbId,
              mediaType: it.mediaType,
            })),
          })),
        );
      })
      .catch(() => {});
  }, []);

  const filteredGenres = useMemo(() => {
    const q = genreQuery.trim().toLowerCase();
    return q ? genres.filter((g) => g.label.toLowerCase().includes(q)) : genres;
  }, [genreQuery, genres]);

  function openItem(item: CategoryItem) {
    if (types.some((t) => t.slug === item.slug)) {
      navigate(`/browse/type/${item.slug}`);
    } else if (studios.some((s) => s.slug === item.slug)) {
      navigate(`/studio/${item.slug}`);
    } else {
      navigate(`/browse/genre/${item.slug}`);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, paddingBottom: 120 }}>

      {/* ── Page header ── */}
      <div style={{ padding: "30px 16px 26px" }}>
        <p style={{
          fontFamily: "'Inter',sans-serif",
          fontWeight: 500, fontSize: 10,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: MAROON, margin: "0 0 5px",
        }}>The Catalog</p>
        <h1 style={{
          fontFamily: "'Cormorant Garamond',Georgia,serif",
          fontWeight: 600, fontSize: 29,
          color: WHITE, margin: 0, lineHeight: 1,
          letterSpacing: "-0.01em",
        }}>Browse Everything</h1>
      </div>

      {/* ── Expanded views ── */}
      {expanded === "type" && (
        <ExpandedGrid title="Browse by Type" items={types} onBack={() => setExpanded(null)} onOpen={openItem} />
      )}
      {expanded === "genre" && (
        <>
          {/* Genre search in expanded view */}
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: CARD_BG, border: `1px solid ${BORDER}`,
              borderRadius: 10, padding: "8px 12px",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={genreQuery}
                onChange={(e) => setGenreQuery(e.target.value)}
                placeholder="Search genres…"
                style={{
                  flex: 1, background: "none", border: "none",
                  fontFamily: "'Inter',sans-serif", fontSize: 13, color: WHITE,
                }}
                className="outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded"
              />
              {genreQuery && (
                <button aria-label="Clear genre search" onClick={() => setGenreQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: DIM, padding: 0 }}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          <ExpandedGrid title="Browse by Genre" items={filteredGenres} onBack={() => setExpanded(null)} onOpen={openItem} />
        </>
      )}
      {expanded === "studio" && (
        <ExpandedGrid title="Browse by Platform" items={studios} onBack={() => setExpanded(null)} onOpen={openItem} />
      )}

      {/* ── Main scroll view ── */}
      {!expanded && (
        <>
          {/* ── Row 1: Browse by Type ── */}
          <div style={{ marginBottom: 30 }}>
            <SectionHeader title="Browse by Type" onViewAll={() => setExpanded("type")} />
            {loading ? (
              <Row>{[0,1,2].map(i => <CardSkeleton key={i} />)}</Row>
            ) : (
              <Row>
                {types.map((t) => {
                  const v = TYPE_VISUAL[t.slug] ?? { img: undefined, tint: "rgba(100,100,100,0.60)" };
                  return (
                    <ImgCard
                      key={t.slug}
                      label={t.label}
                      sub={t.tag}
                      img={v.img}
                      tint={v.tint}
                      onClick={() => openItem(t)}
                    />
                  );
                })}
              </Row>
            )}
          </div>

          {/* ── Row 2: Browse by Genre ── */}
          <div style={{ marginBottom: 30 }}>
            <SectionHeader title="Browse by Genre" onViewAll={() => setExpanded("genre")} />
            {loading ? (
              <Row>{[0,1,2,3].map(i => <CardSkeleton key={i} />)}</Row>
            ) : (
              <Row>
                {genres.map((g) => {
                  const v = GENRE_VISUAL[g.label] ?? { tint: "rgba(100,100,100,0.60)" };
                  return (
                    <ImgCard
                      key={g.slug}
                      label={g.label}
                      sub={g.tag}
                      img={v.img}
                      tint={v.tint}
                      onClick={() => openItem(g)}
                    />
                  );
                })}
              </Row>
            )}
          </div>

          {/* ── Row 3: Browse by Platform ── */}
          <div style={{ marginBottom: 30 }}>
            <SectionHeader title="Browse by Platform" onViewAll={() => setExpanded("studio")} />
            {loading ? (
              <Row>{[0,1,2,3].map(i => <CardSkeleton key={i} />)}</Row>
            ) : (
              <Row>
                {studios.map((s) => {
                  const known = PLATFORM_LOGO[s.slug];
                  if (known) {
                    return (
                      <LogoCard
                        key={s.slug}
                        label={s.label}
                        logo={known.logo}
                        color={known.color}
                        onClick={() => openItem(s)}
                      />
                    );
                  }
                  // Fallback: generic dark card with platform name
                  return (
                    <ImgCard
                      key={s.slug}
                      label={s.label}
                      sub={s.tag}
                      tint="rgba(100,100,100,0.60)"
                      onClick={() => openItem(s)}
                    />
                  );
                })}
              </Row>
            )}
          </div>

          {/* ── Row 4: Browse by Era ── */}
          <div style={{ marginBottom: 30 }}>
            <SectionHeader title="Browse by Era" />
            <Row>
              {ERAS.map((e) => (
                <ImgCard
                  key={e.label}
                  label={e.label}
                  sub={e.sub}
                  img={e.img}
                  tint={e.tint}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(e.sub ?? e.label)}`)}
                />
              ))}
            </Row>
          </div>

          {/* ── Row 5: Browse by Mood ── */}
          <div style={{ marginBottom: 30 }}>
            <SectionHeader title="Browse by Mood" />
            <Row>
              {MOODS.map((m) => (
                <MoodCard
                  key={m.label}
                  label={m.label}
                  grad={m.grad}
                  onClick={() => navigate(`/browse/genre/${m.slug}`)}
                />
              ))}
            </Row>
          </div>

          {/* ── Geo / trending poster rows ── */}
          {geoRows.map((row) => (
            <PosterRow key={row.id} title={row.label} items={row.items} />
          ))}

          {/* ── Maroon rule ── */}
          <div style={{
            margin: "0 16px 26px", height: 1,
            background: `linear-gradient(to right,${MAROON}55,transparent)`,
          }} />

          {/* ── Where to Watch footer ── */}
          <div style={{ padding: "0 16px" }}>
            <button
              onClick={() => setExpanded("studio")}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 14, border: `1px solid ${BORDER}`,
                background: CARD_BG, padding: "15px 16px",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div>
                <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 15, color: WHITE, margin: 0 }}>
                  Where to Watch
                </p>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: DIM, margin: "3px 0 0" }}>
                  Filter by streaming platform
                </p>
              </div>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: `linear-gradient(135deg,${DIM_RED},${MAROON})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <ChevronRight size={16} color={WHITE} strokeWidth={2.5} />
              </div>
            </button>
          </div>
        </>
      )}

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
      `}</style>
    </div>
  );
}
