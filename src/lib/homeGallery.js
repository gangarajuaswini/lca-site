// lib/homeGallery.js
import clientPromise from '@/lib/mongodb';

let ensured = globalThis.__homeGalleryEnsured || false;

export async function getHomeGalleryCollection() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'lca-visual-studios');
  const col = db.collection('home_gallery');

  if (!ensured) {
    try {
      await col.createIndex({ section: 1, order: 1 }, { name: 'section_order' });
      await col.createIndex({ section: 1, isPublished: 1 }, { name: 'section_published' });
      await col.createIndex({ section: 1, driveFileId: 1 }, { name: 'section_drive_unique', unique: true, sparse: true });
      ensured = true;
      globalThis.__homeGalleryEnsured = true;
    } catch (e) {
      console.error('home_gallery index ensure error:', e?.message || e);
    }
  }
  return col;
}
