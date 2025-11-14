//src/app/admin/(dashboard)/inbox/page.js
'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Download, ChevronUp, ChevronDown } from 'lucide-react'
import EventTypeSelect from '@/components/EventTypeSelect'



const STATUS= [
  'New', 'Contacted', 'Confirmed', 'Shot', 'Delivered', 'Event Cancelled', 'Not Interested'
]

const statusColor = {
  New:               'bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/40',
  Contacted:         'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40',
  Confirmed:         'bg-green-500/15 text-green-300 ring-1 ring-green-500/40',
  Shot:              'bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/40',
  Delivered:         'bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/40',
  'Event Cancelled': 'bg-red-500/15 text-red-300 ring-1 ring-red-500/40',
  'Not Interested':  'bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/40',
}


function buildDisplayName(c) {
  return (c.fullName && c.fullName.trim())
    || [c.firstName, c.lastName].filter(Boolean).join(' ')
    || c.name
    || ''
}

function buildSearchText(r) {
  const loc = [r.city, r.state, r.country].filter(Boolean).join(' ')
  return [
    r.referenceId,
    r.fullName,
    r.email,
    r.contactNumber,
    r.eventType,
    loc,
    r.eventDate,
    r.eventTime,
    r.timeZone,
    r.duration ? `${r.duration}h` : '',
    r.message,
    r.status,
    r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '',
    r.adminComment || ''
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

/** Small header button for sorting */
function SortHead({ label, active, asc, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-1 font-semibold text-gold-300 hover:text-gold-200"
      title={`Sort by ${label}`}
    >
      <span>{label}</span>
      {active ? (asc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : <ChevronUp className="h-4 w-4 opacity-20" />}
    </button>
  )
}

/** The pill + invisible select */
function StatusCell({ value, onChange }) {
  const safe = STATUS.includes(value) ? value : 'New'
  return (
    <div className="relative inline-block">
      <span className={`block rounded-full px-3 py-1 text-xs sm:text-sm select-none ${statusColor[safe] || 'bg-zinc-500/20 text-muted ring-1 ring-border'}`}>
        {safe}
      </span>
      <select
        value={safe}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Change status"
        className="absolute inset-0 opacity-0 cursor-pointer [appearance:none] [color-scheme:light] !text-black"
        style={{ color: '#111' }}
      >
        {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}

export default function AdminInboxPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [pageSize, setPageSize] = useState(25) // 25 / 50 / 100 / 'all'
  const [eventSort, setEventSort] = useState('none') // 'none' | 'asc' | 'desc'
  const [sortBy, setSortBy] = useState('date')
  const [sortStatusAsc, setSortStatusAsc] = useState(true)
  const router = useRouter()
  const timers = useRef(new Map()) // debounce timers keyed by _id

  // inline editor control for certain cells
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({})

  // modal editor state
  const [editing, setEditing] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [expandedReq, setExpandedReq] = useState(new Set());
  function toggleReq(id) {
    setExpandedReq(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }



  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/contacts', { credentials: 'include' })
        if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return; }
        const data = await res.json().catch(() => ({}))
        const list = Array.isArray(data.rows) ? data.rows : (Array.isArray(data.contacts) ? data.contacts : [])
        setRows(list.map(c => {
          const fullName = buildDisplayName(c)
          const row = { ...c, fullName, status: c.status || 'New', adminComment: c.adminComment || '' }
          return { ...row, _search: buildSearchText(row) }
        }))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  function save(id, patch) {
    // optimistic UI
    setRows(prev =>
      prev.map(r => r._id === id ? (() => {
        const next = { ...r, ...patch }
        return { ...next, _search: buildSearchText(next) }
      })() : r)
    )

    // debounce network
    const old = timers.current.get(id)
    if (old) clearTimeout(old)
    const t = setTimeout(async () => {
      try {
        await fetch(`/api/admin/contacts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(patch),
        })
      } catch (e) {
        console.error('autosave failed', e)
      }
    }, 500)
    timers.current.set(id, t)
  }

  function openEdit(row) {
    // Allowed fields only in the modal (protected fields are read-only display)
    setEditing({
      _id: row._id,
      referenceId: row.referenceId || '',
      fullName: row.fullName || '',
      email: row.email || '',
      contactNumber: row.contactNumber || row.phone || '',
      city: row.city || '',
      state: row.state || '',
      country: row.country || '',
      eventType: row.eventType || '',
      eventDate: row.eventDate || '',
      eventTime: row.eventTime || '',
      timeZone: row.timeZone || '',
      duration: row.duration || '',
      message: row.message || '',
      status: row.status || 'New',
      adminComment: row.adminComment || ''
    })
  }

  async function saveEdit() {
    if (!editing?._id) return
    try {
      setSavingEdit(true)

      // client-side patch filter (server enforces again)
      const patch = {
        city: editing.city,
        state: editing.state,
        country: editing.country,
        eventType: editing.eventType,
        eventDate: editing.eventDate,
        eventTime: editing.eventTime,
        timeZone: editing.timeZone,
        duration: editing.duration,
        message: editing.message,
        status: editing.status,
        adminComment: editing.adminComment
      }

      const res = await fetch(`/api/admin/contacts/${editing._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch)
      })
      const data = await res.json().catch(()=>({}))
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Save failed')

      // reflect changes in table immediately (rebuild _search too)
      setRows(prev => prev.map(r => {
        if (r._id !== editing._id) return r
        const next = { ...r, ...patch }
        return { ...next, _search: buildSearchText(next) }
      }))

      setEditing(null)
    } catch (e) {
      alert(e.message || 'Failed to save')
    } finally {
      setSavingEdit(false)
    }
  }

  async function deleteInbox(row) {
    if (!confirm('Delete this entry from Inbox?')) return
    try {
      const res = await fetch(`/api/admin/contacts/${row._id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setRows(list => list.filter(x => x._id !== row._id))
      } else {
        alert(data?.message || 'Delete failed')
      }
    } catch (e) {
      console.error(e)
      alert('Network error')
    }
  }


  const [resendingId, setResendingId] = useState(null);

  async function resendAccess(row) {
    try {
      setResendingId(row._id);
      const res = await fetch('/api/admin/send-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // cookie auth
        body: JSON.stringify({ email: row.email, referenceId: row.referenceId })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to send');
      alert('Access email sent.');
    } catch (e) {
      alert(e.message || 'Failed to send');
    } finally {
      setResendingId(null);
    }
  }


  // inline editor for simple text cells (used only on editable columns below)
  function ECell({ row, k, className = '' }) {
    const isEditing = editingId === row._id
    if (!isEditing) {
      return (
        <div
          className="cursor-text"
          onDoubleClick={() => { setEditingId(row._id); setDraft({ [k]: row[k] ?? '' }); }}
        >
          {row[k] ?? ''}
        </div>
      )
    }
    return (
      <input
        autoFocus
        className={`border border-border bg-surface/60 text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60 rounded px-2 py-1 w-full ${className}`}
        value={(draft[k] ?? row[k]) ?? ''}
        onChange={(e) => setDraft(d => ({ ...d, [k]: e.target.value }))}
        onBlur={() => { save(row._id, { [k]: (draft[k] ?? '').trim() }); setEditingId(null); setDraft({}); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') { setEditingId(null); setDraft({}); }
        }}
      />
    )
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    let arr = [...rows]

    if (term) arr = arr.filter(r => (r._search || '').includes(term))

    if (sortBy === 'status') {
      const idx = (s) => {
        const i = STATUS.indexOf(s || 'New')
        return i === -1 ? 0 : i
      }
      arr.sort((a, b) => {
        const da = idx(a.status)
        const db = idx(b.status)
        return sortStatusAsc ? da - db : db - da
      })
    } else if (eventSort !== 'none') {
      arr.sort((a, b) => {
        const da = a.eventDate ? new Date(a.eventDate) : new Date(0)
        const db = b.eventDate ? new Date(b.eventDate) : new Date(0)
        return eventSort === 'asc' ? (da - db) : (db - da)
      })
    }
    return arr
  }, [rows, q, eventSort, sortBy, sortStatusAsc])

  const visible = useMemo(() => {
    if (pageSize === 'all') return filtered
    const n = Number(pageSize) || 25
    return filtered.slice(0, n)
  }, [filtered, pageSize])

  function exportCSV() {
    const headers = [
      'Reference ID','Name','Email','Phone','Event Type','Location',
      'Event Date','Event Time','Duration','Requirements',
      'Status','Submitted','Comments'
    ]
    const lines = [headers.join(',')]

    const esc = (v) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }

    visible.forEach(r => {
      const loc = [r.city, r.state, r.country].filter(Boolean).join(', ')
      const submittedAt = r.submittedAt || r.createdAt
      lines.push([
        esc(r.referenceId),
        esc(r.fullName),
        esc(r.email),
        esc(r.contactNumber),
        esc(r.eventType),
        esc(loc),
        esc(r.eventDate || ''),
        esc(`${r.eventTime || ''} ${r.timeZone || ''}`.trim()),
        esc(r.duration ? `${Number(r.duration)}h` : ''),
        esc(r.message || ''),
        esc(r.status || 'New'),
        esc(submittedAt ? new Date(submittedAt).toLocaleString() : ''),
        esc(r.adminComment || '')
      ].join(','))
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'inbox.csv'
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }
 
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="bg-transparent shadow-none border-b border-border">
        <div className="mx-auto max-w-screen-2xl px-6 py-6">
          <h1 className="text-2xl font-bold text-gold-300">Inbox</h1>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-6 py-8 space-y-6">
        {/* Top bar: search, page size, sort, export */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative md:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
            <input
              className="w-full pl-10 pr-3 py-2 border border-border bg-surface/60 text-text placeholder:text-muted/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
              placeholder="Search name, email, phone, reference, status"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-muted">Page size</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="border border-border rounded-lg px-2 py-2 bg-surface/60 text-text focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">All</option>
            </select>

            <label className="text-sm text-muted ml-2">Event date</label>
            <select
              value={eventSort}
              onChange={(e) => setEventSort(e.target.value)}
              className="border border-border rounded-lg px-2 py-2 bg-surface/60 text-text focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
            >
              <option value="none">No sort</option>
              <option value="asc">Oldest → Newest</option>
              <option value="desc">Newest → Oldest</option>
            </select>

            <button onClick={exportCSV} className="border border-border rounded-lg px-2 py-2 bg-surface/60 text-text focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-card shadow rounded-2xl border border-border overflow-hidden">
          <table className="min-w-[1800px] text-sm border-separate border-spacing-0">
            <thead className="bg-surface/70 sticky top-0 z-10 relative
                        after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border">
              <tr className="text-gold-300">
                <th className="px-6 py-3 text-left font-semibold min-w-[160px]">Reference ID</th>
                <th className="px-6 py-3 text-left font-semibold min-w-[140px]">Name</th>
                <th className="px-6 py-3 text-left font-semibold min-w-[240px]">Email</th>
                <th className="px-6 py-3 text-left font-semibold min-w-[140px]">Phone</th>
                <th className="px-6 py-3 text-left font-semibold min-w-[180px]">Event Type</th>
                <th className="px-6 py-3 text-left font-semibold min-w-[240px]">Location</th>
                <th className="px-6 py-3 text-left font-semibold min-w-[130px]">Event Date</th>
                <th className="px-6 py-3 text-left font-semibold min-w-[220px]">Event Time</th>
                <th className="px-6 py-3 text-left font-semibold min-w-[80px]">Duration</th>
                <th className="px-6 py-3 text-left font-semibold min-w-[300px]">Requirements</th>

                <th className="px-4 py-3 text-left">
                  <SortHead
                    label="Status"
                    active={sortBy === 'status'}
                    asc={sortStatusAsc}
                    onToggle={() => { setSortBy('status'); setSortStatusAsc(v => !v) }}
                  />
                </th>
                <th className="px-6 py-3 text-left font-semibold min-w-[200px]">Submitted</th>
                <th className="px-6 py-3 text-left font-semibold min-w-[300px]">Comments</th>
                <th className="px-6 py-3 text-left font-semibold min-w-[180px]">Actions</th>
              </tr>
            </thead>

            <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border [&>tr:last-child>td]:border-b-0">
              {visible.map((r) => (
                <tr key={r._id} className="align-top hover:bg-surface/60">
                  <td className="px-6 py-4 font-mono whitespace-nowrap leading-6 text-text font-semibold">{r.referenceId}</td>
                  <td className="px-6 py-4 whitespace-nowrap leading-6">{r.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap leading-6">{r.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap leading-6">{r.contactNumber}</td>

                  {/* Editable columns only */}
                  <td className="px-6 py-4 leading-6"><ECell row={r} k="eventType" /></td>

                  <td className="px-6 py-4 whitespace-nowrap leading-6">
                    <div>{[r.city, r.state].filter(Boolean).join(', ')}{r.country ? ',' : ''}</div>
                    {r.country && <div className="text-muted">{r.country}</div>}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap leading-6"><ECell row={r} k="eventDate" /></td>
                  <td className="px-6 py-4 whitespace-nowrap leading-6">
                    <ECell row={r} k="eventTime" /> {r.timeZone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap leading-6">
                    {r.duration ? `${Number(r.duration)}h` : ''}
                  </td>
                  <td className="px-6 py-4 align-top min-w-[520px] max-w-[800px]">
                    {(() => {
                      const text = r.message || '';
                      if (!text) return <span>-</span>;

                      const expanded = expandedReq.has(r._id);
                      const LIMIT = 400; // characters to show before truncating
                      const shown = expanded ? text : text.slice(0, LIMIT);

                      return (
                        <div>
                          <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                            {shown}{!expanded && text.length > LIMIT ? '…' : ''}
                          </div>

                          {text.length > LIMIT && (
                            <button
                              onClick={() => toggleReq(r._id)}
                              className="mt-1 text-xs text-gold-300 hover:underline"
                            >
                              {expanded ? 'Show less' : 'Read more'}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusCell value={r.status} onChange={(s) => save(r._id, { status: s })} />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap leading-6">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ''}
                  </td>

                  <td className="px-6 py-3">
                    <textarea
                      rows={3}
                      className="w-full min-h-[72px] resize-y border border-border rounded-md p-2 bg-surface/60 text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
                      value={r.adminComment || ''}
                      onChange={(e) => save(r._id, { adminComment: e.target.value })}
                    />
                    <div className="text-xs text-red-400 hover:text-red-300 mt-1 cursor-pointer" onClick={() => save(r._id, { adminComment: '' })}>
                      Clear
                    </div>
                  </td>
                  {/* ACTIONS CELL */}
                  <td className="px-6 py-3 whitespace-nowrap">
                    <button
                      className="px-2 py-1 rounded border border-border bg-surface/70 text-text text-xs hover:bg-surface/60 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                      onClick={() => openEdit(r)}
                    >
                      Edit Info
                    </button>

                    <button
                      className="ml-2 px-2 py-1 rounded text-xs bg-gold-500 hover:bg-gold-400 text-ink focus:outline-none focus:ring-2 focus:ring-gold-500/40 disabled:opacity-60"
                      onClick={() => resendAccess(r)}
                      disabled={resendingId === r._id}
                      title="Send the same access email again"
                    >
                      {resendingId === r._id ? 'Sending…' : 'Resend Access Email'}
                    </button>

                    <button
                      className="ml-2 px-2 py-1 rounded border border-border bg-surface/70 text-xs text-red-400 hover:text-red-300 hover:bg-surface/60 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      onClick={() => deleteInbox(r)}
                    >
                      Delete
                    </button>
                  </td>


                </tr>
              ))}

              {visible.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-6 py-10 text-center text-muted">No entries.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-muted">
          Showing {visible.length} of {filtered.length} result{filtered.length !== 1 ? 's' : ''}.
        </div>






        {/* Edit Info modal */}
        {editing && (
          <div className="fixed inset-0 z-50 bg-ink/40 flex items-start md:items-center justify-center overflow-y-auto p-4">
            {/* PANEL */}
            <div className="w-full max-w-3xl bg-card rounded-xl shadow-2xl flex flex-col">
              {/* HEADER (sticky) */}
              <div className="px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
                <h3 className="text-lg font-medium">Edit Customer</h3>
              </div>

              {/* BODY (scrolls) */}
              <div className="px-6 py-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Protected (read-only) */}
                  {[
                    ['referenceId','Reference ID'],
                    ['fullName','Full Name'],
                    ['email','Email'],
                    ['contactNumber','Contact Number'],
                  ].map(([key,label]) => (
                    <div key={key} className="min-w-0">
                      <label className="block text-xs text-muted mb-1">{label}</label>
                      <input
                        className="w-full border border-border rounded px-3 py-2 bg-surface text-muted"
                        value={editing[key] ?? ''}
                        disabled
                      />
                    </div>
                  ))}

                  {/* Editable fields (single Event Type block here) */}
                  {[
                    ['city','City'],
                    ['state','State'],
                    ['country','Country'],
                    // eventType handled below
                    ['eventDate','Event Date'],
                    ['eventTime','Event Time'],
                    ['timeZone','Time Zone'],
                    ['duration','Duration (hours)'],
                  ].map(([key,label]) => (
                    <div key={key} className="min-w-0">
                      <label className="block text-xs text-muted mb-1">{label}</label>
                      <input
                        className="w-full border border-border rounded px-3 py-2 bg-surface/60 text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
                        value={editing[key] ?? ''}
                        onChange={e => setEditing(prev => ({ ...prev, [key]: e.target.value }))}
                      />
                    </div>
                  ))}

                  {/* Event Type (single, not duplicated) */}
                  <div className="min-w-0">
                    <label className="block text-xs text-muted mb-1">Event Type</label>
                    <EventTypeSelect
                      value={editing.eventType ?? ''}
                      onChange={(v) => setEditing(prev => ({ ...prev, eventType: v }))}
                      required
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 min-w-0">
                    <label className="block text-xs text-muted mb-1">Requirements / Message</label>
                    <textarea
                      rows={3}
                      className="w-full border border-border rounded px-3 py-2 bg-surface/60 text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
                      value={editing.message ?? ''}
                      onChange={e => setEditing(prev => ({ ...prev, message: e.target.value }))}
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 min-w-0">
                    <label className="block text-xs text-muted mb-1">Admin Comment</label>
                    <textarea
                      rows={3}
                      className="w-full border border-border rounded px-3 py-2 bg-surface/60 text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
                      value={editing.adminComment ?? ''}
                      onChange={e => setEditing(prev => ({ ...prev, adminComment: e.target.value }))}
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 min-w-0">
                    <label className="block text-xs text-muted mb-1">Status</label>
                    <select
                      className="w-full border border-border rounded px-3 py-2 bg-surface/60 text-text focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
                      value={editing.status ?? 'New'}
                      onChange={e => setEditing(prev => ({ ...prev, status: e.target.value }))}
                    >
                      {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* FOOTER (sticky) */}
              <div className="px-6 py-4 border-t border-border bg-card sticky bottom-0 flex justify-end gap-2">
                <button className="px-4 py-2 rounded border border-border bg-surface/70 text-text hover:bg-surface/60 focus:outline-none focus:ring-2 focus:ring-gold-500/40" onClick={() => setEditing(null)}>Cancel</button>
                <button
                  className="px-4 py-2 rounded bg-gold-500 hover:bg-gold-400 text-ink disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  onClick={saveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
