//src/app/customer-dashboard/page.js
'use client'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone, Menu, X } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'
import { useAutoLogout } from '@/hooks/useAutoLogout'
import IdleWarning from '@/components/IdleWarning'
import Footer from '@/components/Footer'

const isVideo = (mime = '') => String(mime).startsWith('video/');
const getPreview = (it) =>
  it?.previewUrl || (it?.driveFileId ? `/api/drive/preview/${it.driveFileId}` : '');

const getDriveIdFromUrl = (raw) => {
  try {
    if (!raw) return null;
    const u = new URL(raw);
    if (!u.hostname.includes('drive.google')) return null;
    const idParam = u.searchParams.get('id');
    if (idParam) return idParam;
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    return m?.[1] || null;
  } catch { return null; }
};

const getStreamUrl = (it = {}) => {
  const id = it.driveFileId ||
    getDriveIdFromUrl(it.videoUrl || it.downloadUrl || it.url);
  return id ? `/api/drive/stream/${id}` : (it.videoUrl || it.downloadUrl || it.url || '');
};

const getFullUrl = (it = {}) => {
  const id = it.driveFileId ||
    getDriveIdFromUrl(it.url || it.downloadUrl || it.videoUrl || it.previewUrl);
  return id ? `/api/drive/stream/${id}` : (it.url || it.downloadUrl || it.videoUrl || it.previewUrl || '');
};

// --- Sidebar tabs (place under imports) ---
const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'raw',      label: 'Raw' },
  { id: 'edited',   label: 'Edited' },
  { id: 'review',   label: 'Review' },
];

