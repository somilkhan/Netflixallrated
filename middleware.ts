import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const country = request.geo?.country || 'IN'; // fallback India
  const response = NextResponse.next();
  response.cookies.set('user_region', country, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}

export const config = {
  matcher: '/',
};
