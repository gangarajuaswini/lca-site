// src/app/api/contact/route.js
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import nodemailer from 'nodemailer'
import { buildInquiryConfirmationEmail } from '@/lib/emails/inquiryConfirmation'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createEmailTransporter() {
  // same style you use in /api/admin/send-instructions/route.js
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
  })
}
/*
function makeRef(prefix = process.env.REFERENCE_ID_PREFIX || 'LCA') {
  const y = new Date().getFullYear()
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}-${y}-${rand}`
}
*/
export async function POST(req) {
  try {
    const body = await req.json()

    // minimal server validation (front-end does more)
    if (!body?.email) 
      return NextResponse.json({ success: false, message: 'Email required' }, { status: 400 })
    
    // Use your existing reference-id generator if you already have one; otherwise:
    const referenceId = body.referenceId || `LCA-${Math.random().toString(36).slice(2, 12).toUpperCase()}`

    // Build doc exactly with the fields your Inbox expects
    const doc = {
      referenceId,
      fullName: body.fullName || '',
      email: body.email || '',
      contactNumber: body.contactNumber || '',
      country: body.country || '',
      state: body.state || '',
      city: body.city || '',
      category: body.category || '',
      eventType: body.eventType || body.category || '',
      eventDate: body.eventDate || '',
      eventTime: body.eventTime || '',
      timeZone: body.timeZone || '',
      duration: body.duration || '',
      message: body.message || '',
      status: 'New',
      submittedAt: new Date(),
      updatedAt: new Date(),
    }

    const { db } = await connectToDatabase()
    await db.collection('contacts').insertOne(doc)

    // Email (same template used by admin send-instructions)
    try {
      const appBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const { subject, html } = buildInquiryConfirmationEmail({
        doc, referenceId, portalUrl: `${appBase}/login`
      })

      const t = createEmailTransporter();   // ← use the function you defined
      await t.verify();                     // helpful diagnostics in server log
      await t.sendMail({
        from: `"LCA Visual Studios" <${process.env.GMAIL_USER}>`,
        to: doc.email,
        subject,
        html
      })

      // (optional) notify admin mailbox too:
      // if (process.env.GMAIL_USER) await t.sendMail({ from: `"LCA Visual Studios" <${process.env.GMAIL_USER}>`, to: process.env.GMAIL_USER, subject: `New enquiry — ${referenceId}`, html })
    } catch (mailErr) {
      console.error('inquiry email error', mailErr)
    }

    return NextResponse.json({ success:true, referenceId })
  } catch (err) {
    console.error('contact error', err)
    return NextResponse.json({ success:false, message:'Failed to submit enquiry' }, { status:500 })
  }
}


