import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const revalidate = 0

export async function GET() {
  try {
    const db = await getDb()
    const docs = await db.collection('client_reviews')
      .find({ status: 'published', publishedSnapshot: { $ne: null } },
            { projection: { _id:0, referenceId:1, customerRef:1, publishedAt:1, publishedSnapshot:1 } })
      .sort({ publishedAt: -1, updatedAt: -1 })
      .toArray()

    // flatten snapshot fields to the top-level expected by the UI
    const items = docs.map(d => ({ ...d.publishedSnapshot, referenceId: d.referenceId, customerRef: d.customerRef, publishedAt: d.publishedAt }))
    return NextResponse.json({ success: true, items })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success:false }, { status:500 })
  }
}

