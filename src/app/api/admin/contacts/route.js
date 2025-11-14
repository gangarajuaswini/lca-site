//src/app/api/admin/contacts/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function isAdmin() {
  const store = await cookies(); // ✅ must await in Next 15
  const token = store.get('auth_token')?.value || '';
  try { return jwt.verify(token, JWT_SECRET)?.role === 'admin'; }
  catch { return false; }
}

export async function GET(req) {
  if (!(await isAdmin())) {
    return NextResponse.json({ success: false, rows: [] }, { status: 401 });
  }

  const { db } = await connectToDatabase();

  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const size = Math.min(100, Math.max(1, parseInt(url.searchParams.get('size') || '25', 10)));

  // Basic filter: include everything for Inbox (you can add status filter later)
  let filter = {};
  if (q) {
    filter = {
      $and: [
        {},
        {
          $or: [
            { referenceId: { $regex: q, $options: 'i' } },
            { fullName: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { contactNumber: { $regex: q, $options: 'i' } },
            { eventType: { $regex: q, $options: 'i' } },
            { category:  { $regex: q, $options: 'i' } },
            { message: { $regex: q, $options: 'i' } },
            { city: { $regex: q, $options: 'i' } },
            { state: { $regex: q, $options: 'i' } },
            { country: { $regex: q, $options: 'i' } },
          ],
        },
      ],
    };
  }

  const cursor = db
    .collection('contacts')
    .find(filter)
    .sort({ submittedAt: -1, createdAt: -1, _id: -1 })
    .skip((page - 1) * size)
    .limit(size);

  const rows = await cursor.toArray();
  const total = await db.collection('contacts').countDocuments(filter);

  // Normalize fields the UI expects
  const norm = rows.map(r => ({
    ...r,
    //eventType: r.eventType || r.category || '',
    submittedAt: r.submittedAt || r.createdAt || null,
    status: r.status || 'New',
    adminComment: r.adminComment || '',
  }));

  return NextResponse.json({ success: true, rows: norm, total, page, size });
}
