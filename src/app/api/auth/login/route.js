// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import { JWT_SECRET } from '@/lib/auth';

const ADMIN_LIST = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export async function POST(req) {
  try {
    const { email, password, role, referenceId } = await req.json();

    // Admin login (simple allowlist + any password you currently use)
    if (role === 'admin') {
      if (!ADMIN_LIST.includes(String(email || '').toLowerCase())) {
        return NextResponse.json({ success: false, message: 'Not an admin' }, { status: 401 });
      }

      // (Optional) add your own admin password check here if you have one

      const token = jwt.sign({ role: 'admin', email }, JWT_SECRET); // no expiry per your requirement
      const cookieStore = await cookies();                           // ✅ await
      cookieStore.set('auth_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });

      return NextResponse.json({ success: true, role: 'admin' });
    }

    // Customer login (example — adapt to your schema)
    if (role === 'customer') {
      const { db } = await connectToDatabase();
      const contact = await db.collection('contacts').findOne({ email, referenceId });
      if (!contact) {
        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
      }

      const token = jwt.sign(
        { role: 'customer', email, referenceId, sub: String(contact._id) },
        JWT_SECRET
      );

      const cookieStore = await cookies();                           // ✅ await
      cookieStore.set('auth_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });

      return NextResponse.json({ success: true, role: 'customer' });
    }

    return NextResponse.json({ success: false, message: 'Unknown role' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
