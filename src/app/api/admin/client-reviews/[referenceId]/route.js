//src/app/api/admin/client-reviews/[referenceId]/route.js
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req, { params }) {
  try {
    const reviewId = params.referenceId?.trim()
    if (!reviewId) {
      return NextResponse.json({ success:false, message:'referenceId missing' }, { status:400 })
    }

    const payload = await req.json()
    const db = await getDb()

    // Only allow these fields to be edited in the modal
    const allowed = [
      'fullName',
      'eventType',
      'eventDate',
      'rating',
      'highlight',
      'review',
      'comments',
      'profileImageUrl',
      'featuredImageUrl',
      'consent',
    ]

    const update = { updatedAt: new Date() }
    for (const k of allowed) {
      if (payload[k] !== undefined) {
        update[k] = k === 'rating' ? Number(payload[k]) : payload[k]
      }
    }

    // NEVER update identity/meta fields
    // (Ignore if the client sent them by mistake)
    delete payload._id
    delete payload.referenceId
    delete payload.customerRef
    delete payload.status
    delete payload.createdAt
    delete payload.updatedAt

    const res = await db.collection('client_reviews')
      .updateOne({ referenceId: reviewId }, { $set: update })

    if (!res.matchedCount) {
      return NextResponse.json({ success:false, message:'Review not found' }, { status:404 })
    }

    const doc = await db.collection('client_reviews')
      .findOne({ referenceId: reviewId }, { projection: { _id: 0 } })

    return NextResponse.json({ success:true, review: doc })
  } catch (e) {
    console.error('Admin PATCH error:', e)
    return NextResponse.json({ success:false, message:'Update failed' }, { status:500 })
  }
}
