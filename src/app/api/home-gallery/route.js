// src/app/api/home-gallery/route.js
// Public Home Gallery API (used by Hero)
import { NextResponse } from 'next/server';
import { getHomeGalleryCollection } from '@/lib/homeGallery';

export const revalidate = 0;         // always fresh
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get('section') || 'hero';

  const col = await getHomeGalleryCollection();
  const rows = await col
    .find({ section, isPublished: true })
    .sort({ order: 1, createdAt: 1 })
    .toArray();

  // Keep it simple: Hero reads data.rows
  return NextResponse.json({ rows });
}
