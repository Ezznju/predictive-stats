import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    // 1. Store in Supabase
    const { error: dbError } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        subject: subject || 'general',
        message,
      });

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save message. Please try again.' },
        { status: 500 }
      );
    }

    // 2. Send email notification via Resend (if configured)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'Predictive Stats <onboarding@resend.dev>',
            to: ['ezzekielnjuguna.en@gmail.com'],
            subject: `[Contact Form] ${subject || 'General Inquiry'} — from ${name}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
              <hr />
              <p>${message.replace(/\n/g, '<br />')}</p>
              <hr />
              <p style="color:#888;font-size:12px;">Sent from the Predictive Stats contact form</p>
            `,
            reply_to: email,
          }),
        });

        if (!emailRes.ok) {
          const errBody = await emailRes.text();
          console.error('Resend error:', errBody);
        }
      } catch (emailErr) {
        console.error('Email send error:', emailErr);
        // Don't fail the request — message is already saved in DB
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact API error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
