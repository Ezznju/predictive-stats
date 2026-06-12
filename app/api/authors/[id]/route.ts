import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  const row: Record<string, any> = {};
  if (body.name !== undefined) row.name = body.name;
  if (body.slug !== undefined) row.slug = body.slug;
  if (body.title !== undefined) row.title = body.title;
  if (body.bio !== undefined) row.bio = body.bio;
  if (body.avatar !== undefined) row.avatar = body.avatar;
  if (body.twitter !== undefined) row.twitter = body.twitter || null;
  if (body.linkedin !== undefined) row.linkedin = body.linkedin || null;

  const { data, error } = await supabaseAdmin
    .from('authors')
    .update(row)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  // Block deletion when articles still reference this author
  const { count, error: countError } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', params.id);

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${count} article(s) are assigned to this author. Reassign them first.` },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from('authors')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
