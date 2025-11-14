//src/components/GalleryBrowser.jsx
'use client'

import { useEffect, useMemo, useState } from 'react'

export default function GalleryBrowser({ categories }) {
  const [selected, setSelected] = useState('all')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 24

  const selectedLabel = useMemo(() => {
    if (selected === 'all') return 'All Work'
    const c = categories.find((c) => c._id === selected)
    return c?.name || 'All Work'
  }, [selected, categories])

  async function load(reset = false) {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      qs.set('page', String(reset ? 1 : page))
      qs.set('pageSize', String(pageSize))
      if (selected !== 'all') qs.set('categoryId', selected)
      const res = await fetch(`/api/public-gallery/media?${qs.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (reset) setItems(data.media || [])
      else setItems((prev) => [...prev, ...(data.media || [])])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }
 
  useEffect(() => {
    setPage(1)
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  useEffect(() => {
    if (page > 1) load(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <div className="space-y-6">
      {/* Category pills */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setSelected('all')}
          className={`px-4 py-2 rounded-full border transition ${
            selected === 'all'
              ? 'bg-gold-500 text-text border-gold-500'
              : 'bg-card hover:bg-gold-500 border-border'
          }`}
        >
          All Work
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => setSelected(c._id)}
            className={`px-4 py-2 rounded-full border transition ${
              selected === c._id
                ? 'bg-gold-500 text-text border-gold-500'
                : 'bg-card hover:bg-gold-500 border-border'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((m) => (
          <MediaCard key={m._id} item={m} />
        ))}
      </div>

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="text-center text-muted py-16">No items yet.</div>
      )}

      {/* Load more */}
      {items.length < total && (
        <div className="flex justify-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-6 py-3 rounded-lg bg-gold-500 text-text hover:bg-gold-500 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}

function MediaCard({ item }) {
  // Fallbacks if you only stored driveFileId
  const preview =
    item.previewUrl ||
    (item.driveFileId ? `https://drive.google.com/thumbnail?id=${item.driveFileId}&sz=w1000` : '')
  const download =
    item.downloadUrl ||
    (item.driveFileId ? `https://drive.google.com/uc?export=download&id=${item.driveFileId}` : '')

  return (
    <article className="group rounded-xl overflow-hidden shadow-sm bg-card border border-border hover:shadow-lg transition">
      {item.type === 'video' ? (
        <video
          controls
          preload="metadata"
          poster={preview || undefined}
          className="w-full aspect-video object-cover"
          src={download}
        />
      ) : (
        <img
          src={preview}
          alt={item.title || 'Photo'}
          loading="lazy"
          className="w-full aspect-video object-cover"
        />
      )}
      {item.title && (
        <div className="px-3 py-2 text-sm text-muted border-t border-border">
          {item.title}
        </div>
      )}
    </article>
  )
}
