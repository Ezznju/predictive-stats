import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/newsletter-email';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // RPC inserts the subscriber and returns an unsubscribe token for NEW
    // signups only (NULL = already subscribed, so tokens can't be harvested).
    const { data: token, error } = await supabase.rpc('newsletter_subscribe', {
      p_email: email,
      p_source: String(body.source || 'site'),
    });

    if (error) {
      console.error('Newsletter subscribe error:', error);
      return NextResponse.json({ error: 'Subscription failed. Please try again.' }, { status: 500 });
    }

    if (!token) {
      // Already on the list — treat as success.
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    // Fire the welcome email; never block or fail the signup on email issues.
    await sendWelcomeEmail(email, String(token));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Newsletter API error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
