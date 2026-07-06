/**
 * RatingWidget — "Your Rating" section on TitleDetail.
 *
 * Fix #4 applied: fully re-skinned to the monochrome frosted-glass system.
 * - Tier pills: hairline border + `bg-white/5 backdrop-blur`, white text.
 * - Selected state: solid white bg / black text (inverted), no maroon fill.
 * - Submit button: same frosted treatment; hover inverts to solid white.
 * - Layout & spacing unchanged.
 */

const tiers = ['SKIP', 'TIMEPASS', 'GOFORIT', 'PERFECTION'] as const;
export type Tier = typeof tiers[number];
export const tierLabels: Record<Tier, string> = {
  SKIP: 'Skip',
  TIMEPASS: 'Timepass',
  GOFORIT: 'Go for it',
  PERFECTION: 'Perfection',
};

interface RatingWidgetProps {
  myTier: Tier | '';
  setMyTier: (t: Tier) => void;
  review: string;
  setReview: (v: string) => void;
  submitRating: () => void;
  ratingSubmitting: boolean;
}

export default function RatingWidget({
  myTier,
  setMyTier,
  review,
  setReview,
  submitRating,
  ratingSubmitting,
}: RatingWidgetProps) {
  return (
    <div className="mt-8 space-y-4 pt-6 border-t border-line">
      <h2 className="font-serif text-xl font-semibold">Your Rating</h2>

      {/* Tier pills — monochrome frosted-glass; selected = inverted (white bg / black text) */}
      <div className="flex flex-wrap gap-2">
        {tiers.map(t => (
          <button
            key={t}
            onClick={() => setMyTier(t)}
            className={`px-4 py-2 rounded-lg border text-xs font-mono transition-all ${
              myTier === t
                ? 'bg-ink text-void border-ink'
                : 'bg-white/5 backdrop-blur-sm border-line text-ink-dim hover:text-ink hover:border-line-bright'
            }`}
          >
            {tierLabels[t]}
          </button>
        ))}
      </div>

      <textarea
        value={review}
        onChange={e => setReview(e.target.value)}
        placeholder="Write a review (optional)…"
        className="w-full bg-white/5 backdrop-blur-sm border border-line rounded-xl p-3 text-sm text-ink placeholder:text-ink-faint focus:border-line-bright outline-none resize-none transition-colors"
        rows={3}
      />

      {/* Submit — frosted-glass idle; hover inverts to solid white */}
      <button
        onClick={submitRating}
        disabled={!myTier || ratingSubmitting}
        className="px-5 py-2.5 bg-white/5 backdrop-blur-sm border border-line-bright text-ink rounded-lg text-sm font-semibold hover:bg-ink hover:text-void hover:border-ink transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {ratingSubmitting ? 'Submitting…' : 'Submit Rating'}
      </button>
    </div>
  );
}
