// src/app/api/customer/projects/[referenceId]/select/route.js
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollections } from '@/lib/customerGallery';

export async function POST(req, ctx) {
  try {
    const { referenceId: refParam } = await ctx.params;
    const referenceId = decodeURIComponent(refParam || '').trim().toUpperCase();
    if (!referenceId) return NextResponse.json({ success:false, message:'referenceId required' }, { status:400 });

    const body = await req.json().catch(() => ({}));
    const assetId = String(body.assetId || '').trim();
    // accept either { isSelected } or { select }
    const isSelected = body.isSelected != null ? !!body.isSelected : !!body.select;
    if (!assetId) return NextResponse.json({ success:false, message:'assetId required' }, { status:400 });

    const { assets, projects } = await getCollections();

    // deny updates when locked
    const proj = await projects.findOne({ referenceId });
    if (proj?.selectionLocked) {
      return NextResponse.json({ success:false, message:'Selection window is closed by photographer.' }, { status:403 });
    }

    await assets.updateOne(
      { _id: new ObjectId(assetId), referenceId },
      { $set: { isSelected, selectedAt: isSelected ? new Date() : null, selectedBy: 'customer' } }
    );

    // refresh counts on project
    const [rawTotal, selected] = await Promise.all([
      assets.countDocuments({ referenceId }),
      assets.countDocuments({ referenceId, isSelected: true }),
    ]);
    await projects.updateOne({ referenceId }, {
      $set: { 'counts.rawTotal': rawTotal, 'counts.selected': selected, updatedAt: new Date() }
    });

    return NextResponse.json({ success:true, counts:{ rawTotal, selected } });
  } catch (e) {
    console.error('select error', e);
    return NextResponse.json({ success:false, message:'Server error' }, { status:500 });
  }
}
