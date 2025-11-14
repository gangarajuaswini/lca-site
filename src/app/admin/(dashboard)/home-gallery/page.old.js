//src/app/admin/(dashboard)/home-gallery/page.js
'use client'
import { useEffect, useState } from 'react'

function getPreviewUrl(row) {
  const id = row?.driveFileId;
  return id ? `/api/drive/preview/${id}` : '';
}

// detect videos robustly (mime, explicit type, or by name)
const isVideo = (r) =>
  /^video\//.test(r?.mimeType || '') ||
  r?.type === 'video' ||
  /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test((r?.name || ''));

export default function HomeGalleryAdmin() {
  const [links, setLinks] = useState('');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [order, setOrder] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null);

  async function load() {
    const res = await fetch(`/api/admin/home-gallery?section=hero`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    setRows(Array.isArray(data?.rows) ? data.rows : []);
  }

  useEffect(() => { load(); }, []);

  async function onImport(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = await fetch('/api/admin/home-gallery/import', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        section: 'hero',
        links,
        alt, caption,
        order: order === '' ? undefined : Number(order),
        publish: true,
      })
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data);
    if (data?.ok) { setLinks(''); await load(); }
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
      <h1 className="text-xl font-semibold text-gold-300 flex items-center gap-2">Home Gallery</h1>
      <form onSubmit={onImport} className="space-y-4 bg-card p-6 rounded-xl border border-border">
        <label className="block">
          <span className="text-sm text-muted">Drive Folder/File URL:</span>
          <textarea
            className="mt-1 w-full rounded-lg bg-surface border border-border p-3 text-text"
            rows={6}
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            placeholder="Enter the drive Folder URL/File URL"
            required
          />
        </label>

        <button type="submit" disabled={busy}
          className={`rounded-lg px-5 py-2 font-medium ${busy ? 'bg-muted text-ink' : 'bg-gold-500 text-text hover:brightness-110'}`}>
          {busy ? 'Importing…' : 'Import'}
        </button>

        <a href="/api/home-gallery?section=hero" className="ml-4 text-gold-500 underline">View API JSON</a>
        {msg && <pre className="mt-4 text-xs bg-surface border border-border rounded p-3 text-text">{JSON.stringify(msg, null, 2)}</pre>}
      </form>

      {/* Items */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gold-300 flex items-center gap-2">Hero Items</h2>
          <button onClick={load} className="text-gold-500 hover:underline">Refresh</button>
        </div>

        {rows.length === 0 ? (
          <div className="text-muted">No items yet.</div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rows.sort((a,b)=> (a.order ?? 0) - (b.order ?? 0)).map(r => (
              <li key={r._id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="relative aspect-[16/9] bg-surface">
                  {r.driveFileId && (
                    isVideo(r) ? (
                      <video
                        src={`/api/drive/stream/${r.driveFileId}`}   // <-- backticks
                        poster={`/api/drive/preview/${r.driveFileId}`}
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={getPreviewUrl(r)}
                        alt={r.alt || ''}
                        className="w-full h-full object-cover"
                      />
                    )
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-sm text-muted truncate">{r.name || r.driveFileId}</div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted">Order</label>
                    <input
                      type="number"
                      defaultValue={r.order ?? 0}
                      className="w-24 rounded bg-surface border border-border p-1 text-text"
                      onBlur={(e)=> onOrderBlur(r._id, e.target.value)}
                    />
                    <button onClick={()=>onDelete(r._id)} className="ml-auto text-red-500 hover:underline">Delete</button>
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
