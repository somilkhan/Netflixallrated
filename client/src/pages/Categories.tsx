import { useState, useMemo, useRef, useEffect, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, X } from "lucide-react";
import { api } from "../lib/api";

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

// Emoji lookup only — purely cosmetic. The actual list of types/genres and
// their live counts come from GET /api/titles/genres; nothing here is a
// hardcoded catalog list.
const TYPE_EMOJI: Record<string, string> = { MOVIE: '🎬', SERIES: '📺', ANIME: '⛩️' };
const TYPE_LABEL: Record<string, string> = { MOVIE: 'Movies', SERIES: 'TV Shows', ANIME: 'Anime' };
const TYPE_SLUG: Record<string, string> = { MOVIE: 'movies', SERIES: 'tv-shows', ANIME: 'anime' };
const GENRE_EMOJI: Record<string, string> = {
  Drama: '🎭', Comedy: '😄', Thriller: '🔥', Action: '⚡', Romance: '💌', Horror: '👻',
  Crime: '🕵️', 'Sci-Fi': '🛸', 'Science Fiction': '🛸', Fantasy: '🐉', Adventure: '🗺️',
  Animation: '🎨', Mystery: '🔍', Family: '👨‍👩‍👧', Documentary: '📽️', War: '⚔️',
  Music: '🎵', History: '📜', Western: '🤠', 'TV Movie': '📺',
};
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

// Platform logo images are static brand assets shipped with the app; the
// platform list itself + title counts come live from GET /api/platforms.
const PLATFORM_IMAGES: Record<string, string> = {
  netflix: '/images/categories/netflix.jpg',
  'prime-video': '/images/categories/primevideo.webp',
  hotstar: '/images/categories/hotstar.png',
  'apple-tv': '/images/categories/appletv.png',
  crunchyroll: '/images/categories/crunchyroll.png',
  mubi: '/images/categories/mubi.png',
};

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
  const [types, setTypes] = useState<CategoryItem[]>([]);
  const [genres, setGenres] = useState<CategoryItem[]>([]);
  const [studios, setStudios] = useState<CategoryItem[]>([]);

  // Live from the server — never hardcoded. Genres/types come from the DB
  // aggregate (/api/titles/genres); studios/platforms from /api/platforms.
  useEffect(() => {
    api.titles.genres().then(({ genres: g, types: t }: { genres: { genre: string; count: number }[]; types: { type: string; count: number }[] }) => {
      setTypes(t.map(({ type, count }) => ({
        slug: TYPE_SLUG[type] || slugify(type),
        label: TYPE_LABEL[type] || type,
        tag: `${count} title${count === 1 ? '' : 's'}`,
        emoji: TYPE_EMOJI[type] || '🎞️',
      })));
      setGenres(g.map(({ genre, count }) => ({
        slug: slugify(genre),
        label: genre,
        tag: `${count} title${count === 1 ? '' : 's'}`,
        emoji: GENRE_EMOJI[genre] || '🎬',
      })));
    }).catch(() => {});

    api.platforms.list().then((platforms: any[]) => {
      setStudios(platforms.map(p => {
        const slug = slugify(p.abbr || p.name);
        return {
          slug,
          label: p.name,
          tag: `${p._count?.titles ?? 0} title${(p._count?.titles ?? 0) === 1 ? '' : 's'}`,
          image: PLATFORM_IMAGES[slug],
          imageFit: 'contain' as const,
        };
      }));
    }).catch(() => {});
  }, []);

  const filteredGenres = useMemo(() => {
    const q = genreQuery.trim().toLowerCase();
    if (!q) return genres;
    return genres.filter((g) => g.label.toLowerCase().includes(q));
  }, [genreQuery, genres]);

  function openItem(item: CategoryItem) {
    // route matches whichever section it came from
    if (types.some((t) => t.slug === item.slug)) {
      navigate(`/browse/type/${item.slug}`);
    } else if (studios.some((s) => s.slug === item.slug)) {
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
            items={types}
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
            items={studios}
            onBack={() => setExpanded(null)}
            onOpen={openItem}
          />
        ) : (
          <>
            <Row
              title="Browse by Type"
              items={types}
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
              items={studios}
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
