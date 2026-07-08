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

  useEffect(() => { if (!user) return; api.watchlist.mine().then(setItems).catch(() => {}); }, [user]);
  if (!user) return <div className="px-5 py-20 text-center"><p className="text-ink-dim mb-4">Sign in to view your watchlist</p><button onClick={() => nav('/login')} className="px-5 py-2 bg-maroon-bright text-white rounded-lg font-semibold">Sign In</button></div>;
  const filtered = items.filter(i => i.status === active);

  return (
    <div className="px-5 py-8">
      <h1 className="font-serif text-2xl font-semibold mb-6">My Watchlist</h1>
      <div className="flex gap-2 mb-6 border-b border-line">
        {statuses.map(s => <button key={s} onClick={() => setActive(s)} className={`pb-2 font-mono text-xs transition-colors ${active === s ? 'text-ink border-b-2 border-maroon-bright' : 'text-ink-faint hover:text-ink-dim'}`}>{statusLabels[s]} ({items.filter(i => i.status === s).length})</button>)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map((item: any) => (
          <div key={item.id} className="cursor-pointer group" onClick={() => nav(`/title/${item.title.id}`)}>
            <div className="aspect-[2/3] rounded-xl border border-line overflow-hidden mb-2 transition-all group-hover:border-maroon bg-cover bg-center" style={{
              backgroundImage: item.title.posterUrl
                ? `linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.55)), url(${item.title.posterUrl})`
                : `radial-gradient(120% 100% at 30% 0%, ${item.title.posterColorFrom}, ${item.title.posterColorTo} 70%)`,
            }} />
            <div className="text-sm font-semibold truncate">{item.title.name}</div>
            <div className="font-mono text-[10px] text-ink-faint">{item.title.year} · {item.title.type}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
