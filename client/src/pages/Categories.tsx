import { useState, useMemo, useRef, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, X } from "lucide-react";

type CategoryItem = {
  slug: string;
  label: string;
  tag?: string;
  emoji?: string;
  image?: string;
  imageFit?: "contain" | "cover";
};

type Expanded = "type" | "genre" | "studio" | null;

/*
  Allrated — Categories (bingr-style row layout, Allrated theme)

  Theme tokens below are read from the "Rick and Morty" hero screenshot:
  warm near-black background, cream headline text, crimson/red accent,
  serif display font, monospace metadata. If your actual hex values
  differ, only THEME needs editing — every class below reads from it.
*/

const THEME = {
  bg: "#0b0a09",
  card: "#171310",
  cardAlt: "#0e0c0a",
  text: "#f3eee3",
  textMuted: "#8a8580",
  accent: "#df4b60",
  border: "rgba(255,255,255,0.08)",
};

// Counts below are live snapshots from GET /api/titles (not hardcoded
// guesses) — refresh them by re-querying the endpoint as the catalog grows.
const TYPES = [
  { slug: "movies", label: "Movies", tag: "12.3k titles", emoji: "🎬" },
  { slug: "tv-shows", label: "TV Shows", tag: "34 titles", emoji: "📺" },
  { slug: "anime", label: "Anime", tag: "20 titles", emoji: "⛩️" },
];

const GENRES = [
  { slug: "drama", label: "Drama", tag: "5.3k titles", emoji: "🎭" },
  { slug: "comedy", label: "Comedy", tag: "3.8k titles", emoji: "😄" },
  { slug: "thriller", label: "Thriller", tag: "3.2k titles", emoji: "🔥" },
  { slug: "action", label: "Action", tag: "3.1k titles", emoji: "⚡" },
  { slug: "romance", label: "Romance", tag: "2.1k titles", emoji: "💌" },
  { slug: "horror", label: "Horror", tag: "1.8k titles", emoji: "👻" },
  { slug: "crime", label: "Crime", tag: "1.8k titles", emoji: "🕵️" },
  { slug: "scifi", label: "Sci-Fi", tag: "1.4k titles", emoji: "🛸" },
  { slug: "fantasy", label: "Fantasy", tag: "1.5k titles", emoji: "🐉" },
  { slug: "adventure", label: "Adventure", tag: "2k titles", emoji: "🗺️" },
  { slug: "animation", label: "Animation", tag: "1.3k titles", emoji: "🎨" },
  { slug: "mystery", label: "Mystery", tag: "1.1k titles", emoji: "🔍" },
  { slug: "family", label: "Family", tag: "1.3k titles", emoji: "👨‍👩‍👧" },
  { slug: "documentary", label: "Documentary", tag: "288 titles", emoji: "📽️" },
  { slug: "war", label: "War", tag: "370 titles", emoji: "⚔️" },
  { slug: "music", label: "Music", tag: "345 titles", emoji: "🎵" },
  { slug: "history", label: "History", tag: "579 titles", emoji: "📜" },
  { slug: "western", label: "Western", tag: "209 titles", emoji: "🤠" },
];

// Real streaming platforms from the catalog (GET /api/platforms), not
// fictional studio brands — each card filters GET /api/titles?platform=.
const STUDIOS: CategoryItem[] = [
  { slug: "netflix", label: "Netflix", tag: "15 titles", image: "/images/categories/netflix.jpg", imageFit: "contain" },
  { slug: "prime-video", label: "Prime Video", tag: "17 titles", image: "/images/categories/primevideo.webp", imageFit: "contain" },
  { slug: "hotstar", label: "Hotstar", tag: "20 titles", image: "/images/categories/hotstar.png", imageFit: "contain" },
  { slug: "apple-tv", label: "Apple TV+", tag: "8 titles", image: "/images/categories/appletv.png", imageFit: "contain" },
  { slug: "crunchyroll", label: "Crunchyroll", tag: "16 titles", image: "/images/categories/crunchyroll.png", imageFit: "contain" },
  { slug: "mubi", label: "MUBI", tag: "5 titles", image: "/images/categories/mubi.png", imageFit: "contain" },
];

function TiltCard({
  item,
  onOpen,
  large,
}: {
  item: CategoryItem;
  onOpen: (item: CategoryItem) => void;
  large?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleMove(e: MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ x: (py - 0.5) * -7, y: (px - 0.5) * 7 });
  }
  function handleLeave() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <button
      ref={ref}
      onClick={() => onOpen(item)}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 150ms ease-out",
        background: `linear-gradient(160deg, ${THEME.card}, ${THEME.cardAlt})`,
        border: `1px solid ${THEME.border}`,
      }}
      className={`group relative shrink-0 rounded-2xl overflow-hidden text-left
        ${large ? "w-full h-40" : "w-44 h-32"} focus:outline-none`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(115deg, transparent 20%, ${THEME.accent}22 45%, transparent 60%)`,
        }}
      />
      {item.image && (
        <img
          src={item.image}
          alt={item.label}
          className={`absolute inset-0 w-full h-full ${
            item.imageFit === "contain" ? "object-contain p-6" : "object-cover"
          } opacity-90`}
        />
      )}
      {item.image && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 40%, ${THEME.cardAlt}f2 100%)`,
          }}
        />
      )}
      <div className="relative h-full flex flex-col justify-end p-4">
        {!item.image && <span className="text-3xl mb-1">{item.emoji}</span>}
        {!item.image && (
          <span
            style={{ color: THEME.text, fontFamily: "'Georgia', serif" }}
            className="text-xl font-bold leading-tight"
          >
            {item.label}
          </span>
        )}
        {item.image && item.imageFit !== "contain" && (
          <span
            style={{ color: THEME.text, fontFamily: "'Georgia', serif" }}
            className="text-sm font-bold leading-tight"
          >
            {item.label}
          </span>
        )}
        {item.tag && (
          <span
            style={{ color: THEME.textMuted, fontFamily: "monospace" }}
            className="text-xs mt-1"
          >
            {item.tag}
          </span>
        )}
      </div>
    </button>
  );
}

