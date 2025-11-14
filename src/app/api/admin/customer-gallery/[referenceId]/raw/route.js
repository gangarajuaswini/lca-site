// src/app/api/admin/customer-gallery/[referenceId]/raw/route.js
import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/customerGallery';

export async function PATCH(req, { params }) {
  try {
    const referenceId = decodeURIComponent(params.referenceId || '').trim();
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get('category') || '').trim();
    const { rawDriveFolderId } = await req.json().catch(() => ({}));

    if (!referenceId || !category || !rawDriveFolderId) {
      return NextResponse.json({ success:false, message:'referenceId, category and rawDriveFolderId are required' }, { status:400 });
    }

    const { projects } = await getCollections();
    const now = new Date();
    const res = await projects.findOneAndUpdate(
      { referenceId, category },
      {
        $setOnInsert: { referenceId, category, status:'active', createdAt:now, counts:{ rawTotal:0, selected:0 } },
        $set: { rawDriveFolderId, updatedAt: now }
      },
      { upsert:true, returnDocument:'after' }
    );
    return NextResponse.json({ success:true, project: res.value });
  } catch (e) {
    console.error('save raw folder error', e);
    return NextResponse.json({ success:false, message:'Server error' }, { status:500 });
  }
}
