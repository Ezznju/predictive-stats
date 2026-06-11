import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email, source: body.source || 'site' });

    if (error) {
      // 23505 = unique violation → already subscribed, treat as success
      if (error.code === '23505') {
        return NextResponse.json({ success: true, alreadySubscribed: true });
      }
      console.error('Newsletter insert error:', error);
      return NextResponse.json({ error: 'Subscription failed. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Newsletter API error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
