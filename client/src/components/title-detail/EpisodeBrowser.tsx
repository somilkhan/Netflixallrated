import React, { useEffect, useMemo, useRef, useState } from 'react';
import { List, type RowComponentProps } from 'react-window';
import { ChevronDown } from 'lucide-react';
import { EpisodeListSkeleton } from './Skeletons';

export interface EpisodeItem {
  episodeNumber: number;
  name: string;
  overview?: string | null;
  stillUrl?: string | null;
  runtimeMinutes?: number | null;
  airDate?: string | null;
}

export interface SeasonItem {
  seasonNumber: number;
  name?: string | null;
  episodeCount?: number | null;
}

interface EpisodeBrowserProps {
  episodes: EpisodeItem[];
  loading?: boolean;
  selectedEp: number;
  onSelectEpisode: (episodeNumber: number) => void;
  seasons?: SeasonItem[];
  selectedSeason?: number;
  onSelectSeason?: (season: number) => void;
  seasonsLoading?: boolean;
  /** Episode number the user has partial/complete progress on, for the "Continue" badge. */
  continueEpisode?: number | null;
  continuePct?: number;
  emptyLabel?: string;
  /** Row height in px — must stay fixed for virtualization. */
  rowHeight?: number;
  maxListHeight?: number;
}

type RowProps = {
  items: EpisodeItem[];
  selectedEp: number;
  continueEpisode: number | null | undefined;
  continuePct: number;
  onSelectEpisode: (n: number) => void;
};

const MemoEpisodeRow = React.memo(function EpisodeRowInner({ index, style, items, selectedEp, continueEpisode, continuePct, onSelectEpisode }: RowComponentProps<RowProps>) {
  const ep = items[index];
  if (!ep) return null;
  const isActive = selectedEp === ep.episodeNumber;
  const isContinue = continueEpisode === ep.episodeNumber && continuePct > 0 && continuePct < 96;

  return (
    <div style={style}>
      <div
        className={`ep-row${isActive ? ' active' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`Episode ${ep.episodeNumber}${ep.name ? `: ${ep.name}` : ''}`}
        aria-pressed={isActive}
        onClick={() => onSelectEpisode(ep.episodeNumber)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectEpisode(ep.episodeNumber); } }}
      >
        <div className="ep-thumb">
          {ep.stillUrl
            ? <img src={ep.stillUrl} alt="" loading="lazy" decoding="async" />
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 8,19 19,12" /></svg>
          }
          {isContinue && (
            <div className="ep-thumb-progress">
              <div className="ep-thumb-progress-fill" style={{ width: `${continuePct}%` }} />
            </div>
          )}
        </div>
        <div className="ep-info">
          <div className="ep-info-top">
            <span className="ep-num">{ep.episodeNumber}.</span>
            <span className="ep-name">{ep.name}</span>
          </div>
          <div className="ep-info-meta">
            {isContinue && <span className="ep-continue-badge">Continue · {continuePct}%</span>}
            {ep.runtimeMinutes ? <span>{ep.runtimeMinutes}m</span> : null}
            {ep.airDate ? <span>{ep.airDate}</span> : null}
          </div>
          {ep.overview && <p className="ep-overview">{ep.overview}</p>}
        </div>
      </div>
    </div>
  );
});

/** Plain wrapper — react-window requires a bare function component reference for
 *  `rowComponent`; the memoized row underneath still avoids re-rendering when its
 *  own props haven't changed. */
function EpisodeRow(props: RowComponentProps<RowProps>) {
  return <MemoEpisodeRow {...props} />;
}

/** Debounces a fast-changing value (keystrokes) so filtering doesn't run on every render. */
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

/** Full episode-browsing experience: season selector (dropdown), search, a virtualized
 *  scrollable list (react-window — only visible rows are ever mounted, so
 *  100+ episode series stay smooth), thumbnails, metadata, and a
 *  "continue watching" indicator on the in-progress episode. Shared by both
 *  the Series and Anime sections of the detail page. */
export default function EpisodeBrowser({
  episodes,
  loading = false,
  selectedEp,
  onSelectEpisode,
  seasons = [],
  selectedSeason,
  onSelectSeason,
  seasonsLoading = false,
  continueEpisode = null,
  continuePct = 0,
  emptyLabel = 'No episodes found.',
  rowHeight = 122,
  maxListHeight = 440,
}: EpisodeBrowserProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 250);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return episodes;
    const q = debouncedSearch.toLowerCase();
    return episodes.filter(e =>
      String(e.episodeNumber).includes(q) || (e.name || '').toLowerCase().includes(q)
    );
  }, [episodes, debouncedSearch]);

  const rowProps: RowProps = useMemo(() => ({
    items: filtered,
    selectedEp,
    continueEpisode,
    continuePct,
    onSelectEpisode,
  }), [filtered, selectedEp, continueEpisode, continuePct, onSelectEpisode]);

  const listHeight = Math.min(maxListHeight, Math.max(filtered.length, 1) * rowHeight);

  return (
    <div>
      {/* Season selector — dropdown for cleaner UX on long season lists */}
      {seasonsLoading ? (
        <div className="anime-status pulse">Loading seasons…</div>
      ) : seasons.length > 0 && onSelectSeason && (
        <div className="season-selector">
          <select
            className="season-select"
            value={selectedSeason}
            onChange={e => onSelectSeason(parseInt(e.target.value, 10))}
            aria-label="Select season"
          >
            {seasons.map(s => (
              <option key={s.seasonNumber} value={s.seasonNumber}>
                {s.name || `Season ${s.seasonNumber}`}
                {s.episodeCount != null ? ` (${s.episodeCount} episodes)` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="season-select-arrow" size={18} />
        </div>
      )}

      {episodes.length > 5 && (
        <div className="ep-search">
          <svg className="ep-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="ep-search-input"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search episodes…"
          />
          {search && (
            <button className="ep-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {loading ? (
        <EpisodeListSkeleton count={5} />
      ) : filtered.length === 0 ? (
        <div className="empty-note">{emptyLabel}</div>
      ) : (
        <div ref={listContainerRef} className="ep-list-virtual">
          <List
            rowComponent={EpisodeRow}
            rowCount={filtered.length}
            rowHeight={rowHeight}
            rowProps={rowProps}
            style={{ height: listHeight }}
            overscanCount={4}
          />
        </div>
      )}
    </div>
  );
}
