// src/app/api/admin/customer-gallery/[referenceId]/projects/route.js
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAdminOrThrow } from '@/lib/auth'

// src/app/api/admin/customer-gallery/projects/route.js  (add)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const referenceId = (searchParams.get('ref') || searchParams.get('referenceId') || '').trim()
    const category = (searchParams.get('category') || '').trim()
    if (!referenceId || !category) {
      return NextResponse.json({ success:false, message:'referenceId and category required' }, { status:400 })
    }
    const { projects, assets } = await getCollections()
    await projects.deleteOne({ referenceId, category })
    // optional: also purge assets for that category
    // await assets.deleteMany({ referenceId, category })
    return NextResponse.json({ success:true })
  } catch (e) {
    console.error('projects DELETE error', e)
    return NextResponse.json({ success:false, message:'Server error' }, { status:500 })
  }
}

