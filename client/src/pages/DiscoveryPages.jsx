import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ChevronLeft } from "lucide-react";

/*
  Shared discovery pages: Studio / Language / Genre / Type detail.
  All four follow the exact same shape — header, optional tab switch
  between Movies and Series, then a poster grid — so they share one
  data hook and one grid component instead of four separate fetch
  implementations that drift out of sync.

  WIRE THIS UP:
  Replace `fetchDiscover()` below with your real TMDb/AniList route.
  Keep the return shape { id, title, posterUrl, rating, year, mediaType }
  and every page here works unchanged.
*/

// ---- data layer -----------------------------------------------------

async function fetchDiscover({ filterType, filterValue, mediaType }) {
  // Example real call — swap in your actual route:
  // const res = await fetch(
  //   `/api/tmdb/discover?${filterType}=${filterValue}&type=${mediaType}`
  // );
  // const json = await res.json();
  // return json.results.map((r) => ({
  //   id: r.id,
  //   title: r.title || r.name,
  //   posterUrl: `https://image.tmdb.org/t/p/w342${r.poster_path}`,
  //   rating: r.vote_average,
  //   year: (r.release_date || r.first_air_date || "").slice(0, 4),
  //   mediaType,
  // }));

  // Mock data for now so the UI is testable before the route exists.
  await new Promise((r) => setTimeout(r, 200));
  return Array.from({ length: 8 }).map((_, i) => ({
    id: `${filterValue}-${mediaType}-${i}`,
    title: mediaType === "movie" ? `Movie Title ${i + 1}` : `Series Title ${i + 1}`,
    posterUrl: null, // null renders a placeholder tile
    rating: (6 + Math.random() * 3).toFixed(1),
    year: 2024 + (i % 3),
    mediaType,
  }));
}

function useDiscover(filterType, filterValue, mediaType) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDiscover({ filterType, filterValue, mediaType }).then((data) => {
      if (!cancelled) {
        setItems(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [filterType, filterValue, mediaType]);

  return { items, loading };
}

// ---- shared UI --------------------------------------------------------

function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm mb-4 transition-colors"
    >
      <ChevronLeft size={16} /> Back
    </button>
  );
}

function Tabs({ active, onChange }) {
  return (
    <div className="flex gap-6 border-b border-white/10 mb-6">
      {["movie", "tv"].map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`pb-3 text-lg font-semibold transition-colors relative
            ${active === key ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          {key === "movie" ? "Movies" : "Series"}
          {active === key && (
            <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-white rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

function PosterCard({ item }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/title/${item.mediaType}/${item.id}`)}
      className="text-left group focus:outline-none"
    >
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/10 mb-2 relative">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">
            No poster
          </div>
        )}
      </div>
      <p className="text-white text-sm font-medium leading-tight truncate">{item.title}</p>
      <p className="flex items-center gap-1 text-zinc-500 text-xs mt-0.5">
        <Star size={11} className="fill-zinc-500 text-zinc-500" />
        {item.rating} · {item.year}
      </p>
    </button>
  );
}

function PosterGrid({ items, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-zinc-900/60 animate-pulse" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="text-zinc-500 text-sm">Nothing here yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-16">
      {items.map((item) => (
        <PosterCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function DetailShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-black px-5 pt-8">
      <BackButton />
      <h1
        style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
        className="text-white text-4xl mb-1"
      >
        {title}
      </h1>
      {subtitle && <p className="text-zinc-500 mb-6">{subtitle}</p>}
      {children}
    </div>
  );
}

// ---- pages --------------------------------------------------------

// /studio/:slug  — e.g. Disney+, then drills into Marvel / Pixar / Star Wars
const SUB_STUDIOS = {
  disney: [
    { slug: "disney-animation", label: "Disney" },
    { slug: "marvel", label: "Marvel" },
    { slug: "pixar", label: "Pixar" },
    { slug: "star-wars", label: "Star Wars" },
  ],
};

export function StudioDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const children = SUB_STUDIOS[slug];

  // A parent studio (Disney+) shows a grid of sub-brands.
  if (children) {
    return (
      <DetailShell title={slug.replace(/-/g, " ")} subtitle="Studios">
        <div className="grid grid-cols-2 gap-3 pb-16">
          {children.map((c) => (
            <button
              key={c.slug}
              onClick={() => navigate(`/studio/${c.slug}`)}
              className="bg-zinc-900/60 border border-white/10 rounded-2xl h-28 flex items-center justify-center text-white font-semibold hover:border-white/25 hover:bg-zinc-900 transition-colors"
            >
              {c.label}
            </button>
          ))}
        </div>
      </DetailShell>
    );
  }

  // A leaf studio (Marvel, Pixar...) shows its actual titles.
  const [tab, setTab] = useState("movie");
  const { items, loading } = useDiscover("studio", slug, tab);

  return (
    <DetailShell title={slug.replace(/-/g, " ")}>
      <Tabs active={tab} onChange={setTab} />
      <PosterGrid items={items} loading={loading} />
    </DetailShell>
  );
}

// /language/:slug
export function LanguageDetail() {
  const { slug } = useParams();
  const [tab, setTab] = useState("movie");
  const { items, loading } = useDiscover("language", slug, tab);

  return (
    <DetailShell title={slug}>
      <Tabs active={tab} onChange={setTab} />
      <PosterGrid items={items} loading={loading} />
    </DetailShell>
  );
}

// /browse/genre/:slug
export function GenreDetail() {
  const { slug } = useParams();
  const [tab, setTab] = useState("movie");
  const { items, loading } = useDiscover("genre", slug, tab);

  return (
    <DetailShell title={slug} subtitle="Genre">
      <Tabs active={tab} onChange={setTab} />
      <PosterGrid items={items} loading={loading} />
    </DetailShell>
  );
}

// /browse/type/:slug  (movies | tv-shows | anime — type already implies media kind)
const TYPE_TO_MEDIA = { movies: "movie", "tv-shows": "tv", anime: "tv" };

export function TypeDetail() {
  const { slug } = useParams();
  const mediaType = TYPE_TO_MEDIA[slug] || "movie";
  const { items, loading } = useDiscover("type", slug, mediaType);

  return (
    <DetailShell title={slug.replace(/-/g, " ")}>
      <PosterGrid items={items} loading={loading} />
    </DetailShell>
  );
}
