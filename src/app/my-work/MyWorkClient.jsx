//src/app/my-work/MyWorkClient.jsx

'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Camera } from 'lucide-react'

// --- DRIVE HELPERS: always prefer our proxy for any Google Drive link ---
function getDriveIdFromUrl(raw) {
  try {
    if (!raw) return null;
    const u = new URL(raw);
    const host = u.hostname;
    if (!host.includes('drive.google')) return null;
    const idParam = u.searchParams.get('id');
    if (idParam) return idParam;
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (m?.[1]) return m[1];
    return null;
  } catch {
    return null;
  }
}

function getPreviewUrl(item) {
  const id =
    item?.driveFileId ||
    getDriveIdFromUrl(item?.previewUrl || item?.url || item?.downloadUrl || item?.videoUrl);
  if (id) return `/api/drive/preview/${id}`;
  return item?.previewUrl || item?.url;
}

function getDownloadUrl(item) {
  const id =
    item?.driveFileId ||
    getDriveIdFromUrl(item?.videoUrl || item?.downloadUrl || item?.url);
  if (id) return `/api/drive/stream/${id}`;
  return item?.downloadUrl || item?.videoUrl || item?.url;
}

function getFullUrl(item) {
  const id =
    item?.driveFileId ||
    getDriveIdFromUrl(item?.url || item?.downloadUrl || item?.videoUrl || item?.previewUrl);
  if (id) return `/api/drive/stream/${id}`;
  return item?.url || item?.downloadUrl || item?.videoUrl || item?.previewUrl;
}

// --- Lightbox helpers/state ---
const isVideoItem = (it) =>
  it?.type === 'video' || /^video\//i.test(it?.mimeType || '');

function useLightbox() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const scrollYRef = useRef(0);

  const openWith = (arr, startIdx = 0) => {
    if (!Array.isArray(arr) || !arr.length) return;
    scrollYRef.current = window.scrollY || 0;
    setItems(arr);
    setIndex(Math.max(0, Math.min(startIdx, arr.length - 1)));
    setOpen(true);
    document.documentElement.style.overflow = 'hidden';
  };

  const close = () => {
    setOpen(false);
    document.documentElement.style.overflow = '';
    window.scrollTo(0, scrollYRef.current || 0);
  };

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  // keyboard: ESC, ←, →
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return { open, items, index, openWith, close, prev, next };
}


// lazy-load helper
function useInView(options = { rootMargin: '200px' }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        obs.disconnect();
      }
    }, options);
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView, options.rootMargin]);
  return [ref, inView];
}

