//src/app/api/blogs/route.js
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET() {
  const { db } = await connectToDatabase()
  const rows = await db.collection('blogs')
    .find({}, { projection: { title: 1, slug: 1, coverUrl: 1, excerpt: 1, date: 1, readTime: 1 } })
    .sort({ date: -1, _id: -1 })
    .toArray()
  return NextResponse.json({ success: true, rows })
}