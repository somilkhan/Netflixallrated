import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import Card from '../components/Card';

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [filters, setFilters] = useState({ type: '', genre: '', platform: '' });

  useEffect(() => { api.titles.list({ search: q, type: filters.type, genre: filters.genre, platform: filters.platform, limit: '50' }).then(d => setResults(d.titles)); }, [q, filters]);

  return (
    <div className="px-5 py-8">
      <h1 className="font-serif text-2xl font-semibold mb-6">Search: {q}</h1>
      <div className="flex gap-4 mb-6 flex-wrap">
        <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} className="bg-surface border border-line rounded-lg px-3 py-2 text-sm focus:border-maroon outline-none">
          <option value="">All Types</option><option value="MOVIE">Movies</option><option value="SERIES">Series</option><option value="ANIME">Anime</option>
        </select>
        <select value={filters.genre} onChange={e => setFilters(f => ({ ...f, genre: e.target.value }))} className="bg-surface border border-line rounded-lg px-3 py-2 text-sm focus:border-maroon outline-none">
          <option value="">All Genres</option><option value="Drama">Drama</option><option value="Action">Action</option><option value="Animation">Animation</option><option value="Comedy">Comedy</option><option value="Sci-Fi">Sci-Fi</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-4">{results.map((t, i) => <Card key={t.id} title={t} index={i} />)}</div>
    </div>
  );
}
