import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

/*
  Allrated — Categories page
  Fix summary:
  1. Each type/genre card has its OWN onClick + navigate call.
     Nothing wraps the whole grid in a shared click handler.
  2. Search input only filters the `genres` array in local state.
     It does NOT open, submit, or trigger navigation on its own —
     pressing Enter or clicking a result are two separate actions.
  3. Genre click and search are fully independent state:
     `query` (string) vs `navigate(path)` (side effect). They never
     touch the same handler, so typing can't fire a click and
     clicking can't reopen search.
*/

const TYPES = [
  { slug: "movies", label: "Movies", emoji: "🎬", count: "12.3k titles" },
  { slug: "tv-shows", label: "TV Shows", emoji: "📺", count: "34 titles" },
  { slug: "anime", label: "Anime", emoji: "⛩️", count: "20 titles" },
];

const GENRES = [
  { slug: "drama", label: "Drama", emoji: "🎭", count: "5.3k titles" },
  { slug: "comedy", label: "Comedy", emoji: "😄", count: "3.8k titles" },
  { slug: "thriller", label: "Thriller", emoji: "🔥", count: "3.2k titles" },
  { slug: "action", label: "Action", emoji: "⚡", count: "4.1k titles" },
  { slug: "romance", label: "Romance", emoji: "💌", count: "2.9k titles" },
  { slug: "horror", label: "Horror", emoji: "👻", count: "1.7k titles" },
  { slug: "scifi", label: "Sci-Fi", emoji: "🛸", count: "2.2k titles" },
  { slug: "documentary", label: "Documentary", emoji: "📽️", count: "1.1k titles" },
];

function TypeCard({ item }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/browse/type/${item.slug}`)}
      className="flex flex-col items-start gap-3 bg-zinc-900/60 border border-white/10
                 rounded-2xl p-6 text-left hover:border-white/25 hover:bg-zinc-900
                 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
    >
      <span className="text-3xl">{item.emoji}</span>
      <span className="text-white text-xl font-semibold">{item.label}</span>
      <span className="text-zinc-500 text-sm font-mono">{item.count}</span>
    </button>
  );
}

function GenreCard({ item }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/browse/genre/${item.slug}`)}
      className="flex items-center justify-between gap-3 bg-zinc-900/60 border border-white/10
                 rounded-2xl px-5 py-4 text-left hover:border-white/25 hover:bg-zinc-900
                 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
    >
      <span className="flex items-center gap-3">
        <span className="text-2xl">{item.emoji}</span>
        <span>
          <span className="block text-white text-lg font-semibold">{item.label}</span>
          <span className="block text-zinc-500 text-xs font-mono">{item.count}</span>
        </span>
      </span>
      <span className="text-zinc-500">›</span>
    </button>
  );
}

export default function Categories() {
  const [query, setQuery] = useState("");

  // Pure derived state. Typing only ever changes this filtered list —
  // it can't call navigate, and it can't be triggered by a card click.
  const filteredGenres = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GENRES;
    return GENRES.filter((g) => g.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="min-h-screen bg-black px-5 pt-8 pb-24">
      <header className="mb-8">
        <div className="text-4xl mb-2">🎞️</div>
        <h1 className="text-white text-4xl font-serif">Categories</h1>
        <p className="text-zinc-500 mt-1">Browse by genre, type, or format</p>
      </header>

      <section className="mb-10">
        <h2 className="text-white text-2xl font-serif mb-4">Browse by Type</h2>
        <div className="grid grid-cols-3 gap-3">
          {TYPES.map((t) => (
            <TypeCard key={t.slug} item={t} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline gap-2 mb-4">
          <h2 className="text-white text-2xl font-serif">Browse by Genre</h2>
          <span className="text-zinc-500 text-sm font-mono">{GENRES.length} genres</span>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900/60 border border-white/10 rounded-full px-4 py-3 mb-5">
          <Search size={17} className="text-zinc-500 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search genres..."
            className="bg-transparent outline-none text-white placeholder-zinc-600 text-sm w-full"
          />
        </div>

        {filteredGenres.length === 0 ? (
          <p className="text-zinc-500 text-sm">No genres match "{query}".</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredGenres.map((g) => (
              <GenreCard key={g.slug} item={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
