// src/app/admin/(dashboard)/customer-gallery/page.js
'use client'

import { useState, useEffect } from 'react';
const isVideo = (mime = '') => String(mime).startsWith('video/');
const getPreview = (it) =>
  it?.previewUrl || (it?.driveFileId ? `/api/drive/preview/${it.driveFileId}` : '');


function Switch({ checked, onChange, className = '' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center w-24 h-10 rounded-full transition
        ${checked ? 'bg-gold-500' : 'bg-surface/70 border border-border'} ${className}`}
    >
      <span
        className={`w-8 h-8 rounded-full bg-card shadow transform transition
          ${checked ? 'translate-x-14' : 'translate-x-2'}`}
      />
      <span className={`absolute w-24 text-center text-sm font-semibold ${checked ? 'text-ink' : 'text-muted'}`}>
        {checked ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}


// Client-side helper to accept *either* a full Drive URL or a bare folder ID.
function extractFolderIdLocal(input = '') {
  const s = String(input).trim();
  const m =
    s.match(/\/folders\/([A-Za-z0-9_-]+)/) ||   // .../folders/XXXXXXXX
    s.match(/[?&]id=([A-Za-z0-9_-]+)/)    ||   // ?id=XXXXXXXX
    s.match(/[-\w]{20,}/);                      // looks like an ID
  return m ? (m[1] || m[0]) : '';
}


async function readJsonSafe(r) {
  const text = await r.text();
  const data = (() => { try { return JSON.parse(text) } catch { return null } })();
  if (!r.ok || !data?.success) throw new Error(data?.message || text || `HTTP ${r.status}`);
  return data;
}

export default function AdminCustomerGalleryPage() {
  const [ref, setRef] = useState('')
  const [cat, setCat] = useState('')                // <-- selected category
  const [proj, setProj] = useState(null)
  const [counts, setCounts] = useState(null)
  const [selections, setSelections] = useState([])
  const [importedItems, setImportedItems] = useState([])
  const [contact, setContact] = useState(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading]   = useState(false)

  const [rawFolders, setRawFolders] = useState([]);  // [{ name, counts? }, ...]
  const [selectedFolderName, setSelectedFolderName] = useState('');  // track by NAME
  const [driveLink, setDriveLink] = useState('');   // used only for import
  
  const [editedText, setEditedText] = useState('');
  const [folderCounts, setFolderCounts] = useState({ raw: 0, selected: 0 });
  const [folderCountsMap, setFolderCountsMap] = useState({}); // { [name]: { raw: number, selected: number } }
  
  const [lockedAtText, setLockedAtText] = useState('');

  const [editRequests, setEditRequests] = useState([]);
  const [editRequestsErr, setEditRequestsErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  useEffect(() => {
    if (proj?.selectionLockedAt) {
      const dt = new Date(proj.selectionLockedAt);
      setLockedAtText(dt.toLocaleString());
    } else {
      setLockedAtText('');
    }
  }, [proj?.selectionLockedAt]);
  
  // ----- LOOK UP -----
  async function lookup() {
    const referenceId = ref.trim().toUpperCase()
    if (!referenceId) return alert('Enter a Reference ID')

    setLoading(true)
    try {
      const url = new URL('/api/admin/customer-gallery/lookup', window.location.origin)
      url.searchParams.set('referenceId', referenceId)
      const r = await fetch(url, { cache: 'no-store', credentials: 'include' })

      const text = await r.text()
      const data = (() => { try { return JSON.parse(text) } catch { return null } })()
      if (!r.ok || !data?.success) throw new Error(data?.message || text || `HTTP ${r.status}`)

      let p = data.project ?? null;
      setContact(data.contact ?? null);
      if (p) {
        p = {
          selectionLocked: !!p.selectionLocked,
          selectionLockedAt: p.selectionLockedAt || null,
          editedText: typeof p.editedText === 'string' ? p.editedText : '',
          ...p,
        };
      }
      setProj(p);

      if (p?.referenceId) {
        await loadEditRequests(p.referenceId);
      } else {
        setEditRequests([]);
      }


      if (p) {
        setCat(p.category ?? '');
        // Edited text (prefer new field; fall back to legacy fields)
        let next = '';
        if (typeof p.editedText === 'string' && p.editedText.trim()) next = p.editedText;
        else if (Array.isArray(p.editedLinks)) next = p.editedLinks.join('\n');
        else if (p.editedWeTransferUrl) next = String(p.editedWeTransferUrl);
        setEditedText(next);

        // Raw folders (if your API returns them on the project)
        const rf = Array.isArray(p.rawFolders) ? p.rawFolders : [];
        setRawFolders(rf);
        // do not auto-select any folder after lookup
        setSelectedFolderName('');
        setFolderCounts({ raw: 0, selected: 0 });
      } else {
        const ev = (data.contact?.eventType || data.contact?.category || '').trim();
        setCat(ev || '');
        setEditedText('');
        setRawFolders([]);
        setSelectedFolderName('');
        setFolderCounts({ raw: 0, selected: 0 });
      }

      setCounts(data.counts || (p ? { rawTotal: 0, selected: 0 } : null));
      setImportedItems([]);
      setSelections([]);
      //setCats(Array.isArray(data.categories) ? data.categories : []);

    } catch (err) {
      console.error(err)
      alert(err.message || 'Lookup error')
      setProj(null); setCounts(null); setImportedItems([]); setSelections([]); setContact(null)
    } finally {
      setLoading(false)
    }
  }

  // Load assets for the selected folder NAME
  async function loadAdminAssets(referenceId, folderName) {
    if (!referenceId || !folderName) return;
    const url = new URL(
      `/api/admin/customer-gallery/${encodeURIComponent(referenceId)}/assets`,
      window.location.origin
    );
    url.searchParams.set('folderName', folderName);
    url.searchParams.set('limit', '60');
    const r = await fetch(url, { cache: 'no-store', credentials: 'include' });
    const d = await readJsonSafe(r);
    setImportedItems(d.items || []);
  }



  // Load selections for the selected folder NAME
  async function loadSelections(referenceId, folderName) {
    if (!referenceId || !folderName) return;
    const url = new URL(
      `/api/admin/customer-gallery/${encodeURIComponent(referenceId)}/selections`,
      window.location.origin
    );
    url.searchParams.set('folderName', folderName);
    const r = await fetch(url, { cache: 'no-store', credentials: 'include' });
    const d = await readJsonSafe(r);
    setSelections(Array.isArray(d.rows) ? d.rows : []);
  }

  async function loadEditRequests(referenceId) {
    if (!referenceId) return;
    setEditRequestsErr('');
    try {
      const r = await fetch(
        `/api/admin/customer-gallery/${encodeURIComponent(referenceId)}/edit-requests`,
        { cache: 'no-store', credentials: 'include' }
      );
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d?.success) throw new Error(d?.message || 'Failed to load edit requests');
      setEditRequests(Array.isArray(d.items) ? d.items : []);
    } catch (e) {
      setEditRequests([]);
      setEditRequestsErr(e?.message || 'Load error');
    }
  }


  async function createProject() {
    const referenceId = ref.trim().toUpperCase();
    const category = contact?.eventType || cat || ''; // ensure a value
    if (!referenceId) return alert('Enter reference ID');

    try {
      const r = await fetch('/api/admin/customer-gallery/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ referenceId, category }),
      });

      const text = await r.text();
      const data = (() => { try { return JSON.parse(text) } catch { return null } })();
      if (!r.ok || !data?.success) {
        throw new Error(data?.message || text || `HTTP ${r.status}`);
      }

      await lookup(); // re-renders Raw/Edited and table immediately
      alert('Project created');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Create failed');
    }
  }


  useEffect(() => {
    if (!selectedFolderName) { setFolderCounts({ raw: 0, selected: 0 }); return; }
    const sel = (rawFolders || []).find(f => f.name === selectedFolderName);
    setFolderCounts(sel?.counts || { raw: 0, selected: 0 });
  }, [selectedFolderName, rawFolders]);



  async function createRawFolder() {
    if (!proj) return;
    const name = prompt('Raw folder name (e.g. "Raw 1")');
    if (!name?.trim()) return;

    const r = await fetch(`/api/admin/customer-gallery/${proj.referenceId}/raw/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: name.trim() }),
    });

    const d = await readJsonSafe(r);
    // Insert if it doesn't already exist
    setRawFolders(prev => {
      const exists = prev.some(f => f.name.toLowerCase() === d.folder.name.toLowerCase());
      return exists ? prev : [...prev, d.folder];
    });
    // Per flow: do not auto-select after creation
  }



  async function importRaw() {
    if (!proj) return alert('Look up a project first');
    const name = (selectedFolderName || '').trim();
    if (!name) return alert('Select or create a Raw folder first');

    const linkRaw = (driveLink || '').trim();
    const link = extractFolderIdLocal(linkRaw) || linkRaw;
    if (!link) return alert('A Google Drive folder link/ID is required');

    // Build the URL with both folderName and driveLink
    const url = new URL(
      `/api/admin/customer-gallery/${encodeURIComponent(proj.referenceId)}/raw/import`,
      window.location.origin
    );
    url.searchParams.set('folderName', name);
    url.searchParams.set('deep', '0');
    url.searchParams.set('driveLink', link);

    const r = await fetch(url, { method: 'POST', credentials: 'include' });
    const d = await r.json().catch(async () => ({ message: await r.text() }));

    if (!r.ok || !d?.success) return alert(d?.message || 'Import failed');

    // Refresh assets & selections for this folder
    await Promise.all([
      loadAdminAssets(proj.referenceId, name),
      loadSelections(proj.referenceId, name),
    ]);

    // Update folder-scoped counts if the API returns them
    if (d.counts?.folder) {
      setFolderCounts(d.counts.folder);
      setRawFolders(prev => prev.map(f => f.name === name ? { ...f, counts: d.counts.folder } : f));
    }
    // Also recalc from endpoints to be safe
    await refreshCountsFor(name);

    // NEW: update global project counts in the header
    if (d.counts?.global) setCounts(d.counts.global);

    alert(`Imported ${d.imported || 0} files`);
  }




  //When selectedFolderName changes, reload assets & selections.
  useEffect(() => {
    if (!proj?.referenceId || !selectedFolderName) return;
    loadAdminAssets(proj.referenceId, selectedFolderName);
    loadSelections(proj.referenceId, selectedFolderName);
    // keep the summary counts in sync without waiting for clicks
    refreshCountsFor(selectedFolderName);
  }, [proj?.referenceId, selectedFolderName]);


  async function saveEdited() {
    if (!proj) return;
    // edited text is stored on the project; category stays as-is
    const r = await fetch(
      `/api/admin/customer-gallery/${proj.referenceId}/edited-text?category=${encodeURIComponent(cat)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ editedText }),
      }
    );
    if (!r.ok) {
      const t = await r.text().catch(()=> '');
      return alert(t || 'Failed to save Edited text');
    }
    alert('Saved Edited text');
  }

  async function refreshCountsFor(name) {
    if (!proj?.referenceId || !name) return;
    const [aRes, sRes] = await Promise.all([
      fetch(`/api/admin/customer-gallery/${proj.referenceId}/assets?folderName=${encodeURIComponent(name)}&limit=0`, { credentials: 'include', cache: 'no-store' }),
      fetch(`/api/admin/customer-gallery/${proj.referenceId}/selections?folderName=${encodeURIComponent(name)}`, { credentials: 'include', cache: 'no-store' }),
    ]);
    const aJson = await aRes.json().catch(() => ({}));
    const sJson = await sRes.json().catch(() => ({}));
    const raw = aJson?.counts?.rawTotal ?? (Array.isArray(aJson?.items) ? aJson.items.length : 0);
    const selected = sJson?.counts?.selected ?? (Array.isArray(sJson?.rows) ? sJson.rows.length : 0);
    setFolderCountsMap(prev => ({ ...prev, [name]: { raw, selected } }));
  }

  async function refreshAllFolderCounts() {
    setRefreshing(true);
    if (!proj?.referenceId) { setRefreshing(false); return; }
    const r = await fetch(`/api/admin/customer-gallery/${proj.referenceId}/raw/folders?recount=1`, { credentials: 'include', cache: 'no-store' });
    const d = await r.json().catch(()=> ({}));
    if (d?.success && Array.isArray(d.folders)) {
      setRawFolders(d.folders);
      if (d.counts) setCounts(d.counts);  // also refresh project totals display
      const map = {};
      for (const f of d.folders) {
        const raw = f?.counts?.rawTotal ?? f?.counts?.raw ?? f?.raw ?? 0;
        const selected = f?.counts?.selected ?? f?.selected ?? 0;
        map[f.name] = { raw, selected };
      }
      setFolderCountsMap(map);
      setLastRefreshedAt(new Date().toISOString());
    }
    setRefreshing(false);
    }


  async function deleteFolder(name) {
    if (!proj?.referenceId || !name) return;
    if (!confirm(`Delete raw folder "${name}"? This removes its assets/selections from Admin and Customer dashboards (no Drive changes).`)) return;

    const url = new URL(`/api/admin/customer-gallery/${proj.referenceId}/raw/folders`, window.location.origin);
    url.searchParams.set('folderName', name);
    const r = await fetch(url, { method: 'DELETE', credentials: 'include' });

    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d?.success) {
      alert(d?.message || 'Delete failed');
      return;
    }
    // Use server's new folders list if provided; fallback to local filter
    setRawFolders(prev =>
      Array.isArray(d.folders) ? d.folders : prev.filter(x => x.name !== name)
    );
    setSelectedFolderName(s => (s === name ? '' : s));
    setImportedItems([]);
    setSelections([]);
    setFolderCountsMap(prev => {
      const n = { ...prev };
      delete n[name];
      return n;
    });
    if (d.counts) setCounts(d.counts);
    // Optional: update global counts display
    setCounts(d.counts || counts);
    alert('Folder deleted.');
  }



  // ----- UI -----
  return (
    <div className="min-h-screen bg-ink">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-xl font-semibold text-gold-300">Customer Gallery</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Lookup */}
        <section className="bg-card rounded-xl shadow p-5 border border-border">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
            <div>
              <label htmlFor="refId" className="text-sm font-medium text-muted">Reference ID</label>
              <input
                id="refId"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 mt-1 bg-surface/60 text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
                placeholder="LCA-XXXX"
              />
            </div>

            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink focus:outline-none focus:ring-2 focus:ring-gold-500/40 disabled:opacity-60"
              onClick={lookup}
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Look up'}
            </button>
{/*
            <button
              type="button"
              className="px-4 py-2 rounded-lg border"
              onClick={() => { 
                setRawFolders([]); setSelectedFolderName(''); setFolderCounts({ raw: 0, selected: 0 });
                setFolderCountsMap({}); setDriveLink(''); setEditedText('');
               }}
            >
              Clear
            </button>
*/}
          </div>

          {/* Customer summary appears after lookup */}
          {contact && (
            <div className="rounded-lg border border-border p-4 mt-4 bg-card">
              <div className="font-medium mb-1">Customer Details</div>
              {proj?.referenceId && (
                <div className="text-xs text-muted mt-1">
                  Reference ID: <span className="font-mono">{proj.referenceId}</span>
                </div>
              )}
              <div className="text-sm text-muted">
                {contact.name} • {contact.email} • {contact.phone}
              </div>
              <div className="text-xs text-muted">
                {contact.eventType || '-'} • {contact.city}{contact.state ? `, ${contact.state}` : ''}{contact.country ? `, ${contact.country}` : ''}
              </div>
            </div>
          )}



          {/* When there is no project yet, show category dropdown here (mandatory) */}
          {!proj && contact && (
            <div className="rounded-lg border border-border p-4 bg-surface/60">
              <div className="font-medium mb-2">No Customer Gallery yet</div>
              <p className="text-sm mb-3">
                Create a project{contact?.eventType ? <> for <span className="font-medium">{contact.eventType}</span></> : ''}.
              </p>
              <button className="mt-1 px-3 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                      onClick={createProject}>
                Create Project
              </button>
            </div>
          )}

          {/* Project cards */}
          {proj && (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {/* RAW card */}
              <div className="rounded-lg border border-border p-4 bg-card">
                <div className="font-medium mb-3">Raw</div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-sm block mb-1">Raw Folder</label>
                    <select
                      className="w-full border border-border rounded-lg px-3 py-2 bg-surface/60 text-text focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60 [color-scheme:light]"
                      value={selectedFolderName}
                      onChange={e => setSelectedFolderName(e.target.value.trim())}
                    >
                      <option value="">-- Select a Raw folder --</option>
                      {rawFolders.map(f => (
                        <option key={f.name} value={f.name}>{f.name}</option>
                      ))}
                    </select>

                  </div>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-border bg-surface/70 text-text hover:bg-surface/60 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                    onClick={createRawFolder}
                  >
                    Add Raw Folder
                  </button>
                </div>

                <div className="flex gap-2 items-end mt-3">
                  <div className="flex-1">
                    <label className="text-sm block mb-1">Drive link (required)</label>
                    <input
                      className="w-full border border-border rounded-lg px-3 py-2 bg-surface/60 text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
                      placeholder="Paste Drive folder link if helpful"
                      value={driveLink}
                      onChange={e => setDriveLink(e.target.value)}
                    />
                  </div>

                </div>

                <button
                type="button"
                className="px-6 py-3 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink focus:outline-none focus:ring-2 focus:ring-gold-500/40 disabled:opacity-50"
                onClick={importRaw}
                disabled={!proj || !selectedFolderName || !driveLink.trim()}
                title={
                  !selectedFolderName
                    ? 'Select a Raw folder first'
                    : (!driveLink.trim() ? 'Paste a Drive folder link or ID' : '')
                }
              >
                Import from Drive
              </button>
              </div>
              

              {/* RAW folders summary */}
              <div className="rounded-lg border border-border p-4 bg-card">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">Raw folders</div>
                  <button
                    type="button"
                    className="px-2 py-1 text-sm rounded border border-border bg-surface/70 text-text hover:bg-surface/60 focus:outline-none focus:ring-2 focus:ring-gold-500/40 disabled:opacity-60"
                    onClick={refreshAllFolderCounts}
                    disabled={!rawFolders.length || refreshing}
                  >
                    {refreshing ? 'Refreshing…' : 'Refresh counts'}
                  </button>
                </div>
                {lastRefreshedAt && (
                  <div className="text-xs text-muted mb-2">
                    Updated at {new Date(lastRefreshedAt).toLocaleString()}
                  </div>
                )}

                {!rawFolders.length ? (
                  <div className="text-sm text-muted">No raw folders yet.</div>
                ) : (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <table className="w-full text-sm border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-surface/70 text-gold-300">
                          <th className="px-4 py-2 text-left font-semibold">Raw folder</th>
                          <th className="px-4 py-2 text-left font-semibold">Total files</th>
                          <th className="px-4 py-2 text-left font-semibold">Selected</th>
                          {/* no Actions column when showRawActions=false */}
                        </tr>
                      </thead>
                      <tbody>
                        {rawFolders.map(f => {
                          const c = folderCountsMap[f.name];
                          return (
                            <tr key={f.name} className="border-t border-border">
                              <td className="px-4 py-2">
                                <button
                                  className={`underline ${selectedFolderName === f.name ? 'font-semibold' : ''}`}
                                  onClick={() => setSelectedFolderName(f.name)}
                                  title="Select this folder"
                                >
                                  {f.name}
                                </button>
                              </td>
                              <td className="px-4 py-2">
                                {c ? c.raw : (
                                  <button className="text-xs underline" onClick={() => refreshCountsFor(f.name)}>
                                    calc
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                {c ? c.selected : (
                                  <button className="text-xs underline" onClick={() => refreshCountsFor(f.name)}>
                                    calc
                                  </button>
                                )}
                              </td>
                              {/* no actions cell */}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>


              {/* EDITED card */}
              <div className="rounded-lg border border-border p-4 bg-card">
                <div className="font-medium mb-2">Edited / Final</div>
                <textarea
                  className="w-full border border-border rounded-lg px-3 py-2 min-h-[100px] bg-surface/60 text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
                  placeholder="Paste any number of links or write notes—one per line"
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                />
                <div className="mt-3">
                  <button onClick={saveEdited} className="px-3 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink focus:outline-none focus:ring-2 focus:ring-gold-500/40">
                    Save
                  </button>
                </div>
              </div>

            </div>
          )}
        </section>

        {/* Selection Lock */}
        {proj && (
          <div className="rounded-lg border border-border p-4 bg-card">
            <div className="flex items-center justify-between">
              <div className="font-medium">Selection Window</div>
              <Switch
                checked={!proj.selectionLocked}               // ON when not locked
                onChange={async (nextIsOn) => {
                  // optimistic
                  setProj(p => p ? { 
                    ...p, 
                    selectionLocked: !nextIsOn, 
                    selectionLockedAt: nextIsOn ? null : new Date().toISOString() 
                  } : p);

                  await fetch(
                    `/api/admin/customer-gallery/${encodeURIComponent(proj.referenceId)}/lock`,
                    {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ locked: !nextIsOn }),
                    }
                  );

                  // sync with server
                  await lookup();
                }}
              />
            </div>

            <p className="text-sm text-muted mt-2">
              {proj.selectionLocked
                ? <>Customers cannot select files (OFF). Locked at <span suppressHydrationWarning>{lockedAtText || '—'}</span>.</>
                : <>Customers can select files for editing (ON).</>}
            </p>
          </div>
        )}
        

        {/* To be edited (customer selections) */}
        {proj && (
          <section className="mt-8">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold">To be edited</h2>
            </div>

            {!selectedFolderName ? (
              <div className="text-sm text-muted">Select a Raw folder to see selections.</div>
            ) : (
            <div className="border border-border rounded-lg bg-card">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-surface/70 text-gold-300">
                    <th className="px-4 py-2 text-left font-semibold">File name</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Selected at</th>
                    <th className="px-4 py-2 text-left">Selected by</th>
                  </tr>
                </thead>
                <tbody>
                  {selections.length ? selections.map((it) => (
                    <tr key={String(it._id || it.assetId)} className="border-t border-border">
                      <td className="px-4 py-2">{it.name}</td>
                      <td className="px-4 py-2">{it.mimeType?.split('/')[1] || it.mimeType || '-'}</td>
                      <td className="px-4 py-2">{it.selectedAt ? new Date(it.selectedAt).toLocaleString() : '-'}</td>
                      <td className="px-4 py-2">{it.selectedBy || '-'}</td>
                    </tr>
                  )) : (
                    <tr><td className="px-4 py-6 text-center text-muted" colSpan={4}>No selections yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </section>
        )}

        {/* -------- Customer edit requests (below "To be edited") -------- */}
        {proj && (
          <section className="mt-8">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold">Customer edit requests</h2>
              <button
                type="button"
                className="px-2 py-1 text-sm rounded border border-border bg-surface/70 text-text hover:bg-surface/60 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                onClick={() => loadEditRequests(proj.referenceId)}
              >
                Refresh
              </button>
            </div>

            {editRequestsErr && (
              <div className="text-sm text-red-400 mb-2">{editRequestsErr}</div>
            )}

            {!editRequests.length ? (
              <div className="text-sm text-muted">No edit requests yet.</div>
            ) : (
              <div className="border border-border rounded-lg bg-card">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-surface/70 text-gold-300">
                      <th className="px-4 py-2 text-left">Submitted</th>
                      <th className="px-4 py-2 text-left">File Name</th>
                      <th className="px-4 py-2 text-left">Editing Changes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editRequests.flatMap((req) =>
                      (req.items || []).map((it, i) => (
                        <tr key={`${req._id}-${i}`} className="align-top border-t border-border">
                          <td className="px-4 py-2 text-muted">
                            {req.createdAt ? new Date(req.createdAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-2 font-mono">{it.fileName}</td>
                          <td className="px-4 py-2 whitespace-pre-wrap">{it.changes}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}



        {/* Grid of recently imported assets */}
        {importedItems.length > 0 && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {importedItems.map(it => (
              <div key={it._id} className="border border-border rounded overflow-hidden relative group bg-card">
                <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    className="text-xs px-2 py-1 bg-card/80 border border-border rounded hover:bg-surface/70"
                    onClick={async () => {
                      if (!proj) return
                      if (!confirm(`Delete ${it.name}?`)) return
                      const r = await fetch(
                        `/api/admin/customer-gallery/${encodeURIComponent(proj.referenceId)}/assets/${it._id}?folderName=${encodeURIComponent(selectedFolderName)}`,
                        { method: 'DELETE', credentials: 'include' }
                      );
                      const d = await r.json().catch(() => ({}));
                      if (!r.ok || !d.success) return alert(d.message || 'Delete failed');
                      setImportedItems(prev => prev.filter(x => x._id !== it._id))
                      // Update per-folder counts to keep the summary table accurate
                      if (selectedFolderName) {
                        await Promise.all([
                          refreshCountsFor(selectedFolderName),
                          loadSelections(proj.referenceId, selectedFolderName),
                        ]);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div className="aspect-square bg-ink">
                  {isVideo(it.mimeType) ? (
                    <video
                      src={getPreview(it)}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      controls={false}
                      preload="metadata"
                    />
                  ) : getPreview(it) ? (
                    <img
                      src={getPreview(it)}
                      alt={it.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xs text-muted">
                      No preview
                    </div>
                  )}
                </div>

                <div className="p-2 text-xs truncate text-text">{it.name}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
