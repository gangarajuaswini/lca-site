// src/app/api/admin/customer-gallery/[referenceId]/lock/route.js
import { NextResponse } from 'next/server'
import { getCollections } from '@/lib/customerGallery'

export async function PATCH(req, ctx) {
  const { referenceId: raw } = await ctx.params
  const referenceId = String(raw || '').trim().toUpperCase()
  if (!referenceId) {
    return NextResponse.json({ success: false, message: 'referenceId required' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const locked = !!body.locked

  try {
    const { projects } = await getCollections()
    const selectionLockedAt = locked ? new Date() : null

    await projects.updateOne(
      { referenceId },
      {
        $set: {
          selectionLocked: locked,
          selectionLockedAt,
          updatedAt: new Date(),
        },
      }
    )

    const proj = await projects.findOne(
      { referenceId },
      { projection: { selectionLocked: 1, selectionLockedAt: 1 } }
    )

    return NextResponse.json({ success: true, project: proj })
  } catch (e) {
    console.error('lock toggle error:', e?.message || e)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
