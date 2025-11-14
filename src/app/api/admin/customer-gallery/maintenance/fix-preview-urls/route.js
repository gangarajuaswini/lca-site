//src/app/api/admin/customer-gallery/maintenance/fix-preview-urls/route.js
import { NextResponse } from 'next/server'
import { getCollections } from '@/lib/customerGallery'

export async function POST(req) {
  try {
    const { referenceId } = await req.json()
    if (!referenceId) return NextResponse.json({ ok:false, message:'referenceId required' }, { status:400 })
    const { assets } = await getCollections()
    const items = await assets.find({ referenceId }).project({ _id:1, driveFileId:1 }).toArray()
    for (const a of items) {
      await assets.updateOne({ _id: a._id }, { $set: { previewUrl: `/api/drive/preview/${a.driveFileId}` } })
    }
    return NextResponse.json({ ok:true, updated: items.length })
  } catch (e) {
    console.error('fix previews error', e)
    return NextResponse.json({ ok:false, message:'Server error' }, { status:500 })
  }
}
