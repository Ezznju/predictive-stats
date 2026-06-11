import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  const row: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) row.name = body.name;
  if (body.slug !== undefined) row.slug = body.slug;
  if (body.description !== undefined) row.description = body.description;
  if (body.color !== undefined) row.color = body.color;

  const { data, error } = await supabaseAdmin
    .from('categories')
    .update(row)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
