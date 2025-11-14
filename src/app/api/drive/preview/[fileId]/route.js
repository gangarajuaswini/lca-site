//src/app/api/drive/preview/[fileId]/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// --- auth / client ---
function getAuth() {
  const email = process.env.GDRIVE_CLIENT_EMAIL;
  let key = process.env.GDRIVE_PRIVATE_KEY || '';
  if (!email || !key) throw new Error('Missing GDRIVE_CLIENT_EMAIL or GDRIVE_PRIVATE_KEY');
  key = key.replace(/\\n/g, '\n');
  return new google.auth.JWT(email, null, key, ['https://www.googleapis.com/auth/drive.readonly']);
}
const drive = () => google.drive({ version: 'v3', auth: getAuth() });

// Helper to detect if file is an image or video
const isImage = (mime = '', name = '') =>
  /^image\//i.test(mime) || /\.(jpe?g|png|webp|gif|avif|svg|heic|heif|raw|arw|cr2|cr3|nef|dng|orf|raf|rw2)$/i.test(name);
const isVideo = (mime = '', name = '') =>
  /^video\//i.test(mime) || /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(name);
const isSVG = (mime = '', name = '') =>
  /image\/svg\+xml/i.test(mime) || /\.svg$/i.test(name);

// Detect proper MIME type for various image formats
function getImageMimeType(mime = '', name = '') {
  if (mime && mime !== 'application/octet-stream') return mime;
  
  const ext = name.toLowerCase().match(/\.([^.]+)$/)?.[1];
  const mimeMap = {
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
    'png': 'image/png', 'webp': 'image/webp',
    'gif': 'image/gif', 'avif': 'image/avif',
    'svg': 'image/svg+xml',
    'heic': 'image/heic', 'heif': 'image/heif',
    'arw': 'image/x-sony-arw', 'cr2': 'image/x-canon-cr2',
    'cr3': 'image/x-canon-cr3', 'nef': 'image/x-nikon-nef',
    'dng': 'image/x-adobe-dng', 'raw': 'image/x-raw',
    'orf': 'image/x-olympus-orf', 'raf': 'image/x-fuji-raf',
    'rw2': 'image/x-panasonic-rw2'
  };
  return mimeMap[ext] || 'application/octet-stream';
}

export async function GET(req, ctx) {
  const { fileId } = await ctx.params;
  const id = decodeURIComponent(fileId || '').trim();
  if (!id) {
    return NextResponse.json({ success: false, message: 'fileId required' }, { status: 400 });
  }

  try {
    const g = drive();

    // Get file metadata
    const { data: meta } = await g.files.get({
      fileId,
      fields: 'id,name,mimeType,size,hasThumbnail,thumbnailLink',
      supportsAllDrives: true,
    });

    const name = meta.name || '';
    const mime = meta.mimeType || '';

    // STRATEGY: Always stream ORIGINAL files for maximum quality
    // For images and videos, serve the original file directly
    if (isImage(mime, name) || isVideo(mime, name)) {
      try {
        const res = await g.files.get(
          { fileId, alt: 'media', supportsAllDrives: true },
          { responseType: 'stream' }
        );

        // Determine proper content type
        let contentType = res.headers['content-type'] || mime;
        if (isImage(mime, name)) {
          contentType = getImageMimeType(mime, name);
          if (isSVG(mime, name)) contentType = 'image/svg+xml';
        }

        const headers = new Headers({
          'Content-Type': contentType || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
          'Content-Disposition': 'inline',
          'Cross-Origin-Resource-Policy': 'same-origin',
        });

        // Add content length if available
        if (meta.size) {
          headers.set('Content-Length', String(meta.size));
        }

        const stream = new ReadableStream({
          start(controller) {
            res.data.on('data', (chunk) => controller.enqueue(chunk));
            res.data.on('end', () => controller.close());
            res.data.on('error', (err) => controller.error(err));
          },
        });

        return new NextResponse(stream, { headers });
      } catch (streamError) {
        console.error('Failed to stream original file:', streamError?.message);
        // If streaming fails, fall through to thumbnail fallback below
      }
    }

    // FALLBACK: Only use thumbnails if original streaming failed or for non-media files
    // This should rarely be reached for images/videos
    const url = new URL(req.url);
    const w = Math.max(400, Math.min(4000, Number(url.searchParams.get('w')) || 2400));
    
    // Try Google Drive thumbnail API
    const bigThumbUrl = `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${w}`;
    try {
      const resp = await fetch(bigThumbUrl, { redirect: 'follow' });
      if (resp.ok && /^image\//i.test(resp.headers.get('content-type') || '')) {
        return new NextResponse(resp.body, {
          headers: {
            'Content-Type': resp.headers.get('content-type') || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
            'Content-Disposition': 'inline',
            'Cross-Origin-Resource-Policy': 'same-origin',
          },
        });
      }
    } catch {
      // ignore
    }

    // Try thumbnailLink from metadata
    if (meta.thumbnailLink) {
      const token = await g.context._options.auth.getAccessToken();
      const resp = await fetch(meta.thumbnailLink, {
        headers: { Authorization: `Bearer ${token}` },
        redirect: 'follow',
      });
      if (resp.ok) {
        return new NextResponse(resp.body, {
          headers: {
            'Content-Type': resp.headers.get('content-type') || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
            'Content-Disposition': 'inline',
            'Cross-Origin-Resource-Policy': 'same-origin',
          },
        });
      }
    }

    // Last resort: try to stream original bytes anyway
    const res = await g.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );
    const headers = new Headers({
      'Content-Type': res.headers['content-type'] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
      'Cross-Origin-Resource-Policy': 'same-origin',
    });
    const stream = new ReadableStream({
      start(controller) {
        res.data.on('data', (c) => controller.enqueue(c));
        res.data.on('end', () => controller.close());
        res.data.on('error', (e) => controller.error(e));
      },
    });
    return new NextResponse(stream, { headers });
  } catch (e) {
    console.error('drive preview error:', e?.message || e);
    return NextResponse.json({ success: false, message: 'Preview error' }, { status: 500 });
  }
}