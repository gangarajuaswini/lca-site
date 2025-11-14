// lib/customerGallery.js
import clientPromise from '@/lib/mongodb';

let ensured = globalThis.__cgIndexesEnsured || false;

export async function getCollections() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'lca-visual-studios');

  const projects   = db.collection('customer_projects');
  const assets     = db.collection('customer_assets');
  const selections = db.collection('customer_selections');

  if (!ensured) {
    try {
      // Drop legacy/conflicting indexes (ignore errors if missing)
      try { await assets.dropIndex('referenceId_1_driveFileId_1'); } catch {}
      try { await assets.dropIndex('asset_ref_cat_file_unique'); } catch {}

      // ✅ The only unique constraint we keep
      await assets.createIndex(
        { referenceId: 1, folderName: 1, driveFileId: 1 },
        { name: 'asset_ref_folder_file_unique', unique: true }
      );

      // Helpful non-unique indexes
      await assets.createIndex({ referenceId: 1, folderName: 1 }, { name: 'asset_ref_folder' });
      await assets.createIndex({ referenceId: 1, folderName: 1, isSelected: 1 }, { name: 'asset_ref_folder_selected' });

      ensured = true;
      globalThis.__cgIndexesEnsured = true;
    } catch (e) {
      console.error('customer_assets index ensure error:', e?.message || e);
    }
  }

  return { projects, assets, selections };
}
