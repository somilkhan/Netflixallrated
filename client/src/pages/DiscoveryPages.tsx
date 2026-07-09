import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { api } from "../lib/api";
import { slugify } from "../lib/slug";
import GlassCard, { GlassCardSkeleton } from "../components/GlassCard";

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

// ── data layer ────────────────────────────────────────────────────────────────

async function fetchTitles({
  type, genre, platform, page = 1, limit = 20,
}: {
  type?: string;
  genre?: string;
  platform?: string;
  page?: number;
  limit?: number;
}): Promise<TitlesResponse> {
  const params = new URLSearchParams();
  if (type)     params.set("type",     type);
  if (genre)    params.set("genre",    genre);
  if (platform) params.set("platform", platform);
  params.set("page",  String(page));
  params.set("limit", String(limit));
  const res = await fetch(`/api/titles?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load titles (${res.status})`);
  return res.json();
}

function useTitles({ type, genre, platform }: { type?: string; genre?: string; platform?: string }) {
  const [items,   setItems]   = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

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
    return () => { cancelled = true; };
  }, [type, genre, platform]);

  return { items, loading, error };
}

// ── shared UI ────────────────────────────────────────────────────────────────

function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-1.5 font-mono text-[11px] text-ink-faint
        hover:text-ink transition-colors mb-6"
    >
      <ChevronLeft size={14} />
      Back
    </button>
  );
}

const TAB_LABEL: Record<MediaType, string> = { MOVIE: "Movies", SERIES: "Series", ANIME: "Anime" };

function Tabs({ active, onChange, includeAnime = false }: { active: MediaType; onChange: (value: MediaType) => void; includeAnime?: boolean }) {
  const options: MediaType[] = includeAnime ? ["MOVIE", "SERIES", "ANIME"] : ["MOVIE", "SERIES"];
  return (
    <div className="flex gap-6 border-b border-line mb-6">
      {options.map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`pb-3 text-lg font-semibold transition-colors relative
            ${active === key ? "text-ink" : "text-ink-faint hover:text-ink-dim"}`}
        >
          {TAB_LABEL[key]}
          {active === key && (
            <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-maroon-bright rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * PosterCard — grid card that uses the full GlassCard component so every
 * discovery detail page (platform, genre, type) gets the same premium
 * frosted-glass treatment as horizontal rows.
 */
function PosterCard({ item }: { item: Title }) {
  const navigate = useNavigate();
  const typeLabel =
    item.genres?.some((g) => g.toLowerCase() === "animation") ? "Anime" : undefined;

  return (
    <GlassCard
      title={item.name}
      year={item.year}
      genres={item.genres}
      posterUrl={item.posterUrl}
      posterColorFrom={item.posterColorFrom}
      posterColorTo={item.posterColorTo}
      typeLabel={typeLabel}
      onClick={() => navigate(`/title/${item.id}`)}
      fluid
    />
  );
}

function PosterGrid({
  items, loading, error,
}: {
  items: Title[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <GlassCardSkeleton key={i} fluid />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <p className="font-mono text-sm text-ink-faint">
        Couldn't load titles: {error}
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <p className="font-mono text-sm text-ink-faint">
        No titles found for this filter yet.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-24">
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
    <div className="min-h-screen bg-void px-5 pt-10">
      <BackButton />
      <h1 className="font-serif text-[38px] font-semibold leading-tight text-ink mb-1 capitalize italic">
        {title}
      </h1>
      {subtitle && (
        <p className="font-mono text-[11px] text-ink-faint mb-6">{subtitle}</p>
      )}
      {children}
    </div>
  );
}

// ── pages ─────────────────────────────────────────────────────────────────────

// /studio/:slug — real streaming platforms, resolved live from GET
// /api/platforms and matched by slugify(name)
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
            <GlassCardSkeleton key={i} fluid />
          ))}
        </div>
      ) : !platform ? (
        <p className="font-mono text-sm text-ink-faint">
          This streaming platform doesn't exist in the catalog.
        </p>
      ) : (
        <PosterGrid items={items} loading={loading} error={error} />
      )}
    </DetailShell>
  );
}

// /language/:slug
export function LanguageDetail() {
  const { slug = "" } = useParams();
  return (
    <DetailShell title={slug} subtitle="Language filtering">
      <p className="font-mono text-sm text-ink-faint">
        Language isn't stored on titles yet, so this filter can't return real
        results. Add a language field to the catalog to enable this page.
      </p>
    </DetailShell>
  );
}

// /browse/genre/:slug — resolved live from GET /api/titles/genres
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
      <Tabs active={tab} onChange={setTab} includeAnime />
      {genresLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <GlassCardSkeleton key={i} fluid />
          ))}
        </div>
      ) : !genreName ? (
        <p className="font-mono text-sm text-ink-faint">
          This genre doesn't exist in the catalog.
        </p>
      ) : (
        <PosterGrid items={items} loading={loading} error={error} />
      )}
    </DetailShell>
  );
}

// /browse/type/:slug  (movies | tv-shows | anime)
const TYPE_TO_ENUM: Record<string, MediaType> = {
  movies:    "MOVIE",
  "tv-shows": "SERIES",
  anime:     "ANIME",
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
