// src/app/admin/page.js
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export default async function AdminIndex() {
  const token = (await cookies()).get('auth_token')?.value
  let isAdmin = false
  try { isAdmin = jwt.verify(token || '', JWT_SECRET)?.role === 'admin' } catch {}
  redirect(isAdmin ? '/admin/inbox' : '/admin/login')
}
