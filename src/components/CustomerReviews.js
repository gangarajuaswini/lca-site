//src/components/CustomerReviews.js
'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/* Solid filled star (no white edge) */
function FilledStar({ className = 'w-5 h-5 text-yellow-400' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function CustomerReviews() {
  const [items, setItems] = useState([])
  const [active, setActive] = useState(0)
  const timerRef = useRef(null)
  const isHovering = useRef(false)

  useEffect(() => {
    let alive = true
    fetch('/api/public/client-reviews', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (!alive) return
        const arr = Array.isArray(d?.items) ? d.items : (Array.isArray(d?.rows) ? d.rows : [])
        const published = arr.filter(x => !x.status || String(x.status).toLowerCase().includes('publish'))
        setItems(published)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    clearInterval(timerRef.current)
    if (items.length > 1) {
      timerRef.current = setInterval(() => {
        if (!isHovering.current) setActive(i => (i + 1) % items.length)
      }, 30000)
    }
    return () => clearInterval(timerRef.current)
  }, [items.length])

  if (items.length === 0) return null

  const it = items[active] || {}
  const prev = () => setActive(i => (i - 1 + items.length) % items.length)
  const next = () => setActive(i => (i + 1) % items.length)

  return (
    <section id="reviews" className="section-padding bg-ink pt-4 md:pt-2">
      <div className="mt-20 pt-16 border-t border-border">
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        {/* Heading: 1st line white, 2nd line gold */}
        <div className="text-center mb-10">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold leading-tight">
            <span className="block text-text">What Clients Say</span>
            <span className="block text-gold-$1 text-yellow-400">About Us</span>
          </h2>
        </div>

        {/* Review card — no border, soft golden halo */}
        <div
          className="review-card relative rounded-3xl bg-card px-10 sm:px-16 md:px-24 lg:px-28 xl:px-32 py-10 md:py-14"
          onMouseEnter={() => (isHovering.current = true)}
          onMouseLeave={() => (isHovering.current = false)}
        >
          {items.length > 1 && (
            <>
              <button
                aria-label="Previous review"
                onClick={prev}
                className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full bg-card/90 hover:bg-card text-yellow-400 btn-gold-glow"
              >
                <ChevronLeft className="w-5 h-5 gold-icon-glow" />
              </button>

              <button
                aria-label="Next review"
                onClick={next}
                className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full bg-card/90 hover:bg-card text-yellow-400 btn-gold-glow"
              >
                <ChevronRight className="w-5 h-5 gold-icon-glow" />
              </button>
            </>
          )}

          <div className="grid grid-cols-1 gap-8 items-start">
            <div>
              {/* Stars – solid gold */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FilledStar
                    key={i}
                    className={
                      i < (Number(it.rating) || 0)
                        ? 'w-5 h-5 text-yellow-400 gold-icon-glow'
                        : 'w-5 h-5 text-gray-600'
                    }
                  />
                ))}
              </div>

              <blockquote className="text-muted leading-relaxed text-lg">
                {it.review || it.experience || ''}
              </blockquote>


              {/* Person */}
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface flex items-center justify-center">
                  {it.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.profileImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted">No photo</span>
                  )}
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-yellow-300 text-lg">{it.fullName || '—'}</div>
                  <div className="text-muted">{it.eventType || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dots */}
          {items.length > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to review ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={`w-2.5 h-2.5 rounded-full ${i === active ? 'bg-yellow-400' : 'bg-gray-500 hover:bg-gray-400'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </section>
  )
}
