import { cookies } from 'next/headers';

const AUTH_COOKIE = 'pv_admin_session';

async function hashToken(password: string): Promise<string> {
  const secret = process.env.AUTH_SECRET || 'fallback';
  const data = new TextEncoder().encode(password + secret);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getExpectedToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD || '';
  return hashToken(password);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = cookies();
  const session = cookieStore.get(AUTH_COOKIE);
  if (!session) return false;
  return session.value === (await getExpectedToken());
}

export async function setAuthCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE, await getExpectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE);
}
