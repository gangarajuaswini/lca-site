// src/app/api/admin/customer-gallery/[referenceId]/lock/route.js
import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/customerGallery';

export async function PATCH(req, ctx) {
  try {
    const { referenceId: refParam } = await ctx.params;
    const referenceId = decodeURIComponent(refParam || '').trim().toUpperCase();
    const { locked } = await req.json().catch(() => ({}));
    if (!referenceId || typeof locked !== 'boolean') {
      return NextResponse.json({ success:false, message:'referenceId & locked required' }, { status:400 });
    }
    const { projects } = await getCollections();
    await projects.updateOne(
      { referenceId },
      { $set: { selectionLocked: locked, selectionLockedAt: locked ? new Date() : null, updatedAt: new Date() } }
    );
    return NextResponse.json({ success:true });
  } catch (e) {
    console.error('lock toggle error', e);
    return NextResponse.json({ success:false, message:'Server error' }, { status:500 });
  }
}
