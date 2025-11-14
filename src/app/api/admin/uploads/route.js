// Next.js Route Handler for simple image uploads to /public/uploads
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req) {
  try {
    const form = await req.formData()
    const file = form.get('file') // key must be "file"
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success:false, message:'file is required' }, { status:400 })
    }

    const allowed = ['image/jpeg','image/png','image/webp','image/gif']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ success:false, message:'Unsupported file type' }, { status:415 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // 1699999999-profile.jpg
    const safeName = file.name.replace(/[^\w.-]+/g, '_')
    const filename = `${Date.now()}-${safeName}`
    const filePath = path.join(uploadsDir, filename)
    await writeFile(filePath, bytes)

    // Static URL from /public
    const url = `/uploads/${filename}`
    return NextResponse.json({ success:true, url, filename })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success:false, message:'Upload failed' }, { status:500 })
  }
}
