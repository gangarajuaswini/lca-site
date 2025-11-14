// src/app/api/drive/stream/[id]/route.js
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';        // ensure Node streams
export const dynamic = 'force-dynamic'; // range requests must not be cached

export async function GET(req, ctx) {
  const { id } = await ctx.params;      // ✅ Next 15: await params
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const range = req.headers.get('range') || '';
  const upstream = await fetch(
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`,
    { headers: range ? { range } : undefined, redirect: 'follow' }
  );

  // Pass through only the headers the browser needs for media
  const headers = new Headers();
  for (const [k, v] of upstream.headers) {
    if (/^(content-(type|length|range)|accept-ranges|cache-control)$/i.test(k)) {
      headers.set(k, v);
    }
  }
  headers.set('Access-Control-Allow-Origin', '*'); // optional

  return new NextResponse(upstream.body, {
    status: upstream.status, // 200/206 preserved
    headers
  });
}
