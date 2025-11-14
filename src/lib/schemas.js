import { randomUUID } from 'crypto'

export function normalizeReview(payload) {
  const now = new Date()
  return {
    referenceId: randomUUID(),
    fullName: (payload.fullName || '').trim(),
    eventType: (payload.eventType || '').trim(),
    eventDate: (payload.eventDate || '').trim(),
    rating: Number(payload.rating || 0),
    highlight: (payload.highlight || '').trim(),
    review: (payload.review || '').trim(),
    consent: !!payload.consent,
    comments: payload.comments ?? '',
    profileImageUrl: payload.profileImageUrl || '',
    featuredImageUrl: payload.featuredImageUrl || '',
    customerRef: payload.customerRef || null,

    // publishing state
    status: 'draft',              // 'draft' | 'published'
    publishedAt: null,
    publishedSnapshot: null,      // <- the frozen copy used by public site

    createdAt: now,
    updatedAt: now,
  }
}
