//src/app/api/admin/customer-gallery/[referenceId]/assets/[assetId]/route.js
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollections } from '@/lib/customerGallery';
// (optional) import { requireAdminOrThrow } from '@/lib/auth'

export async function DELETE(req, { params }) {
  try {
    // requireAdminOrThrow(req)
    const referenceId = decodeURIComponent(params.referenceId || '').trim().toUpperCase();
    const { searchParams } = new URL(req.url);
    const folderName = (searchParams.get('folderName') || '').trim();
    const assetId = params.assetId;
    if (!referenceId || !assetId) {
      return NextResponse.json({ success: false, message: 'referenceId and assetId required' }, { status: 400 });
    }

    const { assets, projects } = await getCollections();
    // Narrow delete to this ref; (optional) include folderName if provided
    const delFilter = { _id: new ObjectId(assetId), referenceId };
    if (folderName) delFilter.$or = [{ sourceFolderName: folderName }, { folderName }];
    await assets.deleteOne(delFilter);

    // Recompute global counts for the project
    const [rawTotal, selected] = await Promise.all([
      assets.countDocuments({ referenceId }),
      assets.countDocuments({ referenceId, isSelected: true }),
    ]);
    await projects.updateOne(
      { referenceId },
      { $set: { 'counts.rawTotal': rawTotal, 'counts.selected': selected, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true, counts: { rawTotal, selected } });
  } catch (e) {
    console.error('admin delete asset error', e)
    return NextResponse.json({ success: false, message: e.message || 'Server error' }, { status: 500 });
  }
}
