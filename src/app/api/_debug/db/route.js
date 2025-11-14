import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
export async function GET() {
  try { const { db } = await connectToDatabase(); await db.command({ ping:1 }); return NextResponse.json({ ok:true }) }
  catch (e) { return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 }) }
}
