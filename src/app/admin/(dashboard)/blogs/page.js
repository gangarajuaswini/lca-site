//src/app/admin/(dashboard)/blogs/page.js
'use client'
import { useEffect, useState } from 'react'

function emptyBlog() {
  return {
    title: '', coverUrl: '', excerpt: '', eventName: '', date: '', readTime: '',
    hashtags: [], sections: [], gallery: []
  }
}

export default function AdminBlogsPage() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptyBlog())

  async function load() {
    const res = await fetch('/api/admin/blogs', { cache: 'no-store', credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    setRows(Array.isArray(data?.rows) ? data.rows : [])
  }

  useEffect(() => { load() }, [])

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function addTag() { const t = prompt('Hashtag (without #)')?.trim(); if (t) update('hashtags', [...(form.hashtags||[]), t]) }
  function addSection() {
    const heading = prompt('Section heading') || ''
    const body = prompt('Section body') || ''
    update('sections', [...(form.sections||[]), { heading, body }])
  }
  function addGallery() { const url = prompt('Image/Video URL')?.trim(); if (url) update('gallery', [...(form.gallery||[]), url]) }

  async function onCreate(e) {
    e.preventDefault()
    await fetch('/api/admin/blogs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm(emptyBlog())
    await load()
  }

  async function onUpdate(id, patch) {
    await fetch(`/api/admin/blogs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    await load()
  }

  async function onDelete(id) {
    if (!confirm('Delete this blog post?')) return
    await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Blog</h1>

      {/* Create */}
      <form onSubmit={onCreate} className="bg-card border rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className="border p-2 rounded" placeholder="Title" value={form.title} onChange={e=>update('title', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Cover URL" value={form.coverUrl} onChange={e=>update('coverUrl', e.target.value)} />
        <input className="border p-2 rounded md:col-span-2" placeholder="Excerpt" value={form.excerpt} onChange={e=>update('excerpt', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Event Name" value={form.eventName} onChange={e=>update('eventName', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Date (YYYY-MM-DD)" value={form.date} onChange={e=>update('date', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Read time (e.g., 6 min)" value={form.readTime} onChange={e=>update('readTime', e.target.value)} />
        <div className="flex gap-2 md:col-span-2">
          <button type="button" className="px-3 py-2 border rounded" onClick={addTag}>+ Hashtag</button>
          <button type="button" className="px-3 py-2 border rounded" onClick={addSection}>+ Section</button>
          <button type="button" className="px-3 py-2 border rounded" onClick={addGallery}>+ Gallery item</button>
        </div>
        <div className="text-sm text-muted md:col-span-2">
          <div>Tags: {(form.hashtags||[]).map((t,i)=> <span key={i} className="px-2 py-1 bg-ink rounded mr-2">#{t}</span>)}</div>
          <div className="mt-2">Sections: {(form.sections||[]).length}</div>
          <div className="mt-2">Gallery items: {(form.gallery||[]).length}</div>
        </div>
        <div className="md:col-span-2">
          <button className="px-4 py-2 bg-ink text-text rounded">Publish Post</button>
        </div>
      </form>

      {/* List */}
      <div className="mt-8 grid gap-4">
        {rows.map(r => (
          <div key={r._id} className="bg-card border rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{r.title}</div>
              <div className="text-sm text-muted">{r.date} · {r.readTime}</div>
            </div>
            <div className="flex gap-2">
              <a className="px-3 py-1 border rounded" href={`/blog/${r.slug}`} target="_blank">View</a>
              <button className="px-3 py-1 border rounded" onClick={()=>onUpdate(r._id, { title: prompt('Title', r.title) || r.title })}>Rename</button>
              <button className="px-3 py-1 border rounded text-red-600" onClick={()=>onDelete(r._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}