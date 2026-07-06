import CustomPlayer from '../components/CustomPlayer';
import CustomPlayer from '../components/CustomPlayer';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Meter from '../components/Meter';

const tiers = ['SKIP', 'TIMEPASS', 'GOFORIT', 'PERFECTION'];
const tierLabels: Record<string, string> = { SKIP: 'Skip', TIMEPASS: 'Timepass', GOFORIT: 'Go for it', PERFECTION: 'Perfection' };

export default function TitleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [title, setTitle] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [myTier, setMyTier] = useState('');
  const [review, setReview] = useState('');
  const [watchlistStatus, setWatchlistStatus] = useState('');

  useEffect(() => { if (!id) return; api.titles.get(id).then(setTitle); api.titles.ratings(id).then(setRatings); }, [id]);
  const submitRating = async () => { if (!myTier || !id) return; await api.titles.rate(id, { tier: myTier, reviewText: review || undefined }); const r = await api.titles.ratings(id); setRatings(r); };
  const addToWatchlist = async (status: string) => { if (!id) return; await api.watchlist.add({ titleId: id, status }); setWatchlistStatus(status); };
  if (!title) return <div className="p-10 text-ink-dim">Loading...</div>;

  return (
    <div className="px-5 py-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        <div
          className="w-[200px] h-[300px] rounded-xl border border-line shrink-0 bg-cover bg-center"
          style={{
            backgroundImage: title.posterUrl
              ? `linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.5)), url(${title.posterUrl})`
              : `radial-gradient(120% 100% at 30% 0%, ${title.posterColorFrom}, ${title.posterColorTo} 70%)`,
          }}
        />
        <div className="flex-1 space-y-4">
          <h1 className="font-serif text-4xl font-semibold">{title.name}</h1>
          <div className="font-mono text-xs text-ink-dim flex gap-2"><span>{title.year}</span>·<span>{title.type}</span>·<span>{title.genres.join(', ')}</span></div>
          <p className="text-ink-dim leading-relaxed">{title.synopsis}</p>
          {title.trailerYoutubeId && <div className="aspect-video rounded-xl overflow-hidden border border-line"><iframe className="w-full h-full" src={`https://www.youtube.com/embed/${title.trailerYoutubeId}`} title="Trailer" allowFullScreen /></div>}
          <div className="space-y-2">
            <h3 className="font-serif text-lg font-semibold">Where to watch</h3>
            <div className="flex gap-2 flex-wrap">{title.officialWatchLinks?.map((link: any) => <a key={link.platform} href={link.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-mono hover:border-maroon-bright transition-colors">{link.platform}</a>)}</div>
          </div>
          {user && (
            <div className="space-y-3 pt-4 border-t border-line">
              <h3 className="font-serif text-lg font-semibold">Your Rating</h3>
              <div className="flex gap-2">{tiers.map(t => <button key={t} onClick={() => setMyTier(t)} className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${myTier === t ? 'border-maroon-bright bg-maroon/20 text-ink' : 'border-line text-ink-dim hover:text-ink'}`}>{tierLabels[t]}</button>)}</div>
              <textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Write a review..." className="w-full bg-surface border border-line rounded-lg p-3 text-sm text-ink placeholder:text-ink-faint focus:border-maroon outline-none" rows={3} />
              <div className="flex gap-2">
                <button onClick={submitRating} className="px-4 py-2 bg-maroon-bright text-white rounded-lg text-sm font-semibold hover:bg-maroon transition-colors">Submit</button>
                <select onChange={e => addToWatchlist(e.target.value)} value={watchlistStatus} className="bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-maroon outline-none">
                  <option value="">Add to watchlist</option>
                  <option value="PLAN_TO_WATCH">Plan to Watch</option>
                  <option value="WATCHING">Watching</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DROPPED">Dropped</option>
                </select>
              </div>
            </div>
          )}
          <div className="space-y-3 pt-4 border-t border-line">
            <h3 className="font-serif text-lg font-semibold">Reviews ({ratings.length})</h3>
            {ratings.map((r: any) => (
              <div key={r.id} className="bg-surface border border-line rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1"><span className="font-mono text-xs text-ink-dim">{r.user?.displayName || 'Anonymous'}</span><Meter tier={r.tier} mini /></div>
                {r.reviewText && <p className="text-sm text-ink-dim">{r.reviewText}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    
      {/* Stream Player */}
      <div className="mt-6 px-4">
        <CustomPlayer
          tmdbId={title.tmdbId || id || ""}
          type={title.type === "SERIES" ? "tv" : "movie"}
          season={1}
          episode={1}
          title={title.name || title.title || "Unknown"}
          lang="en"
          anilistId={title.anilistId || ""}
          isAnime={title.type === "ANIME"}
        />
      </div>
</div>
  );
}
