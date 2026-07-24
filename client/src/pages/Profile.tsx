/**
 * Profile page — user avatar, watch history, watchlist, account section.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Clock, Bookmark, Settings, LogOut,
  Edit2, Play, ChevronRight, Shield,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Avatar } from '../components/ui/Avatar';
import ContentCard from '../components/ui/ContentCard';
import { BUILD_INFO } from '../lib/version';

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

export default function Profile() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  const [history,   setHistory]   = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loadingH,  setLoadingH]  = useState(true);
  const [loadingW,  setLoadingW]  = useState(true);

  useEffect(() => {
    if (!user) return;
    api.history.mine()
      .then((data: any[]) => setHistory(data.slice(0, 12)))
      .catch(() => setHistory([]))
      .finally(() => setLoadingH(false));
    api.watchlist.mine()
      .then((data: any[]) => setWatchlist(data.slice(0, 12)))
      .catch(() => setWatchlist([]))
      .finally(() => setLoadingW(false));
  }, [user]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    nav('/');
  }, [signOut, nav]);

  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6 px-6 text-center pt-20">
        <div className="w-20 h-20 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
          <User size={36} className="text-white/30" />
        </div>
        <div>
          <p className="text-xl font-semibold text-white mb-1">Sign in to your account</p>
          <p className="text-sm text-white/40">Track what you watch, build your list</p>
        </div>
        <button
          type="button"
          onClick={() => nav('/login')}
          className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => nav('/register')}
          className="text-sm text-white/50 hover:text-white transition-colors"
        >
          Create an account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pb-32 pt-24">

      {/* ── User card ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-white/[0.08] p-6 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-5"
        style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }}
      >
        <Avatar
          src={user.avatarUrl}
          name={user.displayName}
          email={user.email}
          size={80}
          className="shrink-0"
        />

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-white tracking-tight truncate">
            {user.displayName || 'User'}
          </h1>
          <p className="text-sm text-white/45 mt-0.5 truncate">{user.email}</p>

          {user.role === 'ADMIN' && (
            <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-white/50 bg-white/[0.06] border border-white/[0.10] rounded-full px-2 py-0.5 uppercase tracking-wide">
              <Shield size={9} /> Admin
            </span>
          )}

          <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
            <button
              type="button"
              className="
                flex items-center gap-1.5 h-9 px-4 rounded-full text-sm
                bg-white/[0.08] border border-white/[0.10] text-white/70
                hover:bg-white/[0.12] hover:text-white transition-colors
              "
            >
              <Edit2 size={13} />
              Edit Profile
            </button>

            {user.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => nav('/admin')}
                className="
                  flex items-center gap-1.5 h-9 px-4 rounded-full text-sm
                  bg-white/[0.08] border border-white/[0.10] text-white/70
                  hover:bg-white/[0.12] hover:text-white transition-colors
                "
              >
                <Shield size={13} />
                Admin Panel
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="
                flex items-center gap-1.5 h-9 px-4 rounded-full text-sm
                bg-white/[0.04] border border-white/[0.08] text-white/45
                hover:bg-white/[0.08] hover:text-white/80 transition-colors
              "
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ── Watch History ─────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-white/50" />
            <h2 className="text-lg font-semibold text-white">Watch History</h2>
          </div>
          <button
            type="button"
            onClick={() => nav('/history')}
            className="flex items-center gap-0.5 text-sm text-white/40 hover:text-white transition-colors"
          >
            View All <ChevronRight size={14} />
          </button>
        </div>

        {loadingH ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[130px]">
                <div className="aspect-[2/3] rounded-xl bg-white/[0.05] animate-pulse mb-2" />
                <div className="h-3 bg-white/[0.04] rounded-full w-4/5 animate-pulse" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center rounded-xl border border-white/[0.06]"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <Clock size={28} className="text-white/15" />
            <p className="text-sm text-white/35">Nothing watched yet</p>
            <button
              type="button"
              onClick={() => nav('/')}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              Browse titles
            </button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {history.map((item: any) => {
              const pct = item.durationSeconds > 0
                ? Math.min(100, Math.round((item.positionSeconds / item.durationSeconds) * 100))
                : null;
              return (
                <div
                  key={item.titleId}
                  role="button"
                  tabIndex={0}
                  onClick={() => nav(`/title/${item.title.id}?play=1`)}
                  onKeyDown={e => { if (e.key === 'Enter') nav(`/title/${item.title.id}?play=1`); }}
                  className="
                    group shrink-0 w-[130px] cursor-pointer
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-xl
                  "
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/[0.05] mb-2">
                    {item.title.posterUrl && (
                      <img
                        src={item.title.posterUrl}
                        alt={item.title.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    {/* Play overlay */}
                    <div className="
                      absolute inset-0 bg-black/40
                      opacity-0 group-hover:opacity-100 transition-opacity
                      flex items-center justify-center
                    ">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                        <Play size={14} className="fill-black text-black ml-0.5" />
                      </div>
                    </div>
                    {/* Progress */}
                    {pct !== null && !item.completed && (
                      <div className="absolute bottom-0 inset-x-0 h-[3px] bg-white/10">
                        <div className="h-full bg-white/65" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    {item.completed && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[8px] text-white/70 bg-black/70 border border-white/10 rounded px-1.5 py-0.5 font-mono">
                          Done
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] font-medium text-white leading-tight line-clamp-2">{item.title.name}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{timeAgo(item.updatedAt)}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── My List ──────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bookmark size={16} className="text-white/50" />
            <h2 className="text-lg font-semibold text-white">My List</h2>
          </div>
          <button
            type="button"
             onClick={() => nav('/my-list')}
            className="flex items-center gap-0.5 text-sm text-white/40 hover:text-white transition-colors"
          >
            View All <ChevronRight size={14} />
          </button>
        </div>

        {loadingW ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[130px]">
                <div className="aspect-[2/3] rounded-xl bg-white/[0.05] animate-pulse mb-2" />
                <div className="h-3 bg-white/[0.04] rounded-full w-4/5 animate-pulse" />
              </div>
            ))}
          </div>
        ) : watchlist.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center rounded-xl border border-white/[0.06]"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <Bookmark size={28} className="text-white/15" />
            <p className="text-sm text-white/35">Your list is empty</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {watchlist.map((item: any) => (
              <ContentCard
                key={item.id}
                title={item.title}
                className="!w-[130px]"
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Account ──────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={16} className="text-white/50" />
          <h2 className="text-lg font-semibold text-white">Account</h2>
        </div>

        <div
          className="rounded-2xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.05]"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          {[
            { icon: Edit2,   label: 'Change Display Name', action: () => {} },
            { icon: Settings, label: 'Preferences',          action: () => {} },
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className="
                w-full flex items-center gap-3 px-4 py-3.5
                text-sm text-white/70 hover:text-white hover:bg-white/[0.03]
                transition-colors text-left
              "
            >
              <Icon size={15} className="text-white/35 shrink-0" />
              {label}
              <ChevronRight size={14} className="ml-auto text-white/25" />
            </button>
          ))}

          <button
            type="button"
            onClick={handleSignOut}
            className="
              w-full flex items-center gap-3 px-4 py-3.5
              text-sm text-white/45 hover:text-white hover:bg-white/[0.03]
              transition-colors text-left
            "
          >
            <LogOut size={15} className="text-white/30 shrink-0" />
            Sign Out
          </button>
        </div>
      </section>

      {/* ── Version Info ─────────────────────────────────────────────────── */}
      <div className="mt-12 pt-6 border-t border-white/[0.04] text-center">
        <p className="text-[10px] font-mono text-white/20">
          ALLRATED CINEMA · BUILD {BUILD_INFO.sha} ({BUILD_INFO.branch})
        </p>
        <p className="text-[9px] font-mono text-white/15 mt-1">
          Released: {BUILD_INFO.date !== 'dev' ? new Date(BUILD_INFO.date).toLocaleString() : 'Local Development'}
        </p>
      </div>
    </div>
  );
}
