// src/app/api/admin/customer-gallery/[referenceId]/upload/route.js
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getCollections } from '@/lib/customerGallery';

export const runtime = 'nodejs';

export async function POST(req, ctx) {
  try {
    const { referenceId: refParam } = await ctx.params;
    const referenceId = decodeURIComponent(refParam || '').trim().toUpperCase();
    
    if (!referenceId) {
      return NextResponse.json(
        { success: false, message: 'referenceId required' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const folderName = formData.get('folderName') || 'Raw';
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No files provided' },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'customer-gallery', referenceId, folderName);
    await mkdir(uploadDir, { recursive: true });

    const { assets } = await getCollections();
    const imported = [];

    for (const file of files) {
      if (file.size === 0) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Sanitize filename
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${timestamp}_${safeName}`;
      const filePath = join(uploadDir, filename);
      
      await writeFile(filePath, buffer);

      // Create asset record
      const localPath = `/uploads/customer-gallery/${referenceId}/${folderName}/${filename}`;
      const asset = {
        referenceId,
        folderName,
        sourceFolderName: folderName,
        name: file.name,
        localPath,
        url: localPath,
        previewUrl: localPath,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        source: 'local',
        isSelected: false,
        importedAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await assets.insertOne(asset);
      imported.push({ ...asset, _id: result.insertedId });
    }

    // Recount
    const [rawTotal, selected] = await Promise.all([
      assets.countDocuments({ referenceId }),
      assets.countDocuments({ referenceId, isSelected: true }),
    ]);

    const folderRaw = await assets.countDocuments({
      referenceId,
      $or: [{ sourceFolderName: folderName }, { folderName }],
    });

    const folderSelected = await assets.countDocuments({
      referenceId,
      isSelected: true,
      $or: [{ sourceFolderName: folderName }, { folderName }],
    });

    return NextResponse.json({
      success: true,
      imported: imported.length,
      items: imported,
      counts: {
        global: { rawTotal, selected },
        folder: { raw: folderRaw, selected: folderSelected },
      },
    });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json(
      { success: false, message: e?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
