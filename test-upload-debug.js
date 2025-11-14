const { MongoClient } = require('mongodb');

async function testUpload() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('lca-visual-studios');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Available collections:');
    collections.forEach(c => console.log('  -', c.name));
    
    // Try to insert a test media item
    const media = db.collection('publicMedia');
    
    const testItem = {
      categoryId: '6916813c1e95cd1f393b7356f',
      name: 'Test Image',
      localPath: '/uploads/test.jpg',
      url: '/uploads/test.jpg',
      previewUrl: '/uploads/test.jpg',
      mimeType: 'image/jpeg',
      type: 'photo',
      order: 0,
      importedAt: new Date(),
    };
    
    console.log('\n🧪 Attempting to insert test media item...');
    const result = await media.insertOne(testItem);
    console.log('✅ Insert successful! ID:', result.insertedId);
    
    // Verify it was inserted
    const count = await media.countDocuments();
    console.log('📊 Total media items now:', count);
    
    // Clean up test item
    await media.deleteOne({ _id: result.insertedId });
    console.log('🧹 Cleaned up test item');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.close();
  }
}

testUpload();
