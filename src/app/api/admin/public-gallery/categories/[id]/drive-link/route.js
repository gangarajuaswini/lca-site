//src/app/api/admin/public-gallery/categories/[id]/drive-link/route.js
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ObjectId } from 'mongodb'

function extractDriveFolderId(input='') {
  const s = String(input).trim()
  const m = s.match(/\/folders\/([A-Za-z0-9_-]+)/) || s.match(/[?&]id=([A-Za-z0-9_-]+)/) || s.match(/[-\w]{20,}/)
  return m ? (m[1] || m[0]) : ''
}

export async function POST(req, { params }) {
  const id = params?.id
  if (!id) return NextResponse.json({ success:false, message:'id required' }, { status:400 })
  const body = await req.json().catch(()=> ({}))
  const driveFolderId = extractDriveFolderId(body?.driveLink || '')
  if (!driveFolderId) return NextResponse.json({ success:false, message:'Invalid Drive folder link/ID' }, { status:400 })

  const db = await getDb()
  const res = await db.collection('publicCategories').updateOne(
    { _id: new ObjectId(id) },
    { $set: { driveFolderId, updatedAt: new Date() } }
  )
  if (!res.matchedCount) return NextResponse.json({ success:false, message:'Not found' }, { status:404 })
  return NextResponse.json({ success:true, driveFolderId })
}

export async function GET(_req, { params }) {
  const id = params?.id
  const db = await getDb()
  const r = await db.collection('publicCategories').findOne({ _id: new ObjectId(id) }, { projection: { driveFolderId:1 } })
  return NextResponse.json({ success:true, driveFolderId: r?.driveFolderId || '' })
}