function SideTab({ id, active, onClick, children }) {
  const isActive = active === id;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'w-full text-left rounded-lg px-4 py-2 text-sm font-semibold transition',
        isActive
          ? 'bg-gold-500 text-ink shadow'
          : 'text-gold-300 border border-gold-500/40 hover:bg-gold-500/10'
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// Fixed left sidebar (md+)
function FixedSidebar({ active, setActive }) {
  return (
    <aside className="hidden md:block fixed left-0 top-20 bottom-0 w-56 z-30">
      <div className="h-full border-r border-border bg-card/60 backdrop-blur-sm px-3 py-3">
        <div className="text-xs uppercase tracking-wide text-muted px-1 mb-2">Navigation</div>
        <div className="flex flex-col gap-2">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={[
                'w-full text-left rounded-lg px-4 py-2 text-sm font-semibold transition',
                active === t.id ? 'bg-gold-500 text-ink shadow'
                                : 'text-gold-300 border border-gold-500/40 hover:bg-gold-500/10'
              ].join(' ')}
              aria-current={active === t.id ? 'page' : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function useLightbox() {
  const [open, setOpen]   = useState(false);
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const scrollYRef = useRef(0);

  const openWith = (arr, startIdx = 0) => {
    if (!Array.isArray(arr) || !arr.length) return;
    scrollYRef.current = window.scrollY || 0;
    setItems(arr);
    setIndex(Math.max(0, Math.min(startIdx, arr.length - 1)));
    setOpen(true);
    document.documentElement.style.overflow = 'hidden'; // lock page scroll
  };

  const close = () => {
    setOpen(false);
    document.documentElement.style.overflow = '';
    window.scrollTo(0, scrollYRef.current || 0);
  };

  const prev = () => setIndex(i => (i - 1 + items.length) % items.length);
  const next = () => setIndex(i => (i + 1) % items.length);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape')       close();
      else if (e.key === 'ArrowLeft')  prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return { open, items, index, openWith, close, prev, next };
}


export default function CustomerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null) // { email, referenceId }
  const [active, setActive] = useState('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // project + contact
  const [project, setProject] = useState(null)
  const [contact, setContact] = useState(null)
  const [perFolder, setPerFolder] = useState([]) // [{ name, raw, selected }]
  const [selectedFolder, setSelectedFolder] = useState('') // no default
  const [assets, setAssets] = useState([]) // grid
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 60
  const shellRef = useRef(null);
  const headerRef = useRef(null);
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  
  const lightbox = useLightbox();

  // touch double-tap within 300ms (to mirror desktop dblclick)
  const lastTapRef = useRef(0);
  const onDblTap = (fn) => (e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      e.preventDefault();
      e.stopPropagation();
      fn();
    }
    lastTapRef.current = now;
  };

  // Auto-logout (30 min idle, warn in last 60s)
  const { warnSeconds, staySignedIn } = useAutoLogout({
    idleMs: 15 * 60 * 1000,   // 15 minutes
    warnMs: 15 * 1000,       // 15-second popup
    heartbeatMs: 15 * 1000, // low overhead; popup will still count down
  })
 

  const displayName = useMemo(() => {
    const c = contact || {};
    // Only use explicit name-like fields
    const fromParts =
      (c.firstName || c.firstname || c.givenName || '').trim() &&
      (c.lastName || c.lastname || c.familyName || '').trim()
        ? `${(c.firstName || c.firstname || c.givenName || '').trim()} ${(c.lastName || c.lastname || c.familyName || '').trim()}`
        : '';

    return (
      (c.name || '').trim() ||
      (c.personName || '').trim() ||
      (c.fullName || '').trim() ||
      fromParts
      // NOTE: no email-handle fallback here anymore
    );
  }, [contact]);



  function requireUserOrRedirect(u) {
    if (!u?.referenceId) router.push('/login')
  }

  useEffect(() => {
    // fetch session
    ;(async () => {
      try {
        const r = await fetch('/api/auth/me', { cache:'no-store', credentials:'include' })
        const data = await r.json().catch(()=> ({}))
        if (!data?.user?.referenceId) { router.push('/login'); return }
        setUser(data.user)
      } catch {
        router.push('/login')
      }
    })()
  }, [])

  // load project overview/per-folder counts
  useEffect(() => {
    if (!user?.referenceId) return
    ;(async () => {
      setErr('')
      try {
        const url = `/api/customer/projects/${encodeURIComponent(user.referenceId)}`
        const r = await fetch(url, { cache:'no-store', credentials:'include' })
        const d = await r.json().catch(()=> ({}))
        if (!d?.success) throw new Error(d?.message || 'Failed to load project')
        setProject(d.project || null)
        setContact(d.contact || null)
        setPerFolder(Array.isArray(d.project?.perFolder) ? d.project.perFolder : [])
      } catch (e) {
        setErr(e?.message || 'Load error')
      }
    })()
  }, [user?.referenceId])

  useLayoutEffect(() => {
    const setHeaderH = () => {
      const h = headerRef.current?.offsetHeight || 0;
      shellRef.current?.style.setProperty('--cd-header-h', `${h}px`);
    };
    setHeaderH();
    window.addEventListener('resize', setHeaderH);
    return () => window.removeEventListener('resize', setHeaderH);
  }, []);

  // load grid when folder/page changes
  async function loadGrid(folderName, p=1) {
    if (!user?.referenceId || !folderName) return
    setBusy(true); setErr('')
    try {
      const r = await fetch(`/api/admin/customer-gallery/${encodeURIComponent(user.referenceId)}/assets?folderName=${encodeURIComponent(folderName)}&limit=${pageSize}`, { cache:'no-store' })
      const d = await r.json().catch(()=> ({}))
      if (!d?.success) throw new Error(d?.message || 'Failed to load assets')
      setAssets(Array.isArray(d.items) ? d.items : [])
      setTotal(d.counts?.rawTotal || 0)
      setPage(p)
    } catch (e) {
      setErr(e?.message || 'Load error')
    } finally {
      setBusy(false)
    }
  }

  // toggle a selection
  async function toggleSelect(assetId, next) {
    if (!user?.referenceId) return
    try {
      const r = await fetch(`/api/customer/projects/${encodeURIComponent(user.referenceId)}/select`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ assetId, isSelected: next })
      })
      const d = await r.json().catch(()=> ({}))
      if (!r.ok || !d?.success) throw new Error(d?.message || 'Unable to update')
      // optimistic UI
      setAssets(a => a.map(x => x._id===assetId ? { ...x, isSelected: next, selectedAt: next? new Date().toISOString() : null } : x))
      // update per-folder selected count if needed
      setPerFolder(pf => pf.map(f => f.name===selectedFolder ? { ...f, selected: (f.selected || 0) + (next? +1 : -1) } : f))
    } catch (e) {
      alert(e?.message || 'Update failed')
    }
  }

  const locked = !!project?.selectionLocked
  const editedText = (project?.editedText || '').trim()

  const selectedCount = useMemo(() => {
    return assets.reduce((n,a) => n + (a.isSelected ? 1 : 0), 0)
  }, [assets])

  return (
    <div ref={shellRef} className="cd-shell bg-ink">
      {/* Header: full width, sticky */}
      <header ref={headerRef} className="cd-header lca-header bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-3 md:py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold font-playfair text-gold-300">
            Customer Dashboard
          </h1>
          <div className="flex items-center gap-3">
            {/* Desktop logout only */}
            <div className="hidden md:block">
              <LogoutButton className="pill-gold" />
            </div>
            {/* Mobile menu toggle */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-lg border border-border bg-card/70 p-2 hover:bg-card focus:outline-none focus:ring-2 focus:ring-gold-500/60"
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(o => !o)}
            >
              {mobileNavOpen ? <X className="h-5 w-5 text-text" /> : <Menu className="h-5 w-5 text-text" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Tabs Panel */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Dim background */}
          <div
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          {/* Sheet */}
          <nav
            className="absolute left-0 right-0 top-0 rounded-b-2xl border-b border-border bg-card shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
          >
            <div className="px-4 py-4">
              <div id="mobile-menu-title" className="text-xs uppercase tracking-wide text-muted mb-2">
                Navigate
              </div>

              {/* Tabs as vertical list */}
              <ul className="space-y-2">
                {TABS.map(t => (
                  <li key={t.id}>
                    <button
                      onClick={() => { setActive(t.id); setMobileNavOpen(false) }}
                      className={
                        (active === t.id
                          ? 'bg-gold-500 text-ink border-gold-500 shadow'
                          : 'bg-card/70 text-text hover:bg-card border-border') +
                        ' w-full rounded-xl border px-4 py-3 text-base font-medium transition'
                      }
                      aria-current={active === t.id ? 'page' : undefined}
                    >
                      {t.label}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Divider + Logout */}
              <div className="mt-3 pt-3 border-t border-border">
                {/* Close the sheet after triggering logout */}
                <div onClick={() => setMobileNavOpen(false)}>
                  <LogoutButton className="w-full justify-center rounded-xl border border-gold-500/40 bg-gold-500/10 hover:bg-gold-500/20 px-4 py-3 font-semibold text-gold-200" />
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}

       {/* Sidebar: left column, pinned */}
      <aside className="cd-sidebar hidden md:block">
        <div className="px-3 py-3">
          <div className="text-xs uppercase tracking-wide text-muted px-1 mb-2">Navigation</div>
          <div className="flex flex-col gap-2">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={[
                  'w-full text-left rounded-lg px-4 py-2 text-sm font-semibold transition',
                  active === t.id ? 'bg-gold-500 text-ink shadow'
                                  : 'text-gold-300 border border-gold-500/40 hover:bg-gold-500/10'
                ].join(' ')}
                aria-current={active === t.id ? 'page' : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content: scrolls; header/sidebar stay */}
      <main className="cd-main">
        <div className="max-w-8xl mx-auto px-2 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 md:py-5 space-y-6">
            {/* banner + Overview/Raw/Edited/Review sections */}
            {locked && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2"
              >
                Selection window is closed by photographer.
              </div>
            )}

            {/* OVERVIEW */}
            {active==='overview' && (
              <section className="bg-card rounded-xl border border-gold-500/50 shadow p-5 grid gap-4 md:grid-cols-2">
                <div>
                  {/* Name */}
                  <div className="mt-1 font-medium">
                    {displayName || '—'}
                  </div>
                  {/* Reference ID */}
                  <div className="mt-1 text-xs text-muted">
                    Reference ID: <span className="font-mono">{project?.referenceId || user?.referenceId || '—'}</span>
                  </div>
                  {/* Contact details */}
                  <div className="mt-2 flex items-center gap-2">
                    <Mail className="h-4 w-4"/>{contact?.email || '—'}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4"/>{contact?.contactNumber || contact?.phone || '—'}
                  </div>
                </div>

                <div>
                  <div className="mt-1 font-medium">
                    {contact?.eventName || contact?.eventType || project?.category || '—'}
                  </div>
                  <div className="text-sm text-muted">
                    {contact?.eventDate || contact?.date || ''}
                  </div>
                  <div className="text-sm text-muted">
                    {[contact?.city, contact?.state].filter(Boolean).join(', ')}
                  </div>
                </div>
              </section>
            )}

            {/* RAW */}
            {active==='raw' && (
              <section className="bg-card rounded-xl border border-gold-500/50 p-5 shadow">
                <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
                  <div>
                    <label className="block form-label-lg mb-1">Raw folder</label>
                    <select
                      className="w-full form-select"
                      value={selectedFolder}
                      onChange={e => { setSelectedFolder(e.target.value); if (e.target.value) loadGrid(e.target.value, 1); }}
                    >
                      <option value="">-- Select a Raw folder --</option>
                      {perFolder.map(f => (<option key={f.name} value={f.name}>{f.name} ({f.raw} files)</option>))}
                    </select>
                  </div>

                  <div className="h-[42px] md:h-[48px] px-4 rounded-lg flex items-center justify-center
                                  border border-gold-500/40 text-gold-300 bg-gold-500/10">
                    {selectedFolder
                      ? <>Selected in folder: <b className="ml-1">{selectedCount}</b></>
                      : <span className="text-muted">Pick a folder to view files</span>}
                  </div>
                </div>


                {/* Grid */}
                {selectedFolder && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">

{assets.map((a, idx) => (
  <label
    key={a._id}
    className="group block rounded-xl overflow-hidden border border-border/60 bg-card/70 hover:bg-card shadow transition"
  >
    <div
      className="relative aspect-square bg-surface cursor-zoom-in"
      onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); lightbox.openWith(assets, idx); }}
      onTouchEnd={onDblTap(() => lightbox.openWith(assets, idx))}
    >
      {isVideo(a.mimeType) ? (
        <video
          src={getPreview(a)}
          className="w-full h-full object-cover"
          muted
          playsInline
          controls={false}
          preload="metadata"
        />
      ) : (
        <img
          src={getPreview(a)}
          alt={a.name}
          className="w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />
      )}

      {/* selection ring & badge stay as-is */}
      <div className={['pointer-events-none absolute inset-0 rounded-none ring-2 transition', a.isSelected ? 'ring-gold-500' : 'ring-transparent'].join(' ')} />
      <div className={['absolute top-2 right-2 px-2 py-1 rounded-full text-[11px] font-semibold transition', a.isSelected ? 'bg-gold-500 text-ink shadow' : 'border border-gold-600 text-gold-200 bg-ink/60 backdrop-blur-sm'].join(' ')} >
        {a.isSelected ? 'Selected' : 'Select'}
      </div>
    </div>

    <div className="px-2 py-2 flex items-center justify-between text-xs">
      <span className="truncate" title={a.name}>{a.name}</span>
      {!locked && (
        <input
          type="checkbox"
          className="sr-only"
          checked={!!a.isSelected}
          onChange={e => toggleSelect(a._id, e.target.checked)}
          aria-label={`Select ${a.name}`}
        />
      )}
    </div>
  </label>
))}


                  </div>
                )}
                {busy && <div className="mt-4 text-sm text-muted">Loading…</div>}
              </section>
            )}

            {/* EDITED */}
            {active==='edited' && (
              <section className="edited-wrap bg-card rounded-xl shadow p-5 md:p-6 border border-gold-500/50">
                <div>
                  <h2 className="edited-title mb-2">Final Delivery</h2>

                  {!editedText ? (
                    <div className="text-sm edited-subtle">
                      No delivery posted yet. Please check back later.
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm text-white">
                      {editedText}
                    </div>
                  )}

                  <hr className="my-4 edited-hr" />
                  <p className="edited-subtle italic text-md text-gold-300">
                    Submit a review to let us know your thoughts!
                  </p>
                </div>

                <hr className="my-4 edited-hr" />

                <EditRequestsForm referenceId={user?.referenceId} />
              </section>
            )}

            {/* REVIEW */}
            {active==='review' && (
              <ReviewForm referenceId={user?.referenceId} />
            )}
            
            <IdleWarning seconds={warnSeconds} onStay={staySignedIn} />
        </div>
      </main>
      {/* Footer: full width bottom */}
      <div className="cd-footer footer-compact">
        <Footer />

