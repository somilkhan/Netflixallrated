import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, X } from "lucide-react";
import { api } from "../lib/api";
import { slugify } from "../lib/slug";
import GlassCard from "../components/GlassCard";

type CategoryItem = {
  slug: string;
  label: string;
  tag?: string;
  emoji?: string;
  image?: string;
  imageFit?: "contain" | "cover";
};

type PosterItem = {
  key: string;
  name: string;
  posterUrl: string | null;
  year: number | null;
};

type Expanded = "type" | "genre" | "studio" | null;

// Emoji lookup only — purely cosmetic. The actual list of types/genres and
// their live counts come from GET /api/titles/genres; nothing here is a
// hardcoded catalog list.
const TYPE_EMOJI: Record<string, string> = { MOVIE: "🎬", SERIES: "📺", ANIME: "⛩️" };
const TYPE_LABEL: Record<string, string> = { MOVIE: "Movies", SERIES: "TV Shows", ANIME: "Anime" };
const TYPE_SLUG: Record<string, string> = { MOVIE: "movies", SERIES: "tv-shows", ANIME: "anime" };
const GENRE_EMOJI: Record<string, string> = {
  Drama: "🎭", Comedy: "😄", Thriller: "🔥", Action: "⚡", Romance: "💌", Horror: "👻",
  Crime: "🕵️", "Sci-Fi": "🛸", "Science Fiction": "🛸", Fantasy: "🐉", Adventure: "🗺️",
  Animation: "🎨", Mystery: "🔍", Family: "👨‍👩‍👧", Documentary: "📽️", War: "⚔️",
  Music: "🎵", History: "📜", Western: "🤠", "TV Movie": "📺",
};
// Local brand logos are the fallback if a platform's name doesn't match a
// live TMDB provider name below — never the primary source of truth.
const PLATFORM_IMAGES: Record<string, string> = {
  netflix: "/images/categories/netflix.jpg",
  "prime-video": "/images/categories/primevideo.webp",
  hotstar: "/images/categories/hotstar.png",
  "apple-tv": "/images/categories/appletv.png",
  crunchyroll: "/images/categories/crunchyroll.png",
  mubi: "/images/categories/mubi.png",
};