export default function MyWorkClient() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [categories, setCategories] = useState([])
  const [grouped, setGrouped] = useState({})
  const [selectedItems, setSelectedItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const lightbox = useLightbox();
  const scrollRefs = useRef({})
  const scrollMetaRef = useRef({})

  // Open on double-tap (touch) within 300ms; works app-wide
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


  // -------- Load categories + initial data --------
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      // 1) Categories
      let cats = [];
      try {
        const catRes = await fetch('/api/public-gallery/categories', {
          cache: 'no-store',
          next: { revalidate: 0 },
        });
        const catData = await catRes.json().catch(() => null);
        if (catRes.ok && catData?.categories?.length) {
          cats = catData.categories.map(c => ({ ...c, id: String(c._id) }));
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[my-work] categories fetch threw:', err);
        }
      }
      if (cancelled) return;
      setCategories(cats);

      // 2) Per-category media for "All Work" view
      if (cats.length) {
        try {
          const perCat = await Promise.all(
            cats.map(async c => {
              const qs = new URLSearchParams({ categoryId: c.id, pageSize: '10' });
              const r = await fetch(`/api/public-gallery/media?${qs.toString()}`, {
                cache: 'no-store',
                next: { revalidate: 0 },
              });
              const d = await r.json().catch(() => null);
              return [c.id, d?.media || []];
            })
          );
          if (cancelled) return;
          const g = {};
          perCat.forEach(([id, list]) => { g[id] = list; });
          setGrouped(g);
        } catch (err) {
          if (!cancelled && process.env.NODE_ENV === 'development') {
            console.warn('[my-work] per-category media fetch threw:', err);
          }
        }
      }

      // 3) Total count
      try {
        const totalRes = await fetch('/api/public-gallery/media?pageSize=1', {
          cache: 'no-store',
          next: { revalidate: 0 },
        });
        const totalData = await totalRes.json().catch(() => null);
        if (!cancelled) setTotalCount(totalData?.total || 0);
      } catch (err) {
        if (!cancelled && process.env.NODE_ENV === 'development') {
          console.warn('[my-work] total fetch threw:', err);
        }
      }
    }

    boot();
    return () => { cancelled = true; };
  }, []);

  // -------- Load grid when a category is selected --------
  useEffect(() => {
    let cancelled = false
    async function loadSelected() {
      if (activeCategory === 'all') return
      const qs = new URLSearchParams({ categoryId: activeCategory, pageSize: '60' })
      const res = await fetch(`/api/public-gallery/media?${qs.toString()}`, { cache: 'no-store' })

      let data = { media: [] }
      try { data = await res.json() } catch (err) {
        console.warn('[my-work] media api json parse error', err)
      }

      if (!res.ok) {
        console.warn('[my-work] media api error', { status: res.status })
        if (!cancelled) setSelectedItems([])
        return
      }

      const list = Array.isArray(data?.media) ? data.media : []
      if (!cancelled) setSelectedItems(list)
    }
    loadSelected()
    return () => { cancelled = true }
  }, [activeCategory])


  // -------- Infinite, smooth, continuous auto-scroll for 'All Work' rails --------
  useEffect(() => {
    // helper: tear everything down (cancel RAFs, remove listeners, reset transforms)
    const teardown = () => {
      Object.values(scrollMetaRef.current).forEach((m) => {
        if (m?.raf) cancelAnimationFrame(m.raf);
        if (m?.el) m.el.style.transform = 'translate3d(0,0,0)';
        if (m?.cleanup) m.cleanup();
      });
      scrollMetaRef.current = {};
    };

    // stop whatever was running from previous state
    teardown();

    // only run the marquee on the All Work view
    if (activeCategory !== 'all') return () => teardown();

    const ids = Object.keys(grouped);
    if (!ids.length) return;

    // wait one paint so refs exist & sizes are final
    requestAnimationFrame(() => {
      ids.forEach((catId) => {
        const track = scrollRefs.current[catId];
        if (!track) return;

        // viewport is the immediate wrapper; if you used the overflow-hidden wrapper, this is correct
        const viewport = track.parentElement;
        const half = track.scrollWidth / 2; // one copy width (track is duplicated)

        if (!viewport || half <= viewport.clientWidth) return; // nothing to scroll

        const prefersReduced =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        
        // Ultra-slow absolute speed (px per second).
        // Tweak these down further if you want it *near frozen*.
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const speedPxPerSec = prefersReduced ? 0 : (isMobile ? 0.02 : 0.02);
        // 0.06 px/s ≈ 3.6 px/min on mobile
        // 0.10 px/s ≈ 6 px/min on desktop

        const meta = (scrollMetaRef.current[catId] = {
          el: track,
          x: 0,
          last: undefined,
          paused: false,
          speed: prefersReduced ? 0 : speedPxPerSec,
          raf: 0,
        });        

        const onEnter = () => (meta.paused = true);
        const onLeave = () => (meta.paused = false);
        track.addEventListener('mouseenter', onEnter);
        track.addEventListener('mouseleave', onLeave);

        meta.cleanup = () => {
          track.removeEventListener('mouseenter', onEnter);
          track.removeEventListener('mouseleave', onLeave);
        };

        const step = (ts) => {
          if (meta.paused) { meta.last = ts; meta.raf = requestAnimationFrame(step); return; }
          if (meta.last == null) meta.last = ts;

          const dt = Math.min((ts - meta.last) / 1000, 1 / 60); // clamp for stability
          meta.last = ts;

          meta.x += meta.speed * dt;
          if (meta.x >= half) meta.x -= half; // seamless wrap at the seam

          track.style.transform = `translate3d(${-meta.x}px,0,0)`;
          meta.raf = requestAnimationFrame(step);
        };

        meta.raf = requestAnimationFrame(step);
      });
    });

    return () => teardown();
  }, [activeCategory, grouped]); // ⬅️ key change: depend on activeCategory too



  const pills = useMemo(() => [
    { id: 'all', name: 'All Work' },
    ...categories.map(c => ({ id: c.id, name: c.name }))
  ], [categories])

  const currentList = useMemo(() => {
    if (activeCategory === 'all') {
      return Object.values(grouped).flat().sort((a, b) => {
        const ad = new Date(a.createdAt || 0)
        const bd = new Date(b.createdAt || 0)
        return bd - ad
      })
    }
    return [...selectedItems].sort((a, b) => {
      const ad = new Date(a.createdAt || 0)
      const bd = new Date(b.createdAt || 0)
      return bd - ad
    })
  }, [activeCategory, grouped, selectedItems])

  function Tile({ item, rounded = false }) {
    const preview = getPreviewUrl(item);
    const stream  = getDownloadUrl(item);
    const [wrapRef, inView] = useInView({ rootMargin: '300px' });
    const [isLoaded, setIsLoaded] = useState(false);
    const vidRef = useRef(null);
    const [showUnmute, setShowUnmute] = useState(false);

    if (item.type !== 'video') {
      return (
        <div ref={wrapRef} className={['relative w-full h-full', rounded ? 'rounded-xl overflow-hidden' : ''].join(' ')}>
          {!isLoaded && <div className="absolute inset-0 bg-surface/70 animate-pulse" />}
          {inView && (
            <img
              src={preview}
              alt=""
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              sizes="(max-width: 768px) 100vw, 33vw"
              onLoad={() => setIsLoaded(true)}
              className={[
                'w-full h-full object-cover',
                'transform-gpu transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] will-change-transform',
                'transition-opacity duration-500',
                isLoaded ? 'opacity-100' : 'opacity-0',
                'group-hover:scale-[1.05]'
              ].join(' ')}
            />
          )}
        </div>
      );
    }

    const handleEnter = async () => {
      const v = vidRef.current; if (!v) return;
      v.muted = false; v.volume = 1;
      try { await v.play(); setShowUnmute(false); }
      catch { v.muted = true; try { await v.play(); } catch {} setShowUnmute(true); }
    };
    const handleLeave = () => { const v = vidRef.current; if (!v) return; v.pause(); v.currentTime = 0; };
    const handleUnmuteClick = async (e) => {
      e.stopPropagation();
      const v = vidRef.current; if (!v) return;
      v.muted = false; v.volume = 1;
      try { await v.play(); setShowUnmute(false); } catch {}
    };


    return (
      <div
        ref={wrapRef}
        className={['relative w-full h-full', rounded ? 'rounded-xl overflow-hidden' : ''].join(' ')}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {!isLoaded && <div className="absolute inset-0 bg-surface/70 animate-pulse" />}
        {inView && (
          <video
            ref={vidRef}
            poster={preview || undefined}
            src={stream}
            playsInline
            controls={false}
            preload="metadata"
            disablePictureInPicture
            controlsList="nodownload noplaybackrate nofullscreen"
            onLoadedData={() => setIsLoaded(true)}
            className={[
              'w-full h-full object-cover',
              'transform-gpu transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] will-change-transform',
              'transition-opacity duration-500',
              isLoaded ? 'opacity-100' : 'opacity-0',
              'group-hover:scale-[1.05]'
            ].join(' ')}
          />
        )}
        {showUnmute && (
          <button
            type="button"
            onClick={handleUnmuteClick}
            className="absolute bottom-2 left-2 z-10 rounded-full bg-ink/70 text-text text-xs px-2 py-1"
          >
            Click for sound
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-ink">
        {/* Hero Section */}
        <section className="relative pt-24 pb-4 bg-ink text-text overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent"></div>
          <div className="absolute top-20 left-10 w-32 h-32 bg-gold-500/10 rounded-full blur-xl animate-floating"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-gold-500/10 rounded-full blur-xl animate-floating" style={{animationDelay: '2s'}}></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Camera className="h-16 w-16 text-gold-400 mx-auto mb-6 animate-bounce" />
            <h1 className="text-5xl lg:text-6xl font-bold font-playfair mb-6">
              My Work <span className="block text-gold-300">Portfolio</span>
            </h1>
            <p className="text-2xl text-muted max-w-3xl mx-auto mb-1">
              Discover our collection of captured moments, from intimate portraits to grand celebrations.
            </p>
          </div>
        </section>

        {/* Pills */}
        <section className="sticky top-20 z-40 bg-ink/95 backdrop-blur-md border-b border-border py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {pills.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveCategory(p.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all duration-300 
                    border ${activeCategory === p.id
                      ? 'bg-gold-500 text-ink border-gold-500 shadow-lg scale-105'
                      : 'bg-transparent text-gold-500 border-gold-500 hover:bg-gold-500/10 hover:scale-105'}`}
                >
                  <Camera className="h-4 w-4" />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {activeCategory === 'all' ? (
              categories.length === 0 ? (
                <div className="text-center text-muted py-16">No categories yet.</div>
              ) : (
                categories.map((c) => (
                  <div key={c.id} className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-3xl font-bold font-playfair text-gold-$1 flex items-center">
                        <Camera className="h-8 w-8 text-gold-500 mr-3" /> {c.name}
                      </h3>
                      <button onClick={() => setActiveCategory(c.id)} className="text-gold-500 hover:text-gold-500 font-medium">
                        View All →
                      </button>
                    </div>

                    <div className="relative">
                      <div className="overflow-hidden pb-4"> {/* viewport */}
                        <div
                          ref={(el) => { scrollRefs.current[c.id] = el }}
                          className="flex flex-nowrap gap-6 will-change-transform translate-z"
                          style={{ transform: 'translate3d(0,0,0)' }}
                        >
                          {/* first copy */}
                          {(grouped[c.id] || []).map((item, i) => (
                            <div key={`${item._id || item.driveFileId || item.downloadUrl || item.url}-${i}-A`} className="group flex-shrink-0 w-56 md:w-64">
                              <div
                                className="relative aspect-square cursor-zoom-in"
                                onDoubleClick={() => lightbox.openWith(grouped[c.id] || [], i)}
                                onTouchEnd={onDblTap(() => lightbox.openWith(grouped[c.id] || [], i))}
                              >
                                <Tile item={item} rounded />
                              </div>
                            </div>
                          ))}

                          {/* second (duplicated) copy */}
                          {(grouped[c.id] || []).map((item, i) => {
                            const base = (grouped[c.id] || []);
                            const idx = i % base.length;
                            return (
                              <div key={`${item._id || item.driveFileId || item.downloadUrl || item.url}-${i}-B`} className="group flex-shrink-0 w-56 md:w-64">
                                <div
                                  className="relative aspect-square cursor-zoom-in"
                                  onDoubleClick={() => lightbox.openWith(base, idx)}
                                  onTouchEnd={onDblTap(() => lightbox.openWith(base, idx))}
                                >
                                  <Tile item={item} rounded />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              selectedItems.length === 0 ? (
                <div className="text-center py-16">
                  <Camera className="h-16 w-16 text-gold-400 mx-auto mb-4"></Camera>
                  <h3 className="text-xl font-semibold text-muted mb-2">Comeback to view our work</h3>
                  <p className="text-muted">We will be posting in few days</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 overflow-visible">
                  {currentList.map((item, idx) => (
                    <div key={item._id} className="group rounded-2xl overflow-hidden">
                      <div
                        className="relative aspect-square cursor-zoom-in"
                        onDoubleClick={() => lightbox.openWith(currentList, idx)}
                        onTouchEnd={onDblTap(() => lightbox.openWith(currentList, idx))}
                      >
                        <Tile item={item} rounded />
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-ink text-text border-t border-border">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl text-gold-300 font-bold font-playfair mb-6">Love What You See?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Let&apos;s create something beautiful together.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/contact" className="max-w-xs w-full sm:w-auto bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-500 hover:to-gold-600 text-text font-semibold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-center">
                Book Your Session
              </a>
            </div>
          </div>
        </section>
      </main>

      {lightbox.open && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
          onClick={lightbox.close}
        >
          {/* media container */}
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
              if (!active) return null; // guard while state settles

              const isVideo =
                active?.type === 'video' || /^video\//i.test(active?.mimeType || '');

              // Prefer preview for images (RAW/HEIC/etc. become viewable); stream for video.
              const src  = isVideo ? getFullUrl(active) : (getPreviewUrl(active) || getFullUrl(active));
              const poster = isVideo ? (getPreviewUrl(active) || undefined) : undefined;
              const key = active._id || active.driveFileId || src;

              return isVideo ? (
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

            {/* Close (top-right of media) */}
            <button
              type="button"
              aria-label="Close"
              onClick={lightbox.close}
              className="absolute -top-3 -right-3 md:top-2 md:right-2 rounded-full bg-gold-500 text-ink px-3 py-2 font-semibold ring-1 ring-gold-400 shadow-lg transition-transform hover:scale-105"
            >
              ✕
            </button>

            {/* Prev / Next – vertically centered at left/right of media */}
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


      <Footer />

      <style jsx>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  )
}
