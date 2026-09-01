import { NextRequest, NextResponse } from 'next/server';

async function getExpectedToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD || '';
  const secret = process.env.AUTH_SECRET || 'fallback';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  let hex = '';
  for (let i = 0; i < hashArray.length; i++) {
    hex += hashArray[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// Public GET-only API routes (read-only access for frontend)
const PUBLIC_API_PREFIXES = [
  '/api/articles',
  '/api/categories',
  '/api/authors',
  '/api/settings',
  '/api/polymarket',
  '/api/search',
  '/api/lp-scanner',
  '/api/arbitrage-scanner',
  '/api/pulse',
  '/api/gamma-rewards',
  '/api/lp-rewards',
  '/api/order-book',
  '/api/indexnow',
  '/api/debug',
];

// Public POST routes (visitor-facing forms)
const PUBLIC_POST_ROUTES = ['/api/contact', '/api/newsletter'];

export async function middleware(request: NextRequest) {
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

  // Allow public form submissions (contact form, newsletter signup)
  if (request.method === 'POST' && PUBLIC_POST_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Protect admin pages and write API routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
    const sessionCookie = request.cookies.get('pv_admin_session');
    const expected = await getExpectedToken();

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
