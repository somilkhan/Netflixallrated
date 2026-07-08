import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Film, Tv, Sword, ChevronRight } from "lucide-react";
import { api } from "../lib/api";

// Genre → emoji mapping for visual flair
const GENRE_EMOJI: Record<string, string> = {
  Action: "⚡", Drama: "🎭", Comedy: "😄", "Sci-Fi": "🚀", Horror: "👻",
  Romance: "💫", Crime: "🔍", Animation: "🎨", Fantasy: "🗡️", Documentary: "📽️",
  Thriller: "🔥", Adventure: "🏔️", Mystery: "🕵️", Family: "👨‍👩‍👧", Music: "🎵",
  History: "📜", War: "⚔️", Sport: "🏆", Western: "🤠", Biography: "📖",
};

const TYPE_CARDS = [
  { id: "MOVIE",  label: "Movies",   icon: Film,  emoji: "🎬", desc: "Feature films" },
  { id: "SERIES", label: "TV Shows", icon: Tv,    emoji: "📺", desc: "Series & dramas" },
  { id: "ANIME",  label: "Anime",    icon: Sword, emoji: "⛩️",  desc: "Animated series" },
];

function fmtCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${n}`;
}

export default function Categories() {
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [genres, setGenres] = useState<{ genre: string; count: number }[]>([]);
  const [types, setTypes]   = useState<{ type: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.titles.genres()
      .then((d: any) => { setGenres(d.genres || []); setTypes(d.types || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return genres;
    const q = query.toLowerCase();
    return genres.filter(g => g.genre.toLowerCase().includes(q));
  }, [query, genres]);

  function typeCount(id: string) {
    return types.find(t => t.type === id)?.count ?? null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-8 pb-6 border-b border-line">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🎞️</span>
          <h1 className="font-serif text-3xl font-semibold">Categories</h1>
        </div>
        <p className="text-ink-faint text-sm ml-[48px]">Browse by genre, type, or format</p>
      </div>

      {/* Browse by Type */}
      <div className="px-5 pt-7 pb-2">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="font-serif text-xl font-semibold">Browse by Type</span>
          <div className="h-px bg-line flex-1 mx-2" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {TYPE_CARDS.map(({ id, label, emoji, desc }) => {
            const count = typeCount(id);
            return (
              <button
                key={id}
                onClick={() => nav(`/search?type=${id}`)}
                className="group flex flex-col items-start p-4 rounded-xl bg-surface border border-line
                  hover:border-maroon hover:bg-surface-2 transition-all duration-200
                  hover:shadow-[0_0_0_1px_#7A2530,0_8px_24px_-8px_rgba(122,37,48,0.3)]"
              >
                <span className="text-2xl mb-3">{emoji}</span>
                <span className="font-serif text-base font-semibold text-ink leading-tight">{label}</span>
                <span className="font-mono text-[10px] text-ink-faint mt-0.5">
                  {count !== null ? `${fmtCount(count)} titles` : desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Genres */}
      <div className="px-5 pt-7">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="font-serif text-xl font-semibold">Browse by Genre</span>
          {!loading && genres.length > 0 && (
            <span className="font-mono text-[11px] text-ink-faint">{genres.length} genres</span>
          )}
          <div className="h-px bg-line flex-1 mx-2" />
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search genres…"
            className="w-full bg-surface border border-line rounded-full pl-9 pr-9 py-2.5 text-sm text-ink
              placeholder:text-ink-faint outline-none focus:border-maroon
              focus:shadow-[0_0_0_3px_rgba(122,37,48,0.15)] transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Genre grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-[72px] rounded-xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-serif text-lg font-semibold mb-1">
              {query ? `No genres matching "${query}"` : "No genres yet"}
            </p>
            <p className="text-ink-faint text-sm">
              {query ? "Try a different search" : "Catalog is being populated"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-8">
            {filtered.map(({ genre, count }) => (
              <button
                key={genre}
                onClick={() => nav(`/search?genre=${encodeURIComponent(genre)}`)}
                className="group flex items-center justify-between p-4 rounded-xl bg-surface border border-line
                  hover:border-maroon hover:bg-surface-2 transition-all duration-200 text-left
                  hover:shadow-[0_0_0_1px_#7A2530,0_8px_24px_-8px_rgba(122,37,48,0.25)]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base leading-none">{GENRE_EMOJI[genre] || "🎬"}</span>
                    <span className="font-serif text-base font-semibold text-ink truncate">{genre}</span>
                  </div>
                  <span className="font-mono text-[10px] text-ink-faint">{fmtCount(count)} titles</span>
                </div>
                <ChevronRight size={14} className="text-ink-faint group-hover:text-maroon-bright shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
