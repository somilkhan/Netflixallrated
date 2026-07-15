import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { InlineLoader } from '../components/GlassLoader';
import { Clock, Play, Trash2, X } from 'lucide-react';

interface ProgressItem {
  titleId: string;
  positionSeconds: number;
  durationSeconds: number | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  episodeTitle: string | null;
  completed: boolean;
  updatedAt: string;
  title: {
    id: string;
    name: string;
    type: string;
    year: number;
    posterUrl: string | null;
  };
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs  = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 2)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function HistoryRow({
  item,
  onRemove,
}: {
  item: ProgressItem;
  onRemove: (id: string) => void;
}) {
  const navigate = useNavigate();
  const pct = item.durationSeconds && item.durationSeconds > 0
    ? Math.min(100, Math.round((item.positionSeconds / item.durationSeconds) * 100))
    : null;

  const subLabel =
    item.title.type === 'SERIES' && item.seasonNumber != null && item.episodeNumber != null
      ? `S${item.seasonNumber} · E${item.episodeNumber}${item.episodeTitle ? ` — ${item.episodeTitle}` : ''}`
      : item.title.type === 'ANIME' && item.episodeNumber != null
      ? `Ep ${item.episodeNumber}${item.episodeTitle ? ` — ${item.episodeTitle}` : ''}`
      : null;

  const typeLabel =
    item.title.type === 'SERIES' ? 'Series'
    : item.title.type === 'ANIME' ? 'Anime'
    : 'Movie';

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors group">
      {/* Poster */}
      <div
        className="relative shrink-0 w-12 h-16 rounded-md overflow-hidden bg-white/5 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`Play ${item.title.name}`}
        onClick={() => navigate(`/title/${item.title.id}?play=1`)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/title/${item.title.id}?play=1`); } }}
      >
        {item.title.posterUrl ? (
          <img
            src={item.title.posterUrl}
            alt={item.title.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <Play size={14} />
          </div>
        )}
        {/* Progress bar on poster */}
        {pct !== null && !item.completed && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
            <div
              className="h-full bg-[#e50914]"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        {item.completed && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-[9px] font-mono text-white/60 bg-black/60 px-1 rounded">Done</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`View ${item.title.name}`}
        onClick={() => navigate(`/title/${item.title.id}?play=1`)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/title/${item.title.id}?play=1`); } }}
      >
        <p className="font-serif text-sm font-semibold text-ink leading-tight truncate">{item.title.name}</p>
        <p className="text-[10px] text-ink-dim font-mono mt-0.5">
          {typeLabel} · {item.title.year}
        </p>
        {subLabel && (
          <p className="text-[10px] text-ink-dim mt-0.5 truncate">{subLabel}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {pct !== null && !item.completed && (
            <span className="text-[9px] font-mono text-ink-faint">{pct}%</span>
          )}
          {item.positionSeconds > 0 && !item.completed && (
            <span className="text-[9px] font-mono text-ink-faint">
              {formatTime(item.positionSeconds)} watched
            </span>
          )}
          <span className="text-[9px] font-mono text-ink-faint ml-auto">{timeAgo(item.updatedAt)}</span>
        </div>
        {/* Progress bar */}
        {pct !== null && !item.completed && (
          <div className="mt-1.5 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-maroon-bright/70 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => navigate(`/title/${item.title.id}?play=1`)}
          className="flex items-center gap-1 text-[10px] font-mono px-2.5 py-1.5 rounded-lg bg-maroon/20 border border-maroon/40 text-ink hover:bg-maroon/30 transition-colors"
          title="Resume"
        >
          <Play size={10} />
          Resume
        </button>
        <button
          onClick={() => onRemove(item.titleId)}
          className="p-1.5 rounded-lg border border-white/10 text-ink-faint hover:text-ink hover:border-white/20 transition-colors"
          title="Remove from history"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

export default function WatchHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    api.history.mine()
      .then((data: ProgressItem[]) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user]);

  const handleRemove = useCallback((titleId: string) => {
    setItems(prev => prev.filter(i => i.titleId !== titleId));
    api.history.remove(titleId).catch(() => {});
  }, []);

  const handleClearAll = useCallback(async () => {
    if (!confirm('Clear your entire watch history? This cannot be undone.')) return;
    setClearing(true);
    try {
      await api.history.clear();
      setItems([]);
    } finally {
      setClearing(false);
    }
  }, []);

  const filtered = items.filter(i => {
    if (filter === 'in-progress') return !i.completed && i.positionSeconds > 10;
    if (filter === 'completed')   return i.completed;
    return true;
  });

  const inProgressCount = items.filter(i => !i.completed && i.positionSeconds > 10).length;
  const completedCount  = items.filter(i => i.completed).length;

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Clock size={36} className="text-ink-faint" />
        <p className="font-serif text-xl text-ink">Sign in to see your watch history</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-2 px-5 py-2 rounded-full bg-maroon text-white text-sm font-mono border border-maroon-bright/40 hover:bg-maroon/80 transition-colors"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-0 pb-32 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-ink-dim" />
          <h1 className="font-serif text-xl font-semibold text-ink">Watch History</h1>
          {items.length > 0 && (
            <span className="text-[10px] font-mono text-ink-faint bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="flex items-center gap-1.5 text-[10px] font-mono text-ink-faint border border-white/10 rounded-lg px-2.5 py-1.5 hover:text-ink hover:border-white/20 transition-colors disabled:opacity-40"
          >
            <Trash2 size={11} />
            {clearing ? 'Clearing…' : 'Clear all'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      {items.length > 0 && (
        <div className="flex gap-1.5 px-4 mb-3">
          {([
            { key: 'all',         label: `All (${items.length})` },
            { key: 'in-progress', label: `In Progress (${inProgressCount})` },
            { key: 'completed',   label: `Completed (${completedCount})` },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`text-[10px] font-mono px-3 py-1.5 rounded-full border transition-colors ${
                filter === tab.key
                  ? 'border-maroon-bright bg-maroon/20 text-ink'
                  : 'border-white/10 text-ink-faint hover:text-ink hover:border-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <InlineLoader label="Loading history…" minHeight={300} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center px-6">
          <Clock size={32} className="text-ink-faint/40" />
          <p className="font-serif text-lg text-ink-dim">Nothing watched yet</p>
          <p className="text-xs text-ink-faint">Titles you watch will appear here</p>
          <button
            onClick={() => navigate('/')}
            className="mt-3 px-5 py-2 rounded-full bg-maroon/20 border border-maroon/40 text-ink text-sm font-mono hover:bg-maroon/30 transition-colors"
          >
            Browse titles
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-ink-faint text-sm font-mono">
          No {filter === 'in-progress' ? 'in-progress' : 'completed'} titles
        </div>
      ) : (
        <div className="border-t border-white/[0.05]">
          {filtered.map(item => (
            <HistoryRow
              key={item.titleId}
              item={item}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
