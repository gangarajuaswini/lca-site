//src/app/api/admin/public-gallery/media/[id]/route.js
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ObjectId } from 'mongodb'

export async function PATCH(req, { params }) {
  const id = params?.id
  const patch = await req.json().catch(()=> ({}))
  if (!id) return NextResponse.json({ success:false, message:'id required' }, { status:400 })

  const $set = { updatedAt: new Date() }
  if (Number.isFinite(Number(patch.order))) $set.order = Number(patch.order)
  if (typeof patch.categoryId === 'string') $set.categoryId = patch.categoryId

  const db = await getDb()
  const res = await db.collection('publicMedia').updateOne(
    { _id: new ObjectId(id) },
    { $set }
  )
  if (!res.matchedCount) return NextResponse.json({ success:false, message:'Not found' }, { status:404 })
  return NextResponse.json({ success:true })
}

export async function DELETE(_req, { params }) {
  const id = params?.id
  const db = await getDb()
  const res = await db.collection('publicMedia').deleteOne({ _id: new ObjectId(id) })
  if (!res.deletedCount) return NextResponse.json({ success:false, message:'Not found' }, { status:404 })
  return NextResponse.json({ success:true })
}
