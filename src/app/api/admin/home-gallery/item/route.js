//src/app/api/admin/home-gallery/item/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getHomeGalleryCollection } from '@/lib/homeGallery';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
async function isAdmin() {
  const c = await cookies();
  const token = c.get('auth_token')?.value || '';
  try { return jwt.verify(token, JWT_SECRET)?.role === 'admin'; } catch { return false; }
}


export async function DELETE(req) {
  if (!(await isAdmin())) return NextResponse.json({ ok:false, error:'Unauthorized' }, { status:401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ ok:false, error:'Missing id' }, { status:400 });

  const col = await getHomeGalleryCollection();
  await col.deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ ok:true });
}

export async function PATCH(req) {
  if (!(await isAdmin())) return NextResponse.json({ ok:false, error:'Unauthorized' }, { status:401 });
  const payload = await req.json();
  const id = payload.id;
  if (!id) return NextResponse.json({ ok:false, error:'Missing id' }, { status:400 });

  const set = {};
  if (payload.order !== undefined) set.order = Number(payload.order) || 0;
  if (payload.alt !== undefined) set.alt = String(payload.alt || '');
  if (payload.caption !== undefined) set.caption = String(payload.caption || '');
  if (payload.isPublished !== undefined) set.isPublished = !!payload.isPublished;

  const col = await getHomeGalleryCollection();
  await col.updateOne({ _id: new ObjectId(id) }, { $set: set });
  return NextResponse.json({ ok:true });
}
