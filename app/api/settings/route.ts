import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600' },
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();

  const row: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.siteName !== undefined) row.site_name = body.siteName;
  if (body.siteTagline !== undefined) row.site_tagline = body.siteTagline;
  if (body.siteDescription !== undefined) row.site_description = body.siteDescription;
  if (body.siteUrl !== undefined) row.site_url = body.siteUrl;
  if (body.newsletterHeading !== undefined) row.newsletter_heading = body.newsletterHeading;
  if (body.newsletterBody !== undefined) row.newsletter_body = body.newsletterBody;
  if (body.missionHeading !== undefined) row.mission_heading = body.missionHeading;
  if (body.missionBody !== undefined) row.mission_body = body.missionBody;
  if (body.socialTwitter !== undefined) row.social_twitter = body.socialTwitter;
  if (body.socialLinkedin !== undefined) row.social_linkedin = body.socialLinkedin;
  if (body.socialGithub !== undefined) row.social_github = body.socialGithub;

  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .update(row)
    .eq('id', 1)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
