import { NextRequest, NextResponse } from 'next/server';
import { newsletterSubscribe } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/newsletter-email';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
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
