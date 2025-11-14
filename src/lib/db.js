//src/lib/db.js
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
let client, db
let indexesReady = null   // ensure we set indexes only once per runtime

async function ensureIndexes(database) {
  if (indexesReady) return indexesReady
  indexesReady = (async () => {
    const col = database.collection('client_reviews')
    // Unique on customerRef (but allow docs missing this field)
    await col.createIndex({ customerRef: 1 }, { unique: true, sparse: true })

    // (Optional) also make the review’s own referenceId unique
    await col.createIndex({ referenceId: 1 }, { unique: true, sparse: true })
  })().catch(err => {
    // If index already exists with same spec, ignore; otherwise rethrow
    const benign = ['IndexOptionsConflict', 'IndexKeySpecsConflict']
    if (!benign.includes(err?.codeName) && err?.code !== 85) throw err
  })
  return indexesReady
}

export async function getDb() {
  if (db) return db
  client = await MongoClient.connect(uri)
  db = client.db(process.env.MONGODB_DB || 'app')
  await ensureIndexes(db)   // <-- THIS LINE ensures your indexes exist
  return db
}