{lightbox.open && (
  <div
    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
    onClick={lightbox.close}
  >
    <div
      className={[
        'relative',
        'w-[90vw] h-[68svh]',
        'sm:w-[86vw] sm:h-[70svh]',
        'md:w-[80vw] md:h-[74svh]',
        'lg:w-[72vw] lg:h-[76svh]',
        'xl:w-[64vw] xl:h-[78svh]',
        'max-w-[1200px] max-h-[82svh]',
      ].join(' ')}
      onClick={(e) => e.stopPropagation()}
    >
      {(() => {
        const active = lightbox.items[lightbox.index];
        if (!active) return null;

        const video = isVideo(active.mimeType);
        const src    = video ? getStreamUrl(active) : (getPreview(active) || getFullUrl(active));
        const poster = video ? (getPreview(active) || undefined) : undefined;
        const key    = active._id || active.driveFileId || src;

        return video ? (
          <video
            key={key}
            src={src}
            poster={poster}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain rounded-2xl shadow-2xl"
          />
        ) : (
          <img
            key={key}
            src={src}
            alt=""
            draggable={false}
            className="w-full h-full object-contain rounded-2xl shadow-2xl"
          />
        );
      })()}

      {/* Close */}
      <button
        type="button"
        aria-label="Close"
        onClick={lightbox.close}
        className="absolute -top-3 -right-3 md:top-2 md:right-2 rounded-full bg-gold-500 text-ink px-3 py-2 font-semibold ring-1 ring-gold-400 shadow-lg transition-transform hover:scale-105"
      >
        ✕
      </button>

      {/* Prev / Next */}
      <button
        type="button"
        aria-label="Previous"
        onClick={(e) => { e.stopPropagation(); lightbox.prev(); }}
        className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 rounded-full bg-gold-500 text-ink px-4 py-3 font-semibold ring-1 ring-gold-400 shadow-lg transition-transform hover:scale-105"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={(e) => { e.stopPropagation(); lightbox.next(); }}
        className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 rounded-full bg-gold-500 text-ink px-4 py-3 font-semibold ring-1 ring-gold-400 shadow-lg transition-transform hover:scale-105"
      >
        ›
      </button>
    </div>
  </div>
)}


      </div>
    </div>
  )
}


