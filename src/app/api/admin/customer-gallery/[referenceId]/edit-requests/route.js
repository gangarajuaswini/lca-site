import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(_req, { params }) {
  try {
    const referenceId = String(params?.referenceId || '').trim().toUpperCase()
    if (!referenceId) {
      return NextResponse.json({ success:false, message:'referenceId required', items:[] }, { status:400 })
    }

    const db = await getDb()
    const items = await db.collection('edit_requests')
      .find({ referenceId })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ success:true, items })
  } catch (e) {
    console.error('edit-requests GET error:', e)
    return NextResponse.json({ success:false, message:e?.message || 'Server error', items:[] }, { status:500 })
  }
}
