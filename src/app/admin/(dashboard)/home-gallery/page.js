// src/app/admin/(dashboard)/home-gallery/page.js
'use client'
import { useEffect, useState } from 'react'
import FileUpload from '@/components/FileUpload';

function getPreviewUrl(row) {
  if (row?.previewUrl) return row.previewUrl;
  if (row?.url) return row.url;
  if (row?.localPath) return row.localPath;
  return '';
}

const isVideo = (r) =>
  /^video\//.test(r?.mimeType || '') ||
  r?.type === 'video' ||
  /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test((r?.name || ''));

export default function HomeGalleryAdmin() {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const res = await fetch(`/api/admin/home-gallery?section=hero`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    setRows(Array.isArray(data?.rows) ? data.rows : []);
  }

  useEffect(() => { load(); }, []);

  // NEW: File Upload Handler
  async function handleFileUpload(files) {
    setBusy(true);
    setUploading(true);
    setMsg(null);

    try {
      const formData = new FormData();
      formData.append('section', 'hero');
      
      for (const file of files) {
        formData.append('files', file);
      }

      const res = await fetch('/api/admin/home-gallery/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      setMsg(data);

      if (data?.ok || data?.success) {
        alert(`Uploaded ${data.uploaded || 0} files successfully!`);
        await load();
      } else {
        throw new Error(data?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.message || 'Upload failed');
      setMsg({ ok: false, message: error.message });
    } finally {
      setBusy(false);
      setUploading(false);
    }
  }

  async function onDelete(id) {
    if (!confirm('Delete this item from Home Gallery?')) return;
    await fetch(`/api/admin/home-gallery/item?id=${id}`, { method:'DELETE' });
    await load();
  }

  async function onOrderBlur(id, value) {
    await fetch('/api/admin/home-gallery/item', {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ id, order: Number(value) || 0 })
    });
    await load();
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold text-gold-300 mb-6">Home Gallery</h1>
      
      {/* File Upload Section */}
      <section className="bg-card p-6 rounded-xl border border-border mb-8">
        <h2 className="text-lg font-semibold mb-4">Upload Media</h2>
        <FileUpload
          onUpload={handleFileUpload}
          disabled={uploading}
          accept="image/*,video/*"
          multiple={true}
        />

        {msg && (
          <div className={`mt-4 p-3 rounded-lg border ${msg.ok || msg.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            <pre className="text-xs">{JSON.stringify(msg, null, 2)}</pre>
          </div>
        )}

        <a href="/api/home-gallery?section=hero" className="inline-block mt-4 text-gold-500 underline text-sm">
          View API JSON
        </a>
      </section>

      {/* Items Grid */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gold-300">Hero Items</h2>
          <button onClick={load} className="text-gold-500 hover:underline text-sm">
            Refresh
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="text-muted text-center py-10 border border-dashed border-border rounded-lg">
            No items yet. Upload files above.
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rows.sort((a,b)=> (a.order ?? 0) - (b.order ?? 0)).map(r => (
              <li key={r._id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="relative aspect-[16/9] bg-surface">
                  {isVideo(r) ? (
                    <video
                      src={getPreviewUrl(r)}
                      muted
                      playsInline
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={getPreviewUrl(r)}
                      alt={r.alt || r.name || ''}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-sm text-muted truncate">{r.name || r.localPath || 'Untitled'}</div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted">Order</label>
                    <input
                      type="number"
                      defaultValue={r.order ?? 0}
                      className="w-24 rounded bg-surface border border-border p-1 text-text"
                      onBlur={(e)=> onOrderBlur(r._id, e.target.value)}
                    />
                    <button 
                      onClick={()=>onDelete(r._id)} 
                      className="ml-auto text-red-500 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