function ReviewForm({ referenceId }) {
  const [form, setForm] = useState({
    fullName: '',
    eventType: '',
    eventDate: '',   // will hold "YYYY-MM" from <input type="month">
    rating: '',
    highlight: '',
    review: '',
    consent: false,
  })
  const [ok, setOk] = useState('')
  const [err, setErr] = useState('')
  const [echo, setEcho] = useState(null) // when set -> read-only
  const [busy, setBusy] = useState(false)

  // Convert YYYY-MM to "Month YYYY"
  function monthLabel(yyyyMm) {
    if (!yyyyMm) return ''
    const [y, m] = yyyyMm.split('-')
    const d = new Date(Number(y), Number(m)-1, 1)
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  }

  // On mount: check if a review already exists for this customer
  useEffect(() => {
    if (!referenceId) return
    ;(async () => {
      try {
        const r = await fetch(`/api/customer/reviews?referenceId=${encodeURIComponent(referenceId)}`, {
          cache: 'no-store', credentials: 'include'
        })
        const d = await r.json().catch(()=> ({}))
        if (d?.success && d.review) setEcho(d.review) // lock to read-only
      } catch (_) {}
    })()
  }, [referenceId])

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    setOk(''); setErr(''); setBusy(true)
    try {
      const payload = {
        ...form,
        eventDate: monthLabel(form.eventDate) || form.eventDate, // "October 2025"
        rating: Number(form.rating),
        referenceId, // customer/project ref
      }
      const r = await fetch('/api/customer/reviews', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      })
      const d = await r.json().catch(()=> ({}))
      if (!r.ok || !d?.success) throw new Error(d?.message || 'Submit failed')
      setOk('Thanks! Your review was submitted.')
      setEcho(d.review) // switch to read-only
    } catch (e) {
      setErr(e?.message || 'Submit failed')
    } finally {
      setBusy(false)
    }
  }

  // READ-ONLY VIEW
  if (echo) {
    return (
      <section className="bg-card rounded-xl border border-gold-500/50 shadow p-5">
        <h2 className="text-2xl font-semibold text-gold-300 mb-5">Your Review</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <RO label="Full Name" value={echo.fullName}/>
          <RO label="Event Type" value={echo.eventType}/>
          <RO label="Event Date (Month & Year)" value={echo.eventDate}/>
          <RO label="Star Rating" value={`${echo.rating} ⭐`}/>
          <RO label="How did you feel (Highlight)" value={echo.highlight} wide/>
          <RO label="How was your Experience with us (Review)" value={echo.review} wide/>
          <RO label="Consent" value={echo.consent ? 'YES' : 'NO'}/>
          <RO label="Reference ID" value={echo.customerRef || echo.referenceId}/>
        </div>
      </section>
    )
  }

  // ENTRY FORM (Event Type text, Rating number, Month picker)
  return (
    <section className="rounded-xl border border-gold-500/30 bg-card/70 shadow p-5 md:p-6">
      <h2 className="text-lg font-semibold text-gold-300 mb-3">Share your review</h2>
      <p className="text-sm text-white/80">
        If you’re satisfied with the photos and videos, please share your appreciation or positive feedback.
      </p>
      <p className="text-sm text-white/80">
        If not, we’d love to hear your suggestions for improvement.
      </p>
      {/* 🔽 separator line added here */}
      <hr className="my-4 border-t border-gold-500/20" />
      {ok && <div className="mb-3 text-sm text-gold-300">{ok}</div>}
      {err && <div className="mb-3 text-sm text-red-400">{err}</div>}

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FI label="Full Name *">
          <input required className="w-full rounded-lg px-3 py-2 bg-ink text-white placeholder:text-white/40
                     border border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-gold-500"
                 value={form.fullName} 
                 onChange={e=>set('fullName', e.target.value)} />
        </FI>

        <FI label="Event Type *">
          <input required className="w-full rounded-lg px-3 py-2 bg-ink text-white placeholder:text-white/40
                     border border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-gold-500"
                  value={form.eventType}
                 onChange={e=>set('eventType', e.target.value)}
                 placeholder="e.g., Anniversary, Maternity" />
        </FI>

        <FI label="Event Date (Month and Year) *">
          <input 
            required 
            type="month" 
            className="month-icon-white w-full rounded-lg px-3 py-2 bg-ink text-white
             border border-gold-500/30 focus:outline-none focus:ring-2
             focus:ring-gold-500/60 focus:border-gold-500"
            value={form.eventDate} 
            onChange={e=>set('eventDate', e.target.value)} />
        </FI>

        <FI label="Star Rating (out of 5) *">
          <select
            required
            className="w-full rounded-lg px-3 py-2 bg-ink text-white
               border border-gold-500/30 focus:outline-none focus:ring-2
               focus:ring-gold-500/60 focus:border-gold-500 select-arrow-white"
            value={form.rating} 
            onChange={e=>set('rating', e.target.value)} 
          >
            <option value="" disabled>Select Rating (1-5)</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </FI>

        <FI label="How did you feel (Highlight) *" wide>
          <input required className="w-full rounded-lg px-3 py-2 bg-ink text-white placeholder:text-white/40
                     border border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-gold-500"
                 value={form.highlight} 
                 onChange={e=>set('highlight', e.target.value)} />
        </FI>

        <FI label="How was your Experience with us (Review) *" wide>
          <textarea required rows={5} className="w-full rounded-lg px-3 py-2 bg-ink text-white placeholder:text-white/40
                     border border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-gold-500"
                    value={form.review} 
                    onChange={e=>set('review', e.target.value)} />
        </FI>

        <div className="md:col-span-2 flex items-center gap-2 text-white">
          <input 
            type="checkbox" 
            className="accent-gold-500"
            checked={form.consent} 
            onChange={e=>set('consent', e.target.checked)} 
          />
          <span>I give permission to publish my testimonial and image</span>
        </div>

        <div className="md:col-span-2">
          <button disabled={busy} className="btn-gold disabled:opacity-60">
            {busy ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>
    </section>
  )
}


