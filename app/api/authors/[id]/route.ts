import { NextRequest, NextResponse } from 'next/server';
import { updateAuthor, deleteAuthor, countArticlesByAuthor } from '@/lib/db';

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

  await updateAuthor(params.id, row);
  return NextResponse.json({ id: params.id, ...row });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const count = await countArticlesByAuthor(params.id);
  if (count > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${count} article(s) are assigned to this author. Reassign them first.` },
      { status: 400 }
    );
  }

  await deleteAuthor(params.id);
  return NextResponse.json({ ok: true });
}
