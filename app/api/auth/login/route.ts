import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/db';

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  // Brute-force guard: 10 password attempts per 15 min per IP (fail-open).
  if (!(await checkRateLimit(`login:${getClientIp(request)}`, 10, 900))) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const { password } = await request.json();
  const expected = process.env.ADMIN_PASSWORD || '';

  if (!password || password !== expected) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  setAuthCookie();
  return NextResponse.json({ ok: true });
}
