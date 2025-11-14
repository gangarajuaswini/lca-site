// src/app/api/customer/projects/[referenceId]/assets/route.js
import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/customerGallery';

export async function GET(req, ctx) {
  try {
    const params = ctx?.params || {};
    const refParam = params.referenceId ?? '';
    const referenceId = decodeURIComponent(String(refParam)).trim().toUpperCase();
    
    const { searchParams } = new URL(req.url);
    
    // Decode and normalize folderName
    let folderName = searchParams.get('folderName') ?? '';
    try {
      folderName = decodeURIComponent(folderName);
    } catch {}
    folderName = String(folderName).replace(/\+/g, ' ').trim();
    
    // Get limit parameter
    const limRaw = searchParams.get('limit');
    let limit = Number.isFinite(Number(limRaw)) ? Number(limRaw) : 60;
    limit = Math.max(1, Math.min(200, limit));
    
    if (!referenceId || !folderName) {
      return NextResponse.json(
        { success: false, message: 'referenceId & folderName required', items: [], counts: { rawTotal: 0 } },
        { status: 400 }
      );
    }
    
    const { assets } = await getCollections();
    if (!assets) {
      return NextResponse.json(
        { success: false, message: 'Assets collection not available', items: [], counts: { rawTotal: 0 } },
        { status: 500 }
      );
    }
    
    const query = {
      referenceId,
      $or: [{ sourceFolderName: folderName }, { folderName }],
    };
    
    const projection = {
      _id: 1,
      name: 1,
      mimeType: 1,
      size: 1,
      isSelected: 1,
      selectedAt: 1,
      driveFileId: 1,
      previewUrl: 1,
      importedAt: 1,
      updatedAt: 1,
    };
    
    const [rows, rawTotal] = await Promise.all([
      assets
        .find(query, { projection })
        .sort({ importedAt: -1, updatedAt: -1, _id: -1 })
        .limit(limit)
        .toArray(),
      assets.countDocuments(query),
    ]);
    
    const items = (rows || []).map((it) => ({
      ...it,
      // Always provide a previewUrl; proxy Drive when possible
      previewUrl: it?.driveFileId
        ? `/api/drive/preview/${it.driveFileId}`
        : (it?.previewUrl || ''),
    }));
    
    return NextResponse.json({ success: true, items, counts: { rawTotal } });
  } catch (e) {
    console.error('customer assets GET error:', e);
    return NextResponse.json(
      { success: false, message: e?.message || 'Server error', items: [], counts: { rawTotal: 0 } },
      { status: 500 }
    );
  }
}
