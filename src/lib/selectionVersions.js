// src/lib/selectionVersions.js
import { connectToDatabase } from '@/lib/mongodb';

export async function getSelectionCollections() {
  const { db } = await connectToDatabase();
  const versions = db.collection('selection_versions');

  // one version document per submission
  await versions.createIndex({ referenceId: 1, version: 1 }, { unique: true });

  return { db, versions };
}
