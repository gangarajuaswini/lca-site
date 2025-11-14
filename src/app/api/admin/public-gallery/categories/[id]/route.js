//src/app/api/admin/public-gallery/categories/[id]/route.js
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ObjectId } from 'mongodb'

export async function GET(_req, { params }) {
  const id = params?.id
  if (!id) return NextResponse.json({ success:false, message:'id required' }, { status:400 })
  const db = await getDb()
  const r = await db.collection('publicCategories').findOne(
    { _id: new ObjectId(id) },
    { projection: { _id:1, name:1, order:1, driveFolderId:1 } }
  )
  if (!r) return NextResponse.json({ success:false, message:'Not found' }, { status:404 })
  return NextResponse.json({ success:true, category: { id:String(r._id), name:r.name, order:r.order??0, driveFolderId:r.driveFolderId||'' } })
}
