// middleware.js
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable')
}

// Pages that should only be accessible after landing on "/"
const PUBLIC_GUARDED = [
  '/my-work',
  '/contact',
  '/blog',
  '/blogs',
  '/pricing',
  '/about',
  '/customer-dashboard'
]

// Only run on real pages (skip /api, /_next/* and files with an extension)
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}

async function verify(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
    return payload // { role, email, ... }
  } catch {
    return null
  }
}

export default async function middleware(req) {
  const { pathname, searchParams } = req.nextUrl
  const method = req.method

  // Always allow the two login pages
  if (pathname === '/login' || pathname === '/admin/login') return NextResponse.next()

  // ---- Force landing on "/" before guarded public pages (GET only) ----
  const isPublicGuarded = PUBLIC_GUARDED.some(p => pathname === p || pathname.startsWith(p + '/'))
  const landed = req.cookies.get('landed')?.value
  if (method === 'GET' && isPublicGuarded && !landed) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
  if (pathname === '/') {
    const res = NextResponse.next()
    res.cookies.set('landed', '1', {
      path: '/',
      httpOnly: false,         // UX cookie; not a secret
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10,         // 10 minutes
    })
    return res
  }

  // ---- Auth helpers ----
  const token = req.cookies.get('auth_token')?.value
  const payload = await verify(token)

  const redirectWithNext = (to) => {
    const url = req.nextUrl.clone()
    url.pathname = to
    url.searchParams.set('next', pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''))
    const res = NextResponse.redirect(url)
    // clear bad/expired tokens to avoid loops
    res.cookies.set('auth_token', '', { path: '/', maxAge: 0 })
    return res
  }

  // ---- Admin guard ----
  if (pathname.startsWith('/admin')) {
    if (!payload || payload.role !== 'admin') {
      return redirectWithNext('/admin/login')
    }
    return NextResponse.next()
  }

  // ---- Customer guard ----
  if (pathname.startsWith('/customer-dashboard')) {
    if (!payload || payload.role !== 'customer') {
      return redirectWithNext('/login')
    }
    return NextResponse.next()
  }

  // default allow
  return NextResponse.next()
}
