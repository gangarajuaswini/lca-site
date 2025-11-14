//src/app/api/admin/public-gallery/public/route.js
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = await getDb()
    const cats = await db.collection('publicCategories')
      .find({}, { projection: { _id: 1, name: 1, order: 1 } })
      .sort({ order: 1, name: 1 })
      .toArray()

    const mediaCol = db.collection('publicMedia')
    const categories = await Promise.all(cats.map(async (c) => {
      const media = await mediaCol.find({ categoryId: String(c._id) }, {
        projection: { _id:1, name:1, mimeType:1, driveFileId:1, url:1, previewUrl:1, type:1 }
      })
      .sort({ importedAt:-1, createdAt:-1, _id:-1 })
      .limit(24)
      .toArray()
      return { id:String(c._id), name:c.name, order:c.order ?? 0, media }
    }))

    return NextResponse.json({ success:true, categories })
  } catch (e) {
    return NextResponse.json({ success:false, message:e?.message||'Server error' }, { status:500 })
  }
}
