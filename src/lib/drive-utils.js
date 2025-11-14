// src/lib/drive-utils.js
import { google } from 'googleapis';

// Reuse your existing auth if you have one:
export function getDrive() {
  // Example with service account JSON in env:
  // const auth = new google.auth.JWT(
  //   process.env.GDRIVE_CLIENT_EMAIL,
  //   null,
  //   (process.env.GDRIVE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  //   ['https://www.googleapis.com/auth/drive']
  // );
  // return google.drive({ version: 'v3', auth });
  throw new Error('Hook getDrive() up to your existing Drive auth');
}

export function extractFolderId(input = '') {
  const s = String(input).trim();
  const m = s.match(/\/folders\/([A-Za-z0-9_-]+)/)
        || s.match(/[?&]id=([A-Za-z0-9_-]+)/)
        || s.match(/[-\w]{20,}/);
  return m ? (m[1] || m[0]) : '';
}

export async function listFolderFiles(folderId, { pageSize = 200 } = {}) {
  const drive = getDrive();
  const files = [];
  let pageToken;

  const fields =
    'nextPageToken, files(id,name,mimeType,size,modifiedTime,createdTime,' +
    'imageMediaMetadata(width,height),videoMediaMetadata(width,height,durationMillis))';

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      pageSize,
      pageToken,
      fields,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      orderBy: 'modifiedTime desc'
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  // images/videos only
  return files.filter(f => /^image\//.test(f.mimeType) || /^video\//.test(f.mimeType));
}
















/*
// Small, client-safe helper — OK to import in React pages

export function extractFolderId(input) {
  const s = String(input || '').trim();
  if (!s) return '';

  // Already a raw folder ID?
  if (/^[\w-]{10,}$/.test(s)) return s;

  // Try URL parsing (no regex)
  try {
    const u = new URL(s);

    // /drive/folders/<id>  or  /folders/<id>
    const parts = u.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('folders');
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];

    // ...?id=<id>
    const qid = u.searchParams.get('id');
    if (qid) return qid;
  } catch {
  }
  return '';
}
*/