import { NextRequest, NextResponse } from 'next/server';
import { getSiteSettings, updateSiteSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({
      id: 1,
      site_name: settings.siteName,
      site_tagline: settings.siteTagline,
      site_description: settings.siteDescription,
      site_url: settings.siteUrl,
      newsletter_heading: settings.newsletterHeading,
      newsletter_body: settings.newsletterBody,
      mission_heading: settings.missionHeading,
      mission_body: settings.missionBody,
      social_twitter: settings.socialTwitter,
      social_linkedin: settings.socialLinkedin,
      social_github: settings.socialGithub,
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();

  const row: Record<string, any> = {};
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

  await updateSiteSettings(row);
  return NextResponse.json(row);
}
