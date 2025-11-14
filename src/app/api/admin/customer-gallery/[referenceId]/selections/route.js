//src/app/api/admin/customer-gallery/[referenceId]/selections/route.js
import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/customerGallery';

export async function GET(req, ctx) {
  const { referenceId: refParam } = await ctx.params;
  const referenceId = decodeURIComponent(refParam || '').trim().toUpperCase();
  const { searchParams } = new URL(req.url);
  const folderName = String(searchParams.get('folderName') || '').replace(/\+/g, ' ').trim();

  if (!referenceId || !folderName) {
    return NextResponse.json({ success:false, message:'referenceId & folderName required' }, { status:400 });
  }

  const { assets } = await getCollections();

  const q = {
    referenceId,
    isSelected: true,
    $or: [{ sourceFolderName: folderName }, { folderName }]
  };

  const [rows, selected] = await Promise.all([
    assets
      .find(q, { projection: { _id:1, name:1, mimeType:1, selectedAt:1, selectedBy:1, assetId:1 } })
      .sort({ selectedAt: -1 })
      .toArray(),
    assets.countDocuments(q),
  ]);

  return NextResponse.json({ success:true, rows, counts: { selected } });
}