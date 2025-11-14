//src/app/api/admin/public-gallery/media/route.js
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req) {
  const url = new URL(req.url)
  const categoryId = url.searchParams.get('categoryId') || ''
  const page     = Math.max(1, Number(url.searchParams.get('page')||1))
  const pageSize = Math.min(60, Math.max(1, Number(url.searchParams.get('pageSize')||24)))

  const db = await getDb()
  const q = categoryId ? { categoryId } : {}
  const total = await db.collection('publicMedia').countDocuments(q)
  const media = await db.collection('publicMedia')
    .find(q, { projection: { _id:1, categoryId:1, name:1, mimeType:1, type:1, order:1, driveFileId:1, url:1, previewUrl:1, importedAt:1 } })
    .sort({ order: 1, importedAt: -1, _id: -1 })
    .skip((page-1)*pageSize)
    .limit(pageSize)
    .toArray()

  return NextResponse.json({ success:true, media, total })
}
