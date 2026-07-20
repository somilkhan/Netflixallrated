import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import ContentCard from '../components/ui/ContentCard';
import { Bookmark } from 'lucide-react';

const STATUSES = ['PLAN_TO_WATCH', 'WATCHING', 'COMPLETED', 'DROPPED'] as const;
type Status = typeof STATUSES[number];

const STATUS_LABELS: Record<Status, string> = {
  PLAN_TO_WATCH: 'Plan to Watch',
  WATCHING:      'Watching',
  COMPLETED:     'Completed',
  DROPPED:       'Dropped',
};

export default function Watchlist() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items,     setItems]     = useState<any[]>([]);
  const [active,    setActive]    = useState<Status>('PLAN_TO_WATCH');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(false);
    api.watchlist.mine()
      .then(data => { if (!cancelled) setItems(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, retryTick]);

  if (!user) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <Bookmark size={32} className="text-white/20" />
      <p className="text-white/40 text-sm">Sign in to view your watchlist</p>
      <button
        onClick={() => nav('/login')}
        className="px-5 py-2 bg-white text-black rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors"
      >
        Sign In
      </button>
    </div>
  );

  const filtered = items.filter(i => i.status === active);

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-8 pb-32">
      <h1 className="text-2xl font-bold mb-6 text-white tracking-tight">My Watchlist</h1>

      {/* Status tabs */}
      <div className="flex gap-0 mb-7 border-b border-white/[0.07]">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setActive(s)}
            className={`pb-2.5 px-3 text-[11px] font-medium transition-colors relative whitespace-nowrap ${
              active === s
                ? 'text-white after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:bg-white after:rounded-t'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {STATUS_LABELS[s]}
            <span className={`ml-1.5 ${active === s ? 'text-white/45' : 'text-white/20'}`}>
              ({items.filter(i => i.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[2/3] rounded-xl bg-white/[0.05] mb-2 animate-pulse" />
              <div className="h-3 bg-white/[0.05] rounded-full w-3/4 mb-1 animate-pulse" />
              <div className="h-2.5 bg-white/[0.04] rounded-full w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-16">
          <p className="text-white/35 mb-4 text-sm">Couldn't load your watchlist.</p>
          <button
            onClick={() => setRetryTick(t => t + 1)}
            className="px-4 py-2 border border-white/[0.12] rounded-lg text-sm text-white/50 hover:text-white hover:border-white/25 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <Bookmark size={32} className="text-white/15" />
          <p className="text-white/35 text-sm">No titles in "{STATUS_LABELS[active]}" yet.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
          {filtered.map((item: any) => (
            <ContentCard key={item.id} title={item.title} />
          ))}
        </div>
      )}
    </div>
  );
}
