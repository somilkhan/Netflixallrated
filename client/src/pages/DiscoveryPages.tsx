import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { api } from "../lib/api";
import { slugify } from "../lib/slug";

/*
  Shared discovery pages: Platform / Genre / Type detail.
  All follow the exact same shape — header, Movies/Series tab, poster grid —
  backed by the real GET /api/titles endpoint (proxied to the Railway
  backend). No mock data: an empty result means the catalog has nothing
  matching that filter yet, and is shown as such.
*/

type MediaType = "MOVIE" | "SERIES" | "ANIME";

type Title = {
  id: string;
  name: string;
  year: number;
  genres: string[];
  posterUrl?: string | null;
  posterColorFrom?: string;
  posterColorTo?: string;
};

type TitlesResponse = {
  titles: Title[];
  total: number;
  page: number;
  pages: number;
};

// ---- data layer -----------------------------------------------------

async function fetchTitles({
  type,
  genre,
  platform,
  page = 1,
  limit = 20,
}: {
  type?: string;
  genre?: string;
  platform?: string;
  page?: number;
  limit?: number;
}): Promise<TitlesResponse> {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (genre) params.set("genre", genre);
  if (platform) params.set("platform", platform);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const res = await fetch(`/api/titles?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load titles (${res.status})`);
  return res.json();
}

function useTitles({ type, genre, platform }: { type?: string; genre?: string; platform?: string }) {
  const [items, setItems] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTitles({ type, genre, platform, page: 1, limit: 24 })
      .then((data) => {
        if (cancelled) return;
        setItems(data.titles || []);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type, genre, platform]);

  return { items, loading, error };
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

function Tabs({ active, onChange }: { active: MediaType; onChange: (value: MediaType) => void }) {
  const options: MediaType[] = ["MOVIE", "SERIES"];
  return (
    <div className="flex gap-6 border-b border-white/10 mb-6">
      {options.map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`pb-3 text-lg font-semibold transition-colors relative
            ${active === key ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          {key === "MOVIE" ? "Movies" : "Series"}
          {active === key && (
            <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-white rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

function PosterCard({ item }: { item: Title }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/title/${item.id}`)}
      className="text-left group focus:outline-none"
    >
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/10 mb-2 relative">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-zinc-500 text-xs text-center px-2"
            style={{
              background: `linear-gradient(160deg, ${item.posterColorFrom || "#1a1510"}, ${
                item.posterColorTo || "#0a0908"
              })`,
            }}
          >
            {item.name}
          </div>
        )}
      </div>
      <p className="text-white text-sm font-medium leading-tight truncate">{item.name}</p>
      <p className="text-zinc-500 text-xs mt-0.5">
        {item.year} · {(item.genres || []).slice(0, 2).join(", ")}
      </p>
    </button>
  );
}

function PosterGrid({
  items,
  loading,
  error,
}: {
  items: Title[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-zinc-900/60 animate-pulse" />
        ))}
      </div>
    );
  }
  if (error) {
    return <p className="text-red-400 text-sm">Couldn't load titles: {error}</p>;
  }
  if (items.length === 0) {
    return <p className="text-zinc-500 text-sm">No titles found for this filter yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-16">
      {items.map((item) => (
        <PosterCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function DetailShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black px-5 pt-8">
      <BackButton />
      <h1
        style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
        className="text-white text-4xl mb-1 capitalize"
      >
        {title}
      </h1>
      {subtitle && <p className="text-zinc-500 mb-6">{subtitle}</p>}
      {children}
    </div>
  );
}

// ---- pages --------------------------------------------------------

// /studio/:slug — real streaming platforms, resolved live from GET
// /api/platforms and matched by slugify(name) so this always stays in sync
// with whatever platforms actually exist in the catalog (never hardcoded).
export function StudioDetail() {
  const { slug = "" } = useParams();
  const [tab, setTab] = useState<MediaType>("MOVIE");
  const [platform, setPlatform] = useState<{ name: string; abbr: string } | null>(null);
  const [platformsLoading, setPlatformsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.platforms.list()
      .then((platforms: { name: string; abbr: string }[]) => {
        if (cancelled) return;
        const match = platforms.find((p) => slugify(p.name) === slug);
        setPlatform(match || null);
        setPlatformsLoading(false);
      })
      .catch(() => { if (!cancelled) setPlatformsLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const { items, loading, error } = useTitles({
    type: tab,
    platform: platform?.abbr,
  });

  return (
    <DetailShell title={platform?.name || slug.replace(/-/g, " ")}>
      <Tabs active={tab} onChange={setTab} />
      {platformsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-zinc-900/60 animate-pulse" />
          ))}
        </div>
      ) : !platform ? (
        <p className="text-zinc-500 text-sm">This streaming platform doesn't exist in the catalog.</p>
      ) : (
        <PosterGrid items={items} loading={loading} error={error} />
      )}
    </DetailShell>
  );
}

// /language/:slug — the catalog has no language field yet, so this page is
// honest about that instead of faking results.
export function LanguageDetail() {
  const { slug = "" } = useParams();
  return (
    <DetailShell title={slug} subtitle="Language filtering">
      <p className="text-zinc-500 text-sm">
        Language isn't stored on titles yet, so this filter can't return real
        results. Add a language field to the catalog to enable this page.
      </p>
    </DetailShell>
  );
}

// /browse/genre/:slug — resolved live from GET /api/titles/genres and
// matched by slugify(genre), so it always agrees with whatever slug
// Categories.tsx generated for the same genre (never a hardcoded map that
// can drift out of sync and silently return zero results).
export function GenreDetail() {
  const { slug = "" } = useParams();
  const [tab, setTab] = useState<MediaType>("MOVIE");
  const [genreName, setGenreName] = useState<string | null>(null);
  const [genresLoading, setGenresLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.titles.genres()
      .then(({ genres }: { genres: { genre: string; count: number }[] }) => {
        if (cancelled) return;
        const match = genres.find((g) => slugify(g.genre) === slug);
        setGenreName(match?.genre || null);
        setGenresLoading(false);
      })
      .catch(() => { if (!cancelled) setGenresLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const { items, loading, error } = useTitles({ type: tab, genre: genreName || undefined });

  return (
    <DetailShell title={genreName || slug.replace(/-/g, " ")} subtitle="Genre">
      <Tabs active={tab} onChange={setTab} />
      {genresLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-zinc-900/60 animate-pulse" />
          ))}
        </div>
      ) : !genreName ? (
        <p className="text-zinc-500 text-sm">This genre doesn't exist in the catalog.</p>
      ) : (
        <PosterGrid items={items} loading={loading} error={error} />
      )}
    </DetailShell>
  );
}

// /browse/type/:slug  (movies | tv-shows | anime)
const TYPE_TO_ENUM: Record<string, MediaType> = {
  movies: "MOVIE",
  "tv-shows": "SERIES",
  anime: "ANIME",
};

export function TypeDetail() {
  const { slug = "" } = useParams();
  const type = TYPE_TO_ENUM[slug] || "MOVIE";
  const { items, loading, error } = useTitles({ type });

  return (
    <DetailShell title={slug.replace(/-/g, " ")}>
      <PosterGrid items={items} loading={loading} error={error} />
    </DetailShell>
  );
}
