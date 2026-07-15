/** Shared rating tier constants — kept outside component files so Fast Refresh works. */

export const tiers = ['SKIP', 'TIMEPASS', 'GOFORIT', 'PERFECTION'] as const;
export type Tier = typeof tiers[number];
export const tierLabels: Record<Tier, string> = {
  SKIP: 'Skip',
  TIMEPASS: 'Timepass',
  GOFORIT: 'Go for it',
  PERFECTION: 'Perfection',
};
