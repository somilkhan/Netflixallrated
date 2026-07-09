/**
 * AnimeGenres — browse every AniList genre and media tag.
 *
 * Fetches the complete live genre list and tag collection from AniList,
 * lets the user search/filter them, and shows an inline live preview row
 * when a genre or tag is selected.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnimeGenresAndTags, getAnimePage } from '../lib/anilist';
import AniCard from '../components/AniCard';
import { GlassCardSkeleton } from '../components/GlassCard';

interface TagEntry { name: string; category: string }

type SelectionType = { kind: 'genre' | 'tag'; value: string } | null;

// ── Tag category colours (subtle tints) ────────────────────────────────────
const CATEGORY_HUE: Record<string, string> = {
  'Cast-Main Character':   'rgba(194,67,79,0.12)',
  'Cast-Supporting':       'rgba(122,37,48,0.12)',
  'Theme-Action':          'rgba(194,120,60,0.10)',
  'Theme-Drama':           'rgba(80,120,194,0.10)',
  'Theme-Romance':         'rgba(194,80,120,0.12)',
  'Theme-Fantasy':         'rgba(120,80,194,0.10)',
  'Technical':             'rgba(80,180,160,0.10)',
};
const fallbackBg = 'rgba(255,255,255,0.04)';

export default function AnimeGenres() {
  const nav = useNavigate();

  // ── Metadata ──────────────────────────────────────────────────────────────
  const [genres, setGenres]     = useState<string[]>([]);
  const [tags, setTags]         = useState<TagEntry[]>([]);
  const [metaState, setMetaState] = useState<'loading' | 'done' | 'error'>('loading');

  // ── Filter input ──────────────────────────────────────────────────────────
  const [filter, setFilter] = useState('');

  // ── Selected genre / tag and its preview row ──────────────────────────────
  const [selection, setSelection]     = useState<SelectionType>(null);
  const [preview, setPreview]         = useState<any[]>([]);
  const [previewState, setPreviewState] =
    useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  // ── Fetch metadata on mount ───────────────────────────────────────────────
  useEffect(() => {
    getAnimeGenresAndTags()
      .then(({ genres: g, tags: t }) => {
        setGenres(g);
        setTags(t as TagEntry[]);
        setMetaState('done');
      })
      .catch(() => setMetaState('error'));
  }, []);

  // ── Handle selection ──────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (kind: 'genre' | 'tag', value: string) => {
      // Toggle off
      if (selection?.value === value) {
        setSelection(null);
        setPreview([]);
        setPreviewState('idle');
        return;
      }
      setSelection({ kind, value });
      setPreview([]);
      setPreviewState('loading');

      const params = kind === 'genre'
        ? { genre: value, sort: 'POPULARITY_DESC', perPage: 16 }
        : { tag: value,   sort: 'POPULARITY_DESC', perPage: 16 };

      getAnimePage(params)
        .then((media: any[]) => { setPreview(media); setPreviewState('done'); })
        .catch(() => setPreviewState('error'));
    },
    [selection]
  );

  // ── Filtered lists ────────────────────────────────────────────────────────
  const q = filter.toLowerCase();
  const filteredGenres = genres.filter(g => g.toLowerCase().includes(q));
  const filteredTags   = tags.filter(t => t.name.toLowerCase().includes(q));

  // Group tags by category for better scanability
  const tagsByCategory = filteredTags.reduce<Record<string, TagEntry[]>>((acc, t) => {
    const cat = t.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const tagCategories = Object.keys(tagsByCategory).sort();

  return (
    <div className="min-h-screen bg-void">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_80%_100%_at_10%_0%,rgba(122,37,48,0.22),transparent_65%)]" />

        <div className="relative px-5 pt-10 pb-8">
          <button
            onClick={() => nav('/anime')}
            className="flex items-center gap-1.5 font-mono text-[11px] text-ink-faint
              hover:text-ink transition-colors mb-6"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Anime
          </button>

          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-maroon-bright/70
            flex items-center gap-1.5 mb-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-maroon-bright animate-pulse" />
            Live from AniList
          </span>
          <h1 className="font-serif text-[44px] md:text-[56px] font-semibold tracking-tight leading-none text-ink mb-2">
            Browse All
          </h1>
          <p className="font-mono text-sm text-ink-faint">
            Genres &amp; media tags — select one to see a live preview
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-void to-transparent pointer-events-none" />
      </div>

      {/* ── Sticky search bar ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 px-5 py-3 bg-void/85 backdrop-blur-md border-b border-line">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter genres &amp; tags…"
            className="w-full bg-surface/70 border border-line rounded-full pl-9 pr-4 py-2
              text-sm text-ink placeholder:text-ink-faint outline-none
              focus:border-maroon-bright/50 transition-colors"
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink
                transition-colors font-mono text-xs"
            >
              ✕
            </button>
          )}
        </div>
        {metaState === 'done' && (
          <p className="font-mono text-[10px] text-ink-faint mt-1.5">
            {filteredGenres.length} genre{filteredGenres.length !== 1 ? 's' : ''}
            {' '}· {filteredTags.length} tag{filteredTags.length !== 1 ? 's' : ''}
            {filter && ' matching'}
          </p>
        )}
      </div>

      {/* ── Live preview row ──────────────────────────────────────────────── */}
      {selection && (
        <div className="border-b border-line bg-surface/30">
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-serif text-xl font-semibold">{selection.value}</span>
              <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5
                rounded-full border border-line text-ink-faint">
                {selection.kind}
              </span>
              <button
                onClick={() => { setSelection(null); setPreview([]); setPreviewState('idle'); }}
                className="ml-auto font-mono text-xs text-ink-faint hover:text-ink transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="font-mono text-[10px] text-ink-faint mb-4">
              live · anilist
            </p>

            {previewState === 'loading' && (
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3">
                {Array.from({ length: 7 }).map((_, i) => <GlassCardSkeleton key={i} />)}
              </div>
            )}
            {previewState === 'error' && (
              <p className="font-mono text-sm text-ink-faint py-4">Failed to load preview.</p>
            )}
            {previewState === 'done' && preview.length === 0 && (
              <p className="font-mono text-sm text-ink-faint py-4">No anime found for this {selection.kind}.</p>
            )}
            {previewState === 'done' && preview.length > 0 && (
              <div
                className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide overscroll-x-contain"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {preview.map(anime => <AniCard key={anime.id} anime={anime} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Loading / error state for metadata ───────────────────────────── */}
      {metaState === 'loading' && (
        <div className="px-5 pt-10">
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-faint mb-4">Genres</div>
          <div className="flex flex-wrap gap-2 mb-10">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="h-8 rounded-full bg-surface animate-pulse"
                style={{ width: `${60 + (i * 17) % 60}px` }} />
            ))}
          </div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-faint mb-4">Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="h-6 rounded-full bg-surface/60 animate-pulse"
                style={{ width: `${48 + (i * 13) % 50}px` }} />
            ))}
          </div>
        </div>
      )}

      {metaState === 'error' && (
        <div className="px-5 pt-20 text-center">
          <p className="font-mono text-sm text-ink-faint">
            Failed to load genres &amp; tags.{' '}
            <button
              onClick={() => window.location.reload()}
              className="text-maroon-bright hover:underline"
            >
              Retry
            </button>
          </p>
        </div>
      )}

      {/* ── Genres ───────────────────────────────────────────────────────── */}
      {metaState === 'done' && (
        <div className="px-5 pt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
              Genres
            </span>
            <span className="font-mono text-[10px] text-ink-faint/50">{filteredGenres.length}</span>
          </div>

          {filteredGenres.length === 0 ? (
            <p className="font-mono text-sm text-ink-faint py-2">No genres match "{filter}".</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredGenres.map(genre => {
                const active = selection?.value === genre;
                return (
                  <button
                    key={genre}
                    onClick={() => handleSelect('genre', genre)}
                    className={`font-mono text-xs px-4 py-1.5 rounded-full border transition-all duration-200 ${
                      active
                        ? 'bg-maroon/30 border-maroon text-ink shadow-[0_0_14px_-4px_rgba(194,67,79,0.4)]'
                        : 'bg-surface/60 border-line text-ink-faint hover:text-ink hover:border-line-bright'
                    }`}
                  >
                    {genre}
                    {active && (
                      <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-maroon-bright" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tags (grouped by category) ───────────────────────────────────── */}
      {metaState === 'done' && (
        <div className="px-5 pt-10 pb-24">
          <div className="flex items-center gap-2 mb-6">
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
              Media Tags
            </span>
            <span className="font-mono text-[10px] text-ink-faint/50">{filteredTags.length}</span>
          </div>

          {filteredTags.length === 0 ? (
            <p className="font-mono text-sm text-ink-faint py-2">No tags match "{filter}".</p>
          ) : (
            <div className="space-y-8">
              {tagCategories.map(cat => (
                <div key={cat}>
                  {/* Only show category header when not filtering */}
                  {!filter && (
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink-faint/60 mb-2.5">
                      {cat}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {tagsByCategory[cat].map(tag => {
                      const active = selection?.value === tag.name;
                      const bg = CATEGORY_HUE[cat] || fallbackBg;
                      return (
                        <button
                          key={tag.name}
                          onClick={() => handleSelect('tag', tag.name)}
                          className={`font-mono text-[10.5px] px-3 py-1 rounded-full border transition-all duration-200 ${
                            active
                              ? 'border-maroon/60 text-ink shadow-[0_0_10px_-4px_rgba(194,67,79,0.35)]'
                              : 'border-white/[0.07] text-ink-faint hover:text-ink hover:border-white/20'
                          }`}
                          style={{ background: active ? 'rgba(122,37,48,0.25)' : bg }}
                        >
                          {tag.name}
                          {active && (
                            <span className="ml-1 inline-block w-1 h-1 rounded-full bg-maroon-bright" />
                          )}
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
