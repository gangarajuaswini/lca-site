// src/lib/inbox.js
import clientPromise from '@/lib/mongodb'

export async function getInboxCollection() {
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const name = process.env.INBOX_COLLECTION || 'contacts'
  return db.collection(name)
}

