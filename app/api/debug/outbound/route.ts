import { NextResponse } from 'next/server';
import { insertOutboundClick } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasAccount = !!process.env.CLOUDFLARE_ACCOUNT_ID;
  const hasToken = !!process.env.CLOUDFLARE_API_TOKEN;
  const hasDb = !!process.env.D1_DATABASE_ID;
  const accountPrefix = process.env.CLOUDFLARE_ACCOUNT_ID?.slice(0, 6) ?? 'missing';
  const dbPrefix = process.env.D1_DATABASE_ID?.slice(0, 6) ?? 'missing';
  let insertOk = false;
  let insertErr: string | null = null;
  try {
    await insertOutboundClick({ platform_slug: 'debug', ctx: 'debug-outbound', is_affiliate: false, referer: 'test', country: 'US', user_agent: 'debug' });
    insertOk = true;
  } catch (e: any) {
    insertErr = e?.message ?? String(e);
  }
  return NextResponse.json({ hasAccount, hasToken, hasDb, accountPrefix, dbPrefix, insertOk, insertErr });
}
