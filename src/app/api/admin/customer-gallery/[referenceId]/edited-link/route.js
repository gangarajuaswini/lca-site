// src/app/api/admin/customer-gallery/[referenceId]/edited-link/route.js
import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/customerGallery';

export async function PATCH(req, ctx) {
  try {
    const { referenceId: raw } = await ctx.params;
    const referenceId = decodeURIComponent(raw || '').trim().toUpperCase();
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get('category') || '').trim();
    if (!referenceId || !category) {
      return NextResponse.json({ success:false, message:'referenceId and category required' }, { status:400 });
    }

    const body = await req.json().catch(() => ({}));
    let links = Array.isArray(body.links) ? body.links : [];
    // normalize: trim, drop empties, hard cap to something reasonable
    links = links.map(s => String(s || '').trim()).filter(Boolean).slice(0, 1000);

    const { projects } = await getCollections();
    const res = await projects.updateOne(
      { referenceId, category },
      { $set: { editedLinks: links, updatedAt: new Date() } }
    );

    return NextResponse.json({ success:true, modified: res.modifiedCount });
  } catch (e) {
    console.error('edited-links PATCH error:', e);
    return NextResponse.json({ success:false, message:'Server error' }, { status:500 });
  }
}
