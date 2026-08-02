/**
 * HeroSection — backward-compatible wrapper around unified Hero.
 * Accepts raw title objects and maps them to HeroItem shape.
 */
import { useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../ui/Hero';

interface HeroSectionProps {
  titles: unknown[];
  onAction?: (item: unknown, play: boolean) => void;
  regionLabel?: string;
}

const HeroSection = memo(function HeroSection({ titles, onAction, regionLabel }: HeroSectionProps) {
  const nav = useNavigate();

  const items = titles.map((t: any) => ({
    id: String(t.id),
    name: t.name || 'Untitled',
    backdropUrl: t.backdropUrl || t.posterUrl || null,
    posterUrl: t.posterUrl || null,
    synopsis: t.synopsis || '',
    genres: t.genres || [],
    rating: t.rating || t.imdbRating || t.voteAverage || null,
    year: t.year || null,
    type: t.type || '',
    trailerYoutubeId: t.trailerYoutubeId || null,
  }));

  const handleAction = useCallback((item: any, play: boolean) => {
    if (onAction) {
      const idx = items.findIndex(i => i.id === item.id);
      onAction(titles[idx], play);
    } else {
      nav(`/title/${item.id}${play ? '?play=1' : ''}`);
    }
  }, [onAction, titles, items, nav]);

  return (
    <Hero
      items={items}
      variant="hero"
      regionLabel={regionLabel}
      onAction={handleAction}
    />
  );
});

export default HeroSection;
