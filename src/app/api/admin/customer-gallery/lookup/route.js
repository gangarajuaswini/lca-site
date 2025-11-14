// src/app/api/admin/customer-gallery/lookup/route.js
import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/customerGallery';
import { getInboxCollection } from '@/lib/inbox';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const referenceId = String(searchParams.get('referenceId') || '').trim().toUpperCase();
  if (!referenceId) return NextResponse.json({ success:false, message:'referenceId required' }, { status:400 });

  const inbox = await getInboxCollection();
  const { projects } = await getCollections();

  const contact = await inbox.findOne({ referenceId })
    .then(c => c ? ({
      name: c.fullName || c.name || '',
      email: c.email || '',
      phone: c.contactNumber || c.phone || '',
      city: c.city || '', state: c.state || '', country: c.country || '',
      eventType: c.eventType || c.category || ''
    }) : null);

  const proj = await projects.findOne({ referenceId });
  return NextResponse.json({
    success: true,
    contact,
    project: proj ? {
      referenceId: proj.referenceId,
      category: proj.category,
      status: proj.status,
      counts: proj.counts,
      rawFolders: Array.isArray(proj.rawFolders) ? proj.rawFolders : [],
      editedLinks: Array.isArray(proj.editedLinks) ? proj.editedLinks : [],
      selectionLocked: !!proj.selectionLocked,
      selectionLockedAt: proj.selectionLockedAt || null,
      editedText: typeof proj.editedText === 'string' ? proj.editedText : '',
    } : null
  });
}
