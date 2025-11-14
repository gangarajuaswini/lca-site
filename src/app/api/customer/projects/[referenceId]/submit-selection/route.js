// src/app/api/customer/projects/[referenceId]/submit-selection/route.js
import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/customerGallery';
import { getSelectionCollections } from '@/lib/selectionVersions';

export async function POST(_req, { params }) {
  try {
    const referenceId = decodeURIComponent(params.referenceId||'').trim();
    if (!referenceId) return NextResponse.json({ success:false, message:'referenceId required' }, { status:400 });

    const { assets, projects } = await getCollections();
    const { versions } = await getSelectionCollections();

    const selected = await assets.find({ referenceId, isSelected: true })
      .project({ _id:1, name:1, mimeType:1, selectedAt:1 }).toArray();

    // determine next version number
    const last = await versions.find({ referenceId }).sort({ version:-1 }).limit(1).toArray();
    const nextVersion = (last[0]?.version || 0) + 1;

    // Build diff against previous
    const prevIds = new Set(last[0]?.items?.map(i => String(i.assetId)) || []);
    const currIds = new Set(selected.map(i => String(i._id)));
    const added = [...currIds].filter(x => !prevIds.has(x));
    const removed = [...prevIds].filter(x => !currIds.has(x));

    await versions.insertOne({
      referenceId,
      version: nextVersion,
      createdAt: new Date(),
      items: selected.map(i => ({ assetId: i._id, name: i.name, mimeType: i.mimeType, selectedAt: i.selectedAt })),
      diff: { added, removed }
    });

    await projects.updateOne({ referenceId }, {
      $set: { lastSelectionVersion: nextVersion, lastSelectionSubmittedAt: new Date() }
    });

    return NextResponse.json({ success:true, version: nextVersion });
  } catch (e) {
    console.error('submit selection error', e);
    return NextResponse.json({ success:false, message:'Server error' }, { status:500 });
  }
}
