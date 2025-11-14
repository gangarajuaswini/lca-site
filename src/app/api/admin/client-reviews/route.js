//src/app/api/admin/client-reviews/route.js
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = await getDb()
    const rows = await db.collection('client_reviews')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

      // stringify _id for client
      const dto = rows.map(({ _id, ...r }) => ({ ...r, _id: String(_id) }))
    return NextResponse.json({ success:true, rows: dto })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success:false }, { status:500 })
  }
}
