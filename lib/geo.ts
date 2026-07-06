/**
 * Fallback geo-detection for local dev / non-Vercel hosting.
 * Uses ipapi.co — 1 000 req/day free, no API key needed.
 * On Vercel Edge the middleware.ts sets the cookie directly from req.geo.
 */
export async function getCountryFromIP(ip: string): Promise<string> {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/country/`);
    const country = await res.text();
    return country.trim() || 'IN';
  } catch {
    return 'IN'; // safe fallback
  }
}
