//src/app/api/admin//blogs/[id]/route.js
import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongodb'

export async function PATCH(req, { params }) {
  const { db } = await connectToDatabase()
  const body = await req.json().catch(() => ({}))
  const patch = { ...body, updatedAt: new Date() }
  await db.collection('blogs').updateOne(
    { _id: new ObjectId(params.id) },
    { $set: patch }
  )
  return NextResponse.json({ success: true })
}

export async function DELETE(_req, { params }) {
  const { db } = await connectToDatabase()
  await db.collection('blogs').deleteOne({ _id: new ObjectId(params.id) })
  return NextResponse.json({ success: true })
}