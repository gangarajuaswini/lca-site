import { NextResponse } from 'next/server'
import { google } from 'googleapis'
function driveClient() {
  const auth = new google.auth.JWT(
    process.env.GDRIVE_CLIENT_EMAIL,
    null,
    (process.env.GDRIVE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/drive']
  )
  return google.drive({ version: 'v3', auth })
}
export async function GET() {
  try {
    const drive = driveClient()
    const parent = process.env.GDRIVE_PARENT_FOLDER_ID
    const { data } = await drive.files.create({
      requestBody: { name: `LCA-Test-${Date.now()}`, mimeType: 'application/vnd.google-apps.folder', parents: [parent] },
      fields: 'id,name', supportsAllDrives: true,
    })
    return NextResponse.json({ ok: true, created: data })
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 })
  }
}
