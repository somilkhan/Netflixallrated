import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tv, Inbox } from 'lucide-react';
import { api } from '../lib/api';
import Card from '../components/Card';
import Section from '../components/Section';
import { GlassCardSkeleton } from '../components/GlassCard';

export default function TV() {
  const nav = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState('');
  const [all, setAll] = useState<any[]>([]);
  const [genreSections, setGenreSections] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [genreList, setGenreList] = useState<string[]>([]);

  useEffect(() => {
    api.titles.genres()
      .then(({ genres }: { genres: { genre: string; count: number }[] }) => {
        setGenreList(genres.slice(0, 12).map(g => g.genre));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.titles.list({ type: 'SERIES', limit: '50', ...(selectedGenre ? { genre: selectedGenre } : {}) })
      .then(d => { setAll(d.titles || []); })
      .catch(() => { setAll([]); })
      .finally(() => { setLoading(false); });
  }, [selectedGenre]);

  useEffect(() => {
    if (selectedGenre || genreList.length === 0) return;
    Promise.all(
      genreList.map(g =>
        api.titles.list({ type: 'SERIES', genre: g, limit: '20' })
          .then(d => [g, d.titles || []] as [string, any[]])
          .catch(() => [g, []] as [string, any[]])
      )
    ).then(results => {
      setGenreSections(Object.fromEntries(results.filter(([, t]) => t.length > 0)));
    });
  }, [selectedGenre, genreList]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_70%_120%_at_5%_0%,rgba(122,37,48,0.18),transparent_60%)]" />
        <div className="relative px-5 pt-10 pb-7">
          <div className="flex items-center gap-3 mb-1.5">
            <Tv size={20} className="text-maroon-bright shrink-0" strokeWidth={1.8} />
            <h1 className="font-serif text-[32px] font-semibold tracking-tight text-ink leading-none">TV Shows</h1>
          </div>
          <p className="font-sans text-[13.5px] text-ink-faint ml-[31px]">
            Series, dramas, documentaries &amp; more
          </p>
        </div>
      </div>

      {/* Genre filter pills */}
      <div className="px-5 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-b border-line/50">
        <button
          onClick={() => setSelectedGenre('')}
          className={`shrink-0 font-mono text-[11px] px-3.5 py-1.5 rounded-full border transition-all ${
            !selectedGenre ? 'bg-ink text-void border-ink' : 'bg-surface border-line text-ink-faint hover:text-ink hover:border-line-bright'
          }`}
        >All</button>
        {genreList.map(g => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g === selectedGenre ? '' : g)}
            className={`shrink-0 font-mono text-[11px] px-3.5 py-1.5 rounded-full border transition-all ${
              selectedGenre === g ? 'bg-maroon/20 border-maroon text-ink' : 'bg-surface border-line text-ink-faint hover:text-ink hover:border-line-bright'
            }`}
          >{g}</button>
        ))}
      </div>

      {/* Filtered view */}
      {selectedGenre ? (
        <div className="px-5 pt-8">
          <div className="flex items-baseline gap-2 mb-5">
            <span className="font-serif text-[22px] font-semibold">{selectedGenre}</span>
            {!loading && <span className="font-mono text-[11px] text-ink-faint">{all.length} shows</span>}
          </div>
          {loading ? (
            <div className="flex flex-wrap gap-3.5">
              {Array.from({ length: 10 }).map((_, i) => <GlassCardSkeleton key={i} />)}
            </div>
          ) : all.length > 0 ? (
            <div className="flex flex-wrap gap-3.5">
              {all.map(t => <Card key={t.id} title={t} />)}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Inbox size={36} className="mx-auto text-ink-faint/30 mb-4" />
              <p className="font-serif text-lg text-ink">No {selectedGenre} shows yet</p>
              <p className="text-ink-faint text-sm mt-1">Check back soon as the catalog grows</p>
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="px-5 pt-8 flex flex-wrap gap-3.5">
          {Array.from({ length: 10 }).map((_, i) => <GlassCardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          {all.length > 0 && (
            <Section title="All TV Shows" count={`${all.length}`} viewAllPath="/search?q=&type=SERIES">
              {all.map(t => <Card key={t.id} title={t} />)}
            </Section>
          )}
          {genreList.map(g => {
            const titles = genreSections[g];
            if (!titles || titles.length === 0) return null;
            return (
              <Section key={g} title={g} count={`${titles.length}`} viewAllPath={`/search?q=&type=SERIES&genre=${g}`}>
                {titles.map(t => <Card key={t.id} title={t} />)}
              </Section>
            );
          })}
          {all.length === 0 && Object.keys(genreSections).length === 0 && (
            <div className="py-20 text-center">
              <Tv size={40} className="mx-auto text-ink-faint/30 mb-5" strokeWidth={1.5} />
              <p className="font-serif text-xl font-semibold mb-2">No TV shows yet</p>
              <p className="text-ink-faint text-sm">
                The catalog is being populated.{' '}
                <button onClick={() => nav('/admin')} className="text-maroon-bright hover:underline">Add shows</button>
                {' '}or wait for auto-sync.
              </p>
            </div>
          )}
        </>
      )}
      <div className="h-28" />
    </div>
  );
}
