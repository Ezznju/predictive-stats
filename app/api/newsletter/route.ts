import { NextRequest, NextResponse } from 'next/server';
import { newsletterSubscribe, checkRateLimit } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/newsletter-email';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot — bots fill it, humans never see it. Silently accept.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return NextResponse.json({ success: true });
    }

    const email = String(body.email || '').trim().toLowerCase().slice(0, 254);

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!(await checkRateLimit(`newsletter:${getClientIp(request)}`, 10, 3600))) {
      return NextResponse.json({ error: 'Too many signups. Please try again later.' }, { status: 429 });
    }

    const token = randomUUID();
    const inserted = await newsletterSubscribe(email, String(body.source || 'site'), token);

    if (!inserted) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    await sendWelcomeEmail(email, token).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Newsletter API error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