function CategoryCard({
  item,
  onOpen,
  large,
}: {
  item: CategoryItem;
  onOpen: (item: CategoryItem) => void;
  large?: boolean;
}) {
  return (
    <button
      onClick={() => onOpen(item)}
      className={`group relative shrink-0 overflow-hidden rounded-[22px] border border-white/[0.08]
        bg-surface/50 backdrop-blur-md text-left transition-all duration-300 ease-out
        hover:-translate-y-1 hover:scale-[1.02] hover:border-maroon-bright/50
        hover:shadow-[0_18px_40px_-14px_rgba(0,0,0,0.6),0_0_0_1px_rgba(194,67,79,0.3),0_0_24px_-8px_rgba(194,67,79,0.4)]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-bright/70
        ${large ? "w-full h-40" : "w-44 h-32"}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100
          transition-opacity duration-300 bg-gradient-to-br from-maroon/20 via-transparent to-transparent"
      />
      {item.image && (
        <img
          src={item.image}
          alt={item.label}
          loading="lazy"
          className={`absolute inset-0 w-full h-full ${
            item.imageFit === "contain" ? "object-contain p-6" : "object-cover"
          } opacity-90 transition-transform duration-300 group-hover:scale-105`}
        />
      )}
      {item.image && (
        <div className="absolute inset-0 bg-gradient-to-t from-void/95 via-void/10 to-transparent" />
      )}
      <div className="relative h-full flex flex-col justify-end p-4 backdrop-blur-[2px]">
        {!item.image && <span className="text-3xl mb-1">{item.emoji}</span>}
        {!item.image && (
          <span className="font-serif text-xl font-semibold leading-tight text-ink">{item.label}</span>
        )}
        {item.image && item.imageFit !== "contain" && (
          <span className="font-serif text-sm font-semibold leading-tight text-ink">{item.label}</span>
        )}
        {item.tag && <span className="mt-1 text-xs font-mono text-ink-dim">{item.tag}</span>}
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
        <h2 className="font-serif text-2xl sm:text-[26px] font-semibold text-ink">{title}</h2>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-sm text-ink-dim hover:text-maroon-bright transition-colors"
        >
          View All <ChevronRight size={15} />
        </button>
      </div>

      {showSearch && (
        <div className="px-5 mb-4">
          <div className="flex items-center gap-3 rounded-full border border-line bg-surface/60 px-4 py-3 backdrop-blur-sm">
            <Search size={17} className="text-ink-faint" />
            <input
              value={query}
              onChange={(e) => onQuery?.(e.target.value)}
              placeholder="Search genres..."
              className="w-full bg-transparent text-sm text-ink placeholder-ink-faint outline-none"
            />
            {query && (
              <button onClick={() => onQuery?.("")} className="text-ink-faint hover:text-ink-dim">
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="px-5 text-sm text-ink-dim">No matches.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none snap-x snap-mandatory">
          {items.map((item, i) => (
            <div
              key={item.slug}
              className="snap-start animate-fadeUp opacity-0"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <CategoryCard item={item} onOpen={onOpen} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PosterRow({ title, items }: { title: string; items: PosterItem[] }) {
  const navigate = useNavigate();
  if (items.length === 0) return null;
  return (
    <div className="mb-10">
      <div className="px-5 mb-3">
        <h2 className="font-serif text-2xl sm:text-[26px] font-semibold text-ink">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none snap-x snap-mandatory">
        {items.map((item, i) => (
          <div key={item.key} className="snap-start animate-fadeUp opacity-0" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
            <GlassCard
              title={item.name}
              year={item.year}
              posterUrl={item.posterUrl}
              onClick={() => navigate(`/search?q=${encodeURIComponent(item.name)}`)}
            />
          </div>
        ))}
      </div>
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
        className="mb-5 flex items-center gap-1 text-sm text-ink-dim hover:text-maroon-bright transition-colors"
      >
        <ChevronRight size={15} className="rotate-180" /> Back
      </button>
      <h2 className="mb-5 font-serif text-3xl font-semibold text-ink">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-16">
        {items.map((item, i) => (
          <div key={item.slug} className="animate-fadeUp opacity-0" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
            <CategoryCard item={item} onOpen={onOpen} large />
          </div>
        ))}
      </div>
    </div>
  );
}

type GeoRow = { id: string; label: string; items: PosterItem[] };

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [genreQuery, setGenreQuery] = useState("");
  const [expanded, setExpanded] = useState<Expanded>(null);
  const [types, setTypes] = useState<CategoryItem[]>([]);
  const [genres, setGenres] = useState<CategoryItem[]>([]);
  const [studios, setStudios] = useState<CategoryItem[]>([]);
  const [geoRows, setGeoRows] = useState<GeoRow[]>([]);

  // Live from the server — never hardcoded. Genres/types come from the DB
  // aggregate (/api/titles/genres); studios/platforms from /api/platforms;
  // poster rows from /api/geo/content (real TMDB regional/language data).
  useEffect(() => {
    api.titles
      .genres()
      .then(({ genres: g, types: t }: { genres: { genre: string; count: number }[]; types: { type: string; count: number }[] }) => {
        setTypes(
          t.map(({ type, count }) => ({
            slug: TYPE_SLUG[type] || slugify(type),
            label: TYPE_LABEL[type] || type,
            tag: `${count} title${count === 1 ? "" : "s"}`,
            emoji: TYPE_EMOJI[type] || "🎞️",
          })),
        );
        setGenres(
          g.map(({ genre, count }) => ({
            slug: slugify(genre),
            label: genre,
            tag: `${count} title${count === 1 ? "" : "s"}`,
            emoji: GENRE_EMOJI[genre] || "🎬",
          })),
        );
      })
      .catch(() => {});

    Promise.all([
      api.platforms.list().catch(() => []),
      api.titles.watchProvidersList("US").catch(() => []),
    ]).then(([platforms, providers]: [any[], any[]]) => {
      setStudios(
        platforms.map((p) => {
          // Slug from the display name (not the short abbr) so it matches
          // both the logo lookup below and StudioDetail's own name-based
          // matching — using abbr produced slugs like "nf" that never
          // matched "netflix" and silently dropped the logo.
          const slug = slugify(p.name);
          const liveMatch = providers.find((prov: any) => {
            const provSlug = slugify(prov.name || "");
            return provSlug === slug || provSlug.includes(slug) || slug.includes(provSlug);
          });
          return {
            slug,
            label: p.name,
            tag: `${p._count?.titles ?? 0} title${(p._count?.titles ?? 0) === 1 ? "" : "s"}`,
            image: liveMatch?.logoUrl || PLATFORM_IMAGES[slug],
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
            id: row.id,
            label: row.label,
            items: (row.items || []).slice(0, 20).map((it: any) => ({
              key: `${row.id}-${it.mediaType}-${it.tmdbId}`,
              name: it.name,
              posterUrl: it.posterUrl,
              year: it.year,
            })),
          })),
        );
      })
      .catch(() => {});
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
    <div className="min-h-screen bg-void pb-24">
      <div className="pt-8">
        <div className="px-5 mb-2 flex items-center gap-2">
          <span className="inline-block h-[2px] w-4 bg-maroon-bright" />
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-ink-dim">The Catalog</span>
        </div>
        <div className="px-5 mb-8">
          <h1 className="font-serif text-4xl sm:text-[42px] font-semibold leading-tight text-ink">
            Browse Everything
          </h1>
        </div>

        {expanded === "type" ? (
          <ExpandedGrid title="Browse by Type" items={types} onBack={() => setExpanded(null)} onOpen={openItem} />
        ) : expanded === "genre" ? (
          <ExpandedGrid title="Browse by Genre" items={filteredGenres} onBack={() => setExpanded(null)} onOpen={openItem} />
        ) : expanded === "studio" ? (
          <ExpandedGrid title="Where to Watch" items={studios} onBack={() => setExpanded(null)} onOpen={openItem} />
        ) : (
          <>
            <Row title="Browse by Type" items={types} onOpen={openItem} onViewAll={() => setExpanded("type")} showSearch={false} />
            <Row
              title="Browse by Genre"
              items={filteredGenres}
              onOpen={openItem}
              onViewAll={() => setExpanded("genre")}
              showSearch
              query={genreQuery}
              onQuery={setGenreQuery}
            />
            <Row title="Where to Watch" items={studios} onOpen={openItem} onViewAll={() => setExpanded("studio")} showSearch={false} />
            {geoRows.map((row) => (
              <PosterRow key={row.id} title={row.label} items={row.items} />
            ))}
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
