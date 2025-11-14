//src/app/api/blogs/[id]/route.js
import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(_req, { params }) {
  const { db } = await connectToDatabase()
  const key = params.id

  // allow either ObjectId or slug
  let row = null
  if (ObjectId.isValid(key)) {
    row = await db.collection('blogs').findOne({ _id: new ObjectId(key) })
  }
  if (!row) {
    row = await db.collection('blogs').findOne({ slug: key })
  }

  return NextResponse.json({ success: true, row })
}