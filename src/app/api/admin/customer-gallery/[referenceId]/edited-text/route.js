// src/app/api/admin/customer-gallery/[referenceId]/edited-text/route.js
import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/customerGallery';

export async function PATCH(req, ctx) {
  try {
    const { referenceId: rawRef } = await ctx.params;
    const referenceId = decodeURIComponent(rawRef || '').trim().toUpperCase();
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get('category') || '').trim();

    if (!referenceId || !category) {
      return NextResponse.json({ success:false, message:'referenceId and category required' }, { status:400 });
    }

    const { editedText } = await req.json();
    const { projects } = await getCollections();

    const res = await projects.updateOne(
      { referenceId, category },
      { $set: { editedText: String(editedText || ''), updatedAt: new Date() } }
    );

    return NextResponse.json({ success:true, modified: res.modifiedCount ?? 0 });
  } catch (e) {
    console.error('save edited-text error:', e);
    return NextResponse.json({ success:false, message:'Server error' }, { status:500 });
  }
}
