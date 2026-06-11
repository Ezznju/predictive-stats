import { cookies } from 'next/headers';
import { createHash } from 'crypto';

const AUTH_COOKIE = 'pv_admin_session';

function hashToken(password: string): string {
  const secret = process.env.AUTH_SECRET || 'fallback';
  return createHash('sha256').update(password + secret).digest('hex');
}

export function getExpectedToken(): string {
  const password = process.env.ADMIN_PASSWORD || '';
  return hashToken(password);
}

export function isAuthenticated(): boolean {
  const cookieStore = cookies();
  const session = cookieStore.get(AUTH_COOKIE);
  if (!session) return false;
  return session.value === getExpectedToken();
}

export function setAuthCookie(): void {
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE, getExpectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearAuthCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE);
}
