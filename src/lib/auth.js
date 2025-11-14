import jwt from 'jsonwebtoken'

export const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable')
}
export function readTokenFromReq(req) {
  const cookie = req.headers.get('cookie') || ''
  const m = cookie.match(/(?:^|;\s*)auth_token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export function requireAdminOrThrow(req) {
  const token = readTokenFromReq(req)
  if (!token) throw new Error('401')
  const payload = jwt.verify(token, JWT_SECRET)
  if (payload.role !== 'admin') throw new Error('403')
  return payload
}
