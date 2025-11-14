//src/app/api/admin/contacts/[id]/route.js
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// --- VALIDATION (server-side) ---
const STATUS = [
  'New','Contacted','Confirmed','Shot','Delivered',
  'Event Cancelled','Not Interested'
];

function isAlpha(v) {
  if (v == null || v === '') return true;
  return /^[a-zA-Z .,'-]{2,64}$/.test(String(v));
}
function isISODate(v) { // YYYY-MM-DD
  if (!v) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v));
}
function isHHMM(v) { // 0-23:00-59
  if (!v) return true;
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(String(v));
}
function isDuration(v) { // 0.5 .. 24 (hours)
  if (v == null || v === '') return true;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n <= 24;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function isAdmin() {
  const store = await cookies();
  const token = store.get('auth_token')?.value || '';
  try { return jwt.verify(token, JWT_SECRET)?.role === 'admin'; }
  catch { return false; }
}

export async function PATCH(req, ctx) {
  if (!(await isAdmin())) return NextResponse.json({ success: false }, { status: 401 });

  const { id } = await ctx.params; // ✅ await params
  const body = await req.json().catch(() => ({}));

  // 🔒 Allow-list: (ReferenceId, Name, Email, Contact are intentionally NOT here)
  const allowed = [
    'city','state','country',
    'eventType','eventDate','eventTime','timeZone','duration',
    'message','status','adminComment'
  ];

  // --- validate incoming values ---
  const patch = {};
  for (const k of allowed) if (body[k] !== undefined) {
    patch[k] = typeof body[k] === 'string' ? body[k].trim() : body[k];
  }

  // field validations
  if (!isAlpha(patch.city))       return NextResponse.json({ success:false, message:'City is invalid' }, { status:400 });
  if (!isAlpha(patch.state))      return NextResponse.json({ success:false, message:'State is invalid' }, { status:400 });
  if (!isAlpha(patch.country))    return NextResponse.json({ success:false, message:'Country is invalid' }, { status:400 });
  if (!isISODate(patch.eventDate))return NextResponse.json({ success:false, message:'Event Date must be YYYY-MM-DD' }, { status:400 });
  if (!isHHMM(patch.eventTime))   return NextResponse.json({ success:false, message:'Event Time must be HH:MM (24h)' }, { status:400 });
  if (!isDuration(patch.duration))return NextResponse.json({ success:false, message:'Duration must be 0–24 hours' }, { status:400 });
  if (patch.status && !STATUS.includes(patch.status))
                                  return NextResponse.json({ success:false, message:'Status invalid' }, { status:400 });

  patch.updatedAt = new Date();

  const { db } = await connectToDatabase();
  await db.collection('contacts').updateOne(
    { _id: new ObjectId(id) },
    { $set: patch }
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(_req, ctx) {
  if (!(await isAdmin())) return NextResponse.json({ success: false }, { status: 401 });
  const { id } = await ctx.params; // ✅ await params
  const { db } = await connectToDatabase();
  await db.collection('contacts').deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ success: true });
}
