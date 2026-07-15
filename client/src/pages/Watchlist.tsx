import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

const statuses = ['PLAN_TO_WATCH', 'WATCHING', 'COMPLETED', 'DROPPED'];
const statusLabels: Record<string, string> = { PLAN_TO_WATCH: 'Plan to Watch', WATCHING: 'Watching', COMPLETED: 'Completed', DROPPED: 'Dropped' };

export default function Watchlist() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [active, setActive] = useState('PLAN_TO_WATCH');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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

  if (!user) return <div className="px-5 py-20 text-center"><p className="text-[#888] mb-4">Sign in to view your watchlist</p><button onClick={() => nav('/login')} className="px-5 py-2 bg-white text-black rounded-xl font-semibold hover:bg-white/90 transition-colors">Sign In</button></div>;

  const filtered = items.filter(i => i.status === active);

  return (
    <div className="px-5 py-8">
      <h1 className="font-sans text-2xl font-bold mb-6 text-white">My Watchlist</h1>
      <div className="flex gap-2 mb-6 border-b border-[#1a1a1a]">
        {statuses.map(s => <button key={s} onClick={() => setActive(s)} className={`pb-2 font-sans text-xs transition-colors ${active === s ? 'text-white border-b-2 border-white' : 'text-[#555] hover:text-[#aaa]'}`}>{statusLabels[s]} ({items.filter(i => i.status === s).length})</button>)}
      </div>
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] rounded-xl bg-surface mb-2" />
              <div className="h-3 bg-surface rounded w-3/4 mb-1" />
              <div className="h-2 bg-surface rounded w-1/2" />
            </div>
          ))}
        </div>
      )}
      {!loading && error && (
        <div className="text-center py-16">
          <p className="text-ink-dim mb-4">Couldn't load your watchlist. Please try again.</p>
          <button onClick={() => setRetryTick(t => t + 1)} className="px-4 py-2 border border-line rounded-lg text-sm font-mono">Retry</button>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-ink-faint">No titles in "{statusLabels[active]}" yet.</div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((item: any) => (
            <div key={item.id} className="cursor-pointer group" onClick={() => nav(`/title/${item.title.id}`)}>
              <div className="aspect-[2/3] rounded-xl border border-line overflow-hidden mb-2 transition-all group-hover:border-white/40 bg-cover bg-center" style={{
                backgroundImage: item.title.posterUrl
                  ? `linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.55)), url(${item.title.posterUrl})`
                  : `radial-gradient(120% 100% at 30% 0%, ${item.title.posterColorFrom}, ${item.title.posterColorTo} 70%)`,
              }} />
              <div className="text-sm font-semibold truncate">{item.title.name}</div>
              <div className="font-mono text-[10px] text-ink-faint">{item.title.year} · {item.title.type}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
