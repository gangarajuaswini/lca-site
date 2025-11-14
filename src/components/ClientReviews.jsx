//src/components/ClientReviews.jsx
'use client'
import { useEffect, useState } from 'react'

export function ReviewsTable({ rows, onEdit, onPublish, onUnpublish }) {
  const rowKey = (r, i) => r._id || r.customerRef || r.referenceId || `${r.fullName}-${i}`

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[960px] w-full border border-border bg-card border-collapse">
        <thead>
          <tr className="bg-surface/70 text-gold-300">
            {[
              'Reference ID',
              'Full Name',
              'Event Type',
              'Star Rating',
              'How was your Experience (Review)',
              'Consent',
              'Edit',
              'Website',
            ].map((h) => (
              <th
                key={h}
                className={
                  `px-4 py-2 text-left font-semibold border-b border-border ` +
                  (h === 'Website' ? 'min-w-[260px] ' : '') +
                  (h === 'How was your Experience (Review)' ? 'min-w-[32rem] md:min-w-[40rem] ' : '')
                }
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => {
            const isPub = r.status === 'published'
              return (
              <tr
                 key={rowKey(r, i)}
                  className={`align-top bg-card border-b border-border last:border-b-0 ${
                          isPub ? 'shadow-[inset_2px_0_0_0_rgba(34,197,94,1)]' : ''
                }`}
              >
                <td className="px-4 py-2 font-mono font-semibold">
                  {r.customerRef || r.referenceId || '—'}
                </td>
                <td className="px-4 py-2">{r.fullName || '—'}</td>
                <td className="px-4 py-2">{r.eventType || '—'}</td>

                {/* Star Rating — numeric “x / 5”; switch to stars if you prefer */}
                <td className="px-4 py-2">
                  {r.rating != null ? `${r.rating} / 5` : '—'}
                </td>

                <td className="px-4 py-2 min-w-[32rem] md:min-w-[40rem]">
                  {r.review || '—'}
                </td>
                <td className="px-4 py-2">{r.consent ? 'YES' : 'NO'}</td>

                {/* Edit */}
                <td className="px-4 py-2">
                  <button
                    onClick={() => onEdit(r)}
                    className="px-3 py-1.5 rounded border border-border hover:bg-ink"
                  >
                    Edit
                  </button>
                </td>

                {/* Website actions */}
                <td className="px-4 py-2 min-w-[260px] whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPublish(r.referenceId)}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded bg-gold-500 hover:bg-gold-400 text-ink"
                    >
                      {isPub ? 'Re-POST' : 'POST on website'}
                    </button>

                    {isPub && (
                      <button
                        onClick={() => onUnpublish(r.referenceId)}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded border border-red-600/40 text-red-500 hover:bg-red-600/10"
                      >
                        Delete from website
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
          {!rows.length && (
            <tr><td className="p-6 text-center text-muted" colSpan={8}>No reviews yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}


export function EditModal({ open, initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {})
  useEffect(() => { setForm(initial || {}) }, [initial, open])
  if (!open) return null

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave() {
    // Basic client validation to match your customer form
    const ratingNum = Number(form.rating)
    if (!form.review?.trim()) { alert('Review is required'); return }
    if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      alert('Star Rating must be between 1 and 5')
      return
    }
    await onSave({
      fullName: form.fullName ?? '',
      eventType: form.eventType ?? '',
      rating: ratingNum,
      review: form.review ?? '',
      consent: !!form.consent,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-card w-full max-w-2xl rounded-xl p-6 space-y-5 border border-border">
        <div className="text-lg text-gold-300 font-semibold">Edit Client Review</div>
        <Grid>
          <FI label="Full Name" v={form.fullName} onC={v=>set('fullName',v)}/>
          <FI label="Event Type" v={form.eventType} onC={v=>set('eventType',v)}/>
          <div>
            <label className="block text-sm mb-1">Rating (out of 5)</label>
            <input
              type="number" min={1} max={5} step={1}
              value={form.rating ?? ''}
              onChange={e => set('rating', e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 bg-surface/60 text-text
                        focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
            />
          </div>
          <TA label="Review" v={form.review} onC={v=>set('review',v)} />
          <FI label="Comments" v={form.comments || ''} onC={v=>set('comments',v)} wide/>
          <ImageUploader
            label="Profile Image"
            value={form.profileImageUrl || ''}
            onUploaded={(url)=>set('profileImageUrl', url)}
            onClear={()=>set('profileImageUrl','')}
            wide
          />
        </Grid>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded border border-border">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded bg-gold-500 hover:bg-gold-400 text-ink">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}
function FI({ label, v, onC, wide }) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <label className="block text-sm mb-1">{label}</label>
      <input
        value={v ?? ''} onChange={e=>onC(e.target.value)}
        className="w-full border border-border rounded-lg px-3 py-2 bg-surface/60 text-text placeholder:text-muted/70
                  focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
      />
    </div>
  )
}
function TA({ label, v, onC }) {
  return (
    <div className="md:col-span-2">
      <label className="block text-sm mb-1">{label}</label>
      <textarea
        rows={5} value={v ?? ''} onChange={e=>onC(e.target.value)}
        className="w-full border border-border rounded-lg px-3 py-2 bg-surface/60 text-text placeholder:text-muted/70
                  focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
      />
    </div>
  )
}


function ImageUploader({ label, value, onUploaded, onClear, wide }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function handlePick(ev) {
    const file = ev.target.files?.[0]
    if (!file) return
    setErr(''); setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/admin/uploads', { method:'POST', credentials:'include', body: fd })
      const d = await r.json().catch(()=> ({}))
      if (!r.ok || !d?.success) throw new Error(d?.message || 'Upload failed')
      onUploaded?.(d.url)
    } catch (e) {
      setErr(e?.message || 'Upload failed')
    } finally { setBusy(false); ev.target.value = '' }
  }

  return (
    <div className={`${wide ? 'md:col-span-2' : ''}`}>
      <label className="block text-sm mb-1">{label}</label>

      <div className="border border-border rounded-lg p-3 flex flex-col gap-2 bg-surface/40">
        {/* Preview row */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-surface rounded overflow-hidden flex items-center justify-center border border-border">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-muted">No image</span>
            )}
          </div>
          <div className="flex-1 text-xs break-all text-muted">{value || '—'}</div>
        </div>

        {/* Actions row */}
        <div className="flex gap-2">
          <label className="inline-flex">
            <input type="file" accept="image/*" className="hidden" onChange={handlePick} />
            <span className="px-3 py-2 border border-border rounded cursor-pointer hover:bg-ink">
              {busy ? 'Uploading…' : 'Upload'}
            </span>
          </label>

          {value ? (
            <button type="button" className="px-3 py-2 border border-border rounded hover:bg-ink" onClick={onClear}>
              Remove
            </button>
          ) : null}
        </div>

        {err && <div className="text-xs text-red-600">{err}</div>}
      </div>
    </div>
  )
}
