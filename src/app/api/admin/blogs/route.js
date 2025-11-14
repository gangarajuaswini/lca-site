//src/app/api/admin/blogs/route.js
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

function slugify(s = '') {
  return s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function GET() {
  const { db } = await connectToDatabase()
  const rows = await db.collection('blogs')
    .find({}, { projection: { title: 1, slug: 1, coverUrl: 1, excerpt: 1, date: 1, readTime: 1 } })
    .sort({ date: -1, _id: -1 })
    .toArray()
  return NextResponse.json({ success: true, rows })
}

export async function POST(req) {
  const { db } = await connectToDatabase()
  const body = await req.json().catch(() => ({}))
  const now = new Date()

  let slug = (body.slug || slugify(body.title || ''))
  if (!slug) slug = 'post-' + now.getTime()

  // ensure uniqueness (cheaply)
  const exists = await db.collection('blogs').findOne({ slug })
  if (exists) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`

  const doc = {
    slug,
    coverUrl: body.coverUrl || '',
    title: body.title || '',
    excerpt: body.excerpt || '',
    eventName: body.eventName || '',
    date: body.date || '',
    readTime: body.readTime || '',
    hashtags: Array.isArray(body.hashtags) ? body.hashtags : [],
    sections: Array.isArray(body.sections) ? body.sections : [],
    gallery: Array.isArray(body.gallery) ? body.gallery : [],
    createdAt: now,
    updatedAt: now,
  }
  await db.collection('blogs').insertOne(doc)
  return NextResponse.json({ success: true, slug })
}