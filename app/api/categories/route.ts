import { NextRequest, NextResponse } from 'next/server';
import { getCategories, insertCategory } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await getCategories();
    const rows = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      color: c.color,
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

  const row = {
    id: crypto.randomUUID(),
    name: body.name,
    slug: body.slug,
    description: body.description || '',
    color: body.color || '#000000',
  };

  await insertCategory(row);
  return NextResponse.json(row, { status: 201 });
}
