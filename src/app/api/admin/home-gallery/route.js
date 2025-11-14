// src/app/api/admin/home-gallery/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getHomeGalleryCollection } from '@/lib/homeGallery';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function isAdmin() {
  const c = await cookies();
  const token = c.get('auth_token')?.value || '';
  try { return jwt.verify(token, JWT_SECRET)?.role === 'admin'; }
  catch { return false; }
}

export async function GET(req) {
  if (!(await isAdmin())) return NextResponse.json({ success:false, message:'Unauthorized' }, { status:401 });
  const col = await getHomeGalleryCollection();
  const { searchParams } = new URL(req.url);
  const section = searchParams.get('section'); // e.g., 'hero'
  const filter = section ? { section } : {};
  const rows = await col.find(filter).sort({ section:1, order:1, createdAt:1 }).toArray();
  return NextResponse.json({ success:true, rows });
}
