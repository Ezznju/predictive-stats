import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics?days=30
 *
 * Admin-only analytics feed for /admin/analytics. The middleware already
 * requires the admin session cookie for this route; on the database side the
 * data comes from the token-gated `admin_analytics` RPC (security definer),
 * which verifies ADMIN_API_TOKEN against the value stored in Supabase Vault.
 */
export async function GET(request: NextRequest) {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'ADMIN_API_TOKEN is not configured' },
      { status: 500 }
    );
  }

  const daysRaw = parseInt(request.nextUrl.searchParams.get('days') ?? '30', 10);
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 365) : 30;

  const { data, error } = await supabase.rpc('admin_analytics', {
    p_token: token,
    p_days: days,
  });

  if (error) {
    console.error('admin_analytics RPC failed:', error.message);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }

  return NextResponse.json(data);
}
