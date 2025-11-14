import clientPromise from '@/lib/mongodb'

let ensured = globalThis.__reviewsIndexesEnsured || false

export async function getReviewsCollection() {
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB || 'lca-visual-studios')
  const reviews = db.collection('client_reviews')

  if (!ensured) {
    try {
      await reviews.createIndex({ referenceId: 1, createdAt: -1 }, { name: 'ref_created' })
      await reviews.createIndex({ status: 1, createdAt: -1 }, { name: 'status_created' })
      await reviews.createIndex({ email: 1 }, { name: 'email' })
      globalThis.__reviewsIndexesEnsured = true
      ensured = true
    } catch (e) {
      console.error('reviews index ensure error:', e?.message || e)
    }
  }

  return reviews
}

/** Minimal shape validator/normalizer */
export function normalizeReview(input = {}) {
  const safe = (v) => typeof v === 'string' ? v.trim() : ''
  const ratingNum = Number(input.rating)
  const rating = Number.isFinite(ratingNum) ? Math.min(5, Math.max(1, ratingNum)) : null
  return {
    referenceId: safe(input.referenceId).toUpperCase(),
    name: safe(input.name) || safe(input.displayName) || safe(input.email.split('@')[0] || ''),
    email: safe(input.email).toLowerCase(),
    pictureUrl: safe(input.pictureUrl),
    highlight: safe(input.highlight),
    message: safe(input.message),
    eventName: safe(input.eventName),
    eventDate: safe(input.eventDate),
    rating,
  }
}
