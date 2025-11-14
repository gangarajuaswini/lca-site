// src/lib/drive.js
import { google } from 'googleapis';
import stream from 'stream';

function getAuth() {
  const email = process.env.GDRIVE_CLIENT_EMAIL;
  let key = process.env.GDRIVE_PRIVATE_KEY || '';
  if (!email || !key) throw new Error('Missing GDRIVE_CLIENT_EMAIL or GDRIVE_PRIVATE_KEY');
  key = key.replace(/\\n/g, '\n');
  return new google.auth.JWT(email, null, key, [
    'https://www.googleapis.com/auth/drive'
  ]);
}

function getDrive() {
  return google.drive({ version: 'v3', auth: getAuth() });
}

function driveClient() {
  const auth = new google.auth.JWT({
    email: process.env.GDRIVE_CLIENT_EMAIL,
    key: process.env.GDRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

const thumb = (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
const dl    = (id) => `https://drive.google.com/uc?export=download&id=${id}`;


// Normalize one Drive file -> our shape
// Normalize one Drive file -> our shape (shortcut-aware)
function toAssetFile(f) {
  const isShortcut = f.mimeType === 'application/vnd.google-apps.shortcut';
  const targetMime = f.shortcutDetails?.targetMimeType || null;
  const targetId   = f.shortcutDetails?.targetId || null;

  // Use the *content* id for preview/download if this is a shortcut
  const contentFileId = isShortcut && targetId ? targetId : f.id;

  return {
    // Keep original id and mime (useful for de-dupe/diagnostics)
    id: f.id,
    originalMimeType: f.mimeType,

    // Expose effective mime so callers can filter media properly
    mimeType: (isShortcut && targetMime) ? targetMime : f.mimeType,

    // Useful flags
    isShortcut,
    shortcutDetails: f.shortcutDetails ?? null,

    // Content id to fetch/preview the real bytes
    contentFileId,

    name: f.name,
    size: Number(f.size || 0),
    previewUrl: thumb(f.id),
    downloadUrl: dl(contentFileId),

    width: f.imageMediaMetadata?.width ?? null,
    height: f.imageMediaMetadata?.height ?? null,
    durationSec: f.videoMediaMetadata?.durationMillis
      ? Math.round(f.videoMediaMetadata.durationMillis / 1000)
      : null,
  };
}



/** List files in a single folder (NOT recursive). Returns an array. */
// Optional opts kept backwards-compatible
export async function listFolderFiles(folderId, opts = {}) {
  const drive = getDrive();
  let token = null;
  const out = [];
  const fields =
    opts.fields ||
    // NOTE: include shortcutDetails so callers can see target id/mime
    'nextPageToken,files(id,name,mimeType,shortcutDetails(targetId,targetMimeType),size,thumbnailLink,imageMediaMetadata,videoMediaMetadata)';

  do {
    const { data } = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 200,
      pageToken: token,
      fields,
    });
    token = data.nextPageToken || null;
    for (const f of (data.files || [])) out.push(toAssetFile(f));
  } while (token);
  return out;
}


/** Recursively walk sub-folders. Returns an array. */
export async function listAllFilesDeep(folderId, limit = 5000) {
  const drive = getDrive();
  const out = [];
  async function walk(id) {
    let token = null;
    do {
      const { data } = await drive.files.list({
        q: `'${id}' in parents and trashed = false`,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 200,
        pageToken: token,
        // include shortcutDetails so we can follow folder shortcuts too
        // fields: 'nextPageToken,files(id,name,mimeType,shortcutDetails(targetId,targetMimeType),size,thumbnailLink,imageMediaMetadata,videoMediaMetadata)',
        // NOTE: we intentionally omit the 'fields' mask to avoid sporadic
        // 'Invalid field selection ...' errors from the API. We still request
        // All/Shared Drives and page through results.
      });
      token = data.nextPageToken || null;

      for (const f of (data.files || [])) {
        const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
        const isShortcut = f.mimeType === 'application/vnd.google-apps.shortcut';
        const shortcutToFolder =
          isShortcut && f.shortcutDetails?.targetMimeType === 'application/vnd.google-apps.folder';
        const nextId = shortcutToFolder ? f.shortcutDetails.targetId : f.id;

        if (isFolder || shortcutToFolder) {
          await walk(nextId);
          if (out.length >= limit) return;
          continue;
        }

        out.push(toAssetFile(f));
        if (out.length >= limit) return;
      }
    } while (token);
  }
  await walk(folderId);
  return out;
}


export async function findChildFolderByName(parentId, name) {
  const { google } = await import('googleapis')
  const g = google.drive({ version:'v3', auth: getAuth() })
  const { data } = await g.files.list({
    q: `'${parentId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(/'/g,"\\'")}'`,
    fields: 'files(id,name)',
    supportsAllDrives: true, includeItemsFromAllDrives: true, pageSize: 1,
  })
  return data.files?.[0]?.id || null
}










/**
 * Ensure a child folder exists under parent; create if missing.
 * @param {{ parentId: string, name: string }} param0
 * @returns {Promise<string>} folderId
 */
export async function ensureFolder({ parentId, name }) {
  const drive = getDrive();

  // Try to find existing folder by name under the parent
  const { data: list } = await drive.files.list({
    q: `'${parentId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(/'/g, "\\'")}'`,
    fields: 'files(id,name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 1,
  });
  const existing = list.files?.[0];
  if (existing?.id) return existing.id;

  // Create new folder
  const { data: created } = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id,name',
    supportsAllDrives: true,
  });
  return created.id;
}


/**
 * Upload a file buffer into a Drive folder and return metadata + public links.
 * @param {{ parentId: string, filename: string, buffer: Buffer, mimeType?: string }} param0
 * @returns {Promise<{id:string,name:string,mimeType:string,size:number,links:{view?:string,download?:string,thumb?:string}}>}
 */


export async function uploadBuffer({ name, parentId, buffer, mimeType, parents }) {
  const drive = driveClient();

  // accept parentId OR parents -> normalize to Array
  const p = Array.isArray(parents) && parents.length
    ? parents
    : (parentId ? [parentId] : null);

  if (!p) {
    throw new Error('uploadBuffer: missing parent folder (provide parentId or parents)');
  }

  const body = new stream.PassThrough();
  body.end(buffer);

  const { data } = await drive.files.create({
    requestBody: { name, mimeType, parents: p },
    media: { mimeType, body },
    supportsAllDrives: true,
    fields: 'id, name, parents, webViewLink, thumbnailLink',
  });

  return data; // { id, ... }
}

