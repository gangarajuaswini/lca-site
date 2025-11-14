// src/app/blog/page.js
'use client'
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function BlogPage() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('idle'); // JS: no TS generics here
  const [err, setErr] = useState('');

  const formatDate = (d) => {
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return d || ''; }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setStatus('loading');
        const res = await fetch('/api/blogs', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        const list = Array.isArray(data?.rows) ? data.rows : [];
        setRows(list);
        setStatus('ok');
      } catch {
        if (!mounted) return;
        setErr('Failed to load posts.');
        setStatus('error');
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="flex min-h-svh flex-col bg-ink">
      <Header />
      {/* Content area grows to push footer down */}
      <div className="flex-1 flex flex-col">
        <section className="blog-hero">
          <div className="blog-hero-overlay" />
          <div className="blog-hero-inner">
            <h1 className="blog-hero-title font-playfair text-gold-300">Stories & Tips</h1>
            <p className="blog-hero-lead">
              Behind-the-scenes notes, session highlights, and practical advice to help you plan
              picture-perfect moments — from weddings to portraits and everything in between.
            </p>
          </div>
        </section>

        <main className="flex-1 max-w-6xl mx-auto px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {status === 'loading' && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-card border border-border animate-pulse">
                <div className="h-48 bg-surface/70" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-3/4 bg-surface/70 rounded" />
                  <div className="h-4 w-full bg-surface/70 rounded" />
                  <div className="h-4 w-5/6 bg-surface/70 rounded" />
                </div>
              </div>
            ))}

            {status !== 'loading' && rows.length > 0 && rows.map((b) => (
              <a
                key={b.slug}
                href={`/blog/${b.slug}`}
                className="group blog-card border border-border transition
                          hover:border-gold-400/60 hover:shadow-[0_18px_48px_rgba(212,175,55,0.18)]
                          hover:-translate-y-0.5 focus-visible:outline-none
                          focus-visible:ring-2 focus-visible:ring-gold-400/50"
                aria-label={b.title}
              >
                {b.coverUrl ? (
                  <img
                    src={b.coverUrl}
                    alt={b.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-surface to-ink" />
                )}
                <div className="p-4">
                  <h2 className="blog-card-title font-playfair">{b.title}</h2>
                  <p className="blog-card-excerpt">{b.excerpt}</p>
                  <p className="blog-card-meta">
                    {formatDate(b.date)}{b.readTime ? ` · ${b.readTime}` : ''}
                  </p>
                </div>
              </a>
            ))}

            {status !== 'loading' && rows.length === 0 && (
              <div className="blog-empty">No posts yet.</div>
            )}

            {status === 'error' && (
              <div className="text-red-400">{err}</div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
