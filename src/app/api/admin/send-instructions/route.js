//src/app/api/admin/send-instructions/route.js
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { connectToDatabase } from '@/lib/mongodb'
import { buildInquiryConfirmationEmail } from '@/lib/emails/inquiryConfirmation'

function createEmailTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
  })
}

function getToken(req) {
  const h = req.headers.get('authorization') || ''
  if (h.startsWith('Bearer ')) return h.slice(7)
  const ck = req.headers.get('cookie') || ''
  const m = ck.match(/auth_token=([^;]+)/)
  return m ? m[1] : null
}

export async function POST(request) {
  try {
    const token = getToken(request)
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'lca-visual-studios-secret-key-2025')
    if (payload.role !== 'admin') return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

    const { email, referenceId } = await request.json()
    if (!email || !referenceId) {
      return NextResponse.json({ success: false, message: 'email and referenceId required' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const contact =
      (await db.collection('contacts').findOne({ referenceId })) ||
      (await db.collection('contacts').findOne({ email }))

    const appBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const { subject, html } = buildInquiryConfirmationEmail({
      doc: contact || { email },
      referenceId,                     // ← this remains the password
      portalUrl: `${appBase}/login`,
    })

    const t = createEmailTransporter()
    await t.verify()
    await t.sendMail({
      from: `"LCA Visual Studios" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      html,
    })

    return NextResponse.json({ success: true, message: 'Instructions email sent' })
  } catch (err) {
    console.error('send-instructions error:', err)
    return NextResponse.json({ success: false, message: 'Failed to send email' }, { status: 500 })
  }
}
