import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

function sanitizeItem(raw) {
  const fileName = String(raw?.fileName || '').trim()
  const changes  = String(raw?.changes  || '').trim()
  if (!fileName || !changes) return null
  return {
    fileName: fileName.slice(0, 200),
    changes: changes.slice(0, 4000),
  }
}

export async function POST(req, { params }) {
  try {
    const referenceId = String(params?.referenceId || '').trim().toUpperCase()
    if (!referenceId) {
      return NextResponse.json({ success:false, message:'referenceId required' }, { status:400 })
    }

    const body = await req.json().catch(() => ({}))
    const items = Array.isArray(body?.items) ? body.items.map(sanitizeItem).filter(Boolean) : []
    if (!items.length) {
      return NextResponse.json({ success:false, message:'At least one file/change pair is required' }, { status:400 })
    }

    const db = await getDb()
    const doc = {
      referenceId,
      items,
      createdAt: new Date(),
      status: 'new', // 'new' | 'in_progress' | 'done' (optional future use)
      submittedBy: 'customer',
    }
    const r = await db.collection('edit_requests').insertOne(doc)
    return NextResponse.json({ success:true, id: r.insertedId, request: { ...doc, _id: r.insertedId } })
  } catch (e) {
    console.error('edit-requests POST error:', e)
    return NextResponse.json({ success:false, message: e?.message || 'Server error' }, { status:500 })
  }
}

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
    console.error('edit-requests GET (customer) error:', e)
    return NextResponse.json({ success:false, message:e?.message || 'Server error', items:[] }, { status:500 })
  }
}