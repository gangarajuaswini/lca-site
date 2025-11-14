// src/app/api/admin/home-gallery/upload/route.js
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { connectToDatabase } from '@/lib/mongodb';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const section = formData.get('section') || 'hero';
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No files provided' },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'home-gallery');
    await mkdir(uploadDir, { recursive: true });

    const { db } = await connectToDatabase();
    const gallery = db.collection('home_gallery');
    const uploaded = [];

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

      // Determine type
      const isVideo = /^video\//.test(file.type);
      const type = isVideo ? 'video' : 'photo';

      // Create gallery record
      const localPath = `/uploads/home-gallery/${filename}`;
      const doc = {
        section,
        name: file.name,
        localPath,
        url: localPath,
        previewUrl: localPath,
        mimeType: file.type || 'application/octet-stream',
        type,
        order: 0,
        publish: true,
        importedAt: new Date(),
      };

      const result = await gallery.insertOne(doc);
      uploaded.push({ ...doc, _id: result.insertedId });
    }

    return NextResponse.json({
      success: true,
      ok: true,
      uploaded: uploaded.length,
      rows: uploaded,
    });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json(
      { success: false, ok: false, message: e?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
