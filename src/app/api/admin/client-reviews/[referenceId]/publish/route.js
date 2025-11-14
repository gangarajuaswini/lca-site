//src/app/api/admin/client-reviews/[referenceId]/publish/route.js
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(_req, { params }) {
  try {
    const referenceId = params.referenceId?.trim()
    if (!referenceId) return NextResponse.json({ success:false, message:'referenceId missing' }, { status:400 })

    const db = await getDb()
    const doc = await db.collection('client_reviews').findOne({ referenceId })
    if (!doc) return NextResponse.json({ success:false, message:'Review not found' }, { status:404 })

    // build the snapshot from current draft values
    const snap = {
      fullName: doc.fullName,
      eventType: doc.eventType,
      eventDate: doc.eventDate,
      rating: Number(doc.rating || 0),
      highlight: doc.highlight,
      review: doc.review,
      profileImageUrl: doc.profileImageUrl || '',
      featuredImageUrl: doc.featuredImageUrl || '',
    }

    await db.collection('client_reviews').updateOne(
      { referenceId },
      { $set: { status: 'published', publishedAt: new Date(), publishedSnapshot: snap, updatedAt: new Date() } }
    )

    return NextResponse.json({ success:true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success:false }, { status:500 })
  }
}

export async function DELETE(_req, { params }) {
  try {
    const referenceId = params.referenceId?.trim()
    if (!referenceId) return NextResponse.json({ success:false, message:'referenceId missing' }, { status:400 })

    const db = await getDb()
    await db.collection('client_reviews').updateOne(
      { referenceId },
      { $set: { status: 'draft', publishedAt: null, publishedSnapshot: null, updatedAt: new Date() } }
    )
    return NextResponse.json({ success:true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success:false }, { status:500 })
  }
}
