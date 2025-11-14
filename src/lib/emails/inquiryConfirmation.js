// src/lib/emails/inquiryConfirmation.js
export function buildInquiryConfirmationEmail({ doc, referenceId, portalUrl }) {
  const name = doc.fullName || doc.firstName || '';
  const loc = [doc.city, doc.state, doc.country].filter(Boolean).join(', ');
  const eventTime = [doc.eventTime, doc.timeZone].filter(Boolean).join(' ');

  const subject = `📸 Inquiry Confirmation - Reference ID: ${referenceId}`;

  const html = `
  <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; background:#f7f7f7; padding:24px">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="640" style="background:#fff;border-radius:16px;overflow:hidden">
      <tr>
        <td align="center" style="background:#f2a400;padding:28px 24px">
          <div style="width:64px;height:64px;border-radius:999px;background:#fff3;display:flex;align-items:center;justify-content:center;margin-bottom:8px; font-size:28px">📸</div>
          <div style="color:#fff;font-size:28px;font-weight:800;letter-spacing:.3px">LCA Visual Studios</div>
          <div style="color:#fff;opacity:.9;margin-top:4px">Thank you for your inquiry!</div>
        </td>
      </tr>

      <tr>
        <td style="padding:28px 28px 8px">
          <div style="font-size:18px;font-weight:700;margin-bottom:6px">Hi ${name || 'there'}!</div>
          <div style="color:#374151;line-height:1.6">
            We've received your inquiry and are excited about the possibility of capturing your special moments.
            Here are the details we received:
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:12px 28px 0">
          <div style="border:2px solid #ffd166;background:#fff8e6;border-radius:12px;padding:16px;text-align:center">
            <div style="color:#7a5b00;font-weight:600;margin-bottom:6px">Your Reference ID</div>
            <div style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
                        font-size:20px;font-weight:800;letter-spacing:3px;color:#7a5b00;background:#fff;border-radius:10px;padding:12px 16px;display:inline-block;">
              ${referenceId}
            </div>
            <div style="color:#7a5b00;opacity:.8;margin-top:6px;font-size:12px">Please save this ID for future reference</div>
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:20px 28px 0">
          <div style="font-weight:700;margin-bottom:8px;font-size:16px">Inquiry Details:</div>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f9fafb;border-radius:12px;padding:12px 16px">
            ${row('Event Type:', doc.eventType || '')}
            ${row('Event Date:', doc.eventDate || '')}
            ${row('Event Time:', eventTime)}
            ${row('Location:', loc)}
            ${row('Duration:', doc.duration ? `${doc.duration} hours` : '')}
            ${row('Contact:', doc.contactNumber || '')}
          </table>
        </td>
      </tr>

      ${doc.message ? `
      <tr>
        <td style="padding:18px 28px 0">
          <div style="background:#eef6ff;border-left:4px solid #60a5fa;border-radius:8px;padding:12px 14px">
            <div style="font-weight:700;margin-bottom:6px">Your Requirements:</div>
            <div style="white-space:pre-wrap;color:#111827">${escapeHtml(doc.message)}</div>
          </div>
        </td>
      </tr>` : ''}

      <tr>
        <td style="padding:22px 28px">
          <div style="border:2px solid #fde68a;background:#fffbeb;border-radius:12px;padding:16px">
            <div style="font-weight:700;margin-bottom:8px">🔐 Your Client Portal Access</div>
            <div style="line-height:1.6;color:#374151">
              We've created your client account. Use these credentials to access your dashboard:
            </div>
            <div style="margin-top:10px;padding-left:8px;color:#111827">
              <div><b>Portal URL:</b> <a href="${portalUrl}" style="color:#1d4ed8">${portalUrl}</a></div>
              <div><b>Username:</b> ${doc.email}</div>
              <div><b>Password:</b> ${referenceId}</div>
            </div>
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:0 28px 24px;color:#6b7280;font-size:12px">
          Questions? We're here to help! &nbsp;
          <a href="mailto:${process.env.GMAIL_USER}" style="color:#1d4ed8">${process.env.GMAIL_USER}</a> • +1 (480) 803-1955
          <div style="margin-top:10px;color:#9ca3af">© ${new Date().getFullYear()} LCA Visual Studios. Licensed & Insured</div>
        </td>
      </tr>
    </table>
  </div>`;

  return { subject, html };
}

function row(label, value) {
  return `
    <tr>
      <td style="width:170px;color:#6b7280;padding:6px 8px">${label}</td>
      <td style="color:#111827;padding:6px 8px">${escapeHtml(value)}</td>
    </tr>
  `;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
