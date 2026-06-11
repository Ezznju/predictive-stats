import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

function getExpectedToken(): string {
  const password = process.env.ADMIN_PASSWORD || '';
  const secret = process.env.AUTH_SECRET || 'fallback';
  return createHash('sha256').update(password + secret).digest('hex');
}

// Public GET-only API routes (read-only access for frontend)
const PUBLIC_API_PREFIXES = [
  '/api/articles',
  '/api/categories',
  '/api/authors',
  '/api/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page and login API
  if (pathname === '/admin/login' || pathname === '/api/auth/login') {
    return NextResponse.next();
  }

  // Allow public API routes (auth endpoints)
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Allow GET requests on public API routes (read-only for frontend)
  if (request.method === 'GET' && PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Protect admin pages and write API routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
    const sessionCookie = request.cookies.get('pv_admin_session');
    const expected = getExpectedToken();

    if (!sessionCookie || sessionCookie.value !== expected) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // For admin pages, redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
