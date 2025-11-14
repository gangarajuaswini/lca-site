// /src/app/api/public-gallery/categories/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await getDb();
  const rows = await db.collection('publicCategories')
    .find({ $or: [{ isPublished: { $exists: false } }, { isPublished: true }] })
    .project({ _id: 1, name: 1, slug: 1, order: 1 })
    .sort({ order: 1, name: 1 })
    .toArray();

  const categories = rows.map(r => ({
    _id: String(r._id),
    id: String(r._id),
    name: r.name,
    slug: r.slug || undefined,
    order: r.order ?? 0,
  }));

  return NextResponse.json({ success: true, categories });
}
