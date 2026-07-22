import { useEffect, useMemo, useState } from 'react';
import { Download, HardDrive, Trash2, WifiOff, Wifi, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ContentCard from '../components/ui/ContentCard';

type DownloadItem = {
  id: string;
  title: any;
  progress: number;
  quality: 'SD' | 'HD' | '4K';
  sizeMb: number;
  downloadedAt: string;
};

const STORAGE_KEY = 'allrated_downloads';

function readDownloads(): DownloadItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export default function Downloads() {
  const nav = useNavigate();
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    setItems(readDownloads());
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const save = (next: DownloadItem[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const usedMb = useMemo(() => items.reduce((total, item) => total + item.sizeMb * (item.progress / 100), 0), [items]);
  const capacityMb = 10 * 1024;
  const usedPercent = Math.min(100, (usedMb / capacityMb) * 100);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[88px] pb-32">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-white/45">
            <Download size={17} />
            <span className="text-[11px] uppercase tracking-[0.18em]">Offline library</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Downloads</h1>
          <p className="mt-1 text-sm text-white/35">Watch saved titles without a connection.</p>
        </div>
        <div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${online ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-200/75' : 'border-amber-400/20 bg-amber-400/5 text-amber-100/80'}`}>
          {online ? <Wifi size={14} /> : <WifiOff size={14} />}
          {online ? 'Online' : 'Offline'}
        </div>
      </div>

      <section className="mb-8 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-white/65"><HardDrive size={15} /> Storage</div>
          <span className="text-xs text-white/35">{(usedMb / 1024).toFixed(1)} GB of 10 GB</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-white/75 transition-all" style={{ width: `${usedPercent}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-white/30">
          <span>{items.length} {items.length === 1 ? 'download' : 'downloads'}</span>
          <span>{Math.max(0, 10 - usedMb / 1024).toFixed(1)} GB available</span>
        </div>
      </section>

      {items.length > 0 && (
        <div className="mb-5 flex justify-end">
          <button type="button" onClick={() => save([])} className="flex items-center gap-2 rounded-lg border border-red-400/15 px-3 py-2 text-xs text-red-200/65 hover:border-red-400/30 hover:text-red-100">
            <Trash2 size={14} /> Delete all
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.02] px-6 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.08] bg-white/[0.04]">
            <Download size={34} className="text-white/25" />
          </div>
          <h2 className="text-xl font-semibold text-white">No downloads yet</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">Download a title from its detail page to watch it offline.</p>
          <button type="button" onClick={() => nav('/browse')} className="mt-6 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90">Browse titles</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map(item => (
            <div key={item.id} className="group relative">
              <ContentCard title={item.title} fluid />
              <button type="button" onClick={() => save(items.filter(entry => entry.id !== item.id))} aria-label={`Delete ${item.title.name} download`} className="absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white/80 hover:bg-red-500 hover:text-white">
                <X size={14} />
              </button>
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-white/45">
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-semibold text-white/70">{item.quality}</span>
                <span>{item.progress}% · {(item.sizeMb / 1024).toFixed(1)} GB</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-emerald-400/80" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}