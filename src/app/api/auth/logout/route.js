// src/app/api/auth/logout/route.js
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const jar = await cookies()
  const names = ['session', 'auth', 'token']
  
  for (const name of names) {
    try {
      jar.set({
        name, 
        value: '', 
        expires: new Date(0), 
        path: '/', 
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    } catch (_) {
      //ignore missing cookies
    }
  }
  return NextResponse.json({ success: true })
}
  /*
  const res = NextResponse.json({ success: true })
  res.cookies.set('auth_token', '', { path: '/', maxAge: 0 })
  return res
}
*/
