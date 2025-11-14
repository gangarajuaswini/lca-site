// /src/app/api/public-gallery/media/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const mapDoc = (d) => {
  const type = d.type || (d.mimeType?.startsWith('video') ? 'video' : 'image');

  const previewFromDrive = d.driveFileId
    ? `/api/drive/preview/${d.driveFileId}`
    : undefined;

  const downloadFromDrive = d.driveFileId
    ? `https://drive.google.com/uc?export=download&id=${d.driveFileId}`
    : undefined;

  const previewUrl = d.previewUrl || d.url || previewFromDrive;
  const downloadUrl = d.downloadUrl || d.videoUrl || downloadFromDrive;

  return {
    _id: String(d._id),
    categoryId: d.categoryId,
    type,
    previewUrl,
    downloadUrl,
    url: type === 'image' ? (d.url || previewUrl) : undefined,
    videoUrl: type === 'video' ? (d.videoUrl || downloadUrl) : undefined,
    driveFileId: d.driveFileId || undefined,
    title: d.title ?? d.filename ?? undefined,
    filename: d.filename,
    mimeType: d.mimeType,
    size: d.size,
    isPublished: d.isPublished,
    createdAt: d.createdAt,
    order: d.order ?? 0,
  };
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId') || null;
  const pageSize = Math.min(Number(searchParams.get('pageSize') || '24'), 200);

  const db = await getDb();
  const q = { isPublished: { $ne: false } };
  if (categoryId) q.categoryId = categoryId;

  const [items, total] = await Promise.all([
    db.collection('publicMedia')
      .find(q)
      .sort({ order: 1, createdAt: -1 })
      .limit(pageSize)
      .toArray(),
    db.collection('publicMedia').countDocuments(q),
  ]);

  return NextResponse.json({ success: true, total, media: items.map(mapDoc) });
}
