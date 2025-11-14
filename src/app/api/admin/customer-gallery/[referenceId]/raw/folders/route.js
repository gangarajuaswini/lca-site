// src/app/api/admin/customer-gallery/[referenceId]/raw/folders/route.js
import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/customerGallery';

export async function GET(req, { params }) {
  const referenceId = decodeURIComponent(params.referenceId || '').trim().toUpperCase();
  if (!referenceId) {
    return NextResponse.json({ success:false, message:'referenceId required' }, { status:400 });
  }

  const { searchParams } = new URL(req.url);
  const recount = searchParams.get('recount') === '1';

  try {
    const { projects, assets } = await getCollections();
    const proj = await projects.findOne({ referenceId }, { projection: { rawFolders:1 } });
    if (!proj) return NextResponse.json({ success:false, message:'Project not found' }, { status:404 });

    const rawFolders = Array.isArray(proj.rawFolders) ? proj.rawFolders : [];

    if (!recount) {
      return NextResponse.json({ success:true, folders: rawFolders });
    }

    // Recalculate per-folder counts
    const updated = [];
    for (const f of rawFolders) {
      const name = f?.name?.trim();
      if (!name) continue;

      const match = { referenceId, $or: [{ folderName: name }, { sourceFolderName: name }] };
      const [raw, selected] = await Promise.all([
        assets.countDocuments(match),
        assets.countDocuments({ ...match, isSelected: true }),
      ]);

      updated.push({ name, counts: { raw, selected } });
    }

    // Persist counts back to project (one write per folder; fine for admin use)
    for (const u of updated) {
      await projects.updateOne(
        { referenceId },
        { $set: { 'rawFolders.$[f].counts': u.counts, updatedAt: new Date() } },
        { arrayFilters: [{ 'f.name': u.name }] }
      );
    }

    // Also update global totals
    const [rawTotal, selectedTotal] = await Promise.all([
      assets.countDocuments({ referenceId }),
      assets.countDocuments({ referenceId, isSelected: true }),
    ]);
    await projects.updateOne(
      { referenceId },
      { $set: { 'counts.rawTotal': rawTotal, 'counts.selected': selectedTotal, updatedAt: new Date() } }
    );

    // Return fully merged folders with counts
    const merged = rawFolders.map(f => {
      const u = updated.find(x => x.name === f.name);
      return u ? { ...f, counts: u.counts } : f;
    });

    return NextResponse.json({
      success: true,
      folders: merged,
      counts: { rawTotal, selected: selectedTotal },
    });
  } catch (e) {
    console.error('raw/folders recount error:', e?.message || e);
    return NextResponse.json({ success:false, message:'Server error' }, { status:500 });
  }
}

export async function POST(req, ctx) {
  const { referenceId: ref } = await ctx.params;
  const referenceId = decodeURIComponent(ref || '').trim().toUpperCase();

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  if (!referenceId || !name) {
    return NextResponse.json({ success:false, message:'referenceId & name required' }, { status:400 });
  }

  const { projects } = await getCollections();
  const p = await projects.findOne({ referenceId });
  if (!p) return NextResponse.json({ success:false, message:'Project not found' }, { status:404 });

  // Prevent duplicates by name
  const exists = (p.rawFolders || []).some(f => f.name === name);
  if (exists) {
    return NextResponse.json({ success:false, message:'A folder with this name already exists' }, { status:409 });
  }

  // Store only the name; counts are optional and added later
  const folder = { name };
  await projects.updateOne(
    { _id: p._id },
    { $addToSet: { rawFolders: folder }, $set: { updatedAt: new Date() } }
  );

  return NextResponse.json({ success:true, folder });
}

export async function DELETE(req, ctx) {
  try {
    const { referenceId: ref } = await ctx.params;
    const referenceId = decodeURIComponent(ref || '').trim().toUpperCase();
    const { searchParams } = new URL(req.url);
    const folderName = (searchParams.get('folderName') || '').trim();

    if (!referenceId || !folderName) {
      return NextResponse.json({ success:false, message:'referenceId & folderName required' }, { status:400 });
    }

    const { projects, assets, selections } = await getCollections();

    // 1) Remove all assets in this raw folder
    const folderMatch = { $or: [{ sourceFolderName: folderName }, { folderName }] };
    const delRes = await assets.deleteMany({ referenceId, ...folderMatch });

    // 2) Optional: purge any legacy selection docs tied to this folder (if present in your DB)
    try { await selections.deleteMany({ referenceId, ...folderMatch }); } catch {}

    // 3) Remove the raw folder entry from the project
    await projects.updateOne(
      { referenceId },
      { $pull: { rawFolders: { name: folderName } }, $set: { updatedAt: new Date() } }
    );

    // 4) Recompute project global counts (raw/selected) after deletion
    const [rawTotal, selected] = await Promise.all([
      assets.countDocuments({ referenceId }),
      assets.countDocuments({ referenceId, isSelected: true }),
    ]);
    await projects.updateOne(
      { referenceId },
      { $set: { 'counts.rawTotal': rawTotal, 'counts.selected': selected, updatedAt: new Date() } }
    );

    // 5) Return the new list of folders (with counts if you already persisted them)
    const proj = await projects.findOne({ referenceId }, { projection: { rawFolders: 1 } });
    return NextResponse.json({
      success: true,
      removedAssets: delRes.deletedCount || 0,
      counts: { rawTotal, selected },
      folders: proj?.rawFolders || [],
    });
  } catch (e) {
    console.error('raw/folders DELETE error', e);
    return NextResponse.json({ success:false, message: e?.message || 'Server error' }, { status:500 });
  }
}

