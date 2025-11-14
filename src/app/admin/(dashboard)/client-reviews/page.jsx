//src/app/admin/(dashboard)/client-reviews/page.jsx
'use client'
import { useEffect, useState } from 'react'
import { ReviewsTable, EditModal } from '@/components/ClientReviews'

export default function AdminClientReviews() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/client-reviews', { cache:'no-store', credentials:'include' })
      const d = await r.json()
      if (d?.success) setRows(d.rows || [])
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [])

  function onEdit(row){ setSelected(row); setModalOpen(true) }

  async function onSave(form){
    // Remove fields we must not PATCH
    const { _id, referenceId, customerRef, status, createdAt, updatedAt, ...safe } = form

    const r = await fetch(`/api/admin/client-reviews/${selected.referenceId}`, {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json' },
      credentials:'include',                 // <-- added
      body: JSON.stringify(safe)
    })

    const d = await r.json()
    if (d?.success) {
      setModalOpen(false); setSelected(null); await load()
    } else {
      alert('Save failed')
    }
  }


  async function onPublish(referenceId){
    if (!referenceId) return
    const ok = confirm('Publish (or re-publish) this review to the website?')
    if (!ok) return
    const r = await fetch(`/api/admin/client-reviews/${referenceId}/publish`, {
      method:'POST',
      credentials:'include'                  // <-- added
    })
    const d = await r.json()
    if (d?.success) await load(); else alert('Failed to publish')
  }

  async function onUnpublish(referenceId){
    if (!referenceId) return
    const ok = confirm('Remove this review from the website?')
    if (!ok) return
    const r = await fetch(`/api/admin/client-reviews/${referenceId}/publish`, {
      method:'DELETE',
      credentials:'include'                  // <-- added
    })
    const d = await r.json()
    if (d?.success) await load(); else alert('Failed to remove')
  }
 
  return (
    <div className="min-h-screen bg-ink">
      {/* Black heading bar */}
      <header className="bg-ink border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gold-300">Client Reviews</h1>
          {loading && <span className="text-sm text-muted">Loading…</span>}
        </div>
      </header>
      {/* Page content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <ReviewsTable
            rows={rows}
            onEdit={onEdit}
            onPublish={onPublish}
            onUnpublish={onUnpublish}
          />

        <EditModal
          open={modalOpen}
          initial={selected}
          onSave={onSave}
          onClose={()=>{ setModalOpen(false); setSelected(null) }}
        />
      </main>
    </div>
  );
}
