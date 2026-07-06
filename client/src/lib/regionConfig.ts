export const SUPPORTED_REGIONS = [
  { code: 'IN', label: 'India' },
  { code: 'KR', label: 'South Korea' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'JP', label: 'Japan' },
] as const;

export type RegionCode = (typeof SUPPORTED_REGIONS)[number]['code'];

export const REGION_LABELS: Record<string, string> = Object.fromEntries(
  SUPPORTED_REGIONS.map(r => [r.code, r.label])
);

// Cookie helpers — 30-day expiry, same-site lax
const COOKIE_NAME = 'user_region';
const MAX_AGE_DAYS = 30;

const VALID_CODES = new Set(SUPPORTED_REGIONS.map(r => r.code as string));

/** Normalise to a supported code; falls back to IN. */
export function normalizeRegion(raw: string | null | undefined): RegionCode {
  const upper = (raw || '').toUpperCase().trim();
  return (VALID_CODES.has(upper) ? upper : 'IN') as RegionCode;
}

export function getRegionCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setRegionCookie(region: string): void {
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(region)}; max-age=${maxAge}; path=/; samesite=lax`;
}
