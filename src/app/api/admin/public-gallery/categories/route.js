//src/app/api/admin/public-gallery/categories/route.js
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ObjectId } from 'mongodb'

export async function GET() {
  const db = await getDb()
  const rows = await db.collection('publicCategories')
    .find({}, { projection: { _id:1, name:1, order:1, driveFolderId:1 } })
    .sort({ order: 1, name: 1 })
    .toArray()
  return NextResponse.json({
    success: true,
    categories: rows.map(r => ({ id: String(r._id), name: r.name, order: r.order ?? 0, driveFolderId: r.driveFolderId || '' }))
  })
}

export async function POST(req) {
  const { name } = await req.json().catch(()=> ({}))
  if (!name?.trim()) return NextResponse.json({ success:false, message:'Name required' }, { status:400 })
  const db = await getDb()

  // place new ones after the max order
  const max = await db.collection('publicCategories').find().sort({ order:-1 }).limit(1).toArray()
  const nextOrder = (max[0]?.order ?? 0) + 1

  const doc = { name: name.trim(), order: nextOrder, driveFolderId: '', createdAt: new Date(), updatedAt: new Date() }
  const { insertedId } = await db.collection('publicCategories').insertOne(doc)
  return NextResponse.json({ success:true, category: { _id: insertedId, ...doc } })
}

export async function PATCH(req) {
  const { id, name, order } = await req.json().catch(()=> ({}))
  if (!id) return NextResponse.json({ success:false, message:'id required' }, { status:400 })

  const $set = { updatedAt: new Date() }
  if (typeof name === 'string') $set.name = name.trim()
  if (Number.isFinite(Number(order))) $set.order = Number(order)

  const db = await getDb()
  const res = await db.collection('publicCategories').updateOne(
    { _id: new ObjectId(id) },
    { $set }
  )
  if (!res.matchedCount) return NextResponse.json({ success:false, message:'Not found' }, { status:404 })
  return NextResponse.json({ success:true })
}

export async function DELETE(req) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ success:false, message:'id required' }, { status:400 })
  const db = await getDb()
  // optional: also delete media under this category
  await db.collection('publicMedia').deleteMany({ categoryId: id })
  const res = await db.collection('publicCategories').deleteOne({ _id: new ObjectId(id) })
  if (!res.deletedCount) return NextResponse.json({ success:false, message:'Not found' }, { status:404 })
  return NextResponse.json({ success:true })
}
