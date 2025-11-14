// src/components/Footer.js
'use client'
import Link from 'next/link'
import Image from 'next/image'

const STUDIO = {
  name: 'LCA Visual Studios',
  phone: '+1 (737) 412-8343',
  phoneHref: '+17374128343',
  email: 'lcavisualstudio@gmail.com',
  instagram: 'https://www.instagram.com/lca.visualstudios',
}

export default function Footer() {
  return (
    <footer className="bg-ink text-muted lca-footer">
      <div className="max-w-6xl mx-auto px-3 lg:px-4 py-1 md:py-2">
        {/* Row 1 — always centered */}
        <div className="flex flex-col items-center justify-center text-center gap-1 md:flex-row md:flex-wrap md:gap-1">
          <Link
            href="/"
            className="footer-brand text-xl md:text-2xl font-semibold leading-tight whitespace-nowrap"
            aria-label="Go to Home"
          >
            {STUDIO.name}
          </Link>

          <span className="footer-vsep" aria-hidden="true" />
          <a href={`tel:${STUDIO.phoneHref}`} className="footer-link inline-flex items-center justify-center gap-2 text-sm">
            <Image src="/phone-icon.png" alt="Phone" width={20} height={20} className="footer-icon" />
            {STUDIO.phone}
          </a>

          <span className="footer-vsep" aria-hidden="true" />
          <a href={`mailto:${STUDIO.email}`} className="footer-link inline-flex items-center justify-center gap-1 text-sm">
            <Image src="/email-icon.png" alt="Email" width={20} height={20} className="footer-icon" />
            {STUDIO.email}
          </a>

          <span className="footer-vsep" aria-hidden="true" />
          <a
            href={STUDIO.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on Instagram"
            className="pill-gold inline-flex items-center justify-center gap-2"
          >
            <Image src="/instagram-icon.png" alt="Instagram" width={20} height={20} className="footer-icon" />
            Follow us on Instagram
          </a>
        </div>

        <div className="footer-hr" />

        {/* Row 2 — centered too */}
        <div className="mt-1 pt-1 flex flex-col items-center justify-center text-center gap-1 sm:flex-row sm:flex-wrap">
          <span className="text-xs text-muted">© 2025 LCA Visual Studios. All rights reserved.</span>       
        </div>
      </div>
    </footer>
  )
}
