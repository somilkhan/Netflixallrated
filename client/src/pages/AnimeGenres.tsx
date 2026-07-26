/**
 * AnimeGenres — browse every AniList genre and media tag.
 * Netflix-style: dark background, pill filters, inline tag preview row.
 * Genre clicks → /browse/genre/:slug. Tag clicks → inline preview.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ChevronLeft } from 'lucide-react';
import { getAnimeGenresAndTags, getAnimePage } from '../lib/anilist';
import AniCard from '../components/AniCard';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { slugify } from '../lib/slug';

interface TagEntry { name: string; category: string }
type SelectionType = { kind: 'tag'; value: string } | null;

export default function AnimeGenres() {
  const nav = useNavigate();

  const [genres, setGenres]             = useState<string[]>([]);
  const [tags, setTags]                 = useState<TagEntry[]>([]);
  const [metaState, setMetaState]       = useState<'loading' | 'done' | 'error'>('loading');
  const [filter, setFilter]             = useState('');
  const [tagSelection, setTagSel]       = useState<SelectionType>(null);
  const [preview, setPreview]           = useState<any[]>([]);
  const [previewState, setPreviewState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    getAnimeGenresAndTags()
      .then(({ genres: g, tags: t }) => {
        setGenres(g);
        setTags(t as TagEntry[]);
        setMetaState('done');
      })
      .catch(() => setMetaState('error'));
  }, []);

  const handleGenreClick = useCallback((genre: string) => {
    nav(`/browse/genre/${slugify(genre)}`);
  }, [nav]);

  const handleTagClick = useCallback((tag: string) => {
    if (tagSelection?.value === tag) {
      setTagSel(null);
      setPreview([]);
      setPreviewState('idle');
      return;
    }
    setTagSel({ kind: 'tag', value: tag });
    setPreview([]);
    setPreviewState('loading');
    getAnimePage({ tag, sort: 'POPULARITY_DESC', perPage: 16 })
      .then((media: any[]) => { setPreview(media); setPreviewState('done'); })
      .catch(() => setPreviewState('error'));
  }, [tagSelection]);

  const q = filter.toLowerCase();
  const filteredGenres = genres.filter(g => g.toLowerCase().includes(q));
  const filteredTags   = tags.filter(t => t.name.toLowerCase().includes(q));

  const tagsByCategory = filteredTags.reduce<Record<string, TagEntry[]>>((acc, t) => {
    const cat = t.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});
  const tagCategories = Object.keys(tagsByCategory).sort();

  return (
    <div className="min-h-screen pb-32 pt-20" style={{ background: '#0A0A0A' }}>

      {/* Page header */}
      <div className="px-4 md:px-6 pt-4 pb-6">
        <button
          onClick={() => nav('/anime')}
          className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white transition-colors mb-5"
        >
          <ChevronLeft size={14} strokeWidth={2.2} />
          Back to Anime
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/35 font-medium">
            Live from AniList
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-none mb-2">
          Browse All
        </h1>
        <p className="text-sm text-white/40">
          Genres open the genre page · Tags show a live preview row
        </p>
      </div>

      {/* Sticky search */}
      <div
        className="sticky top-16 z-20 px-4 md:px-6 py-3 border-b border-white/[0.06]"
        style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="relative max-w-md">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter genres & tags…"
            className="
              w-full rounded-full pl-9 pr-9 py-2
              text-sm text-white placeholder:text-white/30
              border border-white/[0.10] bg-white/[0.06]
              outline-none focus:border-white/[0.22] focus:bg-white/[0.08]
              transition-colors
            "
          />
          {filter && (
            <button
              aria-label="Clear filter"
              onClick={() => setFilter('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
        {metaState === 'done' && (
          <p className="text-[10px] text-white/30 mt-1.5">
            {filteredGenres.length} genre{filteredGenres.length !== 1 ? 's' : ''}
            {' '}· {filteredTags.length} tag{filteredTags.length !== 1 ? 's' : ''}
            {filter && ' matching'}
          </p>
        )}
      </div>

      {/* Tag preview row */}
      {tagSelection && (
        <div className="border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="px-4 md:px-6 pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-white">{tagSelection.value}</h3>
              <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-white/[0.10] text-white/40">tag</span>
              <button
                aria-label="Close tag preview"
                onClick={() => { setTagSel(null); setPreview([]); setPreviewState('idle'); }}
                className="ml-auto text-white/40 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[10px] text-white/30 mb-4 uppercase tracking-wider">live · anilist</p>

            {previewState === 'loading' && (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="shrink-0 w-[140px]"><SkeletonCard /></div>
                ))}
              </div>
            )}
            {previewState === 'error' && (
              <p className="text-sm text-white/40 py-4">Failed to load preview.</p>
            )}
            {previewState === 'done' && preview.length === 0 && (
              <p className="text-sm text-white/40 py-4">No anime found for this tag.</p>
            )}
            {previewState === 'done' && preview.length > 0 && (
              <div
                className="flex gap-3 md:gap-4 overflow-x-auto pb-3 scrollbar-hide"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {preview.map(anime => <AniCard key={anime.id} anime={anime} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {metaState === 'loading' && (
        <div className="px-4 md:px-6 pt-8">
          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-4 font-medium">Genres</div>
          <div className="flex flex-wrap gap-2 mb-10">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="h-8 rounded-full bg-white/[0.06] animate-pulse"
                style={{ width: `${60 + (i * 17) % 60}px` }} />
            ))}
          </div>
          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-4 font-medium">Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="h-6 rounded-full bg-white/[0.04] animate-pulse"
                style={{ width: `${48 + (i * 13) % 50}px` }} />
            ))}
          </div>
        </div>
      )}

      {metaState === 'error' && (
        <div className="px-4 pt-20 text-center">
          <p className="text-sm text-white/40">
            Failed to load genres &amp; tags.{' '}
            <button onClick={() => window.location.reload()} className="text-white/60 hover:text-white underline underline-offset-2">
              Retry
            </button>
          </p>
        </div>
      )}

      {/* Genres */}
      {metaState === 'done' && (
        <div className="px-4 md:px-6 pt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium">Genres</span>
            <span className="text-[10px] text-white/25">{filteredGenres.length}</span>
            <span className="text-[9px] text-white/20 ml-auto">click to open genre page</span>
          </div>

          {filteredGenres.length === 0 ? (
            <p className="text-sm text-white/40 py-2">No genres match "{filter}".</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredGenres.map(genre => (
                <button
                  key={genre}
                  onClick={() => handleGenreClick(genre)}
                  className="
                    text-xs px-4 py-1.5 rounded-full border transition-all duration-200
                    border-white/[0.10] bg-white/[0.04] text-white/50
                    hover:text-white hover:border-white/[0.25] hover:bg-white/[0.08]
                  "
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tags grouped by category */}
      {metaState === 'done' && (
        <div className="px-4 md:px-6 pt-10 pb-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium">Media Tags</span>
            <span className="text-[10px] text-white/25">{filteredTags.length}</span>
            <span className="text-[9px] text-white/20 ml-auto">click to preview</span>
          </div>

          {filteredTags.length === 0 ? (
            <p className="text-sm text-white/40 py-2">No tags match "{filter}".</p>
          ) : (
            <div className="space-y-8">
              {tagCategories.map(cat => (
                <div key={cat}>
                  {!filter && (
                    <div className="text-[10px] uppercase tracking-widest text-white/25 mb-2.5 font-medium">{cat}</div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {tagsByCategory[cat].map(tag => {
                      const active = tagSelection?.value === tag.name;
                      return (
                        <button
                          key={tag.name}
                          onClick={() => handleTagClick(tag.name)}
                          className={`
                            text-[10.5px] px-3 py-1 rounded-full border transition-all duration-200
                            ${active
                              ? 'border-white/30 bg-white/[0.12] text-white'
                              : 'border-white/[0.07] bg-white/[0.03] text-white/40 hover:text-white/70 hover:border-white/[0.16] hover:bg-white/[0.06]'
                            }
                          `}
                        >
                          {tag.name}
                          {active && <span className="ml-1.5 inline-block w-1 h-1 rounded-full bg-white/60 align-middle" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
