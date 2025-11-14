//src/app/api/admin/home-gallery/import/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getHomeGalleryCollection } from '@/lib/homeGallery';
import { google } from 'googleapis';


const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
async function isAdmin() {
  const c = await cookies();
  const token = c.get('auth_token')?.value || '';
  try { return jwt.verify(token, JWT_SECRET)?.role === 'admin'; } catch { return false; }
}

function extractDriveId(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return s;
  const m = s.match(/\/(?:file\/d|folders)\/([A-Za-z0-9_-]+)/);
  if (m?.[1]) return m[1];
  try { const u = new URL(s); return u.searchParams.get('id') || null; } catch {}
  return null;
}

function driveClient(readonly = true) {
  const auth = new google.auth.JWT({
    email: process.env.GDRIVE_CLIENT_EMAIL,
    key: process.env.GDRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: [readonly
      ? 'https://www.googleapis.com/auth/drive.readonly'
      : 'https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

const MEDIA_MIMES = [
  /^image\//,
  /^video\//,
];

function isMediaMime(m) { return MEDIA_MIMES.some(rx => rx.test(m || '')); }

export async function POST(req) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok:false, error:'Unauthorized' }, { status:401 });
    }
    const body = await req.json();
    const section  = String(body.section || 'hero');
    const publish  = body.publish !== false;
    const alt      = String(body.alt || '');
    const caption  = String(body.caption || '');
    let   baseOrder = Number.isFinite(Number(body.order)) ? Number(body.order) : null;

    // Accept array or newline-separated text
    const links = Array.isArray(body.links) ? body.links : String(body.links || '').split(/\r?\n/);
    const ids   = links.map(extractDriveId).filter(Boolean);
    if (!ids.length) {
      return NextResponse.json({ ok:false, error:'No valid Drive links/IDs.' }, { status:400 });
    }

    const col = await getHomeGalleryCollection();
    // If starting order not provided, append after current max
    if (baseOrder == null) {
      const max = await col.find({ section }).project({ order:1 }).sort({ order: -1 }).limit(1).toArray();
      baseOrder = (max[0]?.order ?? -1) + 1;
    }

    const drive = driveClient(true);
    const saved = [], skipped = [], errors = [];

    // Helper: import a single file id
    async function importFile(fileId, order) {
      // De-dupe
      const exists = await col.findOne({ section, driveFileId: fileId });
      if (exists) { skipped.push({ id:fileId, reason:'already exists' }); return 0; }

      const { data: meta } = await drive.files.get({
        fileId, supportsAllDrives: true,
        fields: 'id,name,mimeType,thumbnailLink',
      });
      if (!isMediaMime(meta?.mimeType)) {
        skipped.push({ id:fileId, reason:`not media (${meta?.mimeType || 'unknown'})` });
        return 0;
      }

      const doc = {
        section,
        driveFileId: fileId,
        name: meta?.name || null,
        mimeType: meta?.mimeType || null,
        alt, caption,
        order,
        isPublished: publish,
        createdAt: new Date(),
      };
      await col.insertOne(doc);
      saved.push({ id: fileId, name: doc.name, order });
      return 1;
    }

    // For each provided id: if it's a folder, list its media and import; else import the file itself
    for (const rawId of ids) {
      try {
        const { data: meta } = await drive.files.get({
          fileId: rawId, supportsAllDrives: true, fields: 'id,mimeType'
        });

        if (meta?.mimeType === 'application/vnd.google-apps.folder') {
          // list immediate children (images/videos)
          let pageToken = null;
          do {
            const { data } = await drive.files.list({
              q: `'${rawId}' in parents and trashed=false`,
              supportsAllDrives: true,
              includeItemsFromAllDrives: true,
              pageSize: 200,
              pageToken,
              fields: 'nextPageToken,files(id,mimeType)',
            });
            pageToken = data.nextPageToken || null;
            for (const f of (data.files || [])) {
              if (!isMediaMime(f.mimeType)) { skipped.push({ id:f.id, reason:`not media (${f.mimeType})` }); continue; }
              await importFile(f.id, baseOrder++);
            }
          } while (pageToken);
        } else {
          await importFile(rawId, baseOrder++);
        }
      } catch (e) {
        const msg = e?.errors?.[0]?.message || e?.response?.data?.error?.message || e?.message || String(e);
        errors.push({ id: rawId, error: msg });
      }
    }

    return NextResponse.json({ ok:true, savedCount: saved.length, saved, skipped, errors });
  } catch (err) {
    const msg = err?.errors?.[0]?.message || err?.message || String(err);
    return NextResponse.json({ ok:false, error: msg }, { status:500 });
  }
}
