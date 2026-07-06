/**
 * Minimal type stub for 'next/server'.
 * Satisfies the TypeScript compiler for middleware.ts without requiring
 * the full Next.js package. Replace with the real package when migrating
 * to a Next.js host.
 */
declare module 'next/server' {
  export interface ResponseCookies {
    set(
      name: string,
      value: string,
      options?: {
        maxAge?: number;
        path?: string;
        domain?: string;
        secure?: boolean;
        httpOnly?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
      }
    ): void;
  }

  export class NextResponse {
    static next(): NextResponse;
    readonly cookies: ResponseCookies;
  }

  export interface NextRequest {
    geo?: {
      country?: string;
      region?: string;
      city?: string;
      latitude?: string;
      longitude?: string;
    };
  }
}
