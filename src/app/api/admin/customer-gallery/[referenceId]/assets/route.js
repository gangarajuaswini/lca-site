//src/app/api/admin/customer-gallery/[referenceId]/assets/route.js
import { NextResponse } from 'next/server'
import { getCollections } from '@/lib/customerGallery'

export async function GET(req, ctx) {
  try {
    const params = ctx?.params || {}
    const refParam = params.referenceId ?? ''
    const referenceId = decodeURIComponent(String(refParam)).trim().toUpperCase()

    const { searchParams } = new URL(req.url)

    // decode + normalize folderName: handle '+', double-encoding, etc.
    let folderName = searchParams.get('folderName') ?? ''
    try {
      folderName = decodeURIComponent(folderName)
    } catch {}
    folderName = String(folderName).replace(/\+/g, ' ').trim()

    // clamp limit to a safe range (MongoDB: limit(0) = no limit, avoid that)
    const limRaw = searchParams.get('limit')
    let limit = Number.isFinite(Number(limRaw)) ? Number(limRaw) : 60
    limit = Math.max(1, Math.min(200, limit))

    if (!referenceId || !folderName) {
      return NextResponse.json(
        { success: false, message: 'referenceId & folderName required', items: [], counts: { rawTotal: 0 } },
        { status: 400 }
      )
    }

    const { assets } = await getCollections()
    if (!assets) {
      return NextResponse.json(
        { success: false, message: 'Assets collection not available', items: [], counts: { rawTotal: 0 } },
        { status: 500 }
      )
    }

    const query = {
      referenceId,
      $or: [{ sourceFolderName: folderName }, { folderName }],
    }

    const projection = {
      _id: 1,
      name: 1,
      mimeType: 1,
      size: 1,
      isSelected: 1,
      selectedAt: 1,
      driveFileId: 1,   // for preview proxy
      previewUrl: 1,    // fallback for non-Drive sources
      importedAt: 1,
      updatedAt: 1,
    }

    const [rows, rawTotal] = await Promise.all([
      assets
        .find(query, { projection })
        .sort({ importedAt: -1, updatedAt: -1, _id: -1 })
        .limit(limit)
        .toArray(),
      assets.countDocuments(query),
    ])

    const items = (rows || []).map((it) => ({
      ...it,
      // always provide a previewUrl; proxy Drive when possible
      previewUrl: it?.driveFileId
        ? `/api/drive/preview/${it.driveFileId}`
        : (it?.previewUrl || ''),
    }))

    return NextResponse.json({ success: true, items, counts: { rawTotal } })
  } catch (e) {
    console.error('admin assets GET error:', e)
    return NextResponse.json(
      { success: false, message: e?.message || 'Server error', items: [], counts: { rawTotal: 0 } },
      { status: 500 }
    )
  }
}












/*
// src/app/api/admin/customer-gallery/[referenceId]/assets/route.js
import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/customerGallery';

export async function GET(req, ctx) {
  try {
    const { referenceId: refParam } = await ctx.params;
    const referenceId = decodeURIComponent(refParam || '').trim().toUpperCase();
    const { searchParams } = new URL(req.url);

    let folderName = String(searchParams.get('folderName') || '').replace(/\+/g, ' ').trim();
    const limRaw = searchParams.get('limit');
    const limit = Number.isFinite(Number(limRaw)) ? Math.max(0, Number(limRaw)) : 60;

    if (!referenceId || !folderName) {
      return NextResponse.json({ success:false, message:'referenceId & folderName required' }, { status:400 });
    }

    const { assets } = await getCollections();

    const q = {
      referenceId,
      $or: [{ sourceFolderName: folderName }, { folderName }],
    };

    const [rows, rawTotal] = await Promise.all([
      assets
        .find(q, {
          projection: {
            _id: 1,
            name: 1,
            mimeType: 1,
            size: 1,
            isSelected: 1,
            selectedAt: 1,
            // 👇 ADD THIS so we can build a safe preview URL
            driveFileId: 1,
            // keep any existing previewUrl for non-Drive sources
            previewUrl: 1,
          }
        })
        .sort({ importedAt: -1, updatedAt: -1, _id: -1 })
        .limit(limit)               // note: limit(0) = no limit in Mongo
        .toArray(),
      assets.countDocuments(q),
    ]);

    // 👇 NEW: normalize preview URL to always use our proxy when we have a Drive id
    const items = (rows || []).map(it => ({
      ...it,
      previewUrl: it?.driveFileId
        ? `/api/drive/preview/${it.driveFileId}`
        : (it?.previewUrl || ''),   // fallback for non-Drive assets
    }));

    return NextResponse.json({ success:true, items, counts: { rawTotal } });
  } catch (e) {
    console.error('admin assets GET error:', e);
    return NextResponse.json({ success:false, message: e?.message || 'Server error' }, { status:500 });
  }
}
  */