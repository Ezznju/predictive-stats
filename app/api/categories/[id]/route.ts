import { NextRequest, NextResponse } from 'next/server';
import { updateCategory, deleteCategory } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  const row: Record<string, any> = {};
  if (body.name !== undefined) row.name = body.name;
  if (body.slug !== undefined) row.slug = body.slug;
  if (body.description !== undefined) row.description = body.description;
  if (body.color !== undefined) row.color = body.color;

  await updateCategory(params.id, row);
  return NextResponse.json({ id: params.id, ...row });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await deleteCategory(params.id);
  return NextResponse.json({ ok: true });
}
