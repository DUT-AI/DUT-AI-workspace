import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwtPayload, hasAdminRole } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;

  // 1. Guard /admin routes
  if (pathname.startsWith('/admin')) {
    if (!accessToken) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname + search);
      redirectUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(redirectUrl);
    }

    // Fast JWT role check on Edge
    const payload = decodeJwtPayload(accessToken);
    if (!payload || !payload.roles || !hasAdminRole(payload.roles)) {
      const forbiddenUrl = new URL('/login', request.url);
      forbiddenUrl.searchParams.set('error', 'forbidden');
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  // 2. Auto-redirect from /login if already authenticated as Admin
  if (pathname === '/login') {
    if (accessToken) {
      const payload = decodeJwtPayload(accessToken);
      if (payload && payload.roles && hasAdminRole(payload.roles)) {
        const redirectTo = request.nextUrl.searchParams.get('redirect') || '/admin';
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    }
  }

  // Security response headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
