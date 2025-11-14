//src/app/api/admin/customer-gallery/projects/route.js
import { NextResponse } from 'next/server'
import { getCollections } from '@/lib/customerGallery'
import { getInboxCollection } from '@/lib/inbox'

export async function POST(req) {
  try {
    const body = await req.json()
    const referenceId = String(body?.referenceId || '').trim().toUpperCase()
    let finalCategory = String(body?.category || '').trim()

    if (!referenceId) {
      return NextResponse.json(
        { success: false, message: 'referenceId required' },
        { status: 400 }
      )
    }

    // Derive category from Inbox if the client didn’t send one
    if (!finalCategory) {
      const inbox = await getInboxCollection()
      const c = await inbox.findOne(
        { referenceId },
        { projection: { eventType: 1 } }
      )
      finalCategory = String(c?.eventType || '').trim()
    }

    if (!finalCategory) {
      return NextResponse.json(
        { success: false, message: 'Valid category required' },
        { status: 400 }
      )
    }

    const { projects } = await getCollections()
    const now = new Date()

    // Idempotent create-or-update by referenceId.
    // Works whether your unique index is {referenceId:1} or {referenceId:1,category:1}.
    await projects.updateOne(
      { referenceId },
      {
        $setOnInsert: {
          referenceId,
          status: 'active',
          counts: { rawTotal: 0, selected: 0 },
          createdAt: now,
        },
        $set: {
          category: finalCategory,
          updatedAt: now,
        },
      },
      { upsert: true }
    )

    const project = await projects.findOne({ referenceId })
    return NextResponse.json({ success: true, project })
  } catch (e) {
    // This will show the real reason in your terminal if something else is wrong.
    console.error('projects POST error:', e)
    return NextResponse.json(
      { success: false, message: e?.message || 'Server error' },
      { status: 500 }
    )
  }
}
