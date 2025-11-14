// src/components/Hero.js
'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

/* ---------- Drive helpers (single copy) ---------- */
function getDriveIdFromUrl(raw) {
  try {
    if (!raw) return null
    const u = new URL(raw)
    if (!u.hostname.includes('drive.google')) return null
    const idParam = u.searchParams.get('id')
    if (idParam) return idParam
    const m = u.pathname.match(/\/file\/d\/([^/]+)/)
    return m?.[1] || null
  } catch { return null }
}

function getDriveIdFromItem(item) {
  return (
    item?.driveFileId ||
    getDriveIdFromUrl(item?.videoUrl || item?.downloadUrl || item?.url || item?.previewUrl)
  )
}

// Web-safe image / video checks
const IMG_EXT_SAFE = /\.(jpe?g|png|webp|gif|avif|svg)$/i
const VID_EXT_SAFE = /\.(mp4|m4v|webm|og[gv])$/i
const AUDIO_UNLOCK_KEY = 'audioUnlocked';

const isVideo = (item) => {
  const name = String(item?.name || '')
  const mime = String(item?.mimeType || '')
  return /^video\//i.test(mime) || VID_EXT_SAFE.test(name) || item?.type === 'video'
}

const browserCanRenderImage = (item) => {
  const name = String(item?.name || '')
  const mime = String(item?.mimeType || '')
  return (
    /^image\/(jpe?g|png|webp|gif|avif|svg\+xml)$/i.test(mime) ||
    IMG_EXT_SAFE.test(name)
  )
}

// URLs
const streamUrl  = (id) => (id ? `/api/drive/stream/${id}` : '')
const previewUrl = (id, w = 3000) => (id ? `/api/drive/preview/${id}?w=${w}` : '')

// Best URL for images: original for jpg/jpeg/webp/svg; high-res preview for RAW (.arw, etc.)
function imageDisplayUrl(item) {
  const id = getDriveIdFromItem(item)
  return browserCanRenderImage(item) ? streamUrl(id) : previewUrl(id, 3000)
}

// Best URL(s) for videos
function videoDisplay(item) {
  const id = getDriveIdFromItem(item)
  const name = String(item?.name || '')
  const mime = String(item?.mimeType || '')
  const webSafe = /^video\/(mp4|webm|ogg)$/i.test(mime) || VID_EXT_SAFE.test(name)
  return {
    src: webSafe ? streamUrl(id) : '',     // if not web-safe, no direct video src
    poster: previewUrl(id, 2000),          // always show a poster
    webSafe,
  }
}

/* ---------- Media primitives ---------- */
function BgVideo({ src, poster, trySound, loop, onEnded }) {
  const ref = useRef(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;

    let cleaned = false;

    // Prefer sound if: (a) this clip wants sound (intro) OR (b) we've unlocked before
    const preferSound =
      trySound || (typeof window !== 'undefined' && localStorage.getItem(AUDIO_UNLOCK_KEY) === '1');

    const tryPlay = async (withSound) => {
      try {
        v.muted = !withSound;
        v.volume = withSound ? 1 : 0;
        await v.play();
        return true;
      } catch {
        return false;
      }
    };

    const unlock = async () => {
      if (cleaned) return;
      const ok = await tryPlay(true);
      if (ok) {
        try { localStorage.setItem(AUDIO_UNLOCK_KEY, '1'); } catch {}
      }
      removeUnlockers();
    };

    const addUnlockers = () => {
      const opts = { once: true, passive: true };
      window.addEventListener('pointerdown', unlock, opts);
      window.addEventListener('touchstart', unlock, opts);
      window.addEventListener('keydown', unlock, { once: true });
      window.addEventListener('scroll', unlock, opts);
    };
    const removeUnlockers = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('scroll', unlock);
    };

    (async () => {
      // First attempt: audible if allowed/preferred
      const ok = await tryPlay(preferSound);
      if (!ok) {
        // Fall back to muted; if intro wanted sound, auto-unmute on first interaction
        const playedMuted = await tryPlay(false);
        if (playedMuted && trySound) addUnlockers();
      }
    })();

    return () => {
      cleaned = true;
      removeUnlockers();
      try { v.pause(); } catch {}
    };
  }, [src, trySound]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster || undefined}
      autoPlay
      loop={loop}
      playsInline
      preload="metadata"
      className="w-full h-full object-cover"
      onEnded={onEnded}
      controls={false}
      disablePictureInPicture
      controlsList="nodownload noplaybackrate nofullscreen"
    />
  );
}

