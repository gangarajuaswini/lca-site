// src/app/api/customer/projects/[referenceId]/route.js
import { NextResponse } from 'next/server'
import { getCollections } from '@/lib/customerGallery'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(req, ctx) {
  try {
    // Next app routes: always await params
    const { referenceId: refParam } = await ctx.params
    const referenceId = decodeURIComponent(refParam || '').trim().toUpperCase()
    if (!referenceId) {
      return NextResponse.json({ success: false, message: 'referenceId is required' }, { status: 400 })
    }

    const { projects, assets } = await getCollections()
    const { db } = await connectToDatabase()

    // Contact: prefer managed_customers, but fall back to contacts if needed
    const managed = db.collection('managed_customers')
    let contact = await managed.findOne({ referenceId })
    if (!contact) {
      try {
        const contactsCol = db.collection('contacts')
        contact = await contactsCol.findOne({ referenceId })
      } catch { /* ok if this collection does not exist */ }
    }

    // Fetch project
    const project = await projects.findOne({ referenceId })

    // Global counts (all raw + selected)
    const [rawTotal, selected] = await Promise.all([
      assets.countDocuments({ referenceId }),
      assets.countDocuments({ referenceId, isSelected: true }),
    ])

    // Per-folder counts, tolerant of legacy `folderName`
    const perFolder = await assets.aggregate([
      { $match: { referenceId, source: 'drive' } },
      {
        $group: {
          _id: { $ifNull: ['$sourceFolderName', '$folderName'] },
          raw: { $sum: 1 },
          selected: { $sum: { $cond: ['$isSelected', 1, 0] } },
        }
      },
      { $project: { _id: 0, name: '$_id', raw: 1, selected: 1 } },
      { $sort: { name: 1 } }
    ]).toArray()

    // Optional: include items for a specific folder if requested (?folderName=...)
    const { searchParams } = new URL(req.url)
    const folderName = (searchParams.get('folderName') || '').trim()
    let items = []
    if (folderName) {
      const q = {
        referenceId,
        source: 'drive',
        $or: [{ sourceFolderName: folderName }, { folderName }]
      }
      items = await assets.find(
        q,
        { projection: { _id: 1, name: 1, previewUrl: 1, mimeType: 1, size: 1 } }
      )
      .sort({ importedAt: -1, updatedAt: -1 })
      .limit(120)
      .toArray()
    }

    return NextResponse.json({
      success: true,
      contact: contact || null,
      project: project ? {
        ...project,
        counts: { rawTotal, selected },
        perFolder,
        // ensure these exist in DB; defaults tolerate legacy data
        selectionLocked: !!project.selectionLocked,
        selectionLockedAt: project.selectionLockedAt || null,
        editedText: project.editedText || '',   // used by Customer “Edited” tab
      } : null,
      items,
    });

  } catch (e) {
    console.error('GET /api/customer/projects/[referenceId] failed:', e)
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 })
  }
}
