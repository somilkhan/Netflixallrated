import { useCallback, useEffect, useState } from 'react';
import { Bookmark, ChevronRight, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ContentCard from '../components/ui/ContentCard';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

type WatchlistItem = {
  id: string;
  status: string;
  title: any;
};

const STATUS_LABELS: Record<string, string> = {
  PLAN_TO_WATCH: 'Plan to Watch',
  WATCHING: 'Watching',
  COMPLETED: 'Completed',
  DROPPED: 'Dropped',
};

function SwipeCard({
  item,
  onRemove,
}: {
  item: WatchlistItem;
  onRemove: (item: WatchlistItem) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);

  return (
    <div
      className="relative min-w-0"
      onTouchStart={event => setStartX(event.touches[0].clientX)}
      onTouchMove={event => {
        if (startX == null) return;
        const delta = event.touches[0].clientX - startX;
        if (delta < 0) setOffset(Math.max(-76, delta));
      }}
      onTouchEnd={() => {
        if (offset < -44) setOffset(-76);
        else setOffset(0);
        setStartX(null);
      }}
    >
      <button
        type="button"
        onClick={() => onRemove(item)}
        aria-label={`Remove ${item.title.name} from My List`}
        className="absolute right-0 top-0 bottom-8 z-0 flex w-[76px] items-center justify-center rounded-xl bg-red-500/80 text-white md:hidden"
      >
        <X size={18} />
      </button>
      <div
        className="relative z-10 transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${offset}px)` }}
      >
        <ContentCard title={item.title} fluid />
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onRemove(item);
          }}
          aria-label={`Remove ${item.title.name} from My List`}
          className="absolute right-2 top-2 z-30 hidden h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white/80 shadow-lg transition-colors hover:bg-red-500 hover:text-white md:flex"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default function MyList() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [active, setActive] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    api.watchlist.mine()
      .then(data => setItems(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const removeItem = async (item: WatchlistItem) => {
    setRemoving(item.id);
    try {
      await api.watchlist.delete(item.id);
      setItems(current => current.filter(entry => entry.id !== item.id));
    } catch {
      setError(true);
    } finally {
      setRemoving(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] px-6 flex flex-col items-center justify-center gap-4 text-center">
        <Bookmark size={36} className="text-white/20" />
        <div>
          <h1 className="text-xl font-semibold text-white">Your list is waiting</h1>
          <p className="mt-2 text-sm text-white/40">Sign in to save movies and shows for later.</p>
        </div>
        <button type="button" onClick={() => nav('/login')} className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90">
          Sign In
        </button>
      </div>
    );
  }

  const filtered = active === 'ALL' ? items : items.filter(item => item.status === active);
  const statuses = ['ALL', ...Array.from(new Set(items.map(item => item.status)))];

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8 pb-32">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-white/45">
            <Bookmark size={17} />
            <span className="text-[11px] uppercase tracking-[0.18em]">Collection</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">My List</h1>
          <p className="mt-1 text-sm text-white/35">{items.length} saved {items.length === 1 ? 'title' : 'titles'}</p>
        </div>
        <button type="button" onClick={() => nav('/browse')} className="hidden items-center gap-1 rounded-full border border-white/10 px-4 py-2 text-sm text-white/55 transition-colors hover:border-white/25 hover:text-white sm:flex">
          Browse <ChevronRight size={15} />
        </button>
      </div>

      {items.length > 0 && (
        <div className="mb-7 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {statuses.map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setActive(status)}
              className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-xs transition-colors ${
                active === status ? 'border-white/25 bg-white/10 text-white' : 'border-white/10 text-white/40 hover:text-white/75'
              }`}
            >
              {status === 'ALL' ? 'All titles' : STATUS_LABELS[status] ?? status}
              <span className="ml-1.5 text-white/30">
                ({status === 'ALL' ? items.length : items.filter(item => item.status === status).length})
              </span>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => <div key={index} className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.05]" />)}
        </div>
      )}

      {!loading && error && (
        <div className="py-20 text-center">
          <p className="mb-4 text-sm text-white/40">Couldn’t load your list.</p>
          <button type="button" onClick={load} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/65 hover:border-white/30 hover:text-white">Try again</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.02] px-6 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.08] bg-white/[0.04]">
            <Bookmark size={34} className="text-white/25" />
          </div>
          <h2 className="text-xl font-semibold text-white">Your list is empty</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">Save movies and shows you want to watch later. They’ll appear here.</p>
          <button type="button" onClick={() => nav('/browse')} className="mt-6 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90">Browse</button>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map(item => (
            <div key={item.id} className={removing === item.id ? 'pointer-events-none opacity-50' : ''}>
              <SwipeCard item={item} onRemove={removeItem} />
              {removing === item.id && <Loader2 size={15} className="absolute" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}