function MediaLayer({ item, active, loop, onEnded }) {
  if (!item) return null;

  if (isVideo(item)) {
    const v = videoDisplay(item);
    if (!v.webSafe) {
      return <img src={v.poster} alt="" className="w-full h-full object-cover" />;
    }
    return (
      <BgVideo
        src={v.src}
        poster={v.poster}
        trySound={active}   // true only for the intro (order 1)
        loop={loop}
        onEnded={onEnded}
      />
    );
  }

  return <img src={imageDisplayUrl(item)} alt="" className="w-full h-full object-cover" />;
}

/* ---------- Hero ---------- */
export default function Hero() {
  const [intro, setIntro] = useState(null)      // order = 1
  const [rest, setRest] = useState([])          // order 2..N
  const [phase, setPhase] = useState('intro')   // 'intro' | 'loop'
  const [loopIdx, setLoopIdx] = useState(0)
  const timerRef = useRef(0)

  // Load curated hero media
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/home-gallery?section=hero', { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        const rows = Array.isArray(data?.rows) ? data.rows : []
        rows.sort((a,b) => (a.order??0)-(b.order??0) || new Date(a.createdAt||0) - new Date(b.createdAt||0))
        const [first, ...others] = rows
        if (!cancelled) { setIntro(first || null); setRest(others) }
      } finally {}
    })()
    return () => { cancelled = true; if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Loop timer for rest (2..N)
  useEffect(() => {
    if (phase !== 'loop' || rest.length < 2) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setLoopIdx(i => (i + 1) % rest.length)
    }, 6000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, rest.length])

  // When intro is an image: advance after 5s
  useEffect(() => {
    if (phase !== 'intro' || !intro || isVideo(intro)) return
    const t = setTimeout(() => setPhase('loop'), 5000)
    return () => clearTimeout(t)
  }, [phase, intro])

  const active = phase === 'intro' ? intro : (rest[loopIdx] || null)
  const prev = phase === 'intro' ? null : (rest[(loopIdx - 1 + Math.max(rest.length,1)) % Math.max(rest.length,1)] || null)

  return (
    <section className="relative overflow-hidden bg-ink">
      {/* Background layers */}
      <div className="absolute inset-0">
        {/* previous (hidden during intro) */}
        <div
          aria-hidden
          className={[
            'absolute inset-0 transition-opacity duration-[1200ms] ease-out',
            phase === 'intro' || rest.length < 2 ? 'opacity-0' : 'opacity-100',
          ].join(' ')}
        >
          <MediaLayer item={prev} active={false} loop={true} />
        </div>

        {/* active */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-100 transition-opacity duration-[1200ms] ease-out"
          key={(active?.driveFileId) || (active?._id) || (active?.name) || 'hero-active'}
        >
          <MediaLayer
            item={active}
            active={phase === 'intro'}
            loop={phase !== 'intro'}               // intro plays once; loop items may loop
            onEnded={() => { if (phase === 'intro') setPhase('loop') }}
          />
        </div>

        {/* overlays for readability */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-gradient-to-tr from-transparent via-gold-500/5 to-gold-500/10" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Center vertically, a touch more top space, less bottom space */}
        <div
          className="
            min-h-[calc(100svh-88px)]   /* fill viewport minus ~navbar height */
            flex flex-col items-center justify-center text-center
            pt-24 md:pt-32 lg:pt-36     /* a little more top space */
            pb-8                        /* less bottom space -> smaller gap to About */
            gap-6
          "
        >
          <h1 className="font-playfair text-text text-4xl sm:text-5xl md:text-6xl leading-tight tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
            Capturing Life&apos;s Precious
            <span className="block mt-1 bg-clip-text text-transparent bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400">
              Moments
            </span>
          </h1>

          <p className="max-w-2xl text-lg md:text-xl text-muted">
            Elegant, emotive, and artfully composed imagery-crafted to preserve your story forever.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4 mb-14">
            <a href="/contact" className="inline-flex items-center justify-center rounded-full bg-gold-500 px-7 py-3 font-semibold text-text shadow-lg shadow-black/30 ring-1 ring-gold-500/30 transition-transform hover:scale-[1.03]">
              Book a Session
            </a>
            <a href="/my-work" className="inline-flex items-center justify-center rounded-full border border-gold-500/50 bg-black/40 px-7 py-3 font-semibold text-text/90 hover:bg-black/60 transform-gpu transition-transform duration-200 ease-[cubic-bezier(.2,.8,.2,1)] hover:scale-[1.05] focus-visible:scale-[1.05]">
              View Portfolio
            </a>
          </div>
        </div>

        {/* Scroll hint (clickable) */}
        <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2">
          <a
            href="#about"
            aria-label="Scroll for more"
            className="inline-flex flex-col items-center gap-1 text-gold-500 hover:text-gold-300 transition-colors"
          >
            <span className="text-xs sm:text-sm tracking-wide whitespace-nowrap">
              Scroll for more
            </span>
            <svg className="h-5 w-5 sm:h-6 sm:w-6 animate-bounce" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