function Row({
  title,
  items,
  onOpen,
  onViewAll,
  showSearch,
  query,
  onQuery,
}: {
  title: string;
  items: CategoryItem[];
  onOpen: (item: CategoryItem) => void;
  onViewAll: () => void;
  showSearch?: boolean;
  query?: string;
  onQuery?: (value: string) => void;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between px-5 mb-3">
        <h2
          style={{ color: THEME.text, fontFamily: "'Georgia', serif" }}
          className="text-[26px] font-bold"
        >
          {title}
        </h2>
        <button
          onClick={onViewAll}
          style={{ color: THEME.textMuted }}
          className="flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
        >
          View All <ChevronRight size={15} />
        </button>
      </div>

      {showSearch && (
        <div className="px-5 mb-4">
          <div
            style={{ background: THEME.card, border: `1px solid ${THEME.border}` }}
            className="flex items-center gap-3 rounded-full px-4 py-3"
          >
            <Search size={17} style={{ color: THEME.textMuted }} />
            <input
              value={query}
              onChange={(e) => onQuery?.(e.target.value)}
              placeholder="Search genres..."
              style={{ color: THEME.text }}
              className="bg-transparent outline-none placeholder-zinc-600 text-sm w-full"
            />
            {query && (
              <button onClick={() => onQuery?.("")} style={{ color: THEME.textMuted }}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p style={{ color: THEME.textMuted }} className="px-5 text-sm">
          No matches.
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none snap-x snap-mandatory">
          {items.map((item) => (
            <div key={item.slug} className="snap-start">
              <TiltCard item={item} onOpen={onOpen} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpandedGrid({
  title,
  items,
  onBack,
  onOpen,
}: {
  title: string;
  items: CategoryItem[];
  onBack: () => void;
  onOpen: (item: CategoryItem) => void;
}) {
  return (
    <div className="px-5">
      <button
        onClick={onBack}
        style={{ color: THEME.textMuted }}
        className="mb-5 text-sm flex items-center gap-1 hover:opacity-80"
      >
        <ChevronRight size={15} className="rotate-180" /> Back
      </button>
      <h2
        style={{ color: THEME.text, fontFamily: "'Georgia', serif" }}
        className="text-3xl font-bold mb-5"
      >
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-16">
        {items.map((item) => (
          <TiltCard key={item.slug} item={item} onOpen={onOpen} large />
        ))}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [genreQuery, setGenreQuery] = useState("");
  const [expanded, setExpanded] = useState<Expanded>(null);

  const filteredGenres = useMemo(() => {
    const q = genreQuery.trim().toLowerCase();
    if (!q) return GENRES;
    return GENRES.filter((g) => g.label.toLowerCase().includes(q));
  }, [genreQuery]);

  function openItem(item: CategoryItem) {
    // route matches whichever section it came from
    if (TYPES.some((t) => t.slug === item.slug)) {
      navigate(`/browse/type/${item.slug}`);
    } else if (STUDIOS.some((s) => s.slug === item.slug)) {
      navigate(`/studio/${item.slug}`);
    } else {
      navigate(`/browse/genre/${item.slug}`);
    }
  }

  return (
    <div style={{ background: THEME.bg }} className="min-h-screen pb-24">
      <div className="pt-8">
        <div className="px-5 mb-2 flex items-center gap-2">
          <span style={{ background: THEME.accent }} className="w-4 h-[2px] inline-block" />
          <span
            style={{ color: THEME.textMuted, fontFamily: "monospace" }}
            className="text-xs tracking-[0.2em] uppercase"
          >
            Categories
          </span>
        </div>
        <div className="px-5 mb-8">
          <h1
            style={{ color: THEME.text, fontFamily: "'Georgia', serif" }}
            className="text-[38px] font-bold leading-tight"
          >
            Browse Everything
          </h1>
        </div>

        {expanded === "type" ? (
          <ExpandedGrid
            title="Browse by Type"
            items={TYPES}
            onBack={() => setExpanded(null)}
            onOpen={openItem}
          />
        ) : expanded === "genre" ? (
          <ExpandedGrid
            title="Browse by Genre"
            items={filteredGenres}
            onBack={() => setExpanded(null)}
            onOpen={openItem}
          />
        ) : expanded === "studio" ? (
          <ExpandedGrid
            title="Where to Watch"
            items={STUDIOS}
            onBack={() => setExpanded(null)}
            onOpen={openItem}
          />
        ) : (
          <>
            <Row
              title="Browse by Type"
              items={TYPES}
              onOpen={openItem}
              onViewAll={() => setExpanded("type")}
              showSearch={false}
            />
            <Row
              title="Browse by Genre"
              items={filteredGenres}
              onOpen={openItem}
              onViewAll={() => setExpanded("genre")}
              showSearch
              query={genreQuery}
              onQuery={setGenreQuery}
            />
            <Row
              title="Where to Watch"
              items={STUDIOS}
              onOpen={openItem}
              onViewAll={() => setExpanded("studio")}
              showSearch={false}
            />
          </>
        )}
      </div>

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
