// src/app/blog/[id]/page.js
'use client'
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function BlogDetailPage({ params }) {
  const [b, setB] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await fetch(`/api/blogs/${params.id}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (mounted) setB(data?.row || null);
    })();
    return () => { mounted = false; };
  }, [params.id]);

  return (
    <>
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-12">
        {!b ? (
          <div className="text-muted">Loading…</div>
        ) : (
          <article className="prose max-w-none">
            {b.coverUrl ? (
              <img src={b.coverUrl} alt={b.title} className="w-full rounded-2xl mb-6" />
            ) : null}
            <h1 className="!mb-2">{b.title}</h1>
            <p className="text-sm text-muted !mt-0">{b.date} · {b.readTime}</p>
            {b.eventName ? <p className="text-sm text-muted">Event: {b.eventName}</p> : null}
            {b.excerpt ? <p className="text-muted">{b.excerpt}</p> : null}

            {Array.isArray(b.hashtags) && b.hashtags.length ? (
              <div className="flex flex-wrap gap-2 my-4">
                {b.hashtags.map((t, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-surface rounded">#{t}</span>
                ))}
              </div>
            ) : null}

            {Array.isArray(b.sections) && b.sections.length ? (
              <div className="space-y-6">
                {b.sections.map((s, i) => (
                  <section key={i}>
                    {s.heading ? <h2>{s.heading}</h2> : null}
                    {s.body ? <p>{s.body}</p> : null}
                  </section>
                ))}
              </div>
            ) : null}

            {Array.isArray(b.gallery) && b.gallery.length ? (
              <div className="grid sm:grid-cols-2 gap-4 mt-8">
                {b.gallery.map((url, i) => (
                  <img key={i} src={url} alt={`Media ${i + 1}`} className="w-full rounded-xl" />
                ))}
              </div>
            ) : null}
          </article>
        )}
      </main>

      <Footer />
    </>
  );
}
