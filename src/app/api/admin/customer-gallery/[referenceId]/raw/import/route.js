// src/app/api/admin/customer-gallery/[referenceId]/raw/import/route.js
import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/customerGallery';
import { listFolderFiles, listAllFilesDeep } from '@/lib/drive';

// tiny helper – works for links or bare IDs
function extractDriveId(input = '') {
  const s = String(input).trim();
  const m =
    s.match(/\/folders\/([A-Za-z0-9_-]+)/) ||
    s.match(/[?&]id=([A-Za-z0-9_-]+)/) ||
    s.match(/[-\w]{20,}/); // last resort: looks like an ID
  return m ? m[1] || m[0] : '';
}

export async function POST(req, ctx) {
  try {
    // Always await params in app routes
    const { referenceId: refParam } = await ctx.params;
    const referenceId = decodeURIComponent(refParam || '').trim().toUpperCase();

    const { searchParams } = new URL(req.url);
    const folderName = (searchParams.get('folderName') || '').trim();
    const driveLink  = (searchParams.get('driveLink')  || '').trim();
    const deep       = searchParams.get('deep') === '1';

    if (!referenceId) {
      return NextResponse.json({ success: false, message: 'referenceId required' }, { status: 400 });
    }
    if (!folderName) {
      return NextResponse.json({ success: false, message: 'folderName required' }, { status: 400 });
    }
    if (!driveLink) {
      return NextResponse.json({ success: false, message: 'A Google Drive folder link/ID is required' }, { status: 400 });
    }

    const folderId = extractDriveId(driveLink);
    if (!folderId) {
      return NextResponse.json({ success: false, message: 'Could not extract folder ID from driveLink' }, { status: 400 });
    }

    const { projects, assets } = await getCollections();

    // sanity: project exists and has this raw folder name registered
    const proj = await projects.findOne({ referenceId }, { projection: { rawFolders: 1 } });
    if (!proj) return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });
    const known = (proj.rawFolders || []).some(f => f?.name === folderName);
    if (!known) return NextResponse.json({ success: false, message: 'Unknown raw folder name' }, { status: 400 });

    // --- list files from Drive (read-only) ---
    const files = deep ? (await listAllFilesDeep(folderId)) : (await listFolderFiles(folderId));
    let imported = 0;

    // Upsert every image/video; store under *folderName* and remove the legacy field.
    for (const f of files || []) {
      const type = `${f.mimeType || ''}`;
      if (!(type.startsWith('image/') || type.startsWith('video/'))) continue;
      // Upsert uniqueness *per folder*. This creates a new row for the same Drive file in a new folder.
      const filter = { referenceId, folderName, source: 'drive', driveFileId: f.id };
      const setOnInsert = {
        referenceId,
        source: 'drive',
        driveFileId: f.id,
        importedAt: new Date(),
        createdAt: new Date(),
        // A brand-new copy in this folder must start unselected
        isSelected: false,
        selectedAt: null,
        selectedBy: null,
      };
      const setAlways = {
        sourceFolderName: folderName,
        folderName,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size || 0,
        // fallback to your proxy endpoints so we ALWAYS have a valid URL
        previewUrl: `/api/drive/preview/${f.id}`,
        downloadUrl: `/api/drive/preview/${f.id}`,
        updatedAt: new Date(),
      };

      // IMPORTANT: never set sourceFolderName anymore; explicitly remove if present.
      const res = await assets.updateOne(
        filter,
        { $setOnInsert: setOnInsert, $set: setAlways },
        { upsert: true }
      );
      if (res.upsertedId) imported += 1;
    }

    // Folder-scoped counts using the canonical field; tolerate legacy if present
    const folderMatch = {
      referenceId,
      $or: [{ sourceFolderName: folderName }, { folderName }]
    };

    // per-folder counts after import
    const [raw, selected] = await Promise.all([
      assets.countDocuments(folderMatch),
      assets.countDocuments({ ...folderMatch, isSelected: true }),
    ]);

    // Persist these counts into the project.rawFolders entry so UI can show them after refresh.
    await projects.updateOne(
      { referenceId },
      { 
        $set: { 
          'rawFolders.$[f].counts': { raw, selected },
          updatedAt: new Date(), 
        }, 
      },
      { arrayFilters: [{ 'f.name': folderName }] }
    );

    // Also refresh GLOBAL counts so the “Project summary” shows up-to-date numbers
    const [rawTotal, selectedGlobal] = await Promise.all([
      assets.countDocuments({ referenceId }),
      assets.countDocuments({ referenceId, isSelected: true }),
    ]);
    await projects.updateOne(
      { referenceId },
      { $set: { 'counts.rawTotal': rawTotal, 'counts.selected': selectedGlobal, updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      imported,
      counts: { folder: { raw, selected }, global: { rawTotal, selected: selectedGlobal } },
    });
  } catch (e) {
    const msg =
      e?.errors?.[0]?.message ||
      e?.response?.data?.error?.message ||
      e?.message || 'Server error';
    console.error('raw/import error:', msg, e?.response?.data || e);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
