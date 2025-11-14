// /src/app/api/public/media/route.js
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const cat = searchParams.get('category') || ''
  const page = Math.max(1, parseInt(searchParams.get('page')||'1',10))
  const pageSize = Math.min(60, Math.max(1, parseInt(searchParams.get('pageSize')||'24',10)))

  const db = await getDb()
  const category = await db.collection('categories').findOne({
    $or: [{ _id: cat }, { slug: cat }]
  })
  if (!category) return NextResponse.json({ success:true, items:[], total:0 })

  const q = { categoryId: category._id, isActive: true }
  const total = await db.collection('public_media').countDocuments(q)
  const items = await db.collection('public_media')
    .find(q, { projection: { name:1, mimeType:1, driveFileId:1, width:1, height:1 } })
    .sort({ modifiedTime: -1, _id: -1 })
    .skip((page-1)*pageSize)
    .limit(pageSize)
    .toArray()

  // Map to preview URLs your frontend can drop into <img> / <video>
  const mapped = items.map(x => ({
    ...x,
    previewUrl: `/api/drive/preview/${x.driveFileId}`
  }))

  // Cache for visitors/CDN
  const res = NextResponse.json({ success:true, items: mapped, total })
  res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300')
  return res
}
