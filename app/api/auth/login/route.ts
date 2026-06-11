import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const expected = process.env.ADMIN_PASSWORD || '';

  if (!password || password !== expected) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  setAuthCookie();
  return NextResponse.json({ ok: true });
}
