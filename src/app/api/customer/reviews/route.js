//src/app/api/customer/reviews/route.js
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { normalizeReview } from '@/lib/schemas'

// GET  /api/customer/reviews?referenceId=LCA-XXXX
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const referenceId = (searchParams.get('referenceId') || '').trim() // customer/project ref
    if (!referenceId) {
      return NextResponse.json({ success:false, message:'referenceId is required' }, { status:400 })
    }
    const db = await getDb()
    const doc = await db.collection('client_reviews').findOne(
      { customerRef: referenceId },
      { projection: { _id:0 } }
    )
    return NextResponse.json({ success:true, review: doc || null })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success:false, message:'Failed to fetch review' }, { status:500 })
  }
}

// POST  /api/customer/reviews
export async function POST(req) {
  try {
    const body = await req.json()

    const required = ['fullName','eventType','eventDate','rating','highlight','review']
    for (const k of required) if (!body?.[k]) {
      return NextResponse.json({ success:false, message:`${k} is required` }, { status:400 })
    }

    const doc = normalizeReview({
      fullName: body.fullName,
      eventType: body.eventType,
      eventDate: body.eventDate,       // already Month YYYY
      rating: Number(body.rating),
      highlight: body.highlight,
      review: body.review,
      consent: !!body.consent,
      customerRef: body.referenceId || null, // customer/project ref from dashboard
    })

    const db = await getDb()

    // Prevent duplicates: if one exists for this customer, return it
    const existing = await db.collection('client_reviews').findOne({ customerRef: doc.customerRef })
    if (existing) {
      const { _id, ...r } = existing
      return NextResponse.json({ success:true, review:r, already:true })
    }

    await db.collection('client_reviews').insertOne(doc)
    return NextResponse.json({ success:true, review:doc })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success:false, message:'Failed to create review' }, { status:500 })
  }
}
