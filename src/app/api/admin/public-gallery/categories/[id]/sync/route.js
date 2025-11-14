// /src/app/api/admin/public-gallery/categories/[id]/sync/route.js
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ObjectId } from 'mongodb'
// ⬇️ use your existing drive lister
import { listFolderFiles } from '@/lib/drive' // <-- change to your helper

export async function POST(req, { params }) {
  const id = params?.id
  if (!id) return NextResponse.json({ success:false, message:'id required' }, { status:400 })

  const db = await getDb()
  const cat = await db.collection('publicCategories').findOne({ _id: new ObjectId(id) })
  if (!cat?.driveFolderId) {
    return NextResponse.json({ success:false, message:'No driveFolderId set for this category' }, { status:400 })
  }
 
  // pull files from Drive
  const files = await listFolderFiles(cat.driveFolderId) // [{ id, name, mimeType, webViewLink, thumbnailLink, size }]
  if (!Array.isArray(files)) return NextResponse.json({ success:false, message:'Drive list failed' }, { status:500 })

  let created = 0, updated = 0

  for (const f of files) {
    const type = String(f.mimeType || '').startsWith('video/') ? 'video' : 'photo'
    const now = new Date()

    const exists = await db.collection('publicMedia').findOne({ driveFileId: f.id, categoryId: String(cat._id) }, { projection: { _id:1, order:1 } })
    if (exists) {
      // keep order as-is; just refresh metadata if mime/name changed
      await db.collection('publicMedia').updateOne(
        { _id: exists._id },
        { $set: { name: f.name, mimeType: f.mimeType, type, previewUrl: '', url: '', updatedAt: now } }
      )
      updated++
    } else {
      // new doc; put at the end = max(order)+1 for that category
      const max = await db.collection('publicMedia').find({ categoryId: String(cat._id) }).sort({ order:-1 }).limit(1).toArray()
      const nextOrder = (max[0]?.order ?? 0) + 1

      await db.collection('publicMedia').insertOne({
        categoryId: String(cat._id),
        name: f.name,
        mimeType: f.mimeType,
        type,
        order: nextOrder,
        driveFileId: f.id,
        // Let your public and admin UIs use your existing preview proxy:
        previewUrl: '', // you will render via /api/drive/preview/:id
        url: '',        // (optional) if you host images elsewhere
        importedAt: now,
        createdAt: now,
        updatedAt: now
      })
      created++
    }
  }

  //Return an imported count from the sync route
  const imported = created;      // what the UI wants to show
  const scanned  = files.length; // optional: total from Drive

  await db.collection('publicCategories').updateOne(
    { _id: new ObjectId(id) },
    { $set: { lastSyncedAt: new Date() } }
  );

  return NextResponse.json({ 
    success:true, 
    imported, 
    created, 
    updated, 
    total: scanned 
  });
}
