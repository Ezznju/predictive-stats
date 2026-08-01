import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200' },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const row = {
    name: body.name,
    slug: body.slug,
    description: body.description || '',
    color: body.color || '#000000',
  };

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert(row)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
