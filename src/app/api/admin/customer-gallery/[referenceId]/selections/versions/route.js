//src/app/api/admin/customer-gallery/[referenceId]/selections/versions/route.js
import { NextResponse } from 'next/server';
import { getSelectionCollections } from '@/lib/selectionVersions'
// (optional) import { requireAdminOrThrow } from '@/lib/auth'

export async function GET(req, { params }) {
  try {
    // requireAdminOrThrow(req)
    const referenceId = decodeURIComponent(params.referenceId || '').trim().toUpperCase();
    const { searchParams } = new URL(req.url)
    //const category = (searchParams.get('category') || '').trim()
    if (!referenceId) {
      return NextResponse.json({ success: false, message: 'referenceId required' }, { status: 400 });
    }

    const { versions } = await getSelectionCollections();
    // GET: /api/admin/customer-gallery/[referenceId]/selections
    const items = await versions
      .find({ referenceId })
      .project({ version:1, createdAt:1, diff:1, itemCount: { $size: '$items' } })
      .sort({ version:-1 })
      .toArray();

    return NextResponse.json({ success: true, items });
  } catch (e) {
    console.error('versions GET error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
