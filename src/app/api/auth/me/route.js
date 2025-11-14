// src/app/api/auth/me/route.js
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readToken(request) {
  const auth = request.headers.get('authorization') || ''
  if (auth.startsWith('Bearer ')) return auth.slice(7)
  const cookie = request.headers.get('cookie') || ''
  const m = cookie.match(/(?:^|;\s*)auth_token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export async function GET(request) {
  const token = readToken(request)
  if (!token) {
    return NextResponse.json({ success: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    return NextResponse.json({ success: true, user: payload }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ success: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }
}
