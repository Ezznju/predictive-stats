import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const MAX_AUTHORS = 10;

export async function GET() {
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || !body.slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
  }

  // Enforce the author limit
  const { count, error: countError } = await supabase
    .from('authors')
    .select('id', { count: 'exact', head: true });

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
  if ((count ?? 0) >= MAX_AUTHORS) {
    return NextResponse.json(
      { error: `Author limit reached (max ${MAX_AUTHORS}). Delete an author before adding a new one.` },
      { status: 400 }
    );
  }

  const row = {
    name: body.name,
    slug: body.slug,
    title: body.title || '',
    bio: body.bio || '',
    avatar: body.avatar || '',
    twitter: body.twitter || null,
    linkedin: body.linkedin || null,
  };

  const { data, error } = await supabaseAdmin
    .from('authors')
    .insert(row)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
