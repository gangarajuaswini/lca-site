// src/app/admin/(dashboard)/public-gallery/page.js
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Images, Trash2 } from 'lucide-react'
import FileUpload from '@/components/FileUpload';

export default function AdminPublicGalleryPage() {
  const router = useRouter()
  const saveTimers = useRef({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [newCatName, setNewCatName] = useState('')

  const [media, setMedia] = useState([])
  const [mPage, setMPage] = useState(1)
  const [mTotal, setMTotal] = useState(0)

  // Updated preview function - local files
  function derivePreview(item) {
    if (item.previewUrl) return item.previewUrl;
    if (item.url) return item.url;
    if (item.localPath) return item.localPath;
    return '';
  }

  // Load Media
  async function loadMedia(page = 1) {
    const qs = new URLSearchParams({
      page: String(page),
      pageSize: '24',
      ...(categoryId ? { categoryId } : {}),
    });

    const r = await fetch(`/api/admin/public-gallery/media?${qs.toString()}`, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (r.status === 401 || r.status === 403) { router.push('/admin/login'); return; }

    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d?.success) { console.error(d); return; }

    setMedia(d.media || []);
    setMTotal(d.total || 0);
    setMPage(page);
  }

  useEffect(() => {
    if (categoryId) loadMedia(1);
  }, [categoryId]);

  async function saveItem(id, patch) {
    const r = await fetch(`/api/admin/public-gallery/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(patch),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok || !d?.success) throw new Error(d?.message || 'Update failed')
    setMedia(prev => prev.map(x => x._id === id ? { ...x, ...patch } : x))
  }

  async function deleteItem(id) {
    if (!confirm('Delete this media item?')) return
    const r = await fetch(`/api/admin/public-gallery/media/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok || !d?.success) { alert(d?.message || 'Delete failed'); return }
    setMedia(prev => prev.filter(x => x._id !== id))
    setMTotal(t => Math.max(0, t - 1))
  }

  // Load categories
  async function loadCategories() {
    async function fetchCats(url) {
      const r = await fetch(url, { credentials: 'include', cache: 'no-store' });
      if (r.status === 401 || r.status === 403) { router.push('/admin/login'); return null; }
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.success) return null;
      return (data.categories || []).map((c, idx) => ({
        ...c,
        id: c.id
          || c?._id?.toString?.()
          || (typeof c._id === 'string' ? c._id : undefined)
          || c.slug
          || `${c.name}-${idx}`
      }));
    }

    let list = await fetchCats('/api/admin/public-gallery/categories');
    if (!list) list = await fetchCats('/api/admin/public-gallery/categories');

    setCategories(list || []);
    if ((list?.length || 0) && !categoryId) setCategoryId(list[0].id);
    return list || [];
  }

  useEffect(() => {
    (async () => {
      try {
        const list = await loadCategories();
        if (list?.length) {
          const first = list[0].id;
          setCategoryId(prev => prev || first);
          await loadMedia(1);
        }
      } catch {
        alert('Failed to load categories');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Create category
  async function createCategory() {
    if (!newCatName.trim()) return alert('Enter a category name')
    try {
      setSaving(true)
      const r = await fetch('/api/admin/public-gallery/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newCatName.trim() }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !data?.success) throw new Error(data?.message || `HTTP ${r.status}`)
 
      setNewCatName('')
      const newId = data?.category?._id?.toString?.()
      const list = await loadCategories()

      if (newId) {
        setCategoryId(newId)
      } else if (list?.length) {
        setCategoryId(list[0].id)
      }

      alert('Category created')
    } catch (e) {
      console.error(e); alert(e.message || 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  async function saveCategoryOrder(id, order) {
    try {
      setSaving(true)
      const r = await fetch('/api/admin/public-gallery/categories', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, order: Number(order) }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.message || 'Update failed')
      await loadCategories()
    } catch (e) {
      console.error(e); alert(e.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  function queueOrderSave(id, value) {
    const current = categories.find(x => x.id === id)?.order ?? 0
    if (Number(value) === Number(current)) return

    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id])

    saveTimers.current[id] = setTimeout(() => {
      saveCategoryOrder(id, Number(value))
      delete saveTimers.current[id]
    }, 600)
  }

  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach(t => clearTimeout(t))
      saveTimers.current = {}
    }
  }, [])

  async function deleteCategory(id) {
    if (!confirm('Delete this category?')) return
    try {
      setSaving(true)
      const r = await fetch(`/api/admin/public-gallery/categories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !data?.success) throw new Error(data?.message || 'Delete failed')
      if (categoryId === id) setCategoryId('')
      await loadCategories()
      alert('Category deleted')
    } catch (e) {
      console.error(e); alert(e.message || 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  // NEW: File Upload Handler
  async function handleFileUpload(files) {
    if (!categoryId) return alert('Select a category first');

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('categoryId', categoryId);
      
      for (const file of files) {
        formData.append('files', file);
      }

      const r = await fetch('/api/admin/public-gallery/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const d = await r.json();
      if (!r.ok || !d?.success) throw new Error(d?.message || 'Upload failed');

      alert(`Uploaded ${d.uploaded || 0} files successfully!`);
      await loadMedia(mPage);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-3">
          <Images className="h-6 w-6 text-gold-300" aria-hidden="true"/>
          <h1 className="text-xl font-semibold text-gold-300 flex items-center gap-2">
            Public Gallery
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Category management */}
        <section className="bg-card rounded-xl shadow p-5 border border-border">
          <h2 className="text-lg font-semibold mb-4">Categories</h2>

          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="New category name"
              className="flex-1 border border-border rounded-lg px-3 py-2 bg-surface/60 text-text placeholder:text-muted/70
                      focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
            />
            <button
              onClick={createCategory}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-ink font-medium px-4 py-2 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-gold-500/40 disabled:opacity-60"
            >
              Create Category
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="text-muted py-8 text-center border border-border rounded-lg">No categories yet.</div>
          ) : (
            <ul className="grid grid-cols-3 gap-4">
                {categories.map((c, idx) => (
                  <li
                  key={c.id || c._id || c.slug || `${c.name}-${idx}`}
                  className="border border-border bg-card rounded-xl p-4 flex flex-col gap-3 overflow-hidden"
                >
                  <div className="text-base font-medium truncate" title={c.name}>
                    {c.name}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label className="text-xs text-muted flex items-center gap-2">
                      <span>Order</span>
                      <input
                        type="number"
                        className="w-20 border border-border rounded px-2 py-1 text-sm bg-surface/60 text-text
                              focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/60"
                        value={typeof c.order === 'number' ? c.order : 0}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setCategories(prev => prev.map(x => x.id === c.id ? { ...x, order: val } : x))
                          queueOrderSave(c.id, val)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (saveTimers.current[c.id]) { clearTimeout(saveTimers.current[c.id]); delete saveTimers.current[c.id] }
                            saveCategoryOrder(c.id, Number(e.currentTarget.value))
                          }
                        }}
                        onBlur={(e) => {
                          if (saveTimers.current[c.id]) { clearTimeout(saveTimers.current[c.id]); delete saveTimers.current[c.id] }
                          saveCategoryOrder(c.id, Number(e.currentTarget.value))
                        }}
                      />
                    </label>

                    <button
                      onClick={() => deleteCategory(c.id)}
                      className="self-end sm:self-auto inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium
                            text-red-500 hover:text-red-50 hover:bg-red-600/20 border border-transparent"
                      title="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* File Upload Panel */}
        <section className="bg-card rounded-xl shadow p-5 border border-border">
          <h2 className="text-lg font-semibold mb-4">Upload Media</h2>
          
          <div className="space-y-4">
            {/* Category select */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Category</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="select-dark border border-border rounded-lg px-3 py-2 min-w-[24rem] md:min-w-[32rem] lg:min-w-[36rem]
                      bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60
                      [color-scheme:dark]"
              >
                {categories.length === 0 && <option value="">No categories yet</option>}
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            {categoryId ? (
              <FileUpload
                onUpload={handleFileUpload}
                disabled={uploading || !categoryId}
                accept="image/*,video/*"
                multiple={true}
              />
            ) : (
              <div className="text-sm text-muted text-center py-8 border border-dashed border-border rounded-lg">
                Select a category to upload files
              </div>
            )}
          </div>
        </section>

        {/* Manage Media */}
        <section className="rounded-2xl border border-border bg-card shadow-sm p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
            <h2 className="text-xl font-semibold tracking-tight">Manage Media</h2>
          </div>

          {!categoryId ? (
            <div className="py-10 text-center text-muted">
              Choose a category to manage media.
            </div>
          ) : media.length === 0 ? (
            <div className="py-10 text-center text-muted">
              No media in this category. Upload files above.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {media.map((item) => {
                const isVideo = item.mimeType?.startsWith('video/');
                const preview = derivePreview(item);

                return (
                  <div
                    key={item._id}
                    className="rounded-xl border border-border bg-card p-3 hover:shadow-sm transition"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-surface">
                      {isVideo ? (
                        <video
                          src={preview || undefined}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          controls
                        />
                      ) : (
                        <img src={preview || ''} alt={item?.name || 'media item'} className="w-full h-full object-cover"/>
                      )}

                      <span className="pointer-events-none absolute top-2 left-2 z-10 text-xs px-2 py-1 rounded-full bg-ink/60 text-text">
                        {isVideo ? 'Video' : 'Photo'}
                      </span>
                    </div>

                    <div className="mt-3 space-y-3">
                      <select
                        value={item.categoryId}
                        onChange={(e) => saveItem(item._id, { categoryId: e.target.value })}
                        className="select-dark w-full rounded-lg border border-border px-3 py-2 text-sm
                              bg-gray-900 text-gray-100 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-gold-500/40 
                              focus:border-gold-500/60"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => deleteItem(item._id)}
                        className="w-full rounded-lg border border-red-600/40 px-3 py-2 text-sm text-red-500
                            hover:bg-red-600/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pager */}
          {categoryId && mTotal > media.length && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => loadMedia(Math.max(1, mPage - 1))}
              disabled={mPage <= 1}
              className="px-4 py-2 rounded-lg border border-border hover:bg-ink disabled:opacity-50"
            >
              Prev
            </button>

            <div className="text-sm text-muted">
              Page {mPage} of {Math.max(1, Math.ceil(mTotal / 24))}
            </div>

            <button
              onClick={() => loadMedia(mPage + 1)}
              disabled={mPage * 24 >= mTotal}
              className="px-4 py-2 rounded-lg border border-border hover:bg-ink disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
        </section>
      </main>
    </div>
  )
}
