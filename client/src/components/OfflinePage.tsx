import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[.04]">
          <WifiOff className="text-white/60" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-white">You’re offline</h1>
        <p className="mt-3 text-sm leading-6 text-white/50">Reconnect to keep discovering movies, series, and anime.</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black">
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    </main>
  );
}