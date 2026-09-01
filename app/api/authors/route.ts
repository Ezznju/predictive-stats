import { NextRequest, NextResponse } from 'next/server';
import { getAuthors, insertAuthor, countAuthors } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_AUTHORS = 10;

export async function GET() {
  try {
    const authors = await getAuthors();
    const rows = authors.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      title: a.title,
      bio: a.bio,
      avatar: a.avatar,
      twitter: a.twitter,
      linkedin: a.linkedin,
    }));
    return NextResponse.json(rows, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || !body.slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
  }

  const count = await countAuthors();
  if (count >= MAX_AUTHORS) {
    return NextResponse.json(
      { error: `Author limit reached (max ${MAX_AUTHORS}). Delete an author before adding a new one.` },
      { status: 400 }
    );
  }

  const row = {
    id: crypto.randomUUID(),
    name: body.name,
    slug: body.slug,
    title: body.title || '',
    bio: body.bio || '',
    avatar: body.avatar || '',
    twitter: body.twitter || null,
    linkedin: body.linkedin || null,
  };

  await insertAuthor(row);
  return NextResponse.json(row, { status: 201 });
}