function EditRequestsForm({ referenceId }) {
  const [rows, setRows] = useState([{ fileName: '', changes: '' }])
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState('')
  const [err, setErr] = useState('')
  const [draftSavedAt, setDraftSavedAt] = useState(null)

  // NEW: full history of submissions
  const [history, setHistory] = useState([])      // [{ _id, createdAt, items: [{fileName, changes}] }, ...]
  const [loadErr, setLoadErr] = useState('')

  const DRAFT_KEY = referenceId ? `editRequestsDraft:${referenceId}` : null

  // ---- Draft (localStorage) ----
  useEffect(() => {
    if (!DRAFT_KEY) return
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
      if (saved?.rows?.length) setRows(saved.rows)
    } catch {}
  }, [DRAFT_KEY])

  useEffect(() => {
    if (!DRAFT_KEY) return
    const clean = rows.map(r => ({ fileName: r.fileName, changes: r.changes }))
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ rows: clean }))
        setDraftSavedAt(new Date())
      } catch {}
    }, 400)
    return () => clearTimeout(t)
  }, [rows, DRAFT_KEY])

  function clearDraft() {
    if (!DRAFT_KEY) return
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setDraftSavedAt(null)
  }

  // ---- Load full history ----
  async function loadHistory() {
    if (!referenceId) return
    setLoadErr('')
    try {
      const r = await fetch(
        `/api/customer/projects/${encodeURIComponent(referenceId)}/edit-requests`,
        { cache: 'no-store', credentials: 'include' }
      )
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.message || 'Failed to load previous submissions')
      setHistory(Array.isArray(d.items) ? d.items : [])
    } catch (e) {
      setHistory([])
      setLoadErr(e?.message || 'Load error')
    }
  }

  useEffect(() => { loadHistory() }, [referenceId])

  // ---- Form helpers ----
  function setRow(i, key, val) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r))
  }
  function addRow() {
    setRows(prev => [...prev, { fileName: '', changes: '' }])
  }
  function removeRow(i) {
    setRows(prev => prev.filter((_, idx) => idx !== i))
  }

  // ---- Submit ----
  async function submit(e) {
    e.preventDefault()
    setOk(''); setErr(''); setBusy(true)
    try {
      const items = rows
        .map(r => ({ fileName: r.fileName.trim(), changes: r.changes.trim() }))
        .filter(r => r.fileName && r.changes)

      if (!items.length) throw new Error('Please add at least one file and editing change.')

      const r = await fetch(`/api/customer/projects/${encodeURIComponent(referenceId)}/edit-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const d = await r.json().catch(()=> ({}))
      if (!r.ok || !d?.success) throw new Error(d?.message || 'Submit failed')

      setOk('Thanks for your inputs! Your request is sent to the photographer.')
      clearDraft()
      setRows([{ fileName: '', changes: '' }])

      // Refresh full history so the new submission appears immediately
      await loadHistory()
    } catch (e) {
      setErr(e?.message || 'Submit failed')
    } finally {
      setBusy(false)
    }
  }

  // ---- UI ----
  return (
    <div>
      <h3 className="font-medium text-gold-300 mb-4">Request edits</h3>
      <p className="text-sm text-muted mb-3">
        Tell us which files need modifications. Fill out the file details and share your thoughts.
      </p>

      {ok && <div className="mb-2 text-green-700 text-sm">{ok}</div>}
      {err && <div className="mb-2 text-red-700 text-sm">{err}</div>}
      {draftSavedAt && (
        <div className="mb-2 text-xs text-muted">
          Draft saved {draftSavedAt.toLocaleTimeString()}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid md:grid-cols-[1fr,2fr,auto] gap-2">
              <input
                className="edited-input"
                placeholder="File name (e.g., DSC_0123.JPG)"
                value={row.fileName}
                onChange={e=>setRow(i, 'fileName', e.target.value)}
              />
              <input
                className="edited-input"
                placeholder="Editing changes (e.g., remove blemish, brighten face)"
                value={row.changes}
                onChange={e=>setRow(i, 'changes', e.target.value)}
              />
              <button type="button" onClick={() => removeRow(i)} className="pill-gold">
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={addRow} className="pill-gold">
            Add more
          </button>
          <button disabled={busy} className="btn-gold">
            {busy ? 'Submitting…' : 'Submit'}
          </button>
          {draftSavedAt && (
            <button type="button" onClick={clearDraft} className="pill-gold">
              Clear draft
            </button>
          )}
        </div>
      </form>

      {/* ----- All previous submissions (newest first) ----- */}
      <div className="mt-6">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">Your previous submissions</h4>
          <button
            type="button"
            className="pill-gold text-xs"
            onClick={loadHistory}
            title="Refresh"
          >
            Refresh
          </button>
        </div>

        {loadErr && <div className="text-sm text-red-600 mt-2">{loadErr}</div>}

        {!history.length ? (
          <div className="text-sm text-muted mt-2">No submissions yet.</div>
        ) : (
          <div className="mt-2 space-y-3">
            {history.map((req) => (
              <div key={req._id} className="border border-gold-500/40 rounded p-3 bg-ink/80">
                <div className="text-sm font-medium text-gold-200">
                  Submitted {req.createdAt ? new Date(req.createdAt).toLocaleString() : '—'}
                </div>
                <div className="mt-2 space-y-2">
                  {(req.items || []).map((it, idx) => (
                    <div key={idx} className="grid md:grid-cols-[1fr,2fr] gap-2 text-sm">
                      <div className="font-mono">{it.fileName}</div>
                      <div className="whitespace-pre-wrap">{it.changes}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}




function FI({ label, children, wide }) {
  return (
    <label className={`block ${wide ? 'md:col-span-2' : ''}`}>
      <span className="block form-label-lg mb-1 text-muted">{label}</span>
      {children}
    </label>
  );
}



function RO({ label, value, wide }) {
  return (
    <div className={`${wide ? 'md:col-span-2' : ''}`}>
      {/* Field name (white) */}
      <div className="text-md text-white">{label}</div>
      {/* Field value (light gray) */}
      <div className="mt-0.5 text-white/50 whitespace-pre-wrap">
        {String(value || '—')}
      </div>
    </div>
  )
}

