'use client'
import { useEffect, useState } from 'react'

export default function PublicTestimonials() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const r = await fetch('/api/public/client-reviews', { cache: 'no-store' })
        const d = await r.json().catch(()=> ({}))
        if (!ignore && d?.success) setItems(Array.isArray(d.items) ? d.items : [])
      } finally { if (!ignore) setLoading(false) }
    })()
    return () => { ignore = true }
  }, [])

  if (loading) return null
  if (!items.length) return null

  return (
    <div className="space-y-6">
      {items.map((t, i) => (
        <article key={(t.customerRef || t.referenceId || i) + '-pub'} className="rounded-xl p-4 bg-card shadow">
          {/* rating */}
          <div className="text-gold-500 text-lg mb-2">
            {'★'.repeat(Number(t.rating || 0))}{' '}
            <span className="text-muted">{'★'.repeat(Math.max(0, 5 - Number(t.rating || 0)))}</span>
          </div>

          {/* main review text */}
          <blockquote className="text-muted leading-relaxed">“{t.review}”</blockquote>

          {/* highlight */}
          {t.highlight && (
            <div className="mt-3 text-sm italic bg-gold-50 rounded px-3 py-2">
              “{t.highlight}”
            </div>
          )}

          {/* person + meta */}
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface flex items-center justify-center">
              {t.profileImageUrl ? (
                <img src={t.profileImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-muted">No photo</span>
              )}
            </div>
            <div className="text-sm">
              <div className="font-medium">{t.fullName || '—'}</div>
              <div className="text-muted">
                {t.eventType || '—'} • {t.eventDate || ''}
              </div>
            </div>
          </div>

          {/* featured image */}
          {t.featuredImageUrl && (
            <div className="mt-4 rounded-lg overflow-hidden">
              <img src={t.featuredImageUrl} alt="" className="w-full h-64 object-cover" />
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
