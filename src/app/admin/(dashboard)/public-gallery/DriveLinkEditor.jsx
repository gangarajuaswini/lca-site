// src/app/admin/(dashboard)/public-gallery/DriveLinkEditor.jsx
'use client'
import { useEffect, useState } from 'react';

export default function DriveLinkEditor({ categoryId, onSynced }) {
  const [value, setValue] = useState('');
  const [busy, setBusy]   = useState(false);

  // Load saved driveFolderId for the chosen category
  useEffect(() => {
    if (!categoryId) { setValue(''); return; }
    (async () => {
      try {
        const r = await fetch(`/api/admin/public-gallery/categories/${categoryId}`, {
          credentials:'include',
          cache:'no-store',
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d?.success) setValue(d.category?.driveFolderId || '');
      } catch {}
    })();
  }, [categoryId]);

  async function syncNow() {
    if (!categoryId) return alert('Choose a category first');
    const link = value.trim();
    if (!link) return alert('Paste a Google Drive folder link or ID');

    setBusy(true);
    try {
      // 1) Save link to category
      const saveRes = await fetch(`/api/admin/public-gallery/categories/${encodeURIComponent(categoryId)}/drive-link`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        credentials:'include',
        body: JSON.stringify({ driveLink: link }),
      });
      const saveJson = await saveRes.json().catch(()=>({}));
      if (!saveRes.ok || !saveJson?.success) throw new Error(saveJson?.message || 'Failed to save Drive link');

      // 2) Trigger sync
      const syncRes = await fetch(`/api/admin/public-gallery/categories/${encodeURIComponent(categoryId)}/sync`, {
        method:'POST', credentials:'include'
      });
      const syncJson = await syncRes.json().catch(()=>({}));
      if (!syncRes.ok || !syncJson?.success) throw new Error(syncJson?.message || 'Sync failed');

      const imported = Number(syncJson.imported ?? syncJson.created ?? 0);
      const updated  = Number(syncJson.updated ?? 0);
      alert(`Imported ${imported} item${imported===1?'':'s'} from Drive${updated?` (updated ${updated})`:''}`);

      onSynced?.(); // refresh media list below
    } catch (e) {
      alert(e?.message || 'Sync failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted">Google Drive Folder Link or ID</label>
      <input
        className="w-full border border-border rounded-lg px-3 py-2 bg-surface/60 text-text placeholder:text-muted/70
                  focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
        placeholder="https://drive.google.com/drive/folders/…  or  1AbCDeF…"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button
        onClick={syncNow}
        disabled={busy || !value.trim()}
        className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink
                focus:outline-none focus:ring-2 focus:ring-gold-500/40 disabled:opacity-50"
      >
        {busy ? 'Syncing…' : 'Sync from Drive'}
      </button>
    </div>
  );
}
